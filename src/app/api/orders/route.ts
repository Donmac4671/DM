import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, Order, logAudit } from '@/lib/db';

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
      return NextResponse.json(db.orders);
    } else {
      const userOrders = db.orders.filter((o) => o.userId === sessionData.id);
      return NextResponse.json(userOrders);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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

    const { packageId, recipientPhone } = await request.json();

    if (!packageId || !recipientPhone) {
      return NextResponse.json({ error: 'Package and Recipient Phone are required' }, { status: 400 });
    }

    const pkg = db.packages.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    if (!pkg.isOnline || pkg.isHidden) {
      return NextResponse.json({ error: 'This package is currently offline or unavailable' }, { status: 400 });
    }

    // Server-side balance validation
    if (user.walletBalance < pkg.price) {
      return NextResponse.json({ error: 'Insufficient wallet balance. Please top up.' }, { status: 400 });
    }

    // Deduct wallet balance automatically
    user.walletBalance -= pkg.price;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      userId: user.id,
      packageId: pkg.id,
      packageName: pkg.name,
      network: pkg.network,
      category: pkg.category,
      recipientPhone,
      amountPaid: pkg.price,
      dataAmount: pkg.dataAmount,
      status: 'completed', // Simulate instant delivery/fulfillment
      createdAt: new Date().toISOString(),
    };

    // Add purchase transaction
    db.transactions.unshift({
      id: `tx-purchase-${Date.now()}`,
      userId: user.id,
      type: 'purchase',
      amount: pkg.price,
      reference: newOrder.id,
      description: `Purchase: ${pkg.name} (${pkg.dataAmount}) for ${recipientPhone}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    db.orders.unshift(newOrder);
    writeDatabase(db);

    logAudit(user.id, user.email, 'PLACE_ORDER', `Purchased package ${pkg.name} for ${recipientPhone}. Cost: GHS ${pkg.price}`);

    return NextResponse.json({ success: true, order: newOrder, walletBalance: user.walletBalance });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Support admin changing order status or cancelling/refunding
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

    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Order ID and Status are required' }, { status: 400 });
    }

    const db = readDatabase();
    const orderIndex = db.orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const oldStatus = db.orders[orderIndex].status;
    db.orders[orderIndex].status = status;

    // Handle refund if state changed to failed from completed/pending
    if (status === 'failed' && oldStatus !== 'failed') {
      const orderUser = db.users.find((u) => u.id === db.orders[orderIndex].userId);
      if (orderUser) {
        orderUser.walletBalance += db.orders[orderIndex].amountPaid;
        db.transactions.unshift({
          id: `tx-refund-${Date.now()}`,
          userId: orderUser.id,
          type: 'refund',
          amount: db.orders[orderIndex].amountPaid,
          reference: db.orders[orderIndex].id,
          description: `Refund for failed order ID: ${db.orders[orderIndex].id}`,
          status: 'completed',
          createdAt: new Date().toISOString(),
        });
      }
    }

    writeDatabase(db);

    logAudit(sessionData.id, sessionData.email, 'UPDATE_ORDER', `Admin updated order ID ${id} to ${status}`);

    return NextResponse.json({ success: true, order: db.orders[orderIndex] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
