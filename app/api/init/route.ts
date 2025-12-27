import { NextRequest, NextResponse } from 'next/server';
import {
  getUsers,
  getCriteria,
  getEvaluations,
  getComments,
  getExclusions,
  getSystemConfig,
} from '@/lib/supabase-helpers';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const evaluatorId = searchParams.get('evaluator_id') || undefined;
    const raw = searchParams.get('raw') === 'true';

    // Fetch all data in parallel
    const [users, criteria, exclusions, scoresData, commentsData, systemConfig] = await Promise.all([
      getUsers(),
      getCriteria(),
      getExclusions(),
      getEvaluations(evaluatorId, raw),
      getComments(evaluatorId),
      getSystemConfig(),
    ]);

    const result: any = {
      users,
      criteria,
      exclusions: exclusions.map(ex => ({
        id: ex.id,
        evaluatorId: ex.evaluatorId,
        targetId: ex.targetId,
        reason: ex.reason,
      })),
      ...scoresData,
      ...commentsData,
      systemConfig,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Init data error:', error);
    // Ensure we always return JSON, not HTML
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch init data',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

