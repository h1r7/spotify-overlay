"use client"

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { NowPlayingData } from '../hooks/useSpotifyData';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../hooks/useTheme';

interface LyricsWidgetProps {
    data: NowPlayingData;
    currentProgress: number;
    noBackground?: boolean;
}

function LyricsWidget({ data, currentProgress, noBackground }: LyricsWidgetProps) {
    const { settings } = useSettings();
    const { lyricsBg: containerBg, dominantColor } = useTheme(data.cover);

    if (!data) return null;

    // 활성 가사 찾기
    const activeLyricIndex = useMemo(() => {
        if (!data.lyrics || data.lyrics.length === 0) return -1;
        // [Predictive] 100ms 미리 보기를 더해 강조 시점을 앞당김
        const predictiveProgress = currentProgress + 100;
        const index = [...data.lyrics].reverse().findIndex(l => predictiveProgress >= l.time);
        return index === -1 ? -1 : data.lyrics.length - 1 - index;
    }, [data.lyrics, currentProgress]);

    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [translateY, setTranslateY] = useState(250);

    const lastTrackId = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (data.trackId && data.trackId !== lastTrackId.current) {
            itemRefs.current = [];
            // 트랙이 바뀔 때만 즉시 중앙(250)으로 리셋
            setTranslateY(250);
            lastTrackId.current = data.trackId;
        }
    }, [data.trackId]);

    useEffect(() => {
        if (activeLyricIndex !== -1 && itemRefs.current[activeLyricIndex]) {
            const activeElement = itemRefs.current[activeLyricIndex];
            if (activeElement) {
                const elementCenter = activeElement.offsetTop + (activeElement.offsetHeight / 2);
                setTranslateY(250 - elementCenter);
            }
        } else if (activeLyricIndex === -1 && data.lyrics && data.lyrics.length > 0) {
            if (currentProgress < (data.lyrics[0].time - 500)) {
                setTranslateY(250);
            }
        }
    }, [activeLyricIndex, data.lyrics]);

    return (
        <div className="relative flex flex-col items-center">
            <div
                className={`relative w-[450px] h-[500px] overflow-hidden rounded-3xl transition-all duration-300 ${!noBackground ? 'border-[3px] border-white/20 shadow-2xl' : ''}`}
                style={{ backgroundColor: noBackground ? 'transparent' : containerBg }}
            >

                {/* 앨범 아트는 가사창 내부에만 존재하도록 완전 독립 */}
                {settings.lyricsStyle === 'album' && dominantColor && !noBackground && (
                    <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
                        <div
                            className={`absolute inset-0 opacity-40 blur-[80px] pointer-events-none transition-all duration-1000`}
                            style={{ backgroundColor: `rgb(${dominantColor})` }}
                        />
                        <div className="absolute inset-0 bg-black/40" />
                    </div>
                )}

                <div className="absolute inset-0 z-20 pointer-events-none"
                    style={{
                        background: `linear-gradient(to bottom, 
                      ${noBackground ? 'rgba(0,0,0,0.5)' : containerBg} 0%, 
                      transparent 20%, 
                      transparent 80%, 
                      ${noBackground ? 'rgba(0,0,0,0.5)' : containerBg} 100%)`
                    }}
                />

                <div className="absolute inset-x-0 top-0 z-10 flex flex-col items-center">
                    {data.lyrics && data.lyrics.length > 0 ? (
                        <div
                            className="w-full flex flex-col gap-6"
                            style={{
                                transform: `translateY(${translateY}px)`,
                                transition: 'transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1)'
                            }}
                        >
                            {data.lyrics.map((line, idx) => {
                                const isActive = idx === activeLyricIndex;
                                return (
                                    <div
                                        key={`${idx}`}
                                        ref={el => { itemRefs.current[idx] = el }}
                                        className={`
                                      py-2 flex items-center justify-center text-center px-12 transition-all duration-300
                                      ${isActive ? "scale-110 opacity-100 active-pulse" : "scale-100 opacity-30 blur-[0.5px]"}
                                      ${settings.lyricsBounceEffect && !isActive && idx !== 0 ? 'animate-lyrics-bounce' : ''}
                                  `}
                                        style={{
                                            contentVisibility: 'auto',
                                            containIntrinsicSize: '0 60px',
                                            animationName: (settings.lyricsBounceEffect && !isActive && idx !== 0) ? (activeLyricIndex % 2 === 0 ? 'lyrics-bounce-a' : 'lyrics-bounce-b') : 'none',
                                            animationDuration: '0.6s',
                                            animationTimingFunction: 'ease-out',
                                            animationFillMode: 'forwards'
                                        } as any}
                                    >
                                        <p
                                            className={`
                                      text-2xl font-bold leading-relaxed break-keep transition-colors duration-300
                                      ${isActive ? "text-white" : "text-zinc-400"}
                                    `}
                                            style={{
                                                textShadow: isActive ? "0 0 30px rgba(255,255,255,0.5)" : "none"
                                            }}
                                        >
                                            {line.words}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
                            {data.lyricsStatus === 'searching' ? (
                                <>
                                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                    <p className="text-lg font-semibold text-zinc-400 animate-pulse">
                                        Searching Lyrics...
                                    </p>
                                </>
                            ) : (
                                <p className="text-xl font-bold tracking-widest text-zinc-500 opacity-50">
                                    NO LYRICS
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div >

            <style jsx>{`
                @keyframes lyrics-bounce-a {
                    0% { transform: translateY(0); }
                    35% { transform: translateY(-${settings.lyricsBounceAmount * 5.0}px); }
                    100% { transform: translateY(0); }
                }
                @keyframes lyrics-bounce-b {
                    0% { transform: translateY(0); }
                    35% { transform: translateY(-${settings.lyricsBounceAmount * 5.0}px); }
                    100% { transform: translateY(0); }
                }
                .active-pulse {
                    animation: pulse-glow 2s infinite alternate ease-in-out;
                }
                @keyframes pulse-glow {
                    0% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.4); transform: scale(1.1); }
                    100% { text-shadow: 0 0 40px rgba(255, 255, 255, 0.8); transform: scale(1.12); }
                }
            `}</style>

            <div className="absolute top-full left-0 w-full text-center mt-3 z-30 opacity-50">
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/60">
                    Lyrics from Musixmatch & lrclib
                </p>
            </div>
        </div >
    );
}

export default React.memo(LyricsWidget);
