"use client"

import React, { useState, useEffect } from 'react';
import { NowPlayingData } from '../hooks/useSpotifyData';
import ProgressBar from './ProgressBar';
import Visualizer from './Visualizer';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../hooks/useTheme';

interface SongInfoWidgetProps {
    data: NowPlayingData;
    currentProgress: number;
    noBackground?: boolean;
    debugSpeed?: number;
}

function SongInfoWidget({ data, currentProgress, noBackground, debugSpeed }: SongInfoWidgetProps) {
    const { settings } = useSettings();
    const { dominantColor, accentColor, widgetBg: bgColor } = useTheme(data.cover);
    const [imgError, setImgError] = useState(false);
    const [imgRetryCount, setImgRetryCount] = useState(0);
    const [prevCover, setPrevCover] = useState<string | null>(data.cover || null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // 노래가 실제로 바뀌었는지 추적 (settings 변경과 구분)
    const lastTrackIdRef = React.useRef<string | undefined>(data.trackId);
    const [songChanged, setSongChanged] = useState(false);

    // 트랙 변경 감지 (settings 변경과 분리)
    useEffect(() => {
        if (data.trackId !== lastTrackIdRef.current) {
            lastTrackIdRef.current = data.trackId;
            setSongChanged(true);
            // 애니메이션 후 리셋
            const timer = setTimeout(() => setSongChanged(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [data.trackId]);

    // 앨범 커버 전환 효과 - 실제 커버 URL이 바뀌었을 때만 적용
    useEffect(() => {
        setImgError(false);
        setImgRetryCount(0);
        // Track ID가 바뀌었거나 Cover URL이 바뀐 경우에만 transition 트리거
        if (settings.animationStyle === 'fade' && data.cover && data.cover !== prevCover) {
            setIsTransitioning(true);
            const timer = setTimeout(() => {
                setPrevCover(data.cover);
                setIsTransitioning(false);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (data.cover !== prevCover) {
            // 그 외 설정 변경 등에서는 즉시 업데이트하여 깜빡임 방지
            setPrevCover(data.cover);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.cover, data.trackId, settings.animationStyle]);

    if (!data) return null;

    const isCustom = settings.widgetStyle === 'custom';
    const isFade = settings.animationStyle === 'fade';
    const progress = Math.min(currentProgress, data.duration);

    const formatTime = (ms: number) => {
        if (isNaN(ms) || ms < 0) return "0:00"
        const s = Math.floor(ms / 1000)
        const min = Math.floor(s / 60)
        const sec = s % 60
        return `${min}:${sec.toString().padStart(2, "0")}`
    }

    return (
        <div className="relative flex flex-col items-center gap-3">
            <div
                className={`relative flex flex-col items-center w-[350px] text-center p-6 rounded-3xl overflow-hidden transition-all duration-1000 ${!noBackground ? 'border border-white/10 backdrop-blur-md shadow-2xl' : ''}`}
                style={{
                    backgroundColor: noBackground
                        ? 'transparent'
                        : (isCustom ? bgColor : 'rgba(24, 24, 27, 0.85)')
                }}
            >
                {/* 3. Wrap Visualizer around the widget */}
                {settings.showWrapVisualizer && !noBackground && (
                    <Visualizer type="wrap" isPlaying={data.isPlaying} color={`rgb(${dominantColor})`} />
                )}

                {/* Album Style Glow Overlay - Always rendered but opacity controlled for smooth transition */}
                {!noBackground && (
                    <div
                        className={`absolute inset-0 z-0 blur-[80px] pointer-events-none transition-all ${isFade ? 'duration-[3000ms]' : 'duration-1000'}`}
                        style={{
                            backgroundColor: `rgb(${dominantColor})`,
                            opacity: isCustom ? 0 : 0.4
                        }}
                    />
                )}

                <div className="absolute top-3 left-0 w-full text-center z-20 opacity-50">
                    <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Powered by R1G3L | R1G3L-Flux</p>
                </div>

                <div className="relative z-10 w-full flex flex-col items-center mt-4">
                    <div className="relative w-64 h-64 mb-6 group">
                        <div
                            className={`absolute inset-0 rounded-2xl blur-xl opacity-40 transition-colors ${isFade ? 'duration-[2000ms]' : 'duration-500'}`}
                            style={{ backgroundColor: `rgb(${dominantColor})` }}
                        />
                        {isFade && prevCover && isTransitioning && (
                            <img src={prevCover} alt="Prev Cover" className="absolute inset-0 w-full h-full object-cover rounded-2xl shadow-2xl z-10 animate-out fade-out duration-1000 fill-mode-forwards" />
                        )}
                        {data.cover && !imgError ? (
                            <img
                                key={`${data.cover}-${imgRetryCount}`}
                                src={imgRetryCount > 0 ? `${data.cover}?retry=${imgRetryCount}` : data.cover}
                                alt="Cover"
                                className={`relative w-full h-full object-cover rounded-2xl shadow-2xl z-10 ${isFade && isTransitioning ? 'animate-in fade-in duration-1000' : ''}`}
                                onError={() => {
                                    if (imgRetryCount < 3) {
                                        setTimeout(() => setImgRetryCount(prev => prev + 1), 1000);
                                    } else {
                                        setImgError(true);
                                    }
                                }}
                            />
                        ) : (
                            <div className="w-full h-full bg-white/5 rounded-2xl flex items-center justify-center z-10">
                                <span className="text-4xl">🎵</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 mb-4 w-full h-24 flex flex-col justify-center">
                        {/* key를 trackId로 변경하고, songChanged일 때만 애니메이션 적용 */}
                        <div key={data.trackId} className={(isFade && songChanged) ? "animate-in fade-in slide-in-from-bottom-4 duration-700" : ""}>
                            <h1 className="text-3xl font-black tracking-tighter text-white drop-shadow-lg line-clamp-2 leading-tight">{data.title}</h1>
                            <p className="text-xl font-medium text-white/80 line-clamp-2 mt-1">{data.artist}</p>
                        </div>
                    </div>

                    <div className="w-full mt-6">
                        <ProgressBar current={progress} total={data.duration} color={accentColor} isPlaying={data.isPlaying} />
                        <div className="flex items-center justify-between px-1 mt-1 text-xs text-white/50 font-mono font-medium">
                            <span>{formatTime(progress)}</span>
                            <span>{formatTime(data.duration)}</span>
                        </div>
                    </div>

                    <div className="w-full flex items-center justify-between px-2 mt-4">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                            <path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" />
                        </svg>
                        <div className="flex items-center gap-6">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white/40"><path d="M19 20L9 12l10-8v16zM5 19V5h2v14H5z" /></svg>
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black shadow-lg">
                                {data.isPlaying ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                )}
                            </div>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white/40"><path d="M5 4l10 8-10 8V4zM17 5h2v14h-2V5z" /></svg>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="absolute top-full left-0 w-full flex flex-col items-center gap-1 mt-4">
                <div className="flex items-center gap-1 opacity-60">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#1DB954]">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-white">Spotify</span>
                </div>
                {debugSpeed !== undefined && Math.abs(debugSpeed - 1.0) > 0.001 && (
                    <div className="text-[10px] font-mono text-zinc-500/30 font-bold tracking-tighter">
                        {debugSpeed > 1.0 ? 'SYNC +' : 'SYNC -'}
                    </div>
                )}
            </div>
        </div>
    );
}

export default React.memo(SongInfoWidget);
