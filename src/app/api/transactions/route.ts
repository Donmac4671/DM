import { NextResponse } from 'next/server';
import { readDatabase } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(^| )donmac_session=([^;]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(decodeURIComponent(match[2]));
    const db = readDatabase();

    // Customers can view their own transactions; admins can view all.
    if (sessionData.role === 'admin') {
      return NextResponse.json(db.transactions);
    } else {
      const userTxs = db.transactions.filter((tx) => tx.userId === sessionData.id);
      return NextResponse.json(userTxs);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
