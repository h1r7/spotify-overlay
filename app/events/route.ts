// app/events/route.ts
import { NextResponse } from 'next/server';
import { eventEmitter } from '../../lib/eventEmitter';

export const dynamic = 'force-dynamic';

export async function GET() {
    const encoder = new TextEncoder();
    let sendData: (data: any) => void;
    let interval: NodeJS.Timeout; // Declare interval here

    const stream = new ReadableStream({
        start(controller) {
            // 1. 데이터 전송 함수
            sendData = (data: any) => {
                try {
                    const message = `data: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                } catch (error) {
                    cleanup();
                }
            };

            const cleanup = () => {
                eventEmitter.off('update', sendData);
                if (interval) clearInterval(interval);
                try { controller.close(); } catch (e) { }
            }

            // 2. 이벤트 리스너 등록
            eventEmitter.on('update', sendData);

            // 3. 연결 유지용 핑 (15초) - 브라우저 연결 끊김 방지
            interval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': ping\n\n'));
                } catch (e) {
                    cleanup();
                }
            }, 15000);
        },
        cancel() {
            if (sendData) eventEmitter.off('update', sendData);
            if (interval) clearInterval(interval);
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'X-Accel-Buffering': 'no', // Nginx 등 프록시 대응
        },
    });
}