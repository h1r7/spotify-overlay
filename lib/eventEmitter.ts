// lib/eventEmitter.ts
import { EventEmitter } from 'events';

// Keep instance global to persist in serverless/dev environments
declare global {
    var lyricEventEmitter: EventEmitter | undefined;
}

export const eventEmitter = global.lyricEventEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
    global.lyricEventEmitter = eventEmitter;
}