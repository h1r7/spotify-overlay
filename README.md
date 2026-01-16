# 🎧 R1G3L-Flux | Spotify Overlay

OBS 스트리밍을 위한 프리미엄 Spotify Now Playing 오버레이

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

## ✨ 주요 기능

- 🎵 **실시간 재생 정보** - Spicetify 연동으로 즉각적인 업데이트
- 📝 **가사 동기화** - Spotify Native + LRCLIB 이중 소스
- 🎨 **다양한 위젯** - Full, Simple, Square, Lyrics 4가지 레이아웃
- 🌈 **앨범 아트 테마** - 커버 기반 동적 컬러 추출
- ⚙️ **커스터마이징** - 색상, 애니메이션, 효과 세부 조절
- 🔄 **실시간 동기화** - OBS와 브라우저 간 설정 공유

## 🖼️ 위젯 종류

| 위젯 | 경로 | 설명 |
|------|------|------|
| **Full** | `/full` | 전체 화면 레이아웃 (정보 + 가사) |
| **Simple** | `/simple` | 컴팩트 가로형 (OBS 코너용) |
| **Square** | `/square` | 정사각형 레이아웃 |
| **Lyrics** | `/lyrics` | 가사 전용 |
| **Widget** | `/widget` | 정보 위젯 단독 |
| **Dashboard** | `/dashboard` | 설정 대시보드 |

## 🚀 시작하기

### 필수 조건

- Node.js 18+
- [Spicetify](https://spicetify.app/) 설치된 Spotify 데스크톱 앱

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-repo/spotify-overlay-design.git
cd spotify-overlay-design

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 또는 프로덕션 빌드
npm run build
npm start
```

### Spicetify 설정

Spotify와 연동하려면 Spicetify 확장을 설치해야 합니다.

 👉 **[Spicetify 설정 가이드](./docs/spicetify-setup.md)**

## 📦 배포 가이드 (개발자용)

소스 코드를 수정하고 배포 버전을 생성하는 방법입니다.

### 1. 배포 빌드 생성
```bash
npm run deploy
```
이 명령어를 실행하면 `build` 과정을 거쳐 `dist` 폴더에 배포 파일이 생성됩니다.

### 2. 배포 패키지 구성
`dist` 폴더 안에 생성된 **`FLUX-setup.bat`** 파일 하나만 배포하면 됩니다.

### 3. GitHub Release 등록 (필수)
`FLUX-setup.bat`은 GitHub Releases에서 실행 파일을 다운로드하므로, 다음 과정이 필수입니다:
1. GitHub 저장소(`h1r7/spotify-overlay`)에 새로운 Release를 생성합니다.
2. `dist/FLUX.exe` 파일을 Release의 **Assets**에 업로드합니다.
   - **주의:** 업로드되는 파일명은 반드시 `FLUX.exe`여야 합니다.

이제 사용자는 `FLUX-setup.bat`만 실행하면 자동으로 최신 `FLUX.exe`를 다운로드하고 설치/업데이트를 진행할 수 있습니다.

## 📁 프로젝트 구조

```
spotify-overlay-design/
├── app/                        # Next.js App Router
│   ├── dashboard/              # 설정 대시보드
│   ├── full, simple, square/   # 위젯 페이지들
│   ├── update/route.ts         # REST API
│   └── events/route.ts         # SSE 실시간 스트리밍
├── components/
│   ├── dashboard/              # 대시보드 섹션 컴포넌트
│   ├── SongInfoWidget.tsx      # 곡 정보 위젯
│   ├── LyricsWidget.tsx        # 가사 위젯
│   └── ...
├── lib/
│   ├── lyricsService.ts        # 가사 검색 서비스
│   └── eventEmitter.ts         # SSE 이벤트 에미터
├── hooks/                      # React 커스텀 훅
├── context/                    # React Context
└── docs/                       # 문서
```

## ⚙️ 설정 항목

대시보드(`/dashboard`)에서 조절 가능:

### 위젯 스타일
- 배경 모드 (앨범 아트 / 커스텀 색상)
- 위젯별 개별 색상 설정

### 애니메이션
- 곡 변경 효과 (기본 / 페이드)
- 가사 바운스 효과 및 강도

### 가사
- 배경 스타일
- 싱크 오프셋 조절 (-500ms ~ +500ms)

### 프리미엄 효과
- 인터랙티브 진행바 (글로우 + 빛 궤적)
- 테두리 회전 조명 (Wrap Visualizer)

## � 기술 스택

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + TailwindCSS 4
- **Language**: TypeScript 5
- **실시간 통신**: SSE (Server-Sent Events)
- **가사 소스**: Spotify API, LRCLIB

## 📝 라이선스

MIT License

## 🙏 크레딧

- Powered by **R1G3L | R1G3L-Flux**
- 가사 제공: [Musixmatch](https://www.musixmatch.com/), [LRCLIB](https://lrclib.net/)