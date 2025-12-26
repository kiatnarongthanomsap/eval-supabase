import { NextRequest, NextResponse } from 'next/server';
import { saveCriteria, deleteCriteria, getCriteria } from '@/lib/supabase-helpers';
import type { Criteria } from '@/lib/types';

export async function GET() {
  try {
    const criteria = await getCriteria();
    return NextResponse.json(criteria);
  } catch (error: any) {
    console.error('Get criteria error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch criteria' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const criteria = body as Criteria;

    await saveCriteria(criteria);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save criteria error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save criteria' },
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

    await deleteCriteria(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete criteria error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete criteria' },
      { status: 500 }
    );
  }
}

