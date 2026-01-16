# 🎧 R1G3L-Flux | Spotify Overlay

Premium Spotify Now Playing Overlay for OBS Streaming.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

## ✨ Features

- 🎵 **Real-time Playback Info** - Instant updates via Spicetify integration
- 📝 **Synced Lyrics** - Dual source: Spotify Native + LRCLIB
- 🎨 **Multiple Widgets** - Full, Simple, Square, and Lyrics layouts
- 🌈 **Dynamic Themes** - Colors extracted from album art
- ⚙️ **Customization** - Detailed control over colors, animations, and effects
- 🔄 **Real-time Sync** - Settings shared instantly between OBS and Browser

## 🖼️ Widget Types

| Widget | Path | Description |
|--------|------|-------------|
| **Full** | `/full` | Full-screen layout (Info + Lyrics) |
| **Simple** | `/simple` | Compact horizontal layout (for OBS corners) |
| **Square** | `/square` | Square layout |
| **Lyrics** | `/lyrics` | Lyrics only |
| **Widget** | `/widget` | Song info only |
| **Dashboard** | `/dashboard` | Settings Dashboard |

## 🚀 Getting Started

### For Users (Recommended)
The fastest and easiest way to install.

1. Download **`FLUX-setup.bat`** from the **[Latest Release](https://github.com/h1r7/spotify-overlay/releases/latest)** page.
2. Run `FLUX-setup.bat`. (It will automatically download the latest `FLUX.exe` and configure Spicetify).
3. Once complete, run `FLUX.exe` to start the overlay.

👉 **[Detailed Setup Guide (Spicetify Integration)](./docs/spicetify-setup.md)**

### For Developers (Build from Source)
1. **Prerequisites**: Node.js 18+, [Spicetify](https://spicetify.app/) installed.
2. **Clone**: `git clone https://github.com/h1r7/spotify-overlay.git`
3. **Install Dependencies**: `npm install`
4. **Run**: `npm run dev` (Development) or `npm run build && npm start` (Production)
5. **Overlay URL**: Open `http://localhost:6974` in your browser.

## 🏗 Local Build & Run

If you want to modify the source code and run it locally:

### ⚙️ Development Mode
Best for making real-time changes to the UI or logic.
```bash
npm run dev
```

### 🚀 Production Mode
Best for daily use after you've finished your modifications. It provides better performance and stability.
```bash
# 1. Build the project
npm run build

# 2. Start the server
npm start
```
Once started, you can access the dashboard at `http://localhost:6974/dashboard` to configure your overlay.

## 📁 Project Structure

```
spotify-overlay-design/
├── app/                        # Next.js App Router
│   ├── dashboard/              # Settings Dashboard
│   ├── full, simple, square/   # Widget Pages
│   ├── update/route.ts         # REST API
│   └── events/route.ts         # SSE Real-time Streaming
├── components/
│   ├── dashboard/              # Dashboard Components
│   ├── SongInfoWidget.tsx      # Song Info Widget
│   ├── LyricsWidget.tsx        # Lyrics Widget
│   └── ...
├── lib/
│   ├── lyricsService.ts        # Lyrics Service
│   └── eventEmitter.ts         # SSE Event Emitter
├── hooks/                      # React Custom Hooks
├── context/                    # React Context
└── docs/                       # Documentation
```

## ⚙️ Configuration

Adjustable via Dashboard (`/dashboard`):

### Widget Style
- Background Mode (Album Art / Custom Color)
- Individual Widget Colors

### Animation
- Song Change Effect (Default / Fade)
- Lyrics Bounce Effect & Intensity

### Lyrics
- Background Style
- Sync Offset Adjustment (-500ms ~ +500ms)

### Premium Effects
- Interactive Progress Bar (Glow + Trail)
- Border Rotation Lighting (Wrap Visualizer)

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + TailwindCSS 4
- **Language**: TypeScript 5
- **Real-time**: SSE (Server-Sent Events)
- **Lyrics Source**: Spotify API, LRCLIB

## 📝 License

MIT License

## 🙏 Credits

- Powered by **R1G3L | R1G3L-Flux**
- Lyrics provided by: [Musixmatch](https://www.musixmatch.com/), [LRCLIB](https://lrclib.net/)
