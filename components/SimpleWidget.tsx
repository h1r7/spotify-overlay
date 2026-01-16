"use client"

import React from 'react';
import { NowPlayingData } from '../hooks/useSpotifyData';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../context/SettingsContext';
import Visualizer from './Visualizer';

interface SimpleWidgetProps {
    data: NowPlayingData;
}

/**
 * Simple Widget Component
 * Compact horizontal layout optimized for OBS broadcasting
 */
const SimpleWidget: React.FC<SimpleWidgetProps> = ({ data }) => {
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

    const isCustom = settings.simpleWidgetStyle === 'custom';
    const widgetAccent = isCustom ? settings.customColors.simpleWidgetBg : `rgb(${accentColor})`;
    const containerBg = isCustom ? settings.customColors.simpleWidgetBg : 'transparent';

    return (
        <div
            className="relative flex items-center gap-4 p-4 pr-6 rounded-3xl transition-all duration-1000 overflow-hidden max-w-[450px] shadow-2xl group border border-white/20"
        >
            {/* Wrap Visualizer Around Widget */}
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
                            className="w-full h-full object-cover blur-2xl scale-150 opacity-60 transition-all duration-1000"
                        />
                        <div className="absolute inset-0 bg-black/30" />
                    </div>
                )}
                {/* Highlight Glow */}
                <div
                    className="absolute -inset-[50%] opacity-20 blur-3xl rounded-full transition-colors duration-1000"
                    style={{ backgroundColor: widgetAccent }}
                />
            </div>

            {/* Glass Texture Overlay */}
            <div className="absolute inset-0 z-0 backdrop-blur-md bg-zinc-950/20" />

            {/* Content Layer */}
            <div className="relative z-10 flex items-center gap-4 w-full">
                {/* Album Cover */}
                <div className="relative w-20 h-20 flex-shrink-0">
                    {data.cover && !imgError ? (
                        <img
                            key={`${data.cover}-${imgRetryCount}`}
                            src={imgRetryCount > 0 ? `${data.cover}?retry=${imgRetryCount}` : data.cover}
                            alt="Cover"
                            className="w-full h-full object-cover rounded-xl shadow-2xl border border-white/10"
                            onError={() => {
                                if (imgRetryCount < 3) {
                                    setTimeout(() => setImgRetryCount(prev => prev + 1), 1000);
                                } else {
                                    setImgError(true);
                                }
                            }}
                        />
                    ) : (
                        <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                            <span className="text-2xl">🎵</span>
                        </div>
                    )}
                </div>

                {/* Track Info */}
                <div className="flex flex-col min-w-0 flex-grow py-1">
                    <h1 className="text-xl font-black text-white truncate leading-tight tracking-tight drop-shadow-md">
                        {data.title}
                    </h1>
                    <p className="text-sm font-bold text-white/70 truncate uppercase tracking-widest mt-0.5 drop-shadow-sm">
                        {data.artist}
                    </p>
                </div>

                {/* Playback Status Icon */}
                <div className="flex-shrink-0 ml-2">
                    {data.isPlaying ? (
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <div
                                className="absolute inset-0 rounded-full animate-ping opacity-20"
                                style={{ backgroundColor: widgetAccent }}
                            />
                            <div className="relative w-8 h-8 flex items-center justify-center bg-white rounded-full text-black shadow-xl transform group-hover:scale-110 transition-transform">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-white/40 backdrop-blur-sm border border-white/5">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default React.memo(SimpleWidget);
