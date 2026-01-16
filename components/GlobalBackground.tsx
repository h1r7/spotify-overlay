"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import { useSpotifyData } from '../hooks/useSpotifyData'
import { useTheme } from '../hooks/useTheme'

/**
 * Global Background Component
 * Renders a consistent background color using the useTheme hook.
 */
export default function GlobalBackground() {
    const pathname = usePathname()
    const { data } = useSpotifyData()
    const { globalBg, isAlbumMode } = useTheme(data.cover)

    // Hide global background on pages that only have lyrics or widgets (for OBS transparent layers)
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
