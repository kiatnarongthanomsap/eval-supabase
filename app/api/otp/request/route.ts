import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// In-memory OTP storage (in production, use Redis or database)
// Format: { mobile_no: { code: string, expiresAt: number, attempts: number } }
// Use global store to share between routes (for serverless compatibility)
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

// Clean up expired OTPs every 5 minutes
setInterval(() => {
    const now = Date.now();
    const otpStore = getOtpStore();
    for (const [mobile, data] of otpStore.entries()) {
        if (data.expiresAt < now) {
            otpStore.delete(mobile);
        }
    }
}, 5 * 60 * 1000);

/**
 * Generate a random 4-digit OTP code
 */
function generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * OTP Request API Route
 * Generates OTP code and sends it via SMS using KU Coop SMS service
 * Uses the PHP endpoint: https://apps3.coop.ku.ac.th/php/sms/otp.php
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mobile_no = searchParams.get('mobile_no');
    const msg = searchParams.get('msg');

    // Validate mobile number
    if (!mobile_no) {
        return NextResponse.json(
            { error: 'Mobile number is required' },
            { status: 400 }
        );
    }

    // Validate mobile number format (Thai mobile: 08x, 09x, 06x)
    const mobileRegex = /^0[689]\d{8}$/;
    if (!mobileRegex.test(mobile_no)) {
        return NextResponse.json(
            { error: 'Invalid mobile number format' },
            { status: 400 }
        );
    }

    // Generate OTP code (4 digits)
    const otpCode = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Store OTP in memory
    const otpStore = getOtpStore();
    otpStore.set(mobile_no, {
        code: otpCode,
        expiresAt: expiresAt,
        attempts: 0
    });

    // Build SMS message with OTP code
    // Format: "{otpCode} คือ OTP ของระบบประเมิน" or use custom message
    // If msg parameter is provided, use it as-is (assuming it already contains OTP placeholder or full message)
    // Otherwise, use default format with OTP code
    const smsMessage = msg 
        ? msg.includes('{{otp}}') || msg.includes('{otp}') 
            ? msg.replace(/\{\{?otp\}\}?/g, otpCode)
            : `${otpCode} คือ OTP ของ${msg}`
        : `${otpCode} คือ OTP ของระบบประเมิน`;

    // HTTPS agent to ignore SSL errors (common for internal KU servers)
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false
    });

    const apiUrl = 'https://apps3.coop.ku.ac.th/php/sms/otp.php';

    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: apiUrl,
        params: {
            mobile_no: mobile_no,
            msg: smsMessage
        },
        httpsAgent: httpsAgent,
        timeout: 10000 // 10 seconds timeout
    };

    // Log request details for debugging
    console.log('[OTP API] Request URL:', apiUrl);
    console.log('[OTP API] Request params:', {
        mobile_no: mobile_no,
        msg: smsMessage
    });
    console.log('[OTP API] Generated OTP:', otpCode);

    try {
        const response = await axios.request(config);
        const responseData = response.data;

        // Log response for debugging
        console.log('[OTP API] Status:', response.status);
        console.log('[OTP API] Response:', JSON.stringify(responseData, null, 2));

        // Extract Task ID and Message ID from response
        let taskId = '';
        let messageId = '';
        const responseText = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
        
        const taskIdMatch = responseText.match(/TASK_ID[=\s:]+(\d+)/i);
        const messageIdMatch = responseText.match(/MESSAGE_ID[=\s:]+(\d+)/i);
        
        if (taskIdMatch) taskId = taskIdMatch[1];
        if (messageIdMatch) messageId = messageIdMatch[1];

        // Check if SMS was sent successfully
        const isSuccess = responseText.includes('Send Success') || 
                         responseText.includes('STATUS=0') ||
                         responseText.includes('END=OK') ||
                         (response.status >= 200 && response.status < 300 && !responseText.toLowerCase().includes('error'));

        if (isSuccess) {
            // Return success response with OTP info (but don't expose the code in production)
            return NextResponse.json({
                success: true,
                message: 'OTP sent successfully',
                taskId: taskId || undefined,
                messageId: messageId || undefined,
                expiresIn: 10, // minutes
                // In development, include OTP code for testing
                ...(process.env.NODE_ENV === 'development' && { otpCode: otpCode }),
                data: responseData
            });
        } else {
            // Remove OTP from store if SMS failed
            otpStore.delete(mobile_no);
            
            // Handle error response
            if (responseData?.error) {
                return NextResponse.json(
                    { error: responseData.error, success: false },
                    { status: 400 }
                );
            }
            
            return NextResponse.json(
                { error: 'Failed to send OTP SMS', success: false, data: responseData },
                { status: 500 }
            );
        }
    } catch (error: any) {
        // Remove OTP from store on error
        otpStore.delete(mobile_no);

        // Handle axios errors
        if (error.response) {
            // API returned an error response
            return NextResponse.json(
                {
                    error: error.response.data?.error || 'Failed to send OTP',
                    success: false,
                    data: error.response.data
                },
                { status: error.response.status || 500 }
            );
        } else if (error.request) {
            // Request was made but no response received
            return NextResponse.json(
                { error: 'No response from OTP service', success: false },
                { status: 503 }
            );
        } else {
            // Error in request setup
            return NextResponse.json(
                { error: error.message || 'Failed to send OTP', success: false },
                { status: 500 }
            );
        }
    }
}
