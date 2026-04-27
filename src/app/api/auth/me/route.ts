export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAllUsers, isAdmin } from '@/lib/auth-service';

/**
 * GET /api/auth/me
 * Returns current authenticated user info.
 * If ?users=true is passed and user is admin, also returns all users.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid atau expired' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const wantUsers = searchParams.get('users') === 'true';

    const result: any = {
      success: true,
      user: {
        user_id: payload.user_id,
        email: payload.email,
        nama: payload.nama,
        role: payload.role,
      },
    };

    // If admin requests user list
    if (wantUsers && isAdmin(payload)) {
      result.users = await getAllUsers();
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data user' },
      { status: 500 }
    );
  }
}
