export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { registerUser, verifyToken, isAdmin } from '@/lib/auth-service';

/**
 * POST /api/auth/register
 * Admin-only: Create a new user account.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!isAdmin(payload)) {
      return NextResponse.json(
        { success: false, error: 'Hanya admin yang bisa menambahkan user' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, nama, role } = body;

    // Validate
    if (!email || !password || !nama) {
      return NextResponse.json(
        { success: false, error: 'Email, password, dan nama wajib diisi' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const user = await registerUser(email, password, nama, role || 'viewer');

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Registrasi gagal' },
      { status: 400 }
    );
  }
}
