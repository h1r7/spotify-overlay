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
    settings?: any // 서버에서 전달하는 설정
}

const BASE_SYNC_OFFSET = 300; // 기본 오프셋
const CLIENT_SIDE_BUFFER = 150; // [NEW] 미리 반응하기 위한 안전 마진 (ms)
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

    // Refs
    const lastUpdateTimestamp = useRef<number>(Date.now())
    const progressAtUpdate = useRef<number>(0)
    const animationFrameRef = useRef<number>(0)
    const correctionFactor = useRef<number>(1.0)
    const lastDisplayedProgress = useRef<number>(0) // 뒤로 점프 방지용
    const networkDelayRef = useRef<number>(BASE_SYNC_OFFSET) // 네트워크 지연 (자동 계산)

    // 🔥 클로저 문제 해결을 위한 Ref (SSE/Polling 콜백에서 최신 data 접근용)
    const dataRef = useRef(data);
    useEffect(() => { dataRef.current = data; }, [data]);

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // 🔥 데이터 처리 로직 (SSE & Polling 공용)
    const processUpdate = (newData: NowPlayingData, isFromSSE: boolean) => {
        const now = Date.now();
        const compensatedProgress = newData.progress;

        // 🔥 네트워크 지연 자동 업데이트
        if (newData.networkDelay && newData.networkDelay > 0) {
            networkDelayRef.current = newData.networkDelay;
        }

        const oldData = dataRef.current;
        const isSongChange = oldData.trackId !== newData.trackId;
        const stateChanged = oldData.isPlaying !== newData.isPlaying;

        // 현재 로컬 예상 시간
        const timePassed = now - lastUpdateTimestamp.current;
        const currentExpected = progressAtUpdate.current + (timePassed * correctionFactor.current);

        // 오차 계산
        const diff = compensatedProgress - currentExpected;
        const absDiff = Math.abs(diff);

        // 앵커(시작점) 차이 계산
        const currentAnchor = lastUpdateTimestamp.current - progressAtUpdate.current;
        const newAnchor = now - compensatedProgress;
        const anchorDiff = Math.abs(currentAnchor - newAnchor);

        // 🔥 설정 업데이트 처리
        if (newData.settings) {
            setServerSettings((prev: any) => {
                if (JSON.stringify(prev) === JSON.stringify(newData.settings)) return prev;
                return newData.settings;
            });
        }

        const mergedLyrics = (newData.lyrics && newData.lyrics.length > 0)
            ? newData.lyrics
            : (isSongChange ? [] : oldData.lyrics);

        const mergedData = { ...newData, lyrics: mergedLyrics };

        // [Fix] 곡이 바뀌었더라도 newData에 가사가 있다면 즉시 반영 (딜레이 방지)
        if (isSongChange) {
            setData(mergedData);
        } else {
            if (!isFromSSE && !stateChanged && anchorDiff < 3000) {
                setData(prev => ({ ...mergedData, progress: prev.progress }));
            } else {
                setData(mergedData);
            }
        }

        // [Sync Optimization] 
        // 노래 시작 부분(초반 5초)이거나 곡이 바뀌었을 때는 드리프트 보정 대신 즉시 점프(100ms만 차이나도 점프)
        const isNearStart = compensatedProgress < 5000;
        const jumpThreshold = (isSongChange || isNearStart) ? 100 : 1000;

        const shouldHardJump = isSongChange || stateChanged || !newData.isPlaying || anchorDiff >= 1000 || absDiff > jumpThreshold;

        if (shouldHardJump) {
            lastUpdateTimestamp.current = now;
            progressAtUpdate.current = compensatedProgress;
            correctionFactor.current = 1.0;
            setDebugSpeed(1.0);

            // [Fix] 하드 점프(곡 이동, 설정 변경, 수동 탐색 등) 시에만 시각적 상태 업데이트
            // 단, 서버 데이터가 너무 예전 것이라 뒤로 가는 경우라면, 현재 진행률이 서버보다 느려질 때까지 기다림
            const isSongChange = oldData.trackId !== newData.trackId;
            const isForwardJump = compensatedProgress >= lastDisplayedProgress.current;
            const isSignificantSeek = Math.abs(diff) > 5000; // 5초 이상의 수동 탐색은 항상 허용

            if (isSongChange || isForwardJump || isSignificantSeek) {
                lastDisplayedProgress.current = compensatedProgress;
                setCurrentProgress(compensatedProgress);
            }
        } else {
            if (absDiff < 50) {
                correctionFactor.current = 1.0;
            } else {
                const pGain = 0.00005;
                let adjustment = diff * pGain;
                adjustment = Math.max(-0.05, Math.min(0.05, adjustment));
                correctionFactor.current = 1.0 + adjustment;
            }
            setDebugSpeed(correctionFactor.current);
        }
    };

    // 1. SSE 연결 (실시간 이벤트 수신)
    useEffect(() => {
        if (!isMounted) return
        const eventSource = new EventSource('/events')
        eventSource.onmessage = (e) => {
            try { processUpdate(JSON.parse(e.data), true) }
            catch (err) { console.error(err) }
        }
        eventSource.onerror = () => eventSource.close()
        return () => eventSource.close()
    }, [isMounted])

    // 2. 폴링 (드리프트 보정)
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

    // 로컬 타이머 (requestAnimationFrame)
    useEffect(() => {
        // [Fix] 정지 상태일 때는 애니메이션 루프를 돌리지 않음 (CPU 절약 및 루프 방지)
        if (!data.isPlaying) {
            setCurrentProgress(progressAtUpdate.current);
            return;
        }

        const animate = () => {
            const now = Date.now();
            const timePassed = now - lastUpdateTimestamp.current;

            // 현재 속도(correctionFactor)를 반영하여 진행 시간 계산
            // networkDelayRef: 백엔드에서 자동 계산된 지연 시간 사용
            // settings.lyricsOffset: 사용자가 수동으로 설정한 오프셋
            const userOffset = serverSettings?.lyricsOffset || 0;
            const estimated = Math.max(0,
                progressAtUpdate.current +
                (timePassed * correctionFactor.current) +
                networkDelayRef.current +
                CLIENT_SIDE_BUFFER +
                userOffset
            );
            const finalProgress = data.duration > 0 ? Math.min(estimated, data.duration) : estimated;

            // [Fix] 미세한 역주행 방지 (로컬 예상 시간 오차 방지)
            // 지연된 서버 데이터가 도착하더라도, 실제 표시되는 바는 항상 이전보다 앞서야 함
            if (finalProgress > lastDisplayedProgress.current) {
                lastDisplayedProgress.current = finalProgress;
                setCurrentProgress(finalProgress);
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        }

        animationFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [data.isPlaying, data.duration]);

    return { data, currentProgress, debugSpeed, serverSettings }
}