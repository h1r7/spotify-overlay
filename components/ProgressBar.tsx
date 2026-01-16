import React from 'react';
import { useSettings } from '../context/SettingsContext';

interface ProgressBarProps {
    current: number;
    total: number;
    color: string;
    isPlaying?: boolean;
}

function ProgressBar({ current, total, color, isPlaying = false }: ProgressBarProps) {
    const { settings } = useSettings();
    const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

    const isInteractive = settings.interactiveProgress;

    // Extract brightness from color (assumes R,G,B string format)
    const [r, g, b] = color.includes(',') ? color.split(',').map(c => parseInt(c.trim())) : [255, 255, 255];
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const isLightColor = luminance > 0.7;

    return (
        <div className="relative w-full mt-4 mb-2">
            {/* Progress Bar Container */}
            <div className={`relative w-full h-2 rounded-full overflow-hidden shadow-inner transition-all duration-500 ${isInteractive ? 'h-3' : 'h-2'} ${isLightColor ? 'bg-black/20 border border-black/5' : 'bg-white/10 border border-white/5'}`}>
                {/* Main Progress Fill */}
                <div
                    className="h-full rounded-full transition-none relative z-10"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: `rgb(${color})`,
                        boxShadow: isInteractive ? `0 0 15px rgb(${color}), 0 0 30px rgb(${color})` : `0 0 10px rgb(${color})`
                    }}
                >
                    {/* Interactive Light Trail / Particle Effect */}
                    {isInteractive && isPlaying && (
                        <div
                            className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white/40 to-transparent animate-pulse"
                            style={{ filter: 'blur(4px)' }}
                        />
                    )}
                </div>

                {/* Interactive Background Glow */}
                {isInteractive && (
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{ backgroundColor: `rgb(${color})`, filter: 'blur(8px)' }}
                    />
                )}
            </div>
        </div>
    );
}

export default React.memo(ProgressBar);
