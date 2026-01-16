/**
 * Lyrics Search Service
 * Searches and parses lyrics from Spotify Native and LRCLIB.
 */

import axios from 'axios';

// --- Type Definitions ---
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

// --- LRC Parsing ---
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
            // [Detail] Add newline before parentheses for better readability
            const words = match[4].trim().replace(/ \(/g, '\n(').replace(/ \[/g, '\n[');
            if (words) lines.push({ time, words });
        }
    });

    return lines;
}

// --- Spotify Lyrics Parsing ---
export function parseSpotifyLyrics(spotifyLines: any[]): LyricLine[] {
    return spotifyLines.map((line: any) => ({
        time: Number(line.startTimeMs || 0),
        words: (line.words || "").replace(/ \(/g, '\n(').replace(/ \[/g, '\n[')
    }));
}

// --- LRCLIB Best Match Selection ---
function findBestMatch(
    results: LrcLibResult[],
    validArtists: string[],
    targetDuration: number,
    validTitles: string[]
): LrcLibResult | undefined {
    // Check if the song contains Korean characters to prioritize Korean results
    const isKoreanSong = validTitles.some(t => /[가-힣]/.test(t)) ||
        validArtists.some(a => /[가-힣]/.test(a));
    const candidates: ScoredResult[] = [];

    for (const item of results) {
        // Validate duration (within 15s)
        if (Math.abs(item.duration - targetDuration) > 15) continue;
        if (!item.syncedLyrics) continue;

        // Check if lyrics are valid (filter out those without timestamps)
        const parsed = parseLrc(item.syncedLyrics);
        if (parsed.length === 0) continue;

        // Artist Matching
        const dbArtist = item.artistName.toLowerCase().replace(/\s/g, "");
        const artistMatch = validArtists.some(myArtist =>
            dbArtist.includes(myArtist.toLowerCase().replace(/\s/g, ""))
        );
        if (!artistMatch) continue;

        // Score Calculation
        let score = 0;

        // Prioritize Korean lyrics for Korean songs
        if (isKoreanSong && /[가-힣]/.test(item.syncedLyrics)) score += 100;

        // Exclude romanized versions
        if (item.trackName.toLowerCase().includes("romanized") ||
            item.syncedLyrics.includes("Romanized")) score -= 50;

        // Exact title match bonus
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

// --- LRCLIB Search ---
export async function searchLrclib(
    title: string,
    artist: string,
    duration: number,
    queryTitle?: string,
    queryArtist?: string
): Promise<LyricsSearchResult> {
    console.log(`   🌍 Starting LRCLIB search...`);

    // Generate artist candidates
    const artistCandidates: string[] = [];
    if (artist) artistCandidates.push(artist);
    if (queryArtist) artistCandidates.push(queryArtist);

    const splitArtists: string[] = [];
    artistCandidates.forEach(a =>
        a.split(',').forEach(p => splitArtists.push(p.trim()))
    );
    const validArtists = [...new Set([...artistCandidates, ...splitArtists])].filter(Boolean);

    // Generate title candidates
    const titleCandidates = [...new Set([
        queryTitle,
        title,
        title.replace(/\(.*\)/g, '').trim()
    ])].filter(t => typeof t === 'string' && t.length > 0) as string[];

    // Combine search queries
    const searchQueries: string[] = [];

    // 1. Title + Artist (Most accurate)
    for (const t of titleCandidates) {
        for (const a of validArtists) {
            searchQueries.push(`${t} ${a}`);
        }
    }

    // 2. Title only (Fallback)
    for (const t of titleCandidates) {
        searchQueries.push(t);
    }

    // Execute search
    const targetDuration = duration / 1000; // ms -> seconds

    for (const query of searchQueries) {
        try {
            console.log(`      🔍 LRCLIB Search: "${query}"`);
            const res = await axios.get(
                `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`
            );

            if (res.data && res.data.length > 0) {
                const match = findBestMatch(res.data, validArtists, targetDuration, titleCandidates);
                if (match && match.syncedLyrics) {
                    console.log(`      ✓ Matched: ${match.artistName} - ${match.trackName}`);
                    console.log(`   ✅ LRCLIB matching successful!`);
                    return {
                        lyrics: parseLrc(match.syncedLyrics),
                        source: 'LRCLIB',
                        status: 'ok'
                    };
                }
            }
        } catch (e) {
            // Try next query on failure
        }
    }

    return {
        lyrics: [],
        source: '',
        status: 'not_found'
    };
}

// --- Spotify Native Lyrics Processing ---
export function processSpotifyLyrics(spotifyLyrics: any): LyricsSearchResult {
    const lines = spotifyLyrics?.lines;

    if (lines && Array.isArray(lines)) {
        console.log(`   ✅ Spotify Native lyrics found!`);
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
