"use client"

import React, { useEffect, useRef, useState } from 'react';

interface VisualizerProps {
    type: 'wrap';
    isPlaying: boolean;
    color: string; // rgb(r, g, b) format
}

const Visualizer: React.FC<VisualizerProps> = ({ type, isPlaying, color }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (canvasRef.current && canvasRef.current.parentElement) {
                const { clientWidth, clientHeight } = canvasRef.current.parentElement;
                setDimensions({ width: clientWidth, height: clientHeight });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let offset = 0;

        const render = () => {
            if (!isPlaying) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Smooth premium rotation speed
            offset += 0.04;

            if (type === 'wrap') {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;

                // Subtle rotation for premium feel
                const rotation = offset * 0.1;

                // Create a rotating gradient for the "RGB Chase" effect
                const colorBase = color.replace('rgb(', '').replace(')', '');
                const [r, g, b] = colorBase.split(',').map(v => parseInt(v.trim()));

                const colorLighter = `rgba(${Math.min(255, r + 60)}, ${Math.min(255, g + 60)}, ${Math.min(255, b + 60)}, 0.8)`;
                const colorDarker = `rgba(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)}, 0.2)`;

                const gradient = ctx.createConicGradient(rotation, centerX, centerY);
                gradient.addColorStop(0, colorLighter);
                gradient.addColorStop(0.25, colorDarker);
                gradient.addColorStop(0.5, colorLighter);
                gradient.addColorStop(0.75, colorDarker);
                gradient.addColorStop(1, colorLighter);

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 15;
                ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;

                const radius = 24;
                const x = 1.5;
                const y = 1.5;
                const w = canvas.width - 3;
                const h = canvas.height - 3;

                ctx.beginPath();
                ctx.roundRect(x, y, w, h, radius);
                ctx.stroke();

                // Add a subtle outer glow
                ctx.globalAlpha = 0.4;
                ctx.lineWidth = 6;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying, color, type, dimensions]);

    return (
        <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="absolute inset-0 pointer-events-none z-0"
            style={{
                opacity: isPlaying ? 1 : 0.5,
                transition: 'opacity 0.5s ease'
            }}
        />
    );
};

export default React.memo(Visualizer);
