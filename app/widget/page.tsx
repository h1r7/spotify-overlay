"use client"

import { useEffect } from "react"
import { useSpotifyData } from "../../hooks/useSpotifyData"
import SongInfoWidget from "../../components/SongInfoWidget"
import { useSettings } from "../../context/SettingsContext"

export default function WidgetPage() {
    const { data, currentProgress, debugSpeed, serverSettings } = useSpotifyData()
    const { updateSettings } = useSettings()

    // 서버 설정 동기화 (OBS 등 분리된 환경 대응)
    useEffect(() => {
        if (serverSettings) {
            updateSettings(serverSettings)
        }
    }, [serverSettings, updateSettings])

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center font-sans overflow-hidden">
            <SongInfoWidget
                data={data}
                currentProgress={currentProgress}
                noBackground={false}
                debugSpeed={debugSpeed}
            />
        </div>
    )
}
