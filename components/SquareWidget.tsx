"use client"

import React from 'react';
import { NowPlayingData } from '../hooks/useSpotifyData';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../context/SettingsContext';
import Visualizer from './Visualizer';

interface SquareWidgetProps {
    data: NowPlayingData;
}

/**
 * Square Widget Component
 * Compact square layout optimized for OBS broadcasting
 */
const SquareWidget: React.FC<SquareWidgetProps> = ({ data }) => {
    const { dominantColor, accentColor } = useTheme(data.cover);
    const { settings } = useSettings();
    const [imgError, setImgError] = React.useState(false);
    const [imgRetryCount, setImgRetryCount] = React.useState(0);

    // Reset error state on track change
    React.useEffect(() => {
        setImgError(false);
        setImgRetryCount(0);
    }, [data.trackId, data.cover]);

    if (!data || !data.title) return null;

    const isCustom = settings.squareWidgetStyle === 'custom';
    const widgetAccent = isCustom ? settings.customColors.squareWidgetBg : `rgb(${accentColor})`;
    const containerBg = isCustom ? settings.customColors.squareWidgetBg : 'transparent';

    return (
        <div
            className="relative w-80 h-80 rounded-[2.5rem] transition-all duration-1000 overflow-hidden shadow-2xl group flex flex-col items-center justify-between p-8 border border-white/20"
        >
            {/* 1. Wrap Visualizer around the widget */}
            {settings.showWrapVisualizer && (
                <Visualizer type="wrap" isPlaying={data.isPlaying} color={widgetAccent} />
            )}

            {/* Background Layer (Album Art Blur or Custom Color) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {isCustom || !data.cover || imgError ? (
                    <div
                        className="w-full h-full transition-colors duration-1000"
                        style={{ backgroundColor: isCustom ? containerBg : '#18181b' }}
                    />
                ) : (
                    <div className="relative w-full h-full">
                        <img
                            key={`${data.cover}-bg-${imgRetryCount}`}
                            src={imgRetryCount > 0 ? `${data.cover}?retry=${imgRetryCount}` : data.cover}
                            alt=""
                            className="w-full h-full object-cover blur-3xl scale-125 opacity-70 transition-all duration-1000"
                        />
                        <div className="absolute inset-0 bg-black/50" />
                    </div>
                )}
                {/* Highlight Glow */}
                <div
                    className="absolute -inset-[50%] opacity-40 blur-[100px] rounded-full transition-colors duration-1000"
                    style={{ backgroundColor: widgetAccent }}
                />
            </div>

            {/* Glass Texture Overlay */}
            <div className={`absolute inset-0 z-0 backdrop-blur-2xl ${isCustom ? 'bg-black/30' : 'bg-zinc-950/40'}`} />

            {/* Header: Track Info */}
            <div className="relative z-10 flex flex-col items-center text-center w-full gap-5">
                {/* Album Cover */}
                <div className="relative w-36 h-36 flex-shrink-0 group-hover:scale-105 transition-transform duration-700 ease-out">
                    {data.cover && !imgError ? (
                        <div className="relative">
                            {/* Pulse effect behind cover when playing */}
                            {data.isPlaying && (
                                <div
                                    className="absolute -inset-3 rounded-3xl animate-pulse opacity-50 blur-xl"
                                    style={{ backgroundColor: widgetAccent }}
                                />
                            )}
                            <img
                                key={`${data.cover}-${imgRetryCount}`}
                                src={imgRetryCount > 0 ? `${data.cover}?retry=${imgRetryCount}` : data.cover}
                                alt="Cover"
                                className="relative w-full h-full object-cover rounded-3xl shadow-2xl border border-white/20"
                                onError={() => {
                                    if (imgRetryCount < 3) {
                                        setTimeout(() => setImgRetryCount(prev => prev + 1), 1000);
                                    } else {
                                        setImgError(true);
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
                            <span className="text-4xl">🎵</span>
                        </div>
                    )}
                </div>

                {/* Track Details */}
                <div className="flex flex-col items-center min-w-0 w-full px-2">
                    <h1 className="text-xl font-black text-white w-full truncate leading-tight tracking-tight drop-shadow-2xl">
                        {data.title}
                    </h1>
                    <p className="text-sm font-bold text-white/50 w-full truncate uppercase tracking-widest mt-1.5 drop-shadow-md">
                        {data.artist}
                    </p>
                </div>
            </div>

            {/* Footer: Decorative Controller */}
            <div className="relative z-10 flex items-center justify-center gap-8 w-full mt-auto pb-2">
                {/* Previous Button (Decorative) */}
                <div className="text-white/30 hover:text-white/60 transition-colors cursor-default transform hover:scale-110">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                </div>

                {/* Play/Pause Button */}
                <div className="relative w-14 h-14 flex items-center justify-center group/play cursor-default">
                    <div
                        className="absolute inset-0 rounded-full opacity-20 blur-md group-hover/play:opacity-40 transition-opacity"
                        style={{ backgroundColor: widgetAccent }}
                    />
                    <div className="relative w-full h-full rounded-full bg-white text-black flex items-center justify-center shadow-xl transform group-hover/play:scale-110 transition-all duration-300">
                        {data.isPlaying ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Next Button (Decorative) */}
                <div className="text-white/30 hover:text-white/60 transition-colors cursor-default transform hover:scale-110">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 18l8.5-6L6 6zm9-12v12h2V6z" />
                    </svg>
                </div>
            </div>

            {/* Decorative Progress Line (Very thin at the bottom) */}
            {data.isPlaying && (
                <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden bg-white/10">
                    <div
                        className="h-full animate-pulse"
                        style={{
                            backgroundColor: widgetAccent,
                            width: '40%', // Decorative placeholder
                            boxShadow: `0 0 10px ${widgetAccent}`
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default React.memo(SquareWidget);
