"use client"

import { AlertCircle } from "lucide-react"

export default function DisconnectedNotice() {
    return (
        <div className="fixed top-0 left-0 w-full z-[9999] animate-in slide-in-from-top duration-500">
            <div className="bg-red-600/90 backdrop-blur-md text-white px-6 py-3 flex items-center justify-center gap-3 shadow-2xl border-b border-red-500/50">
                <AlertCircle className="w-5 h-5 animate-pulse" />
                <div className="flex flex-col items-center">
                    <span className="font-bold text-sm">서버 연결이 종료되었습니다</span>
                    <span className="text-[10px] opacity-80">R1G3L-Flux 서버가 꺼져있어 실시간 데이터를 받아올 수 없습니다.</span>
                </div>
            </div>
        </div>
    )
}
