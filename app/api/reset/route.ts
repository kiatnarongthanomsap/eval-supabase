import { NextRequest, NextResponse } from 'next/server';
import { resetData } from '@/lib/supabase-helpers';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await resetData();
    return NextResponse.json({ 
      success: true, 
      message: 'All scores and comments reset.' 
    });
  } catch (error: any) {
    console.error('Reset data error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset data' },
      { status: 500 }
    );
  }
}

