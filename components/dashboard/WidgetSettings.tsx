"use client"

interface WidgetSettingsProps {
    // Default Widget
    draftWidgetStyle: 'album' | 'custom'
    setDraftWidgetStyle: (v: 'album' | 'custom') => void
    draftWidgetBg: string
    setDraftWidgetBg: (v: string) => void
    // Simple Widget
    draftSimpleWidgetStyle: 'album' | 'custom'
    setDraftSimpleWidgetStyle: (v: 'album' | 'custom') => void
    draftSimpleWidgetBg: string
    setDraftSimpleWidgetBg: (v: string) => void
    // Square Widget
    draftSquareWidgetStyle: 'album' | 'custom'
    setDraftSquareWidgetStyle: (v: 'album' | 'custom') => void
    draftSquareWidgetBg: string
    setDraftSquareWidgetBg: (v: string) => void
}

export default function WidgetSettings({
    draftWidgetStyle, setDraftWidgetStyle, draftWidgetBg, setDraftWidgetBg,
    draftSimpleWidgetStyle, setDraftSimpleWidgetStyle, draftSimpleWidgetBg, setDraftSimpleWidgetBg,
    draftSquareWidgetStyle, setDraftSquareWidgetStyle, draftSquareWidgetBg, setDraftSquareWidgetBg
}: WidgetSettingsProps) {
    return (
        <div className="col-span-1 bg-zinc-900/50 p-6 rounded-2xl border border-white/5 space-y-6">
            <h2 className="text-xl font-bold">Widget Settings</h2>

            {/* Style Toggle */}
            <div className="space-y-3">
                <label className="text-sm text-zinc-400 font-bold uppercase tracking-wider">Background Style</label>
                <div className="flex bg-zinc-950 rounded-lg p-1">
                    <button
                        onClick={() => setDraftWidgetStyle('album')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${draftWidgetStyle === 'album' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Album Art
                    </button>
                    <button
                        onClick={() => setDraftWidgetStyle('custom')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${draftWidgetStyle === 'custom' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Custom Color
                    </button>
                </div>
            </div>

            {/* Custom Color Picker */}
            {draftWidgetStyle === 'custom' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm text-zinc-400 font-bold uppercase tracking-wider">Select Background Color</label>
                    <div className="flex gap-3">
                        <input
                            type="color"
                            value={draftWidgetBg}
                            onChange={(e) => setDraftWidgetBg(e.target.value)}
                            className="h-10 w-14 bg-transparent cursor-pointer rounded overflow-hidden"
                        />
                        <input
                            type="text"
                            value={draftWidgetBg}
                            onChange={(e) => setDraftWidgetBg(e.target.value)}
                            className="flex-1 bg-zinc-800 border-none rounded-md px-3 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            )}

            {/* Simple Widget Style */}
            <div className="pt-4 border-t border-white/5 space-y-3">
                <label className="text-sm text-green-400 font-bold uppercase tracking-wider">Simple Widget Design</label>
                <div className="flex bg-zinc-950 rounded-lg p-1">
                    <button
                        onClick={() => setDraftSimpleWidgetStyle('album')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${draftSimpleWidgetStyle === 'album' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Album Art
                    </button>
                    <button
                        onClick={() => setDraftSimpleWidgetStyle('custom')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${draftSimpleWidgetStyle === 'custom' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Custom Color
                    </button>
                </div>
            </div>

            {/* Simple Widget Custom Color */}
            {draftSimpleWidgetStyle === 'custom' && (
                <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 border-t border-white/5">
                    <label className="text-sm text-zinc-400 font-bold uppercase tracking-wider">Simple Widget Custom Color</label>
                    <div className="flex gap-3">
                        <input
                            type="color"
                            value={draftSimpleWidgetBg}
                            onChange={(e) => setDraftSimpleWidgetBg(e.target.value)}
                            className="h-10 w-14 bg-transparent cursor-pointer rounded overflow-hidden"
                        />
                        <input
                            type="text"
                            value={draftSimpleWidgetBg}
                            onChange={(e) => setDraftSimpleWidgetBg(e.target.value)}
                            className="flex-1 bg-zinc-800 border-none rounded-md px-3 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            )}

            {/* Square Widget Style */}
            <div className="pt-4 border-t border-white/5 space-y-3">
                <label className="text-sm text-purple-400 font-bold uppercase tracking-wider">Square Widget Design</label>
                <div className="flex bg-zinc-950 rounded-lg p-1">
                    <button
                        onClick={() => setDraftSquareWidgetStyle('album')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${draftSquareWidgetStyle === 'album' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Album Art
                    </button>
                    <button
                        onClick={() => setDraftSquareWidgetStyle('custom')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${draftSquareWidgetStyle === 'custom' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Custom Color
                    </button>
                </div>
            </div>

            {/* Square Widget Custom Color */}
            {draftSquareWidgetStyle === 'custom' && (
                <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 border-t border-white/5">
                    <label className="text-sm text-zinc-400 font-bold uppercase tracking-wider">Square Widget Custom Color</label>
                    <div className="flex gap-3">
                        <input
                            type="color"
                            value={draftSquareWidgetBg}
                            onChange={(e) => setDraftSquareWidgetBg(e.target.value)}
                            className="h-10 w-14 bg-transparent cursor-pointer rounded overflow-hidden"
                        />
                        <input
                            type="text"
                            value={draftSquareWidgetBg}
                            onChange={(e) => setDraftSquareWidgetBg(e.target.value)}
                            className="flex-1 bg-zinc-800 border-none rounded-md px-3 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
