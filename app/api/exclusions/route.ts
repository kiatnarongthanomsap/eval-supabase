import { NextRequest, NextResponse } from 'next/server';
import { getExclusions, addExclusion, deleteExclusion } from '@/lib/supabase-helpers';

export async function GET() {
  try {
    const exclusions = await getExclusions();
    return NextResponse.json(exclusions);
  } catch (error: any) {
    console.error('Get exclusions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exclusions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evaluatorId, targetId, reason } = body;

    if (!evaluatorId || !targetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await addExclusion(evaluatorId, targetId, reason || '');

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error('Add exclusion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add exclusion' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id' },
        { status: 400 }
      );
    }

    await deleteExclusion(Number(id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete exclusion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete exclusion' },
      { status: 500 }
    );
  }
}

