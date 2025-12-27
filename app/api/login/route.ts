import { NextRequest, NextResponse } from 'next/server';
import { getUserByOrgId } from '@/lib/supabase-helpers';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orgId = body.org_id;

    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing org_id' },
        { status: 400 }
      );
    }

    const user = await getUserByOrgId(orgId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to login' },
      { status: 500 }
    );
  }
}

