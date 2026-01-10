import { NextResponse } from 'next/server';
import { eventEmitter } from '../../lib/eventEmitter';
import {
    LyricLine,
    processSpotifyLyrics,
    searchLrclib
} from '../../lib/lyricsService';
import fs from 'fs';
import path from 'path';

// --- 설정 파일 경로 ---
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'state.json');

function saveSettings(settings: any) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error("Failed to save settings to file", e);
    }
}

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Failed to load settings from file", e);
    }
    return null;
}

// --- 기본 설정 ---
const DEFAULT_SETTINGS = {
    widgetStyle: 'album',
    lyricsStyle: 'custom',
    animationStyle: 'default',
    customColors: {
        widgetBg: '#18181b',
        lyricsBg: '#000000',
        simpleWidgetBg: '#18181b'
    },
    simpleWidgetStyle: 'album',
    lyricsOffset: 0,
    showWrapVisualizer: true,
    interactiveProgress: false
};

// --- 서버 메모리 저장소 ---
const savedSettings = loadSettings();

let currentData: any = {
    isPlaying: false,
    title: 'Waiting for Spotify...',
    artist: '',
    cover: '',
    progress: 0,
    duration: 0,
    lyrics: [],
    lyricsStatus: 'ok',
    spotifyLyrics: null,
    timestamp: Date.now(),
    trackId: '',
    networkDelay: 0,
    source: '',
    settings: savedSettings || DEFAULT_SETTINGS
};

let lastSearchedTrackId = "";

// --- 헬퍼 함수 ---
function calculateNetworkDelay(clientTimestamp: number | undefined, receivedTimestamp: number): number {
    if (clientTimestamp && typeof clientTimestamp === 'number') {
        const delay = receivedTimestamp - clientTimestamp;
        // 비정상적인 값 필터링 (음수거나 너무 큰 경우)
        if (delay >= 0 && delay <= 5000) {
            return delay;
        }
    }
    return 0;
}

function extrapolateProgress(data: any): any {
    const responseData = { ...data };
    if (responseData.isPlaying && responseData.timestamp) {
        const now = Date.now();
        const elapsed = now - responseData.timestamp;
        responseData.progress = (responseData.progress || 0) + elapsed;
        if (responseData.duration > 0 && responseData.progress > responseData.duration) {
            responseData.progress = responseData.duration;
        }
    }
    return responseData;
}

// --- 설정 업데이트 처리 ---
function handleSettingsUpdate(newSettings: any): NextResponse {
    console.log("⚙️ 설정 업데이트 수신:", JSON.stringify(newSettings, null, 2));
    currentData.settings = { ...currentData.settings, ...newSettings };
    saveSettings(currentData.settings);

    // 클라이언트 점프 방지: 현재 서버 시간 기준으로 진행률 보정 후 송출
    const emitData = extrapolateProgress(currentData);

    console.log("✅ 현재 서버 설정:", JSON.stringify(currentData.settings, null, 2));
    eventEmitter.emit('update', emitData);
    return NextResponse.json({ success: true });
}

// --- 새 트랙 처리 ---
async function handleNewTrack(
    newData: any,
    currentTrackId: string,
    receivedTimestamp: number,
    networkDelay: number
): Promise<void> {
    console.log(`\n🎵 새 노래 감지: ${currentTrackId}`);
    lastSearchedTrackId = currentTrackId;

    // 설정 필드 제외하고 데이터 정리
    const { settings: _, ...cleanNewData } = newData;

    // Step 1: 메타데이터 즉시 업데이트 (가사 비움)
    currentData = {
        ...currentData,
        ...cleanNewData,
        lyrics: [],
        lyricsStatus: 'searching',
        timestamp: receivedTimestamp,
        trackId: currentTrackId,
        networkDelay: networkDelay,
        source: ""
    };

    // SSE 송출: "새 노래 시작됨 (가사 찾는 중)"
    eventEmitter.emit('update', { ...currentData });

    // Step 2: 가사 검색
    let lyricsResult = processSpotifyLyrics(newData.spotifyLyrics);

    // Spotify 가사가 없으면 LRCLIB 시도
    if (lyricsResult.status !== 'ok') {
        lyricsResult = await searchLrclib(
            newData.title,
            newData.artist,
            typeof newData.duration === 'number' ? newData.duration : Number(newData.duration?.milliseconds),
            newData.queryTitle,
            newData.queryArtist
        );
    }

    // Step 3: 가사 결과 적용
    // 트랙이 여전히 이 요청의 트랙인지 확인 (곡 넘김 시 뒤늦은 결과 무시)
    if (currentData.trackId === currentTrackId) {
        if (lyricsResult.lyrics.length > 0) {
            // Spotify 가사가 이미 존재하면 LRCLIB 무시
            if (currentData.source === 'Spotify' && lyricsResult.source !== 'Spotify') {
                console.log(`   ⚠️ Spotify 가사가 이미 존재하여 ${lyricsResult.source} 가사를 무시합니다.`);
            } else {
                currentData.lyrics = lyricsResult.lyrics;
                currentData.lyricsStatus = 'ok';
                currentData.source = lyricsResult.source;
                console.log(`   ✨ 가사 적용 완료 (${lyricsResult.source})`);
            }
        } else if (currentData.lyricsStatus === 'searching') {
            console.log(`   ❌ 가사를 찾을 수 없음.`);
            currentData.lyricsStatus = 'not_found';
            currentData.source = "";
        }

        // SSE 송출: "가사 찾음 (또는 못 찾음)"
        eventEmitter.emit('update', { ...currentData });
    } else {
        console.log(`   ⚠️ 트랙이 바뀌어 (${currentTrackId} -> ${currentData.trackId}) 검색 결과를 무시합니다.`);
    }
}

