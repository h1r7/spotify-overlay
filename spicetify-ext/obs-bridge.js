// obs-bridge.js - Spotify <-> R1G3L-Flux Integration
(async function OBSBridge() {
    while (!Spicetify || !Spicetify.Player || !Spicetify.CosmosAsync) {
        await new Promise(r => setTimeout(r, 100));
    }

    const SERVER_URL = "http://localhost:6974/update";

    // State variables
    let lastTrackId = "";
    let cachedLyrics = null;
    let isFetchingLyrics = false;
    let lastProgress = 0;
    let lastCheckTime = Date.now();

    console.log("%c[OBS-Bridge] LOADED (Sync Fix v4)", "background: purple; color: white; font-size: 14px;");

    // 1. Fetch Lyrics (Async)
    async function fetchNativeLyrics(trackId) {
        if (isFetchingLyrics) return null;
        isFetchingLyrics = true;
        console.log(`[OBS-Bridge] Searching lyrics... (${trackId})`);

        try {
            // Try Platform API first
            if (Spicetify.Platform?.LyricsAPI?.getLyrics) {
                const lyrics = await Spicetify.Platform.LyricsAPI.getLyrics(trackId);
                if (lyrics) {
                    isFetchingLyrics = false;
                    return lyrics;
                }
            }

            // Cosmos API fallback
            const response = await Spicetify.CosmosAsync.get(`https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&market=from_token`);
            if (response && response.lyrics) {
                isFetchingLyrics = false;
                return response.lyrics;
            }
        } catch (e) {
            // console.warn("Lyrics not found or error");
        }

        isFetchingLyrics = false;
        return null;
    }

    // 2. Data Transmission (Core Logic)
    async function sendData(reason) {
        try {
            const data = Spicetify.Player.data;
            if (!data || !data.item) return;

            const meta = data.item.metadata;
            const trackUri = data.item.uri;
            const trackId = trackUri.split(':')[2];
            const isPlaying = Spicetify.Player.isPlaying();

            // Duration: Use Player API instead of metadata
            const duration = Spicetify.Player.getDuration();
            const progress = Spicetify.Player.getProgress();

            // Detect track change
            if (trackId !== lastTrackId) {
                console.log(`%c[OBS-Bridge] Track Change: ${meta.title}`, "color: yellow;");
                lastTrackId = trackId;
                cachedLyrics = null; // Reset cache

                // Request lyrics
                fetchNativeLyrics(trackId).then(lyrics => {
                    if (lyrics) {
                        console.log("%c[OBS-Bridge] Lyrics found! Resending data", "color: lime;");
                        cachedLyrics = lyrics;
                        // Update immediately once lyrics are found
                        sendData("lyrics_found");
                    }
                });
            }

            const payload = {
                timestamp: Date.now(),
                clientTimestamp: Date.now(), // For auto-calculating network delay
                reason: reason,
                isPlaying: isPlaying,
                title: meta.title,
                artist: meta.artist_name,
                cover: meta.image_url ? meta.image_url.replace("spotify:image:", "https://i.scdn.co/image/") : "",
                progress: progress,
                duration: duration,
                trackId: trackId,
                spotifyLyrics: cachedLyrics
            };

            await fetch(SERVER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            lastProgress = progress;
            lastCheckTime = Date.now();

        } catch (err) {
            console.error("[OBS-Bridge] Transmission error", err);
        }
    }

    // 3. Timer & Seek Detection
    setInterval(() => {
        if (Spicetify.Player.isPlaying()) {
            const current = Spicetify.Player.getProgress();
            const now = Date.now();
            const expected = lastProgress + (now - lastCheckTime);

            // Consider a Seek if difference is > 1.5s (sensitivity buffer)
            const isSeek = Math.abs(current - expected) > 1500;

            // Detect "Back to Start" (Started > 3s -> < 2s)
            const isRestart = lastProgress > 3000 && current < 2000;

            if (isSeek || isRestart) {
                console.log("[OBS-Bridge] Seek!");
                sendData("seek");
            }

            lastProgress = current;
            lastCheckTime = now;
        } else {
            // Update timestamp only when paused
            lastProgress = Spicetify.Player.getProgress();
            lastCheckTime = Date.now();
        }
    }, 1000); // 1s check interval (low overhead)

    Spicetify.Player.addEventListener("songchange", () => sendData("songchange"));
    Spicetify.Player.addEventListener("onplaypause", () => sendData("playpause"));

    sendData("init");
})();
