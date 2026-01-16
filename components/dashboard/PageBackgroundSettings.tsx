"use client"

interface PageBackgroundSettingsProps {
    draftPageBgStyle: 'album' | 'custom'
    setDraftPageBgStyle: (v: 'album' | 'custom') => void
    draftPageBgColor: string
    setDraftPageBgColor: (v: string) => void
}

export default function PageBackgroundSettings({
    draftPageBgStyle, setDraftPageBgStyle,
    draftPageBgColor, setDraftPageBgColor
}: PageBackgroundSettingsProps) {
    return (
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 space-y-6">
            <h2 className="text-xl font-bold">Page Background Settings</h2>
            <div className="space-y-3">
                <label className="text-sm text-zinc-400 font-bold uppercase tracking-wider">Full Background Mode</label>
                <div className="flex bg-zinc-950 rounded-lg p-1">
                    <button
                        onClick={() => setDraftPageBgStyle('album')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${draftPageBgStyle === 'album' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Album Art (Blur)
                    </button>
                    <button
                        onClick={() => setDraftPageBgStyle('custom')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${draftPageBgStyle === 'custom' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Custom Color
                    </button>
                </div>
            </div>

            {draftPageBgStyle === 'custom' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm text-zinc-400 font-bold uppercase tracking-wider">Select Background Color</label>
                    <div className="flex gap-3">
                        <input
                            type="color"
                            value={draftPageBgColor}
                            onChange={(e) => setDraftPageBgColor(e.target.value)}
                            className="h-10 w-14 bg-transparent cursor-pointer rounded overflow-hidden"
                        />
                        <input
                            type="text"
                            value={draftPageBgColor}
                            onChange={(e) => setDraftPageBgColor(e.target.value)}
                            className="flex-1 bg-zinc-800 border-none rounded-md px-3 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
