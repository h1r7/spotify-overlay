"use client"

import { useState, useRef, useEffect } from "react"
import { useSpotifyData } from "../../hooks/useSpotifyData"
import SimpleWidget from "../../components/SimpleWidget"
import { useSettings } from "../../context/SettingsContext"
import DisconnectedNotice from "../../components/DisconnectedNotice"

/**
 * Simple Widget Page (/simple)
 * Compact layout for OBS corner placement.
 */
export default function SimplePage() {
    const { data, serverSettings, isDisconnected } = useSpotifyData()
    const { updateSettings } = useSettings()

    const [showToast, setShowToast] = useState(false)
    const lastSyncedSettingsRef = useRef<string>("")

    // Sync server settings
    useEffect(() => {
        if (serverSettings) {
            const settingsString = JSON.stringify(serverSettings);

            // Show toast only if settings actually changed (ignore initial load)
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
            {/* Sync Status Notification (Top-left, subtle) */}
            {showToast && (
                <div className="fixed top-4 left-4 z-[100] bg-white/5 backdrop-blur-md border border-white/10 text-white/40 px-3 py-1 rounded-full text-[10px] font-bold animate-in fade-in slide-in-from-left-2 duration-700">
                    Synced
                </div>
            )}
            <SimpleWidget data={data} />
        </div>
    )
}
