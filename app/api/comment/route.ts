import { NextRequest, NextResponse } from 'next/server';
import { updateComment } from '@/lib/supabase-helpers';

export async function POST(request: NextRequest) {
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

