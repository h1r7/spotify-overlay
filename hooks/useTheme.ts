"use client"

import { useState, useEffect, useMemo } from "react"
import { useSettings } from "../context/SettingsContext"

/**
 * Hook for global theme and color management
 * Calculates global background color and widget background color consistently.
 */
export function useTheme(coverUrl: string | undefined) {
    const { settings } = useSettings()
    const [dominantColor, setDominantColor] = useState<string>("18, 18, 18")

    // Color extraction logic (integrated)
    useEffect(() => {
        if (!coverUrl) return

        const extractColor = () => {
            const img = new Image()
            img.crossOrigin = "Anonymous"
            img.src = coverUrl
            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas")
                    const ctx = canvas.getContext("2d", { willReadFrequently: true })
                    if (!ctx) return
                    canvas.width = 1
                    canvas.height = 1
                    ctx.drawImage(img, 0, 0, 1, 1)
                    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
                    const newColor = `${r}, ${g}, ${b}`

                    if (newColor !== "0, 0, 0") {
                        setDominantColor(newColor)
                    }
                } catch (e) {
                    console.warn("Theme extraction failed:", e)
                }
            }
        }
        extractColor()
    }, [coverUrl])

    // Common background calculation logic
    const theme = useMemo(() => {
        const isAlbumMode = settings.pageBackgroundStyle === 'album'
        const [r, g, b] = dominantColor.split(',').map(c => parseInt(c.trim()))

        // Calculate Luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

        // High contrast accent color (for progress bar, etc.)
        // Darken bright colors to ensure contrast with white text/UI
        let accentR = r, accentG = g, accentB = b
        if (luminance > 0.6) {
            // Darken if too bright (approx. 50%)
            const darkenFactor = 0.5
            accentR = Math.floor(r * darkenFactor)
            accentG = Math.floor(g * darkenFactor)
            accentB = Math.floor(b * darkenFactor)
        } else if (luminance < 0.15) {
            // Brighten slightly if too dark
            const brightenFactor = 1.5
            accentR = Math.min(255, Math.floor(r * brightenFactor) + 30)
            accentG = Math.min(255, Math.floor(g * brightenFactor) + 30)
            accentB = Math.min(255, Math.floor(b * brightenFactor) + 30)
        }
        const accentColor = `${accentR}, ${accentG}, ${accentB}`

        // 1. Global Page Background
        const globalBg = isAlbumMode
            ? `rgb(${[r, g, b].map(c => Math.floor(c * 0.4)).join(',')})`
            : settings.pageBackgroundColor

        // 2. Default Widget/Lyrics Background (Opaque)
        const lyricsBg = settings.lyricsStyle === 'custom'
            ? settings.customColors.lyricsBg
            : `rgb(${dominantColor})`

        const widgetBg = settings.widgetStyle === 'custom'
            ? settings.customColors.widgetBg
            : `rgb(${dominantColor})`

        return {
            dominantColor,
            accentColor,
            globalBg,
            lyricsBg,
            widgetBg,
            isAlbumMode
        }
    }, [dominantColor, settings])

    return theme
}
