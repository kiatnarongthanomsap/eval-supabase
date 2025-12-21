
import { NextRequest, NextResponse } from 'next/server';

const API_TARGET_URL = 'https://apps2.coop.ku.ac.th/hrpro_api/api.php';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    const targetUrl = `${API_TARGET_URL}?action=${action || ''}`;

    try {
        const res = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        const responseText = await res.text();
        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data);
        } catch (e) {
            console.error('Proxy GET - Invalid JSON from backend:', responseText);
            return NextResponse.json({
                error: 'Invalid JSON from backend',
                rawBody: responseText.substring(0, 1000)
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Proxy GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch from backend' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const targetUrl = `${API_TARGET_URL}?action=${action || ''}`;

    try {
        const body = await request.json();
        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const responseText = await res.text();
        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data);
        } catch (e) {
            console.error('Proxy POST - Invalid JSON from backend:', responseText);
            return NextResponse.json({
                error: 'Invalid JSON from backend',
                rawBody: responseText.substring(0, 1000)
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Proxy POST Error:', error);
        return NextResponse.json({ error: 'Failed to post to backend' }, { status: 500 });
    }
}
