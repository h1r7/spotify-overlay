import { NextResponse } from 'next/server';

export async function POST() {
    console.log("🛑 Shutdown request received. Closing application...");

    // Give some time for the response to reach the client before exiting
    setTimeout(() => {
        process.exit(0);
    }, 1000);

    return NextResponse.json({ success: true, message: "Server is shutting down..." });
}
