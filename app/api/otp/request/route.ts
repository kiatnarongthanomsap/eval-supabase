import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mobile_no = searchParams.get('mobile_no');

    if (!mobile_no) {
        return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    // Agent to ignore SSL errors (common for internal KU servers)
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false
    });

    // Updated configuration based on user's working example (2024-12-23)
    const apiUrl = 'https://apps3.coop.ku.ac.th/php/sms/otp.php';
    const msg = 'OTP for Login'; // Default message

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
        console.log("Sending OTP to:", mobile_no);
        const response = await axios.request(config);
        console.log('OTP API Response:', response.data);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('OTP API Error:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
            return NextResponse.json(error.response.data, { status: error.response.status });
        }
        return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 });
    }
}
