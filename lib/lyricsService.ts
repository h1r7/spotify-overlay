/**
 * 가사 검색 서비스
 * Spotify Native 및 LRCLIB에서 가사를 검색하고 파싱합니다.
 */

import axios from 'axios';

// --- 타입 정의 ---
export interface LyricLine {
    time: number;
    words: string;
}

interface LrcLibResult {
    trackName: string;
    artistName: string;
    duration: number;
    syncedLyrics?: string;
}

interface ScoredResult {
    match: LrcLibResult;
    score: number;
}

export interface LyricsSearchResult {
    lyrics: LyricLine[];
    source: 'Spotify' | 'LRCLIB' | '';
    status: 'ok' | 'searching' | 'not_found';
}

// --- LRC 파싱 ---
export function parseLrc(lrcString: string): LyricLine[] {
    const lines: LyricLine[] = [];
    const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

    lrcString.split('\n').forEach((line) => {
        const match = line.match(regex);
        if (match) {
            const min = parseInt(match[1]);
            const sec = parseInt(match[2]);
            let msStr = match[3];
            let ms = parseInt(msStr);
            if (msStr.length === 2) ms *= 10;
            const time = (min * 60 * 1000) + (sec * 1000) + ms;
            // [Detail] 괄호 시작 전에 줄바꿈 추가 (가독성 향상)
            const words = match[4].trim().replace(/ \(/g, '\n(').replace(/ \[/g, '\n[');
            if (words) lines.push({ time, words });
        }
    });

    return lines;
}

// --- Spotify 가사 파싱 ---
export function parseSpotifyLyrics(spotifyLines: any[]): LyricLine[] {
    return spotifyLines.map((line: any) => ({
        time: Number(line.startTimeMs || 0),
        words: (line.words || "").replace(/ \(/g, '\n(').replace(/ \[/g, '\n[')
    }));
}

// --- LRCLIB 최적 매칭 ---
function findBestMatch(
    results: LrcLibResult[],
    validArtists: string[],
    targetDuration: number,
    validTitles: string[]
): LrcLibResult | undefined {
    const isKoreanSong = validTitles.some(t => /[가-힣]/.test(t)) ||
        validArtists.some(a => /[가-힣]/.test(a));
    const candidates: ScoredResult[] = [];

    for (const item of results) {
        // Duration 검증 (15초 이내)
        if (Math.abs(item.duration - targetDuration) > 15) continue;
        if (!item.syncedLyrics) continue;

        // 유효한 가사인지 확인 (타임스탬프가 없으면 걸러냄)
        const parsed = parseLrc(item.syncedLyrics);
        if (parsed.length === 0) continue;

        // 아티스트 매칭
        const dbArtist = item.artistName.toLowerCase().replace(/\s/g, "");
        const artistMatch = validArtists.some(myArtist =>
            dbArtist.includes(myArtist.toLowerCase().replace(/\s/g, ""))
        );
        if (!artistMatch) continue;

        // 점수 계산
        let score = 0;

        // 한국어 노래일 때 한국어 가사 우선
        if (isKoreanSong && /[가-힣]/.test(item.syncedLyrics)) score += 100;

        // 로마자 변환 버전 제외
        if (item.trackName.toLowerCase().includes("romanized") ||
            item.syncedLyrics.includes("Romanized")) score -= 50;

        // 제목 정확 매칭 보너스
        const dbTitle = item.trackName.toLowerCase().replace(/\s/g, "");
        const titleMatch = validTitles.some(vt => {
            const cleanVT = vt.toLowerCase().replace(/\s/g, "");
            return dbTitle === cleanVT;
        });
        if (titleMatch) score += 10;

        candidates.push({ match: item, score });
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.length > 0 ? candidates[0].match : undefined;
}

// --- LRCLIB 검색 ---
export async function searchLrclib(
    title: string,
    artist: string,
    duration: number,
    queryTitle?: string,
    queryArtist?: string
): Promise<LyricsSearchResult> {
    console.log(`   🌍 LRCLIB 검색 시작...`);

    // 아티스트 후보 생성
    const artistCandidates: string[] = [];
    if (artist) artistCandidates.push(artist);
    if (queryArtist) artistCandidates.push(queryArtist);

    const splitArtists: string[] = [];
    artistCandidates.forEach(a =>
        a.split(',').forEach(p => splitArtists.push(p.trim()))
    );
    const validArtists = [...new Set([...artistCandidates, ...splitArtists])].filter(Boolean);

    // 제목 후보 생성
    const titleCandidates = [...new Set([
        queryTitle,
        title,
        title.replace(/\(.*\)/g, '').trim()
    ])].filter(t => typeof t === 'string' && t.length > 0) as string[];

    // 검색 쿼리 조합
    const searchQueries: string[] = [];

    // 1. 제목 + 아티스트 조합 (가장 정확)
    for (const t of titleCandidates) {
        for (const a of validArtists) {
            searchQueries.push(`${t} ${a}`);
        }
    }

    // 2. 제목만 (fallback)
    for (const t of titleCandidates) {
        searchQueries.push(t);
    }

    // 검색 실행
    const targetDuration = duration / 1000; // ms -> seconds

    for (const query of searchQueries) {
        try {
            console.log(`      🔍 LRCLIB 검색: "${query}"`);
            const res = await axios.get(
                `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`
            );

            if (res.data && res.data.length > 0) {
                const match = findBestMatch(res.data, validArtists, targetDuration, titleCandidates);
                if (match && match.syncedLyrics) {
                    console.log(`      ✓ 매칭됨: ${match.artistName} - ${match.trackName}`);
                    console.log(`   ✅ LRCLIB 매칭 성공!`);
                    return {
                        lyrics: parseLrc(match.syncedLyrics),
                        source: 'LRCLIB',
                        status: 'ok'
                    };
                }
            }
        } catch (e) {
            // 검색 실패 시 다음 쿼리 시도
        }
    }

    return {
        lyrics: [],
        source: '',
        status: 'not_found'
    };
}

// --- Spotify Native 가사 처리 ---
export function processSpotifyLyrics(spotifyLyrics: any): LyricsSearchResult {
    const lines = spotifyLyrics?.lines;

    if (lines && Array.isArray(lines)) {
        console.log(`   ✅ Spotify Native 가사 발견!`);
        return {
            lyrics: parseSpotifyLyrics(lines),
            source: 'Spotify',
            status: 'ok'
        };
    }

    return {
        lyrics: [],
        source: '',
        status: 'searching'
    };
}
