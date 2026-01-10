"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import { useSpotifyData } from '../hooks/useSpotifyData'
import { useTheme } from '../hooks/useTheme'

/**
 * 전역 배경 컴포넌트
 * useTheme 훅을 사용하여 일관된 배경색을 렌더링합니다.
 */
export default function GlobalBackground() {
    const pathname = usePathname()
    const { data } = useSpotifyData()
    const { globalBg, isAlbumMode } = useTheme(data.cover)

    // 가사만 있거나 위젯만 있는 페이지에서는 전역 배경을 숨깁니다 (OBS 투명 레이어용)
    const isTransparentPage = ['/simple', '/square', '/widget', '/lyrics'].includes(pathname)
    if (isTransparentPage) return null

    return (
        <div className="fixed inset-0 -z-50 transition-all duration-1000 ease-in-out" style={{ backgroundColor: globalBg }}>
            {isAlbumMode && data.cover && (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 blur-[100px] scale-110 transition-all duration-2000 ease-in-out"
                    style={{ backgroundImage: `url(${data.cover})` }}
                />
            )}
            {/* Overlay to make sure text is readable */}
            <div className="absolute inset-0 bg-black/40 transition-opacity duration-1000" />
        </div>
    )
}
