"use client"

import { useEffect } from "react"
import { useSpotifyData } from "../../hooks/useSpotifyData"
import SongInfoWidget from "../../components/SongInfoWidget"
import { useSettings } from "../../context/SettingsContext"

export default function WidgetPage() {
    const { data, currentProgress, debugSpeed, serverSettings } = useSpotifyData()
    const { updateSettings } = useSettings()

    // Sync server settings (Support isolated environments like OBS)
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
