import { NextRequest, NextResponse } from 'next/server';
import { updateComment } from '@/lib/supabase-helpers';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  // Skip during build time if env vars are missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Server configuration missing. Please set environment variables.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { evaluatorId, targetId, comment } = body;

    if (!evaluatorId || !targetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await updateComment(evaluatorId, targetId, comment || '');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update comment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update comment' },
      { status: 500 }
    );
  }
}

