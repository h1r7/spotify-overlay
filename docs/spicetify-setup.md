# Spicetify 연동 가이드 (OBS Bridge)

이 문서는 Spotify 데스크톱 앱과 R1G3L-Flux 오버레이를 연결하는 Spicetify 확장을 설정하는 방법을 설명합니다.

## ✅ 필수 조건

1. Windows용 **Spotify 데스크톱 앱**이 설치되어 있어야 합니다. (Microsoft Store 버전 제외 권장)
2. **[Spicetify](https://spicetify.app/)**가 설치되어 있어야 합니다.

---

## 🚀 방법 1: 자동 설정 (권장)

가장 권장되는 방법입니다. `FLUX-setup.bat` 또는 `FLUX.exe`가 자동으로 연동 설정을 진행합니다.

1. **`FLUX-setup.bat` 실행**: 설치 프로그램에서 'Repair' 또는 'Install'을 선택하면 자동으로 확장이 설치됩니다.
2. **직접 실행**: `FLUX.exe`가 있는 폴더에서 터미널을 열고 다음 명령어를 입력합니다.
   ```bash
   FLUX.exe --install
   ```
3. **확인**: Spotify가 자동으로 재시작되며 연동이 완료됩니다.

---

## 🛠️ 방법 2: 수동 설정 (자동 설정 실패 시)

자동 설정이 작동하지 않는 경우 아래 단계를 수동으로 진행하세요.

### 1. 확장 파일 생성
아래 경로에 `obs-bridge.js` 파일을 생성합니다. (폴더가 없으면 생성하세요)
`%APPDATA%\spicetify\Extensions\obs-bridge.js`

### 2. 코드 복사
아래 코드를 `obs-bridge.js`에 붙여넣고 저장합니다.

```javascript
// obs-bridge.js - Spotify <-> R1G3L-Flux 연동
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
                // 가사 생략 (서버에서 처리 가능하지만 클라이언트 측에서 보내주면 더 정확함)
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

### 3. Spicetify 적용
터미널(PowerShell)에서 다음 명령어를 차례대로 입력합니다:
```powershell
spicetify config extensions obs-bridge.js
spicetify apply
```

---

## ❓ 문제 해결

### 연결이 안 돼요!
- `FLUX.exe`가 실행 중인지 확인하세요.
- `localhost:6974/dashboard`가 브라우저에서 열리는지 확인하세요.

### Spotify가 스킨만 입혀지고 오버레이는 안 나와요
- `spicetify apply` 명령어가 성공했는지 확인하세요.
- Spotify 개발자 도구(Ctrl+Shift+I)의 Console 탭에 에러가 없는지 확인하세요.
