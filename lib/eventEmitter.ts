// lib/eventEmitter.ts
import { EventEmitter } from 'events';

// 전역 변수로 선언하여 서버리스 환경(개발 모드 등)에서도 인스턴스 유지
declare global {
    var lyricEventEmitter: EventEmitter | undefined;
}

export const eventEmitter = global.lyricEventEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
    global.lyricEventEmitter = eventEmitter;
}