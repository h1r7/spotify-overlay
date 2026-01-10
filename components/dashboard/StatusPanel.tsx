"use client"

import { NowPlayingData } from '../../hooks/useSpotifyData'

interface StatusPanelProps {
    data: NowPlayingData
}

export default function StatusPanel({ data }: StatusPanelProps) {
    return (
        <div className="col-span-1 bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-green-500">●</span> 현재 재생 중
            </h2>

            <div className="flex gap-4 items-center mb-6">
                {data.cover ? (
                    <img src={data.cover} alt="Album Cover" className="w-20 h-20 rounded-lg shadow-lg" />
                ) : (
                    <div className="w-20 h-20 bg-zinc-800 rounded-lg" />
                )}
                <div>
                    <p className="font-bold text-lg line-clamp-1">{data.title}</p>
                    <p className="text-zinc-400">{data.artist}</p>
                </div>
            </div>

            <div className="space-y-2 text-sm text-zinc-500 font-mono bg-zinc-950/50 p-4 rounded-lg">
                <p>
                    상태:{' '}
                    <span className={data.isPlaying ? "text-green-400" : "text-yellow-400"}>
                        {data.isPlaying ? "재생 중" : "일시정지"}
                    </span>
                </p>
                <p>
                    가사:{' '}
                    <span className="text-blue-400">
                        {data.lyricsStatus === 'ok' ? '정상' : data.lyricsStatus === 'searching' ? '검색 중...' : '찾을 수 없음'}
                    </span>
                </p>
                <p>
                    트랙ID: <span className="text-zinc-600 truncate block">{data.trackId || '-'}</span>
                </p>
            </div>
        </div>
    )
}
