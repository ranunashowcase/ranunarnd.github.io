export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    const { token, user } = await loginUser(email, password);

    // Set JWT as httpOnly cookie
    const response = NextResponse.json({ success: true, user });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Login gagal' },
      { status: 401 }
    );
  }
}
