"use client"

import { useState, useRef, useEffect } from "react"
import { useSpotifyData } from "../../hooks/useSpotifyData"
import SimpleWidget from "../../components/SimpleWidget"
import { useSettings } from "../../context/SettingsContext"
import DisconnectedNotice from "../../components/DisconnectedNotice"

/**
 * 심플 위젯 전용 페이지 (/simple)
 * 방송 중 구석에 작게 띄워두는 용도입니다.
 */
export default function SimplePage() {
    const { data, serverSettings, isDisconnected } = useSpotifyData()
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
        <div className="min-h-screen bg-transparent flex items-start p-8 relative">
            {isDisconnected && <DisconnectedNotice />}
            {/* 설정 적용 알림 (좌측 상단, 연하게) */}
            {showToast && (
                <div className="fixed top-4 left-4 z-[100] bg-white/5 backdrop-blur-md border border-white/10 text-white/40 px-3 py-1 rounded-full text-[10px] font-bold animate-in fade-in slide-in-from-left-2 duration-700">
                    싱크 완료
                </div>
            )}
            <SimpleWidget data={data} />
        </div>
    )
}
