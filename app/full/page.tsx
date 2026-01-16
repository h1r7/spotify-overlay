"use client"

import { useState, useRef, useEffect } from "react"
import { useSpotifyData } from "../../hooks/useSpotifyData"
import SongInfoWidget from "../../components/SongInfoWidget"
import LyricsWidget from "../../components/LyricsWidget"
import { useSettings } from "../../context/SettingsContext"
import DisconnectedNotice from "../../components/DisconnectedNotice"

/**
 * 풀 위젯 페이지 (가장 완성도 높은 전체 구성)
 * Song Info + Lyrics + Chat Box Placeholder
 */
export default function FullPage() {
    const { data, currentProgress, debugSpeed, serverSettings, isDisconnected } = useSpotifyData()
    const { updateSettings } = useSettings()

    const [showToast, setShowToast] = useState(false)
    const lastSyncedSettingsRef = useRef<string>("")

    // 서버 설정 동기화
    useEffect(() => {
        if (serverSettings) {
            const settingsString = JSON.stringify(serverSettings);

            // 처음 로딩이 아니고 실제로 설정이 바뀌었을 때만 토스트 표시
            if (lastSyncedSettingsRef.current && lastSyncedSettingsRef.current !== settingsString) {
                setShowToast(true);
                setTimeout(() => setShowToast(false), 2000);
            }

            lastSyncedSettingsRef.current = settingsString;
            updateSettings(serverSettings)
        }
    }, [serverSettings, updateSettings])

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-8 font-sans overflow-hidden relative">
            {/* Server Disconnected Notice */}
            {isDisconnected && <DisconnectedNotice />}

            {/* 설정 적용 알림 (좌측 상단, 연하게) */}
            {showToast && (
                <div className="fixed top-4 left-4 z-[100] bg-white/5 backdrop-blur-md border border-white/10 text-white/40 px-3 py-1 rounded-full text-[10px] font-bold animate-in fade-in slide-in-from-left-2 duration-700">
                    심크 완료
                </div>
            )}
            <div className="relative z-10 flex items-center justify-center gap-12">

                {/* 1. Song Info (Left) */}
                <SongInfoWidget
                    data={data}
                    currentProgress={currentProgress}
                    debugSpeed={debugSpeed}
                />

                {/* 2. Lyrics (Center) */}
                <LyricsWidget
                    data={data}
                    currentProgress={currentProgress}
                />

                {/* 3. Chat Box Placeholder (Right) */}
                <div className="w-[400px] h-[500px] rounded-3xl border-[3px] border-white/20 bg-black/10 backdrop-blur-sm flex items-center justify-center relative shadow-2xl">
                    <div className="absolute opacity-0 hover:opacity-100 transition-opacity inset-0 flex items-center justify-center bg-black/50 rounded-3xl text-white text-xs text-center p-4">
                        Place your chat overlay source here in OBS
                    </div>
                </div>

            </div>
        </div>
    )
}
