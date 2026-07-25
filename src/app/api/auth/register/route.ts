import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, phone } = await request.json();

    if (!email || !password || !fullName || !phone) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const db = readDatabase();
    const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      passwordHash: password, // Simulated hash
      fullName,
      phone,
      walletBalance: 0,
      role: email.toLowerCase() === 'donmacdatahub@gmail.com' ? 'admin' : 'customer' as 'admin' | 'customer',
      notificationPrefs: {
        email: true,
        sms: true,
        orderUpdates: true,
      },
      favorites: [],
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    writeDatabase(db);

    const sessionData = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
    };

    const response = NextResponse.json({ success: true, user: sessionData });
    response.cookies.set('donmac_session', JSON.stringify(sessionData), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
