"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface ColorSettings {
    widgetBg: string
    lyricsBg: string
    simpleWidgetBg: string
    squareWidgetBg: string
}

export interface Settings {
    widgetStyle: 'album' | 'custom'
    lyricsStyle: 'album' | 'custom'
    animationStyle: 'default' | 'fade'
    pageBackgroundStyle: 'album' | 'custom'
    pageBackgroundColor: string
    lyricsBounceEffect: boolean
    lyricsBounceAmount: number
    simpleWidgetStyle: 'album' | 'custom'
    squareWidgetStyle: 'album' | 'custom'
    lyricsOffset: number
    showWrapVisualizer: boolean
    interactiveProgress: boolean
    customColors: ColorSettings
}

const defaultSettings: Settings = {
    widgetStyle: 'album',
    lyricsStyle: 'custom',
    animationStyle: 'default',
    pageBackgroundStyle: 'custom',
    pageBackgroundColor: '#000000',
    lyricsBounceEffect: false,
    lyricsBounceAmount: 7,
    lyricsOffset: 0,
    simpleWidgetStyle: 'album',
    squareWidgetStyle: 'album',
    showWrapVisualizer: true,
    interactiveProgress: false,
    customColors: {
        widgetBg: '#18181b', // zinc-900
        lyricsBg: '#000000', // black
        simpleWidgetBg: '#18181b', // zinc-900
        squareWidgetBg: '#18181b' // zinc-900
    }
}

interface SettingsContextType {
    settings: Settings
    updateSettings: (newSettings: Partial<Settings>) => void
    resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage and listen for changes
    useEffect(() => {
        const loadSettings = () => {
            const saved = localStorage.getItem('overlay-settings')
            if (saved) {
                try {
                    setSettings({ ...defaultSettings, ...JSON.parse(saved) })
                } catch (e) {
                    console.error("Failed to parse settings", e)
                }
            }
        }

        loadSettings()
        setIsLoaded(true)

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'overlay-settings') {
                loadSettings()
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    // Save to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('overlay-settings', JSON.stringify(settings))
        }
    }, [settings, isLoaded])

    const updateSettings = React.useCallback((newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }))
    }, [])

    const resetSettings = React.useCallback(() => {
        setSettings(defaultSettings)
    }, [])

    const value = React.useMemo(() => ({
        settings,
        updateSettings,
        resetSettings
    }), [settings, updateSettings, resetSettings])

    return (
        <SettingsContext.Provider value={value}>
            {isLoaded ? children : null}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider")
    }
    return context
}
