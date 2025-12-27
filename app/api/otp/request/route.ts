import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';
import { randomInt } from 'crypto';
import { storeOtp, removeOtp } from '@/lib/otp-store';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mobile_no = searchParams.get('mobile_no');
    const msgParam = searchParams.get('msg');

    if (!mobile_no) {
        return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    // Agent to ignore SSL errors (common for internal KU servers)
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false
    });

    // Updated configuration based on user's working example (2024-12-23)
    const apiUrl = 'https://apps3.coop.ku.ac.th/php/sms/otp.php';
    
    // Generate OTP first (before sending SMS)
    // If `msg` is provided, treat it as a plain SMS message (used by ProgressPage reminders).
    // Otherwise, generate a 4-digit OTP and include it in the SMS body (used by Login OTP flow).
    const otp = msgParam ? null : String(randomInt(1000, 10000));
    
    // Store OTP in memory BEFORE sending SMS (only for login OTP, not plain SMS)
    if (otp) {
        storeOtp(mobile_no, otp);
        console.log(`[OTP Request] OTP generated and stored BEFORE sending SMS for ${mobile_no}`);
    }
    
    const msg = msgParam || `รหัส OTP สำหรับเข้าสู่ระบบ: ${otp}`;

    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: apiUrl,
        params: {
            mobile_no: mobile_no,
            msg: msg
        },
        httpsAgent: httpsAgent
    };

    try {
        console.log("[OTP Request] Sending OTP to:", mobile_no);
        const response = await axios.request(config);
        console.log('[OTP Request] OTP API Response:', response.data);
        
        // Keep response format backward-compatible with the frontend:
        // return the raw provider response (usually a string).
        // Never include the OTP value in the API response.
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('[OTP Request] OTP API Error:', error.message);
        // Remove OTP from store if sending failed
        if (otp) {
            removeOtp(mobile_no);
            console.log(`[OTP Request] Removed OTP from store due to send failure for ${mobile_no}`);
        }
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
            return NextResponse.json(error.response.data, { status: error.response.status });
        }
        return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 });
    }
}
