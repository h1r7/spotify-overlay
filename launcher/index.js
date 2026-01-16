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

// Simple logging - reduced verbosity
const log = (msg) => {
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    const line = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync(logFile, line);
        if (!process.argv.includes('--server')) {
            process.stdout.write(line);
        }
    } catch (e) { }
};

const logEssential = log;

// Configuration
const PORT = 6974;
// OPEN BOTH DASHBOARD AND FULL OVERLAY
const URLS = [
    `http://127.0.0.1:${PORT}/dashboard`,
    `http://127.0.0.1:${PORT}/full`
];
const APPDATA = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
const SPICETIFY_EXT_PATH = path.join(APPDATA, 'spicetify', 'Extensions');

// OBS Bridge Content (Embedded)
const OBS_BRIDGE_CONTENT = `// obs-bridge.js - Spotify <-> R1G3L-Flux Link
(async function OBSBridge() {
    while (!Spicetify || !Spicetify.Player || !Spicetify.CosmosAsync) {
        await new Promise(r => setTimeout(r, 100));
    }

    const SERVER_URL = "http://localhost:6974/update";
    
    let lastTrackId = "";
    let cachedLyrics = null;
    let isFetchingLyrics = false;
    let lastProgress = 0;
    let lastCheckTime = Date.now();

    console.log("%c[OBS-Bridge] LOADED", "background: purple; color: white; font-size: 14px;");

    async function fetchNativeLyrics(trackId) {
        if (isFetchingLyrics) return null;
        isFetchingLyrics = true;
        try {
            if (Spicetify.Platform?.LyricsAPI?.getLyrics) {
                const lyrics = await Spicetify.Platform.LyricsAPI.getLyrics(trackId);
                if (lyrics) { isFetchingLyrics = false; return lyrics; }
            }
            const response = await Spicetify.CosmosAsync.get(\`https://spclient.wg.spotify.com/color-lyrics/v2/track/\${trackId}?format=json&market=from_token\`);
            if (response && response.lyrics) { isFetchingLyrics = false; return response.lyrics; }
        } catch (e) { }
        isFetchingLyrics = false;
        return null;
    }

    async function sendData(reason) {
        try {
            const data = Spicetify.Player.data;
            if (!data || !data.item) return;
            const meta = data.item.metadata;
            const trackUri = data.item.uri;
            const trackId = trackUri.split(':')[2];
            const isPlaying = Spicetify.Player.isPlaying();
            const duration = Spicetify.Player.getDuration(); 
            const progress = Spicetify.Player.getProgress();

            if (trackId !== lastTrackId) {
                lastTrackId = trackId;
                cachedLyrics = null;
                fetchNativeLyrics(trackId).then(lyrics => {
                    if (lyrics) { cachedLyrics = lyrics; sendData("lyrics_found"); }
                });
            }

            await fetch(SERVER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    timestamp: Date.now(), clientTimestamp: Date.now(), reason,
                    isPlaying, title: meta.title, artist: meta.artist_name,
                    cover: meta.image_url ? meta.image_url.replace("spotify:image:", "https://i.scdn.co/image/") : "",
                    progress, duration, trackId, spotifyLyrics: cachedLyrics
                })
            });
            lastProgress = progress;
            lastCheckTime = Date.now();
        } catch (err) { }
    }

    setInterval(() => {
        if (Spicetify.Player.isPlaying()) {
            const current = Spicetify.Player.getProgress();
            const expected = lastProgress + (Date.now() - lastCheckTime);
            if (Math.abs(current - expected) > 1500 || (lastProgress > 3000 && current < 2000)) {
                sendData("seek");
            }
            lastProgress = current;
            lastCheckTime = Date.now();
        } else {
            lastProgress = Spicetify.Player.getProgress();
            lastCheckTime = Date.now();
        }
    }, 1000);

    Spicetify.Player.addEventListener("songchange", () => sendData("songchange"));
    Spicetify.Player.addEventListener("onplaypause", () => sendData("playpause"));
    sendData("init");
})();
`;

function openBrowsers() {
    logEssential('Opening Dashboard & Full Overlay...');
    const startParam = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
    URLS.forEach(url => { exec(`${startParam} ${url}`); });
}

async function startServer() {
    require('./pkg-patches')();

    logEssential('Starting Next.js Server...');
    process.env.PORT = PORT;
    process.env.HOSTNAME = '0.0.0.0';
    process.env.NODE_ENV = 'production';

    // Use static require - pkg needs literal string path
    // In pkg snapshot: __dirname is /snapshot/.../launcher
    // server.js is at /snapshot/.../.next/standalone/server.js
    try {
        require('../.next/standalone/server.js');
        logEssential('Server is Ready!');
    } catch (e) {
        logEssential('Error loading server: ' + e.message);
        console.error(e);
        process.exit(1);
    }
}

