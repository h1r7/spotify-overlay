"use client"

import { useEffect, useState, useRef } from "react"

export interface LyricLine {
    time: number
    words: string
}

export interface NowPlayingData {
    timestamp: number
    isPlaying: boolean
    title: string
    artist: string
    cover: string
    progress: number
    duration: number
    lyrics: LyricLine[]
    lyricsStatus?: 'ok' | 'searching' | 'not_found'
    trackId?: string
    networkDelay?: number
    settings?: any // Server-provided settings
}

const BASE_SYNC_OFFSET = 300; // Default offset
const CLIENT_SIDE_BUFFER = 150; // [NEW] Safety margin for proactive response (ms)
const POLLING_INTERVAL = 500;

export function useSpotifyData() {
    const [data, setData] = useState<NowPlayingData>({
        timestamp: Date.now(),
        isPlaying: false,
        title: "Waiting...",
        artist: "",
        cover: "",
        progress: 0,
        duration: 0,
        lyrics: [],
    })

    const [currentProgress, setCurrentProgress] = useState(0)
    const [isMounted, setIsMounted] = useState(false)
    const [debugSpeed, setDebugSpeed] = useState(1.0)
    const [serverSettings, setServerSettings] = useState<any>(null)
    const [isDisconnected, setIsDisconnected] = useState(false)

    // Refs
    const lastUpdateTimestamp = useRef<number>(Date.now())
    const progressAtUpdate = useRef<number>(0)
    const animationFrameRef = useRef<number>(0)
    const correctionFactor = useRef<number>(1.0)
    const lastDisplayedProgress = useRef<number>(0) // Prevent backward jumps
    const networkDelayRef = useRef<number>(BASE_SYNC_OFFSET) // Network delay (auto-calculated)

    // Ref to solve closure issues (access latest data in SSE/Polling callbacks)
    const dataRef = useRef(data);
    useEffect(() => { dataRef.current = data; }, [data]);

    useEffect(() => {
        setIsMounted(true)

        // [New] Force sync reset when returning from tab switch
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log("👀 Tab active - Resetting sync state");
                lastDisplayedProgress.current = 0; // Force reset
                correctionFactor.current = 1.0;
                // Trigger immediate polling (optional)
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [])

    // Data processing logic (Common for SSE & Polling)
    const processUpdate = (newData: NowPlayingData, isFromSSE: boolean) => {
        const now = Date.now();
        const compensatedProgress = newData.progress;

        // Auto-update network delay
        if (newData.networkDelay && newData.networkDelay > 0) {
            networkDelayRef.current = newData.networkDelay;
        }

        const oldData = dataRef.current;
        const isSongChange = oldData.trackId !== newData.trackId;
        const stateChanged = oldData.isPlaying !== newData.isPlaying;

        // Current local expected time
        const timePassed = now - lastUpdateTimestamp.current;
        const currentExpected = progressAtUpdate.current + (timePassed * correctionFactor.current);

        // Calculate drift
        const diff = compensatedProgress - currentExpected;
        const absDiff = Math.abs(diff);

        // [Stabilization] Increase anchor difference threshold (Handle network jitter)
        const currentAnchor = lastUpdateTimestamp.current - progressAtUpdate.current;
        const newAnchor = now - compensatedProgress;
        const anchorDiff = Math.abs(currentAnchor - newAnchor);

        // Handle settings update
        if (newData.settings) {
            setServerSettings((prev: any) => {
                if (JSON.stringify(prev) === JSON.stringify(newData.settings)) return prev;
                return newData.settings;
            });
        }

        const mergedLyrics = (newData.lyrics && newData.lyrics.length > 0)
            ? newData.lyrics
            : (isSongChange ? [] : oldData.lyrics);

        // [Fix] Preserve lyrics status (prevent overwrite while searching)
        // [Update] If server explicitly sends 'not_found', apply immediately
        const mergedStatus = (newData.lyricsStatus === 'not_found' && oldData.lyricsStatus === 'searching' && !isSongChange)
            ? 'not_found' // Follow server's final decision instead of forcing back to searching
            : newData.lyricsStatus || oldData.lyricsStatus;

        const mergedData = { ...newData, lyrics: mergedLyrics, lyricsStatus: mergedStatus };

        // [Fix] Apply immediately if newData has lyrics even if song changed
        // [Fix] Remove logic acting on polling data (always try to reflect latest data)
        setData(mergedData);

        // [Sync Optimization] 
        const isNearStart = compensatedProgress < 5000;
        // [Tweaked] Adjust jump sensitivity (800ms)
        const jumpThreshold = (isSongChange || isNearStart) ? 100 : 800;

        // [Fix] Simplify condition: Hard jump if anchor diff > 1s or actual drift exceeds threshold
        // Increased threshold 800 -> 1200 to prevent frequent jumps
        const shouldHardJump =
            isSongChange ||
            stateChanged ||
            !newData.isPlaying ||
            anchorDiff >= 3000 ||
            absDiff > 1200;

        if (shouldHardJump) {
            // console.log(`[Jump] Diff: ${Math.round(diff)}ms, AnchorDiff: ${Math.round(anchorDiff)}ms`);
            lastUpdateTimestamp.current = now;
            progressAtUpdate.current = compensatedProgress;
            correctionFactor.current = 1.0;
            setDebugSpeed(1.0);

            // [Fix] Update UI unconditionally on hard jump (for immediate reflection on tab return)
            // But prevent 'reverse jump' to too old data
            const isForwardJump = compensatedProgress >= lastDisplayedProgress.current;
            const isSignificantJump = Math.abs(diff) > 2000; // Allow backward jump if diff > 2s (e.g. seeking)

            if (isSongChange || isForwardJump || isSignificantJump) {
                lastDisplayedProgress.current = compensatedProgress;
                setCurrentProgress(compensatedProgress);
            }
        } else {
            // [Soft Correction] Catch up via speed adjustment
            if (absDiff < 50) {
                correctionFactor.current = 1.0;
            } else {
                // P-Controller Gain
                const pGain = 0.0001; // Slightly smoother
                let adjustment = diff * pGain;
                // Limit speed adjustment to max 10%
                adjustment = Math.max(-0.1, Math.min(0.1, adjustment));
                correctionFactor.current = 1.0 + adjustment;
            }
            setDebugSpeed(correctionFactor.current);
        }
    };

    // 1. SSE Connection (Receive real-time events)
    useEffect(() => {
        if (!isMounted) return
        const eventSource = new EventSource('/events')
        eventSource.onopen = () => setIsDisconnected(false)
        eventSource.onmessage = (e) => {
            try {
                setIsDisconnected(false);
                processUpdate(JSON.parse(e.data), true);
            }
            catch (err) { console.error(err) }
        }
        eventSource.onerror = () => {
            setIsDisconnected(true);
            eventSource.close();
            // Retry connection (after 5s)
            setTimeout(() => {
                if (isMounted) setIsMounted(false);
                setTimeout(() => setIsMounted(true), 100);
            }, 5000);
        }
        return () => eventSource.close()
    }, [isMounted])

    // 2. Polling (Drift correction)
    useEffect(() => {
        if (!isMounted) return
        const fetchData = async () => {
            try {
                const res = await fetch("/update", { cache: "no-store" })
                if (res.ok) processUpdate(await res.json(), false)
            } catch (e) { console.warn(e) }
        }
        fetchData()
        const interval = setInterval(fetchData, POLLING_INTERVAL)
        return () => clearInterval(interval)
    }, [isMounted])

    // Local timer (requestAnimationFrame)
    useEffect(() => {
        // [Fix] Do not run animation loop when paused (Save CPU and prevent loop)
        if (!data.isPlaying) {
            setCurrentProgress(progressAtUpdate.current);
            return;
        }

        const animate = () => {
            const now = Date.now();
            const timePassed = now - lastUpdateTimestamp.current;

            // Calculate progress reflecting current speed (correctionFactor)
            // networkDelayRef: Use auto-calculated delay from backend
            // settings.lyricsOffset: User manually configured offset
            const userOffset = serverSettings?.lyricsOffset || 0;
            const estimated = Math.max(0,
                progressAtUpdate.current +
                (timePassed * correctionFactor.current) +
                networkDelayRef.current +
                CLIENT_SIDE_BUFFER +
                userOffset
            );
            const finalProgress = data.duration > 0 ? Math.min(estimated, data.duration) : estimated;

            // [Fix] Prevent micro reverse jumps (Local estimation error prevention)
            // Even if delayed server data arrives, the displayed bar must always move forward
            if (finalProgress > lastDisplayedProgress.current) {
                lastDisplayedProgress.current = finalProgress;
                setCurrentProgress(finalProgress);
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        }

        animationFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [data.isPlaying, data.duration]);

    return { data, currentProgress, debugSpeed, serverSettings, isDisconnected }
}