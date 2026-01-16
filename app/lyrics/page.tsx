"use client"

import { useEffect } from "react"
import { useSpotifyData } from "../../hooks/useSpotifyData"
import LyricsWidget from "../../components/LyricsWidget"
import { useSettings } from "../../context/SettingsContext"
import DisconnectedNotice from "../../components/DisconnectedNotice"

export default function LyricsPage() {
    const { data, currentProgress, serverSettings, isDisconnected } = useSpotifyData()
    const { updateSettings } = useSettings()

    // Sync server settings (Support isolated environments like OBS)
    useEffect(() => {
        if (serverSettings) {
            updateSettings(serverSettings)
        }
    }, [serverSettings, updateSettings])

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center font-sans overflow-hidden">
            {isDisconnected && <DisconnectedNotice />}
            <LyricsWidget
                data={data}
                currentProgress={currentProgress}
                noBackground={false}
            />
        </div>
    )
}