async function main() {
    try {
        const args = process.argv.slice(2);

        // MODE 1: Install Spicetify Extension
        // MODE 1: Install Spicetify Extension
        if (args.includes('--install')) {
            logEssential('Checking Spicetify installation...');

            const checkSpicetify = () => new Promise((resolve) => {
                exec('spicetify -v', (err) => resolve(!err));
            });

            const installSpicetify = () => new Promise((resolve) => {
                logEssential('Spicetify not found. Installing...');
                const cmd = 'powershell -Command "iwr -useb https://raw.githubusercontent.com/spicetify/spicetify-cli/master/install.ps1 | iex"';
                exec(cmd, (err, stdout, stderr) => {
                    if (err) {
                        logEssential('Failed to install Spicetify: ' + stderr);
                        resolve(false);
                    } else {
                        logEssential('Spicetify installed successfully.');
                        resolve(true);
                    }
                });
            });

            const upgradeSpicetify = () => new Promise((resolve) => {
                logEssential('Spicetify found. Checking for updates...');
                exec('spicetify upgrade', (err, stdout) => {
                    if (stdout && stdout.includes('success')) logEssential('Spicetify updated.');
                    else logEssential('Spicetify is up to date.');
                    resolve(true);
                });
            });

            const hasSpicetify = await checkSpicetify();
            if (!hasSpicetify) {
                const installed = await installSpicetify();
                if (!installed) process.exit(1);
            } else {
                await upgradeSpicetify();
            }

            // Re-check path after install
            const APPDATA_ACTUAL = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
            const SPICETIFY_EXT_PATH_ACTUAL = path.join(APPDATA_ACTUAL, 'spicetify', 'Extensions');

            if (!fs.existsSync(SPICETIFY_EXT_PATH_ACTUAL)) {
                // Try create if missing (fresh install might need it)
                try { fs.mkdirSync(SPICETIFY_EXT_PATH_ACTUAL, { recursive: true }); }
                catch (e) {
                    logEssential('Error: Spicetify Extensions directory not found at ' + SPICETIFY_EXT_PATH_ACTUAL);
                    process.exit(1);
                }
            }

            const targetPath = path.join(SPICETIFY_EXT_PATH_ACTUAL, 'obs-bridge.js');
            fs.writeFileSync(targetPath, OBS_BRIDGE_CONTENT);

            logEssential('Configuring Spicetify...');

            const runSpicetifyCmd = (cmd) => new Promise((resolve, reject) => {
                exec(cmd, (err, stdout, stderr) => {
                    if (err) reject(stderr || err.message);
                    else resolve(stdout);
                });
            });

            try {
                await runSpicetifyCmd('spicetify config extensions obs-bridge.js');
                await runSpicetifyCmd('spicetify apply');
                logEssential('Installation Complete!');
                process.exit(0);
            } catch (err) {
                try {
                    logEssential('Standard apply failed, trying backup apply...');
                    await runSpicetifyCmd('spicetify backup apply');
                    logEssential('Installation Complete (backup)!');
                    process.exit(0);
                } catch (err2) {
                    logEssential('Installation Failed: ' + err2);
                    process.exit(1);
                }
            }
            return;
        }

        // MODE 2: Background Server
        if (args.includes('--server')) {
            await startServer();
            return;
        }
    } catch (e) {
        logEssential('Launcher Error: ' + e.message);
        process.exit(1);
    }

    try {
        // MODE 3: Launcher (Default)
        logEssential('--- R1G3L-Flux Launcher ---');
        logEssential('Launching background service...');

        // pkg requires the entry point script to be the first argument when spawning itself
        const childArgs = [process.argv[1], '--server'];

        const child = spawn(process.execPath, childArgs, {
            detached: true,
            stdio: 'ignore', // No need for debug logs anymore
            windowsHide: true
        });

        child.unref();

        logEssential('Service started. Waiting for initialization...');

        // Poll until ready
        let checks = 0;
        const maxChecks = 60; // 30 seconds
        const checkInterval = setInterval(() => {
            // Use 127.0.0.1 specifically to avoid IPv6 (::1) issues on Windows
            const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
                clearInterval(checkInterval);
                logEssential('Ready! Opening browser...');
                openBrowsers();
                setTimeout(() => process.exit(0), 1500);
            });

            req.on('error', () => {
                checks++;
                if (checks > maxChecks) {
                    clearInterval(checkInterval);
                    logEssential('Error: Server timed out.');
                    process.exit(1);
                }
            });

            req.end();
        }, 500);

    } catch (err) {
        logEssential('CRITICAL ERROR: ' + err.message);
        console.error(err);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', () => process.exit(1));
    }
}

main();
