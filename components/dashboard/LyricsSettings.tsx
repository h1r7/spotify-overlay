"use client"

interface LyricsSettingsProps {
    // 애니메이션 스타일
    draftAnimationStyle: 'default' | 'fade'
    setDraftAnimationStyle: (v: 'default' | 'fade') => void
    // 가사 스타일
    draftLyricsStyle: 'album' | 'custom'
    setDraftLyricsStyle: (v: 'album' | 'custom') => void
    draftLyricsBg: string
    setDraftLyricsBg: (v: string) => void
    // 가사 바운스
    draftLyricsBounce: boolean
    setDraftLyricsBounce: (v: boolean) => void
    draftLyricsBounceAmount: number
    setDraftLyricsBounceAmount: (v: number) => void
    // 가사 오프셋
    draftLyricsOffset: number
    setDraftLyricsOffset: (v: number) => void
}

export default function LyricsSettings({
    draftAnimationStyle, setDraftAnimationStyle,
    draftLyricsStyle, setDraftLyricsStyle, draftLyricsBg, setDraftLyricsBg,
    draftLyricsBounce, setDraftLyricsBounce, draftLyricsBounceAmount, setDraftLyricsBounceAmount,
    draftLyricsOffset, setDraftLyricsOffset
}: LyricsSettingsProps) {
    return (
        <div className="col-span-1 bg-zinc-900/50 p-6 rounded-2xl border border-white/5 space-y-6">
            <h2 className="text-xl font-bold">애니메이션 & 가사 설정</h2>

            {/* Animation Style */}
            <div className="space-y-3">
                <label className="text-sm text-zinc-400 font-bold uppercase tracking-wider">곡 변경 효과</label>
                <div className="flex bg-zinc-950 rounded-lg p-1">
                    <button
                        onClick={() => setDraftAnimationStyle('default')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${draftAnimationStyle === 'default' ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        기본값
                    </button>
                    <button
                        onClick={() => setDraftAnimationStyle('fade')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${draftAnimationStyle === 'fade' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        페이드 (부드럽게)
                    </button>
                </div>
            </div>

            {/* Lyrics Style */}
            <div className="pt-4 border-t border-white/5">
                <div className="space-y-3">
                    <label className="text-sm text-zinc-400 font-bold uppercase tracking-wider">가사 배경 스타일</label>
                    <div className="flex bg-zinc-950 rounded-lg p-1">
                        <button
                            onClick={() => setDraftLyricsStyle('album')}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${draftLyricsStyle === 'album' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                        >
                            앨범 아트
                        </button>
                        <button
                            onClick={() => setDraftLyricsStyle('custom')}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${draftLyricsStyle === 'custom' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                        >
                            커스텀 색상
                        </button>
                    </div>
                </div>

                {draftLyricsStyle === 'custom' && (
                    <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                        <label className="text-sm text-zinc-400 font-bold uppercase tracking-wider">가사 배경색</label>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                value={draftLyricsBg}
                                onChange={(e) => setDraftLyricsBg(e.target.value)}
                                className="h-10 w-14 bg-transparent cursor-pointer rounded overflow-hidden"
                            />
                            <input
                                type="text"
                                value={draftLyricsBg}
                                onChange={(e) => setDraftLyricsBg(e.target.value)}
                                className="flex-1 bg-zinc-800 border-none rounded-md px-3 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Lyrics Bounce Toggle */}
            <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-white/5">
                    <div>
                        <p className="font-bold">가사 바운스 효과</p>
                        <p className="text-xs text-zinc-500">가사가 넘어갈 때 튕기는 애니메이션</p>
                    </div>
                    <button
                        onClick={() => setDraftLyricsBounce(!draftLyricsBounce)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${draftLyricsBounce ? 'bg-purple-500' : 'bg-zinc-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${draftLyricsBounce ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {/* Lyrics Bounce Amount Slider */}
                {draftLyricsBounce && (
                    <div className="space-y-4 px-2 py-4 mt-3 bg-zinc-950 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400 font-bold uppercase tracking-wider">바운스 강도</span>
                            <span className="text-purple-400 font-mono font-bold">{draftLyricsBounceAmount}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={draftLyricsBounceAmount}
                            onChange={(e) => setDraftLyricsBounceAmount(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 font-bold">
                            <span>약하게</span>
                            <span>강하게</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Lyrics Offset */}
            <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                    <label className="text-sm text-zinc-400 font-bold uppercase tracking-wider">가사 오프셋 (싱크 조절)</label>
                    <span className="text-blue-400 font-mono text-sm">{draftLyricsOffset > 0 ? `+${draftLyricsOffset}` : draftLyricsOffset} ms</span>
                </div>
                <input
                    type="range"
                    min="-500"
                    max="500"
                    step="10"
                    value={draftLyricsOffset}
                    onChange={(e) => setDraftLyricsOffset(parseInt(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <p className="text-[10px] text-zinc-500 italic text-center">가사가 실제 노래보다 빠르거나 느릴 때 조정하세요 (+는 빠르게, -는 느리게)</p>
            </div>
        </div>
    )
}
