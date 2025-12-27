import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// Import OTP store from request route
// Note: In production, use Redis or database for shared storage
// For now, we'll need to access the same store
// This is a simplified approach - in production, use a shared storage solution

// Temporary: We'll need to share the OTP store between routes
// In production, use Redis or database
declare global {
    var otpStore: Map<string, { code: string; expiresAt: number; attempts: number }> | undefined;
}

// Use global store or create new one (for serverless compatibility)
const getOtpStore = () => {
    if (!global.otpStore) {
        global.otpStore = new Map();
    }
    return global.otpStore;
};

/**
 * OTP Verify API Route
 * Verifies the OTP code entered by the user
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mobile_no, otp_code } = body;

        // Validate input
        if (!mobile_no || !otp_code) {
            return NextResponse.json(
                { error: 'Mobile number and OTP code are required', success: false },
                { status: 400 }
            );
        }

        // Validate OTP code format (4 digits - matching the new API)
        if (!/^\d{4}$/.test(otp_code)) {
            return NextResponse.json(
                { error: 'Invalid OTP code format. OTP must be 4 digits.', success: false },
                { status: 400 }
            );
        }

        const otpStore = getOtpStore();
        const storedOtp = otpStore.get(mobile_no);

        // Check if OTP exists
        if (!storedOtp) {
            return NextResponse.json(
                { error: 'OTP not found or expired. Please request a new OTP.', success: false },
                { status: 404 }
            );
        }

        // Check if OTP is expired
        if (Date.now() > storedOtp.expiresAt) {
            otpStore.delete(mobile_no);
            return NextResponse.json(
                { error: 'OTP has expired. Please request a new OTP.', success: false },
                { status: 410 }
            );
        }

        // Check if too many attempts
        if (storedOtp.attempts >= 5) {
            otpStore.delete(mobile_no);
            return NextResponse.json(
                { error: 'Too many failed attempts. Please request a new OTP.', success: false },
                { status: 429 }
            );
        }

        // Verify OTP code
        if (storedOtp.code !== otp_code) {
            storedOtp.attempts += 1;
            return NextResponse.json(
                { 
                    error: 'Invalid OTP code', 
                    success: false,
                    attemptsRemaining: 5 - storedOtp.attempts
                },
                { status: 401 }
            );
        }

        // OTP verified successfully - remove from store
        otpStore.delete(mobile_no);

        return NextResponse.json({
            success: true,
            message: 'OTP verified successfully'
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to verify OTP', success: false },
            { status: 500 }
        );
    }
}

