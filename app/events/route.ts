// app/events/route.ts
import { NextResponse } from 'next/server';
import { eventEmitter } from '../../lib/eventEmitter';

export const dynamic = 'force-dynamic';

export async function GET() {
    const encoder = new TextEncoder();
    let sendData: (data: any) => void;

    const stream = new ReadableStream({
        start(controller) {
            // 1. 데이터 전송 함수
            sendData = (data: any) => {
                try {
                    const message = `data: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                } catch (error) {
                    // 컨트롤러가 닫혀있거나 에러 발생 시 리스너 제거
                    console.error("SSE Error (Removing listener):", error);
                    eventEmitter.off('update', sendData);
                }
            };

            // 2. 이벤트 리스너 등록
            eventEmitter.on('update', sendData);

            // 3. 연결 유지용 핑 (30초마다) - Vercel 타임아웃 방지
            // const interval = setInterval(() => {
            //    try { controller.enqueue(encoder.encode(': ping\n\n')); } catch(e) {}
            // }, 30000);
        },
        cancel() {
            // 3. 클라이언트 연결 종료 시 정리
            if (sendData) {
                eventEmitter.off('update', sendData);
            }
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}