import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp, getOtpStoreInfo } from '@/lib/otp-store';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mobile_no, otp_code } = body;

        if (!mobile_no || !otp_code) {
            return NextResponse.json(
                { error: 'Mobile number and OTP code are required' },
                { status: 400 }
            );
        }

        console.log(`[OTP Verify API] Request received - mobile: ${mobile_no}, code: ${otp_code} (type: ${typeof otp_code})`);
        
        // Debug: Show store info before verification
        const storeInfo = getOtpStoreInfo();
        console.log(`[OTP Verify API] Store info before verification:`, JSON.stringify(storeInfo, null, 2));

        // Normalize OTP code to string (in case it comes as number)
        const normalizedOtpCode = String(otp_code).trim();

        // Verify the OTP
        const isValid = verifyOtp(mobile_no, normalizedOtpCode);

        if (isValid) {
            console.log(`[OTP Verify API] SUCCESS for mobile ${mobile_no}`);
            return NextResponse.json({ success: true, message: 'OTP verified successfully' });
        } else {
            console.log(`[OTP Verify API] FAILED for mobile ${mobile_no}, code: ${normalizedOtpCode}`);
            // Get store info again to include in error response for debugging
            const storeInfoAfter = getOtpStoreInfo();
            return NextResponse.json(
                { 
                    error: 'Invalid OTP code',
                    debug: {
                        storeSize: storeInfoAfter.size,
                        requestedMobile: mobile_no,
                        requestedCode: normalizedOtpCode,
                    }
                },
                { status: 401 }
            );
        }
    } catch (error: any) {
        console.error('[OTP Verify API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify OTP' },
            { status: 500 }
        );
    }
}

