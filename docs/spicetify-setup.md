# Spicetify OBS Bridge 설정 가이드

## 개요

이 문서는 Spotify 데스크톱 앱과 R1G3L-Flux 오버레이를 연결하는 Spicetify 확장 설정 방법을 설명합니다.

## 필수 조건

1. [Spicetify](https://spicetify.app/) 설치
2. R1G3L-Flux 오버레이 서버 실행 중 (`npm start`)

## 설치 방법

### 1. 확장 파일 생성

아래 경로에 `obs-bridge.js` 파일을 생성합니다:

```
C:\Users\{사용자명}\AppData\Roaming\spicetify\Extensions\obs-bridge.js
```

### 2. 확장 코드

```javascript
// obs-bridge.js - Spotify <-> R1G3L-Flux 연동
(async function OBSBridge() {
    while (!Spicetify || !Spicetify.Player || !Spicetify.CosmosAsync) {
        await new Promise(r => setTimeout(r, 100));
    }

    const SERVER_URL = "http://localhost:6974/update";
    
    // 상태 변수
    let lastTrackId = "";
    let cachedLyrics = null;
    let isFetchingLyrics = false;
    let lastProgress = 0;
    let lastCheckTime = Date.now();

    console.log("%c[OBS-Bridge] LOADED (Sync Fix v4)", "background: purple; color: white; font-size: 14px;");

    // 1. 가사 가져오기 (비동기)
    async function fetchNativeLyrics(trackId) {
        if (isFetchingLyrics) return null;
        isFetchingLyrics = true;
        console.log(`[OBS-Bridge] 가사 검색 중... (${trackId})`);

        try {
            // Platform API 우선
            if (Spicetify.Platform?.LyricsAPI?.getLyrics) {
                const lyrics = await Spicetify.Platform.LyricsAPI.getLyrics(trackId);
                if (lyrics) {
                    isFetchingLyrics = false;
                    return lyrics; 
                }
            }
            
            // Cosmos API 차선
            const response = await Spicetify.CosmosAsync.get(`https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&market=from_token`);
            if (response && response.lyrics) {
                isFetchingLyrics = false;
                return response.lyrics;
            }
        } catch (e) {
            // console.warn("가사 없음 or 에러");
        }
        
        isFetchingLyrics = false;
        return null;
    }

    // 2. 데이터 전송 (핵심)
    async function sendData(reason) {
        try {
            const data = Spicetify.Player.data;
            if (!data || !data.item) return;

            const meta = data.item.metadata;
            const trackUri = data.item.uri;
            const trackId = trackUri.split(':')[2];
            const isPlaying = Spicetify.Player.isPlaying();
            
            // Duration: metadata 대신 Player API 사용
            const duration = Spicetify.Player.getDuration(); 
            const progress = Spicetify.Player.getProgress();

            // 곡 변경 감지
            if (trackId !== lastTrackId) {
                console.log(`%c[OBS-Bridge] 곡 변경: ${meta.title}`, "color: yellow;");
                lastTrackId = trackId;
                cachedLyrics = null; // 초기화
                
                // 가사 요청 시작
                fetchNativeLyrics(trackId).then(lyrics => {
                    if (lyrics) {
                        console.log("%c[OBS-Bridge] 가사 찾음! 재전송", "color: lime;");
                        cachedLyrics = lyrics;
                        // 가사 찾은 즉시 업데이트 (딜레이 없이)
                        sendData("lyrics_found"); 
                    }
                });
            }

            const payload = {
                timestamp: Date.now(),
                clientTimestamp: Date.now(), // 네트워크 지연 자동 계산용
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
            console.error("[OBS-Bridge] 전송 에러", err);
        }
    }

    // 3. 타이머 & Seek 감지
    setInterval(() => {
        if (Spicetify.Player.isPlaying()) {
            const current = Spicetify.Player.getProgress();
            const now = Date.now();
            const expected = lastProgress + (now - lastCheckTime);

            // 1.5초 이상 차이날 때만 Seek로 간주 (민감도 완화)
            const isSeek = Math.abs(current - expected) > 1500;
            
            // "처음으로 되돌리기" 감지 (3초 이상 진행 → 2초 미만)
            const isRestart = lastProgress > 3000 && current < 2000;

            if (isSeek || isRestart) {
                console.log("[OBS-Bridge] Seek!");
                sendData("seek");
            }
            
            lastProgress = current;
            lastCheckTime = now;
        } else {
            // 멈춰있을 땐 시간만 갱신
            lastProgress = Spicetify.Player.getProgress();
            lastCheckTime = Date.now();
        }
    }, 1000); // 1초 체크 (부담 줄임)

    Spicetify.Player.addEventListener("songchange", () => sendData("songchange"));
    Spicetify.Player.addEventListener("onplaypause", () => sendData("playpause"));
    
    sendData("init");
})();
```

### 3. Spicetify에 확장 등록

PowerShell에서 다음 명령어 실행:

```powershell
spicetify config extensions obs-bridge.js
spicetify apply
```

### 4. 확인

Spotify를 재시작하면 개발자 도구(Ctrl+Shift+I)에서 다음 로그 확인:

```
[OBS-Bridge] LOADED (Sync Fix v4)
```

## 서버 URL 변경

기본 포트(6974)가 아닌 다른 포트를 사용하는 경우, `obs-bridge.js`의 `SERVER_URL` 변수를 수정하세요:

```javascript
const SERVER_URL = "http://localhost:YOUR_PORT/update";
```

## 문제 해결

### 가사가 표시되지 않음
- Spotify Premium 계정이 필요합니다 (일부 가사 기능)
- LRCLIB 폴백으로 무료 가사 검색도 지원됩니다

### 연결 실패
- 오버레이 서버가 실행 중인지 확인하세요 (`npm start`)
- 방화벽이 localhost 통신을 차단하고 있는지 확인하세요

### 확장이 로드되지 않음
```powershell
spicetify restore backup apply
```
