import { NextRequest, NextResponse } from 'next/server';
import { updateScore } from '@/lib/supabase-helpers';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evaluatorId, targetId, criteriaId, score } = body;

    if (!evaluatorId || !targetId || !criteriaId || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await updateScore(evaluatorId, targetId, criteriaId, score);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update score error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update score' },
      { status: 500 }
    );
  }
}

