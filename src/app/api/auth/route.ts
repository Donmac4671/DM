import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(^| )donmac_session=([^;]+)/);
  if (!match) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const sessionData = JSON.parse(decodeURIComponent(match[2]));
    const db = readDatabase();
    const user = db.users.find((u) => u.id === sessionData.id);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        walletBalance: user.walletBalance,
        notificationPrefs: user.notificationPrefs,
        favorites: user.favorites,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const db = readDatabase();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const sessionData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    const response = NextResponse.json({ success: true, user: sessionData });
    response.cookies.set('donmac_session', JSON.stringify(sessionData), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('donmac_session', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
