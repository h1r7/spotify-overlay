"use client"

interface VisualEffectsSettingsProps {
    draftInteractiveProgress: boolean
    setDraftInteractiveProgress: (v: boolean) => void
    draftShowWrapVisualizer: boolean
    setDraftShowWrapVisualizer: (v: boolean) => void
}

export default function VisualEffectsSettings({
    draftInteractiveProgress, setDraftInteractiveProgress,
    draftShowWrapVisualizer, setDraftShowWrapVisualizer
}: VisualEffectsSettingsProps) {
    return (
        <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-900/50 p-6 rounded-2xl border border-white/10 space-y-6">
            <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-500 rounded-full" />
                <h2 className="text-xl font-bold">Visual Effects Settings</h2>
            </div>

            {/* Interactive Progress Bar Toggle */}
            <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-white/5">
                <div>
                    <p className="font-bold">Interactive Progress Bar</p>
                    <p className="text-xs text-zinc-500">Adds light trails, glow, and dynamic thickness effects</p>
                </div>
                <button
                    onClick={() => setDraftInteractiveProgress(!draftInteractiveProgress)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${draftInteractiveProgress ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${draftInteractiveProgress ? 'left-7' : 'left-1'}`} />
                </button>
            </div>

            {/* Wrap Visualizer Toggle */}
            <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-white/5">
                <div>
                    <p className="font-bold">Border Rotation Lighting</p>
                    <p className="text-xs text-zinc-500">Soft rotating light effect wrapping the entire widget</p>
                </div>
                <button
                    onClick={() => setDraftShowWrapVisualizer(!draftShowWrapVisualizer)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${draftShowWrapVisualizer ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${draftShowWrapVisualizer ? 'left-7' : 'left-1'}`} />
                </button>
            </div>
        </div>
    )
}
