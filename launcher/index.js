const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const util = require('util');
const http = require('http');

// Setup Logger
const logFile = path.join(process.cwd(), 'debug.log');

// Clear log only if starting new main process
if (!process.argv.includes('--server')) {
    try { fs.writeFileSync(logFile, ''); } catch (e) { }
}

let lastLogMsg = '';
let lastLogCount = 0;

const log = (msg, isVerbose = true) => {
    const rawMsg = util.format(msg);
    const cleanMsg = rawMsg.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
    if (!cleanMsg) return;

    if (cleanMsg === lastLogMsg) {
        lastLogCount++;
        return;
    } else {
        if (lastLogCount > 0) {
            try { fs.appendFileSync(logFile, `[Last message repeated ${lastLogCount} times]\n`); } catch (e) { }
        }
        lastLogMsg = cleanMsg;
        lastLogCount = 0;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    const fileMsg = `[${timestamp}] ${cleanMsg}\n`;

    if (!cleanMsg.includes('GET /update') && !cleanMsg.includes('POST /update') && !cleanMsg.includes('GET /events')) {
        try { fs.appendFileSync(logFile, fileMsg); } catch (e) { }
    }

    // Only log to console if NOT verbose or if it's an error/critical
    // AND if we are NOT in server mode (which runs hidden)
    if ((!isVerbose || cleanMsg.toLowerCase().includes('error') || cleanMsg.toLowerCase().includes('critical')) && !process.argv.includes('--server')) {
        process.stdout.write(rawMsg + '\n');
    }
};

const logEssential = (msg) => log(msg, false);

// Configuration
const PORT = 6974;
const URLS = [`http://localhost:${PORT}/full`, `http://localhost:${PORT}/dashboard`];
const APPDATA = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
const SPICETIFY_EXT_PATH = path.join(APPDATA, 'spicetify', 'Extensions');

// OBS Bridge Content (Embedded)
const OBS_BRIDGE_CONTENT = `// obs-bridge.js - Spotify <-> R1G3L-Flux Link
(async function OBSBridge() {
    while (!Spicetify || !Spicetify.Player || !Spicetify.CosmosAsync) {
        await new Promise(r => setTimeout(r, 100));
    }

    const SERVER_URL = "http://localhost:6974/update";
    
    // Status State
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
        console.log(\`[OBS-Bridge] Searching lyrics... (\${trackId})\`);

        try {
            // Platform API first
            if (Spicetify.Platform?.LyricsAPI?.getLyrics) {
                const lyrics = await Spicetify.Platform.LyricsAPI.getLyrics(trackId);
                if (lyrics) {
                    isFetchingLyrics = false;
                    return lyrics; 
                }
            }
            
            // Cosmos API backup
            const response = await Spicetify.CosmosAsync.get(\`https://spclient.wg.spotify.com/color-lyrics/v2/track/\${trackId}?format=json&market=from_token\`);
            if (response && response.lyrics) {
                isFetchingLyrics = false;
                return response.lyrics;
            }
        } catch (e) {
            // console.warn("No lyrics or error");
        }
        
        isFetchingLyrics = false;
        return null;
    }

    // 2. Send Data (Core)
    async function sendData(reason) {
        try {
            const data = Spicetify.Player.data;
            if (!data || !data.item) return;

            const meta = data.item.metadata;
            const trackUri = data.item.uri;
            const trackId = trackUri.split(':')[2];
            const isPlaying = Spicetify.Player.isPlaying();
            
            // Duration: use Player API instead of metadata
            const duration = Spicetify.Player.getDuration(); 
            const progress = Spicetify.Player.getProgress();

            // Song Change Detection
            if (trackId !== lastTrackId) {
                console.log(\`%c[OBS-Bridge] Song Changed: \${meta.title}\`, "color: yellow;");
                lastTrackId = trackId;
                cachedLyrics = null; // Reset
                
                // Start Lyrics Fetch
                fetchNativeLyrics(trackId).then(lyrics => {
                    if (lyrics) {
                        console.log("%c[OBS-Bridge] Lyrics Found! Resending", "color: lime;");
                        cachedLyrics = lyrics;
                        // Send immediately when lyrics found
                        sendData("lyrics_found"); 
                    }
                });
            }

            const payload = {
                timestamp: Date.now(),
                clientTimestamp: Date.now(),
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
            console.error("[OBS-Bridge] Send Error", err);
        }
    }

    // 3. Timer & Seek Detection
    setInterval(() => {
        if (Spicetify.Player.isPlaying()) {
            const current = Spicetify.Player.getProgress();
            const now = Date.now();
            const expected = lastProgress + (now - lastCheckTime);

            // Consider as seek if diff > 1.5s
            const isSeek = Math.abs(current - expected) > 1500;
            
            // Detect "Restart" (progress > 3s -> < 2s)
            const isRestart = lastProgress > 3000 && current < 2000;

            if (isSeek || isRestart) {
                console.log("[OBS-Bridge] Seek!");
                sendData("seek");
            }
            
            lastProgress = current;
            lastCheckTime = now;
        } else {
            // Update time only when paused
            lastProgress = Spicetify.Player.getProgress();
            lastCheckTime = Date.now();
        }
    }, 1000); // Check every 1s

    Spicetify.Player.addEventListener("songchange", () => sendData("songchange"));
    Spicetify.Player.addEventListener("onplaypause", () => sendData("playpause"));
    
    sendData("init");
})();
`;

function checkServerReady() {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${PORT}/api/health`, (res) => { // Assuming Next.js responds, or just root
            resolve(true);
        }).on('error', () => {
            resolve(false);
        });
        req.end();
    });
}

function openBrowsers() {
    logEssential('Opening Dashboard & Overlay...');
    const startParam = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
    URLS.forEach(url => {
        exec(`${startParam} ${url}`);
    });
}

async function startServer() {
    // Apply pkg compatibility patches
    require('./pkg-patches')();

    const possibleServerPaths = [
        path.join(__dirname, '..', '.next', 'standalone', 'server.js'),
        path.join(process.cwd(), '.next', 'standalone', 'server.js'),
        path.join(__dirname, 'server.js'),
    ];

    const serverPath = possibleServerPaths.find(p => fs.existsSync(p));

    if (!serverPath) {
        logEssential('Error: Could not find server.js');
        process.exit(1);
    }

    logEssential('Starting Next.js Server (Background Mode)...');
    process.env.PORT = PORT;
    process.env.HOSTNAME = '0.0.0.0';
    process.env.NODE_ENV = 'production';

    require(serverPath);
    logEssential('Server is Ready!');
}

async function main() {
    try {
        const args = process.argv.slice(2);

        // MODE 1: Install
        if (args.includes('--install')) {
            logEssential('Installing Spicetify Extension...');
            // ... (Install logic same as before)
            if (!fs.existsSync(SPICETIFY_EXT_PATH)) {
                console.error('Error: Spicetify Extensions directory not found.');
                console.error(`Path: ${SPICETIFY_EXT_PATH}`);
                console.error('Please install Spicetify first.');
                process.exit(1);
            }

            const targetPath = path.join(SPICETIFY_EXT_PATH, 'obs-bridge.js');
            fs.writeFileSync(targetPath, OBS_BRIDGE_CONTENT);
            console.log(`Extension file written to: ${targetPath}`);

            console.log('Applying changes...');

            // Run commands sequentially for better error handling
            const runCmd = (cmd) => {
                return new Promise((resolve, reject) => {
                    exec(cmd, (err, stdout, stderr) => {
                        if (stdout) console.log(stdout.trim());
                        if (stderr) console.log(stderr.trim());
                        if (err) reject(err);
                        else resolve();
                    });
                });
            };

            const applySpicetify = async () => {
                try {
                    // Try adding extension first
                    await runCmd('spicetify config extensions obs-bridge.js');
                    console.log('Extension registered.');

                    // Then apply
                    await runCmd('spicetify apply');
                    console.log('Spicetify applied successfully.');
                    logEssential('Installation Complete!');
                    process.exit(0);
                } catch (e) {
                    console.error('Error applying Spicetify changes:', e);

                    // Fallback: try backup apply
                    try {
                        console.log('Attempting backup apply...');
                        await runCmd('spicetify backup apply');
                        logEssential('Installation Complete (with backup)!');
                        process.exit(0);
                    } catch (e2) {
                        console.error('Backup apply also failed. Please run manually:');
                        console.error('  spicetify config extensions obs-bridge.js');
                        console.error('  spicetify apply');
                        process.exit(1);
                    }
                }
            };

            applySpicetify();
            return;
        }

        // MODE 2: Background Server (Actual Worker)
        if (args.includes('--server')) {
            await startServer();
            // Keep process alive indefinitely
            return;
        }

        // MODE 3: Launcher (User Double Click)
        logEssential('--- R1G3L-Flux Launcher ---');
        logEssential('Launching background service...');

        // Check if already running by pinging port
        http.get(`http://localhost:${PORT}`, (res) => {
            logEssential('Server is already running! Opening browser...');
            openBrowsers();
            setTimeout(() => process.exit(0), 1000);
        }).on('error', () => {
            // Not running, spawn it
            const child = spawn(process.execPath, ['--server'], {
                detached: true,
                stdio: 'ignore',
                windowsHide: true
            });

            child.unref();

            logEssential('Service started. Waiting for initialization...');

            // Poll until ready then open browser
            let checks = 0;
            const checkInterval = setInterval(() => {
                http.get(`http://localhost:${PORT}`, (res) => {
                    clearInterval(checkInterval);
                    logEssential('Ready! Opening browser...');
                    openBrowsers();
                    setTimeout(() => process.exit(0), 1000);
                }).on('error', () => {
                    checks++;
                    if (checks > 20) {
                        clearInterval(checkInterval);
                        logEssential('Error: Server timed out.');
                        process.exit(1);
                    }
                });
            }, 500);
        });

    } catch (err) {
        logEssential('CRITICAL ERROR: ' + err.message);
        console.error(err);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', () => process.exit(1));
    }
}

main();
