import { NextResponse } from 'next/server';
import { eventEmitter } from '../../lib/eventEmitter';
import {
    LyricLine,
    processSpotifyLyrics,
    searchLrclib
} from '../../lib/lyricsService';
import fs from 'fs';
import path from 'path';

// --- Settings File Path ---
const SETTINGS_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'state.json');

function saveSettings(settings: any) {
    try {
        if (!fs.existsSync(SETTINGS_DIR)) {
            fs.mkdirSync(SETTINGS_DIR, { recursive: true });
        }
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

// --- Default Settings ---
const DEFAULT_SETTINGS = {
    widgetStyle: 'album',
    lyricsStyle: 'album',
    animationStyle: 'fade',
    pageBackgroundStyle: 'album',
    lyricsBounceEffect: true,
    lyricsBounceAmount: 5,
    customColors: {
        widgetBg: '#18181b',
        lyricsBg: '#000000',
        simpleWidgetBg: '#18181b'
    },
    simpleWidgetStyle: 'album',
    squareWidgetStyle: 'album',
    lyricsOffset: 0,
    showWrapVisualizer: true,
    interactiveProgress: false
};

// --- Server Memory Store ---
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

// --- Helper Functions ---
function calculateNetworkDelay(clientTimestamp: number | undefined, receivedTimestamp: number): number {
    if (clientTimestamp && typeof clientTimestamp === 'number') {
        const delay = receivedTimestamp - clientTimestamp;
        // Filter out abnormal values (negative or too large)
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

// --- Process Settings Update ---
function handleSettingsUpdate(newSettings: any): NextResponse {
    console.log("⚙️ Settings update received:", JSON.stringify(newSettings, null, 2));
    currentData.settings = { ...currentData.settings, ...newSettings };
    saveSettings(currentData.settings);

    // Prevent client jumps: Compensate progress based on current server time before broadcast
    const emitData = extrapolateProgress(currentData);

    console.log("✅ Current server settings:", JSON.stringify(currentData.settings, null, 2));
    eventEmitter.emit('update', emitData);
    return NextResponse.json({ success: true });
}

// --- Process New Track ---
async function handleNewTrack(
    newData: any,
    currentTrackId: string,
    receivedTimestamp: number,
    networkDelay: number
): Promise<void> {
    console.log(`\n🎵 New track detected: ${currentTrackId}`);
    lastSearchedTrackId = currentTrackId;

    // Clean data except for settings fields
    const { settings: _, ...cleanNewData } = newData;

    // Step 1: Immediate metadata update (clear lyrics)
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

    // SSE Broadcast: "New song started (Searching lyrics)"
    eventEmitter.emit('update', { ...currentData });

    // Step 2: Search lyrics
    let lyricsResult = processSpotifyLyrics(newData.spotifyLyrics);

    // Try LRCLIB if Spotify lyrics are missing
    if (lyricsResult.status !== 'ok') {
        lyricsResult = await searchLrclib(
            newData.title,
            newData.artist,
            typeof newData.duration === 'number' ? newData.duration : Number(newData.duration?.milliseconds),
            newData.queryTitle,
            newData.queryArtist
        );
    }

    // Step 3: Apply lyrics result
    // Verify track is still the current one (ignore late results if skipped)
    if (currentData.trackId === currentTrackId) {
        if (lyricsResult.lyrics.length > 0) {
            // Ignore LRCLIB if Spotify lyrics already found
            if (currentData.source === 'Spotify' && lyricsResult.source !== 'Spotify') {
                console.log(`   ⚠️ Spotify lyrics already exist, ignoring ${lyricsResult.source} lyrics.`);
            } else {
                currentData.lyrics = lyricsResult.lyrics;
                currentData.lyricsStatus = 'ok';
                currentData.source = lyricsResult.source;
                console.log(`   ✨ Lyrics applied (${lyricsResult.source})`);
            }
        } else if (currentData.lyricsStatus === 'searching') {
            console.log(`   ❌ Lyrics not found.`);
            currentData.lyricsStatus = 'not_found';
            currentData.source = "";
        }

        // SSE Broadcast: "Lyrics found (or not found)"
        eventEmitter.emit('update', { ...currentData });
    } else {
        console.log(`   ⚠️ Track changed (${currentTrackId} -> ${currentData.trackId}), ignoring search result.`);
    }
}

// --- Process Existing Track Update ---
function handleExistingTrack(
    newData: any,
    currentTrackId: string,
    receivedTimestamp: number,
    networkDelay: number
): void {
    const spotifyLines = newData.spotifyLyrics?.lines;
    const hasSpotifyLyrics = spotifyLines && Array.isArray(spotifyLines);
    const { settings: _, ...cleanNewData } = newData;

    // If Spotify lyrics arrived late
    if (hasSpotifyLyrics && (currentData.lyricsStatus !== 'ok' || currentData.source !== 'Spotify')) {
        console.log(`   ✅ Spotify Native lyrics arrived late! (Replacing ${currentData.source})`);
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
        // Ensure album cover integrity
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

    // SSE Broadcast
    eventEmitter.emit('update', { ...currentData });
}

// --- API Route Handler ---
export async function POST(request: Request) {
    const receivedTimestamp = Date.now();

    try {
        const newData = await request.json();

        // If settings update request
        if (newData.type === 'settings_update' && newData.settings) {
            return handleSettingsUpdate(newData.settings);
        }

        const currentTrackId = newData.trackId || `${newData.title} - ${newData.artist}`;
        const networkDelay = calculateNetworkDelay(newData.clientTimestamp, receivedTimestamp);

        // Extract progress value
        const rawProgress = Number(newData.progress);
        const nextProgress = isNaN(rawProgress) ? 0 : rawProgress;

        // New track vs existing track
        if (currentTrackId !== lastSearchedTrackId) {
            // [Fix] Reset progress to 0 or use provided value for new track
            newData.progress = nextProgress;
            handleNewTrack(newData, currentTrackId, receivedTimestamp, networkDelay).catch(err => {
                console.error("Async track processing error:", err);
            });
        } else {
            // [Fix] Filter abnormal data where progress jumps to 0 for same track
            // (Spicetify occasionally reports 0 in the middle of a song)
            if (nextProgress === 0 && currentData.progress > 3000) {
                // Prevent progress backtracking
                newData.progress = currentData.progress; // Keep existing value
            } else {
                currentData.progress = nextProgress;
            }
            handleExistingTrack(newData, currentTrackId, receivedTimestamp, networkDelay);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json(extrapolateProgress(currentData), {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        }
    });
}
