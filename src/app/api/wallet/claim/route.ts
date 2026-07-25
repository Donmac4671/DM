import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, PaymentClaim, logAudit } from '@/lib/db';

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

    const { transactionId, amount, referenceCodeUsed, screenshotUrl } = await request.json();

    if (!transactionId || !amount) {
      return NextResponse.json({ error: 'Transaction ID and Amount are required' }, { status: 400 });
    }

    // Check if duplicate claim exists
    const duplicateClaim = db.claims.some(
      (c) => c.transactionId.toLowerCase() === transactionId.toLowerCase() && c.status !== 'rejected'
    );
    if (duplicateClaim) {
      return NextResponse.json({ error: 'A claim for this Transaction ID has already been submitted' }, { status: 400 });
    }

    // Check if transaction was already processed automatically
    const autoProcessed = db.transactions.some(
      (tx) => tx.reference === transactionId && tx.status === 'completed'
    );
    if (autoProcessed) {
      return NextResponse.json({ error: 'This Transaction ID has already been processed automatically and credited' }, { status: 400 });
    }

    const newClaim: PaymentClaim = {
      id: `claim-${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      transactionId: transactionId.trim(),
      amount: parseFloat(amount),
      referenceCodeUsed: referenceCodeUsed?.trim() || undefined,
      screenshotUrl: screenshotUrl || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.claims.push(newClaim);
    writeDatabase(db);

    logAudit(
      user.id,
      user.email,
      'CLAIM_SUBMITTED',
      `Manual claim submitted for GHS ${amount}. Tx ID: ${transactionId}`
    );

    return NextResponse.json({ success: true, claim: newClaim });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
