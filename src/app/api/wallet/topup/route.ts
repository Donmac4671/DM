import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, WalletTransaction, logAudit } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(^| )donmac_session=([^;]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(decodeURIComponent(match[2]));
    const db = readDatabase();
    const user = db.users.find((u) => u.id === sessionData.id);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Generate reference code
    const uniqueRef = `DMH-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPendingTx: WalletTransaction = {
      id: `tx-pending-${Date.now()}`,
      userId: user.id,
      type: 'deposit',
      amount: numericAmount,
      reference: uniqueRef,
      description: `Pending top-up wallet funding via MoMo`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.transactions.push(newPendingTx);
    writeDatabase(db);

    logAudit(user.id, user.email, 'INITIATE_TOPUP', `Initiated wallet top-up of GHS ${numericAmount}. Reference code: ${uniqueRef}`);

    return NextResponse.json({
      success: true,
      referenceCode: uniqueRef,
      amount: numericAmount,
      momoNumber: '0241234567', // Static simulated admin momo number
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