// --- 기존 트랙 업데이트 처리 ---
function handleExistingTrack(
    newData: any,
    currentTrackId: string,
    receivedTimestamp: number,
    networkDelay: number
): void {
    const spotifyLines = newData.spotifyLyrics?.lines;
    const hasSpotifyLyrics = spotifyLines && Array.isArray(spotifyLines);
    const { settings: _, ...cleanNewData } = newData;

    // Spotify 가사가 뒤늦게 도착한 경우
    if (hasSpotifyLyrics && (currentData.lyricsStatus !== 'ok' || currentData.source !== 'Spotify')) {
        console.log(`   ✅ 뒤늦게 Spotify Native 가사 도착! (기존 ${currentData.source} 대체)`);
        const lyricsResult = processSpotifyLyrics(newData.spotifyLyrics);

        currentData = {
            ...currentData,
            ...cleanNewData,
            lyrics: lyricsResult.lyrics,
            lyricsStatus: 'ok',
            timestamp: receivedTimestamp,
            source: "Spotify",
            trackId: currentTrackId,
            networkDelay: networkDelay
        };
    } else {
        // 앨범 커버 무결성 보강
        const finalCover = cleanNewData.cover || currentData.cover;

        currentData = {
            ...currentData,
            ...cleanNewData,
            cover: finalCover,
            lyrics: currentData.source === 'Spotify' ? currentData.lyrics : (newData.lyrics || currentData.lyrics),
            lyricsStatus: currentData.source === 'Spotify' ? 'ok' : currentData.lyricsStatus,
            source: currentData.source === 'Spotify' ? 'Spotify' : (currentData.source || ""),
            timestamp: receivedTimestamp,
            trackId: currentTrackId,
            networkDelay: networkDelay
        };
    }

    // SSE 송출
    eventEmitter.emit('update', { ...currentData });
}

// --- API 라우트 핸들러 ---
export async function POST(request: Request) {
    const receivedTimestamp = Date.now();

    try {
        const newData = await request.json();

        // 설정 업데이트 요청인 경우
        if (newData.type === 'settings_update' && newData.settings) {
            return handleSettingsUpdate(newData.settings);
        }

        // Spicetify 페이로드에 settings 필드가 포함된 경우 경고
        if ((newData.title || newData.artist) && 'settings' in newData) {
            console.log("⚠️ Spicetify/Bridge Payload에 settings 필드가 포함됨! (무시됨)");
        }

        const currentTrackId = newData.trackId || `${newData.title} - ${newData.artist}`;
        const networkDelay = calculateNetworkDelay(newData.clientTimestamp, receivedTimestamp);

        // 새 노래 vs 기존 노래
        if (currentTrackId !== lastSearchedTrackId) {
            // [Fix] 가사 검색이 응답을 블로킹하지 않도록 비동기 처리 (await 제거)
            // 단, 기본적인 메타데이터 업데이트는 보장해야 하므로 handleNewTrack 내부에서 처리 분리
            handleNewTrack(newData, currentTrackId, receivedTimestamp, networkDelay).catch(err => {
                console.error("Async track processing error:", err);
            });
        } else {
            handleExistingTrack(newData, currentTrackId, receivedTimestamp, networkDelay);
        }

        // Progress 업데이트
        const rawProgress = Number(newData.progress);
        currentData.progress = isNaN(rawProgress) ? 0 : rawProgress;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json(extrapolateProgress(currentData));
}
