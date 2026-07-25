import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit, WalletTransaction } from '@/lib/db';

/**
 * We'll support standard webhook handling of MoMo automated top-ups.
 * Unique reference codes generated look like: DMH-xxxxxx
 * An SMS format we support is:
 * "Received GHS 150.00 from Kojo Antwi. Reference: DMH-123456. Transaction ID: 293810293."
 * or standard MTN SMS messages containing a reference.
 *
 * Rules:
 * 1. Check for duplicate SMS by keeping track of the Transaction ID.
 * 2. Find matching pending transaction reference or allocate to user wallet based on reference code.
 * 3. Expired reference codes: unique reference code should match an entry, but let's make it robust.
 */

export async function POST(request: Request) {
  try {
    const { smsContent, senderNumber } = await request.json();

    if (!smsContent) {
      return NextResponse.json({ error: 'smsContent is required' }, { status: 400 });
    }

    const db = readDatabase();

    // Regex parsing to extract fields
    // Standard format support:
    // GHS [Amount] from [Sender Name]. Reference: [DMH-XXXXXX]. Transaction ID: [ID]
    // Or a generic parser looking for "GHS <amount>", "Ref: <reference>", "Transaction ID: <id>"

    const amountMatch = smsContent.match(/(?:GHS|GHC|Ghs|Ghc)\s*([0-9]+(?:\.[0-9]+)?)/);
    const refMatch = smsContent.match(/(?:Reference|Ref|ref|REF)[:\s\-]*([A-Z0-9\-]+)/i);
    const txIdMatch = smsContent.match(/(?:Transaction ID|TxID|ID|Tx)[:\s\-]*([0-9a-zA-Z]+)/i);

    if (!amountMatch) {
      return NextResponse.json({ error: 'Could not extract amount from SMS' }, { status: 400 });
    }

    const amount = parseFloat(amountMatch[1]);
    const referenceCode = refMatch ? refMatch[1].trim() : '';
    const transactionId = txIdMatch ? txIdMatch[1].trim() : `SMS-${Date.now()}`;

    // 1. Prevention of duplicate transaction credits
    const duplicateTx = db.transactions.some(
      (tx) => tx.reference === transactionId || (tx.id === transactionId && tx.status === 'completed')
    );
    if (duplicateTx) {
      return NextResponse.json({ error: 'Duplicate SMS / Transaction ID already processed' }, { status: 400 });
    }

    // Find pending top-up transaction or matching user with the reference code
    // A standard reference code: DMH-XXXXXX
    let targetUser = null;
    let matchingPendingTx = null;

    if (referenceCode) {
      // Find matching pending top-up
      matchingPendingTx = db.transactions.find(
        (tx) => tx.reference === referenceCode && tx.type === 'deposit' && tx.status === 'pending'
      );

      if (matchingPendingTx) {
        targetUser = db.users.find((u) => u.id === matchingPendingTx!.userId);
      } else {
        // Fallback: search if code was generated for user (e.g. standard format where user's ID or unique code matches)
        // Let's search transactions for any pending with this reference
        // Or check if reference matches reference codes we gave to users
      }
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'No matching pending transaction or user found for reference code: ' + referenceCode }, { status: 400 });
    }

    // Check expiration if applicable (say 2 hours from creation)
    const createdAtTime = new Date(matchingPendingTx!.createdAt).getTime();
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    if (Date.now() - createdAtTime > twoHoursInMs) {
      matchingPendingTx!.status = 'failed';
      writeDatabase(db);
      logAudit(
        targetUser.id,
        targetUser.email,
        'WALLET_TOP_UP_EXPIRED',
        `Top-up for GHS ${amount} expired for reference ${referenceCode}`
      );
      return NextResponse.json({ error: 'Reference code has expired' }, { status: 400 });
    }

    // Credit user's wallet
    targetUser.walletBalance += amount;

    // Mark pending topup as completed and update info
    matchingPendingTx!.status = 'completed';
    matchingPendingTx!.description = `Automated Top-up completed (MoMo Tx: ${transactionId})`;
    matchingPendingTx!.amount = amount; // Set final actual received amount if they sent slightly different amount

    // Record the completed actual transaction
    const completedTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      userId: targetUser.id,
      type: 'deposit',
      amount: amount,
      reference: transactionId,
      description: `Mobile Money Credit via SMS Webhook (${referenceCode})`,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    db.transactions.push(completedTx);

    writeDatabase(db);

    logAudit(
      targetUser.id,
      targetUser.email,
      'WALLET_AUTO_FUNDED',
      `Auto credited GHS ${amount} via SMS webhook. Reference: ${referenceCode}, MoMo Tx: ${transactionId}`
    );

    return NextResponse.json({
      success: true,
      message: 'Wallet credited successfully',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        walletBalance: targetUser.walletBalance,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
