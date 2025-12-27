import { NextRequest, NextResponse } from 'next/server';
import { getSystemConfig, updateSystemConfig } from '@/lib/supabase-helpers';
import type { SystemConfig } from '@/lib/types';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getSystemConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Get config error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config = body as Partial<SystemConfig>;

    await updateSystemConfig(config);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update config error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update config' },
      { status: 500 }
    );
  }
}

