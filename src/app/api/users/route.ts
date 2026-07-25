import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(^| )donmac_session=([^;]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(decodeURIComponent(match[2]));
    const db = readDatabase();

    if (sessionData.role === 'admin') {
      return NextResponse.json(db.users);
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(^| )donmac_session=([^;]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(decodeURIComponent(match[2]));
    const db = readDatabase();

    // Support either admin updating ANY user OR user updating their OWN profile/wallet
    const { id, fullName, phone, password, walletBalance, notificationPrefs, favorites, actionType } = await request.json();

    const targetId = id || sessionData.id;
    const userIndex = db.users.findIndex((u) => u.id === targetId);

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isSelf = sessionData.id === targetId;
    const isAdmin = sessionData.role === 'admin';

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = db.users[userIndex];

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (password) user.passwordHash = password; // plain simulated hash
    if (notificationPrefs) user.notificationPrefs = { ...user.notificationPrefs, ...notificationPrefs };
    if (favorites) user.favorites = favorites;

    // Balance update: only allowed for admin OR through specific wallet flow
    if (walletBalance !== undefined && isAdmin) {
      user.walletBalance = parseFloat(walletBalance);
    }

    writeDatabase(db);

    logAudit(
      sessionData.id,
      sessionData.email,
      'UPDATE_USER',
      `Updated user profile for ${user.email}. ActionType: ${actionType || 'profile_edit'}`
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        walletBalance: user.walletBalance,
        role: user.role,
        notificationPrefs: user.notificationPrefs,
        favorites: user.favorites,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
