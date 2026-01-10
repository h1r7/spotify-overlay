"use client"

import { useSpotifyData } from "../../hooks/useSpotifyData"
import { useSettings } from "../../context/SettingsContext"
import { useState, useEffect, useRef } from "react"

// Dashboard Components
import StatusPanel from "../../components/dashboard/StatusPanel"
import WidgetSettings from "../../components/dashboard/WidgetSettings"
import LyricsSettings from "../../components/dashboard/LyricsSettings"
import PageBackgroundSettings from "../../components/dashboard/PageBackgroundSettings"
import PremiumEffectsSettings from "../../components/dashboard/PremiumEffectsSettings"

export default function DashboardPage() {
    const { data, serverSettings } = useSpotifyData()
    const { settings, updateSettings, resetSettings } = useSettings()

    // 서버에서 온 마지막 설정을 저장하여 중복 동기화 방지
    const lastSyncedSettingsRef = useRef<string>("")

    // 로컬 상태 (즉시 적용 방지용 Draft)
    const [draftWidgetStyle, setDraftWidgetStyle] = useState<'album' | 'custom'>('album')
    const [draftLyricsStyle, setDraftLyricsStyle] = useState<'album' | 'custom'>('custom')
    const [draftAnimationStyle, setDraftAnimationStyle] = useState<'default' | 'fade'>('default')
    const [draftWidgetBg, setDraftWidgetBg] = useState('#18181b')
    const [draftLyricsBg, setDraftLyricsBg] = useState('#000000')
    const [draftSimpleWidgetBg, setDraftSimpleWidgetBg] = useState('#18181b')
    const [draftSquareWidgetBg, setDraftSquareWidgetBg] = useState('#18181b')

    // 추가 기능 Draft
    const [draftPageBgStyle, setDraftPageBgStyle] = useState<'album' | 'custom'>('custom')
    const [draftPageBgColor, setDraftPageBgColor] = useState('#000000')
    const [draftLyricsBounce, setDraftLyricsBounce] = useState(false)
    const [draftLyricsBounceAmount, setDraftLyricsBounceAmount] = useState(5)
    const [draftSimpleWidgetStyle, setDraftSimpleWidgetStyle] = useState<'album' | 'custom'>('album')
    const [draftSquareWidgetStyle, setDraftSquareWidgetStyle] = useState<'album' | 'custom'>('album')
    const [draftLyricsOffset, setDraftLyricsOffset] = useState(0)
    const [draftShowWrapVisualizer, setDraftShowWrapVisualizer] = useState(true)
    const [draftInteractiveProgress, setDraftInteractiveProgress] = useState(false)

    const [showToast, setShowToast] = useState(false)

    // 초기 로딩 및 서버 설정 변경 시 동기화
    useEffect(() => {
        if (serverSettings) {
            const settingsString = JSON.stringify(serverSettings)
            if (settingsString === lastSyncedSettingsRef.current) return

            console.log("🔄 서버 설정 변경 감지 - 대시보드 동기화")
            lastSyncedSettingsRef.current = settingsString

            setDraftWidgetStyle(serverSettings.widgetStyle)
            setDraftLyricsStyle(serverSettings.lyricsStyle)
            setDraftAnimationStyle(serverSettings.animationStyle)
            setDraftWidgetBg(serverSettings.customColors.widgetBg || '#18181b')
            setDraftLyricsBg(serverSettings.customColors.lyricsBg || '#000000')
            setDraftSimpleWidgetBg(serverSettings.customColors.simpleWidgetBg || '#18181b')
            setDraftPageBgStyle(serverSettings.pageBackgroundStyle || 'custom')
            setDraftPageBgColor(serverSettings.pageBackgroundColor || '#000000')
            setDraftLyricsBounce(serverSettings.lyricsBounceEffect || false)
            setDraftLyricsBounceAmount(serverSettings.lyricsBounceAmount ?? 5)
            setDraftSimpleWidgetStyle(serverSettings.simpleWidgetStyle || 'album')
            setDraftSquareWidgetStyle(serverSettings.squareWidgetStyle || 'album')
            setDraftSquareWidgetBg(serverSettings.customColors.squareWidgetBg || '#18181b')
            setDraftLyricsOffset(serverSettings.lyricsOffset || 0)
            setDraftShowWrapVisualizer(serverSettings.showWrapVisualizer ?? true)
            setDraftInteractiveProgress(serverSettings.interactiveProgress || false)

            updateSettings(serverSettings)
        }
    }, [serverSettings, updateSettings])

    const handleApply = async () => {
        const newSettings = {
            widgetStyle: draftWidgetStyle,
            lyricsStyle: draftLyricsStyle,
            animationStyle: draftAnimationStyle,
            pageBackgroundStyle: draftPageBgStyle,
            pageBackgroundColor: draftPageBgColor,
            lyricsBounceEffect: draftLyricsBounce,
            lyricsBounceAmount: draftLyricsBounceAmount,
            simpleWidgetStyle: draftSimpleWidgetStyle,
            squareWidgetStyle: draftSquareWidgetStyle,
            lyricsOffset: draftLyricsOffset,
            showWrapVisualizer: draftShowWrapVisualizer,
            interactiveProgress: draftInteractiveProgress,
            customColors: {
                widgetBg: draftWidgetBg,
                lyricsBg: draftLyricsBg,
                simpleWidgetBg: draftSimpleWidgetBg,
                squareWidgetBg: draftSquareWidgetBg
            }
        }

        updateSettings(newSettings)

        try {
            await fetch('/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'settings_update',
                    settings: newSettings
                })
            })
            setShowToast(true)
            setTimeout(() => setShowToast(false), 3000)
        } catch (e) {
            console.error("Failed to sync settings to server", e)
            alert("Settings Applied locally, but failed to sync to server.")
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans relative">
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-8 py-3 rounded-full shadow-2xl font-bold animate-in fade-in slide-in-from-top-4 duration-500">
                    ✅ 설정이 서버에 적용되었습니다!
                </div>
            )}

            {/* Header */}
            <header className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                    R1G3L-Flux | 대시보드
                </h1>
                <div className="flex gap-4">
                    <button
                        onClick={handleApply}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg transition-all transform hover:scale-105"
                    >
                        설정 저장 및 적용
                    </button>
                    <a href="/widget" target="_blank" className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition">정보</a>
                    <a href="/lyrics" target="_blank" className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition">가사</a>
                    <div className="w-px h-8 bg-zinc-800 mx-1" />
                    <a href="/simple" target="_blank" className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition font-bold">심플 위젯</a>
                    <a href="/square" target="_blank" className="px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-lg hover:bg-purple-600/30 transition font-bold">정사각형</a>
                    <a href="/full" target="_blank" className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition font-bold">전체 화면</a>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Row 1: Status, Widget, Lyrics */}
                <StatusPanel data={data} />

                <WidgetSettings
                    draftWidgetStyle={draftWidgetStyle}
                    setDraftWidgetStyle={setDraftWidgetStyle}
                    draftWidgetBg={draftWidgetBg}
                    setDraftWidgetBg={setDraftWidgetBg}
                    draftSimpleWidgetStyle={draftSimpleWidgetStyle}
                    setDraftSimpleWidgetStyle={setDraftSimpleWidgetStyle}
                    draftSimpleWidgetBg={draftSimpleWidgetBg}
                    setDraftSimpleWidgetBg={setDraftSimpleWidgetBg}
                    draftSquareWidgetStyle={draftSquareWidgetStyle}
                    setDraftSquareWidgetStyle={setDraftSquareWidgetStyle}
                    draftSquareWidgetBg={draftSquareWidgetBg}
                    setDraftSquareWidgetBg={setDraftSquareWidgetBg}
                />

                <LyricsSettings
                    draftAnimationStyle={draftAnimationStyle}
                    setDraftAnimationStyle={setDraftAnimationStyle}
                    draftLyricsStyle={draftLyricsStyle}
                    setDraftLyricsStyle={setDraftLyricsStyle}
                    draftLyricsBg={draftLyricsBg}
                    setDraftLyricsBg={setDraftLyricsBg}
                    draftLyricsBounce={draftLyricsBounce}
                    setDraftLyricsBounce={setDraftLyricsBounce}
                    draftLyricsBounceAmount={draftLyricsBounceAmount}
                    setDraftLyricsBounceAmount={setDraftLyricsBounceAmount}
                    draftLyricsOffset={draftLyricsOffset}
                    setDraftLyricsOffset={setDraftLyricsOffset}
                />

                {/* Row 2: Page Background & Premium Effects */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <PageBackgroundSettings
                        draftPageBgStyle={draftPageBgStyle}
                        setDraftPageBgStyle={setDraftPageBgStyle}
                        draftPageBgColor={draftPageBgColor}
                        setDraftPageBgColor={setDraftPageBgColor}
                    />

                    <PremiumEffectsSettings
                        draftInteractiveProgress={draftInteractiveProgress}
                        setDraftInteractiveProgress={setDraftInteractiveProgress}
                        draftShowWrapVisualizer={draftShowWrapVisualizer}
                        setDraftShowWrapVisualizer={setDraftShowWrapVisualizer}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-end">
                <button onClick={resetSettings} className="text-xs text-red-500 hover:underline">
                    기본값으로 초기화
                </button>
            </div>
        </div>
    )
}