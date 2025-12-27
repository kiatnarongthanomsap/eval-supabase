import { NextRequest, NextResponse } from 'next/server';
import { batchUpdateScores } from '@/lib/supabase-helpers';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evaluatorId, updates } = body;

    if (!evaluatorId || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: evaluatorId and updates array' },
        { status: 400 }
      );
    }

    // Validate each update
    for (const update of updates) {
      if (!update.targetId || !update.criteriaId || update.score === undefined) {
        return NextResponse.json(
          { error: 'Each update must have targetId, criteriaId, and score' },
          { status: 400 }
        );
      }
    }

    await batchUpdateScores(evaluatorId, updates);

    return NextResponse.json({ 
      success: true, 
      count: updates.length 
    });
  } catch (error: any) {
    console.error('Batch update score error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to batch update scores' },
      { status: 500 }
    );
  }
}


