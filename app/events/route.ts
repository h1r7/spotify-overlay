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
            // 1. Data transmission function
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

            // 2. Register event listener
            eventEmitter.on('update', sendData);

            // 3. Keep-alive ping (15s) - Prevents browser connection timeout
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
            'X-Accel-Buffering': 'no', // For proxy support (Nginx, etc.)
        },
    });
}