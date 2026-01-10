"use client"

import { useState, useEffect, useMemo } from "react"
import { useSettings } from "../context/SettingsContext"

/**
 * 전역 테마 및 색상 관리를 위한 훅
 * 전역 배경색, 위젯 배경색 등을 일관되게 계산합니다.
 */
export function useTheme(coverUrl: string | undefined) {
    const { settings } = useSettings()
    const [dominantColor, setDominantColor] = useState<string>("18, 18, 18")

    // 색상 추출 로직 (통합)
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

    // 공통 배경 계산 로직
    const theme = useMemo(() => {
        const isAlbumMode = settings.pageBackgroundStyle === 'album'
        const [r, g, b] = dominantColor.split(',').map(c => parseInt(c.trim()))

        // 밝기 계산 (Luminance)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

        // 가독성 높은 강조색 (진행바 등용)
        // 밝은 색상은 어둡게 조절하여 흰색 텍스트/UI와 대비가 잘 되도록 함
        let accentR = r, accentG = g, accentB = b
        if (luminance > 0.6) {
            // 밝은 색상이면 어둡게 조절 (50% 정도로)
            const darkenFactor = 0.5
            accentR = Math.floor(r * darkenFactor)
            accentG = Math.floor(g * darkenFactor)
            accentB = Math.floor(b * darkenFactor)
        } else if (luminance < 0.15) {
            // 너무 어두운 색상이면 약간 밝게 조절
            const brightenFactor = 1.5
            accentR = Math.min(255, Math.floor(r * brightenFactor) + 30)
            accentG = Math.min(255, Math.floor(g * brightenFactor) + 30)
            accentB = Math.min(255, Math.floor(b * brightenFactor) + 30)
        }
        const accentColor = `${accentR}, ${accentG}, ${accentB}`

        // 1. 전체 페이지 배경색
        const globalBg = isAlbumMode
            ? `rgb(${[r, g, b].map(c => Math.floor(c * 0.4)).join(',')})`
            : settings.pageBackgroundColor

        // 2. 가사/위젯용 기본 배경색 (불투명)
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
