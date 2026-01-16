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
    const [isDisconnected, setIsDisconnected] = useState(false)

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

        // [New] 탭 전환 후 복귀 시 싱크 강제 맞춤
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log("👀 Tab active - Resetting sync state");
                lastDisplayedProgress.current = 0; // 강제 리셋
                correctionFactor.current = 1.0;
                // 즉시 폴링 트리거 (선택사항)
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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

        // [Stabilization] 앵커 차이 임계값 상향 (네트워크 지터 대응)
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

        // [Fix] 가사 상태 보존 (검색 중일 때 덮어쓰기 방지)
        // [Update] 서버가 명시적으로 'not_found'를 보냈다면 즉시 반영하도록 수정
        const mergedStatus = (newData.lyricsStatus === 'not_found' && oldData.lyricsStatus === 'searching' && !isSongChange)
            ? 'not_found' // 강제로 searching으로 되돌리지 않고 서버의 최종 판단을 따름
            : newData.lyricsStatus || oldData.lyricsStatus;

        const mergedData = { ...newData, lyrics: mergedLyrics, lyricsStatus: mergedStatus };

        // [Fix] 곡이 바뀌었더라도 newData에 가사가 있다면 즉시 반영
        // [Fix] 폴링 데이터 무시 로직 제거 (항상 최신 데이터 반영 시도)
        setData(mergedData);

        // [Sync Optimization] 
        const isNearStart = compensatedProgress < 5000;
        // [Tweaked] 점프 민감도 조정 (800ms)
        const jumpThreshold = (isSongChange || isNearStart) ? 100 : 800;

        // [Fix] 조건 단순화: 1초 이상 앵커 차이나거나, 실제 오차가 임계값 넘으면 무조건 점프
        // Threshold를 800 -> 1200으로 상향하여 잦은 점프 방지
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

            // [Fix] 하드 점프 시 조건 없이 UI 업데이트 (탭 복귀 시 즉시 반영 위해)
            // 단, 너무 과거의 데이터로 돌아가는 '역주행'만 방지
            const isForwardJump = compensatedProgress >= lastDisplayedProgress.current;
            const isSignificantJump = Math.abs(diff) > 2000; // 2초 이상 차이면 뒤로 가더라도 허용 (구간 반복 등)

            if (isSongChange || isForwardJump || isSignificantJump) {
                lastDisplayedProgress.current = compensatedProgress;
                setCurrentProgress(compensatedProgress);
            }
        } else {
            // [Soft Correction] 배속 재생으로 따라잡기
            if (absDiff < 50) {
                correctionFactor.current = 1.0;
            } else {
                // P-Controller Gain
                const pGain = 0.0001; // 조금 더 부드럽게
                let adjustment = diff * pGain;
                // 최대 10% 속도 조절로 제한
                adjustment = Math.max(-0.1, Math.min(0.1, adjustment));
                correctionFactor.current = 1.0 + adjustment;
            }
            setDebugSpeed(correctionFactor.current);
        }
    };

    // 1. SSE 연결 (실시간 이벤트 수신)
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
            // 재연결 시도 (5초 후)
            setTimeout(() => {
                if (isMounted) setIsMounted(false);
                setTimeout(() => setIsMounted(true), 100);
            }, 5000);
        }
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

    return { data, currentProgress, debugSpeed, serverSettings, isDisconnected }
}