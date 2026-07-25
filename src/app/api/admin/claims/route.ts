import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';

export async function GET() {
  const db = readDatabase();
  return NextResponse.json(db.claims);
}

export async function PUT(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(^| )donmac_session=([^;]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(decodeURIComponent(match[2]));
    if (sessionData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, status, rejectionReason } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Claim ID and status are required' }, { status: 400 });
    }

    const db = readDatabase();
    const claimIndex = db.claims.findIndex((c) => c.id === id);
    if (claimIndex === -1) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    const claim = db.claims[claimIndex];
    if (claim.status !== 'pending') {
      return NextResponse.json({ error: 'Claim has already been processed' }, { status: 400 });
    }

    claim.status = status;
    claim.rejectionReason = rejectionReason || undefined;
    claim.reviewedAt = new Date().toISOString();

    if (status === 'approved') {
      const targetUser = db.users.find((u) => u.id === claim.userId);
      if (!targetUser) {
        return NextResponse.json({ error: 'User for this claim not found' }, { status: 404 });
      }

      // 1. Prevention of duplicate credits: Add completed wallet transaction
      db.transactions.unshift({
        id: `tx-${Date.now()}`,
        userId: targetUser.id,
        type: 'deposit',
        amount: claim.amount,
        reference: claim.transactionId,
        description: `Manual Claim Approved (MoMo ID: ${claim.transactionId})`,
        status: 'completed',
        createdAt: new Date().toISOString()
      });

      // Credit wallet
      targetUser.walletBalance += claim.amount;
    }

    writeDatabase(db);

    logAudit(
      sessionData.id,
      sessionData.email,
      'PROCESS_CLAIM',
      `Manual claim of GHS ${claim.amount} for user ${claim.userEmail} ${status}`
    );

    return NextResponse.json({ success: true, claim });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
