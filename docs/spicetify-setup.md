# Spicetify Integration Guide (OBS Bridge)

This guide explains how to set up the Spicetify extension to connect the Spotify desktop app with the R1G3L-Flux overlay.

## ✅ Prerequisites

1. **Spotify Desktop App** for Windows must be installed. (Microsoft Store version is NOT recommended).
2. **[Spicetify](https://spicetify.app/)** must be installed.

---

## 🚀 Method 1: Automatic Setup (Recommended)

This is the recommended method. `FLUX-setup.bat` or `FLUX.exe` handles the integration automatically.

1. **Run `FLUX-setup.bat`**: Select 'Repair' or 'Install' to automatically install the extension.
2. **Manual Run**: Open a terminal in the folder containing `FLUX.exe` and run:
   ```bash
   FLUX.exe --install
   ```
3. **Verify**: Spotify will restart automatically, and the integration should be complete.

---

## 🛠️ Method 2: Manual Setup (If Auto-Setup Fails)

If the automatic setup fails, follow these steps manually.

### 1. Create Extension File
Create a file named `obs-bridge.js` at the following path (create directory if missing):
`%APPDATA%\spicetify\Extensions\obs-bridge.js`

### 2. Copy Code
Paste the following code into `obs-bridge.js` and save it.

```javascript
// obs-bridge.js - Spotify <-> R1G3L-Flux Bridge
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

    async function sendData(reason) {
        try {
            const data = Spicetify.Player.data;
            if (!data || !data.item) return;
            const meta = data.item.metadata;
            const trackId = data.item.uri.split(':')[2];
            const isPlaying = Spicetify.Player.isPlaying();
            const duration = Spicetify.Player.getDuration(); 
            const progress = Spicetify.Player.getProgress();
            if (trackId !== lastTrackId) {
                lastTrackId = trackId;
                cachedLyrics = null;
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
        } catch (e) { }
    }

    setInterval(() => {
        if (Spicetify.Player.isPlaying()) {
            const current = Spicetify.Player.getProgress();
            if (Math.abs(current - (lastProgress + (Date.now() - lastCheckTime))) > 1500) sendData("seek");
            lastProgress = current;
            lastCheckTime = Date.now();
        }
    }, 1000);
    Spicetify.Player.addEventListener("songchange", () => sendData("songchange"));
    Spicetify.Player.addEventListener("onplaypause", () => sendData("playpause"));
    sendData("init");
})();
```

### 3. Apply to Spicetify
Run the following commands in PowerShell:
```powershell
spicetify config extensions obs-bridge.js
spicetify apply
```

---

## ❓ Troubleshooting

### No Connection!
- Ensure `FLUX.exe` is running.
- Check if `localhost:6974/dashboard` is accessible in your browser.

### Spotify UI changed but overlay isn't working
- Ensure `spicetify apply` was successful.
- Check the Console tab in Spotify Developer Tools (Ctrl+Shift+I) for errors.
