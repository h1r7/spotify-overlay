// pkg-patches.js
// Patches for running Next.js standalone server within pkg (Node.js 18)

const Module = require('module');
const originalRequire = Module.prototype.require;

function applyPatches() {
    console.log('[Info] Applying pkg compatibility patches...');

    // 1. Monkey-patch process.chdir to prevent server.js from crashing in snapshot
    const originalChdir = process.chdir;
    process.chdir = function (directory) {
        // console.log(`[Patch] preventing chdir to: ${directory}`);
        // Do nothing in pkg environment
    };

    // 2. Hook require to mock missing modules or polyfill methods
    Module.prototype.require = function (id) {
        // A. Mock 'inspector' module (missing in pkg)
        if (id === 'inspector' || id === 'node:inspector') {
            return {
                url: () => undefined,
                open: () => undefined,
                close: () => undefined,
                waitForDebugger: () => undefined,
                console: {
                    log: () => { },
                    error: () => { }
                },
                Session: class {
                    connect() { }
                    disconnect() { }
                    post() { }
                    on() { }
                }
            };
        }

        // B. Mock 'v8' module (snapshot methods missing)
        if (id === 'v8' || id === 'node:v8') {
            let v8 = {};
            try {
                v8 = originalRequire.apply(this, ['v8']) || {};
            } catch (e) { }

            return {
                ...v8,
                snapshot: () => undefined,
                startupSnapshot: {
                    isBuildingSnapshot: () => false,
                    ...(v8.startupSnapshot || {})
                }
            };
        }

        // C. Polyfill AsyncLocalStorage.snapshot (missing in older Node 18 builds used by pkg)
        if (id === 'async_hooks' || id === 'node:async_hooks') {
            const original = originalRequire.apply(this, arguments);
            if (original && original.AsyncLocalStorage && !original.AsyncLocalStorage.snapshot) {
                original.AsyncLocalStorage.snapshot = function () {
                    return (fn, ...args) => fn(...args);
                };
            }
            return original;
        }

        // D. Mock Next.js dev-only modules
        if (id.includes('router-utils/setup-dev-bundler')) {
            return {
                setupDevBundler: () => Promise.resolve()
            };
        }

        return originalRequire.apply(this, arguments);
    };

    console.log('[Info] Patches applied successfully.');
}

module.exports = applyPatches;
