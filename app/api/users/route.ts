import { NextRequest, NextResponse } from 'next/server';
import { saveUser, deleteUser, getUsers } from '@/lib/supabase-helpers';
import type { User } from '@/lib/types';

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userData = body as Partial<User>;

    await saveUser(userData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const internalId = searchParams.get('internalId');

    if (!internalId) {
      return NextResponse.json(
        { error: 'Missing internalId' },
        { status: 400 }
      );
    }

    await deleteUser(internalId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

