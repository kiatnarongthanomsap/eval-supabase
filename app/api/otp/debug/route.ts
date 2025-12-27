import { NextRequest, NextResponse } from 'next/server';
import { getOtpStoreInfo } from '@/lib/otp-store';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const storeInfo = getOtpStoreInfo();
        return NextResponse.json({
            success: true,
            store: storeInfo,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[OTP Debug API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get store info' },
            { status: 500 }
        );
    }
}

