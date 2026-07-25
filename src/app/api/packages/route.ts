import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, Package, logAudit } from '@/lib/db';

export async function GET() {
  const db = readDatabase();
  // Filter hidden packages for public view, but we can do that on frontend depending on user role.
  return NextResponse.json(db.packages);
}

export async function POST(request: Request) {
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

    const { network, category, name, dataAmount, price, validity, isOnline, isHidden, sortOrder } = await request.json();

    if (!network || !category || !name || !dataAmount || isNaN(parseFloat(price))) {
      return NextResponse.json({ error: 'Missing package details' }, { status: 400 });
    }

    const db = readDatabase();
    const newPkg: Package = {
      id: `pkg-${Date.now()}`,
      network,
      category,
      name,
      dataAmount,
      price: parseFloat(price),
      validity: validity || '30 Days',
      isOnline: isOnline !== undefined ? isOnline : true,
      isHidden: isHidden !== undefined ? isHidden : false,
      sortOrder: isNaN(parseInt(sortOrder)) ? db.packages.length + 1 : parseInt(sortOrder),
    };

    db.packages.push(newPkg);
    // Sort automatically by sortOrder
    db.packages.sort((a, b) => a.sortOrder - b.sortOrder);
    writeDatabase(db);

    logAudit(sessionData.id, sessionData.email, 'CREATE_PACKAGE', `Created package ${name} (${network}) - Price: GHS ${price}`);

    return NextResponse.json({ success: true, package: newPkg });
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
    if (sessionData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, network, category, name, dataAmount, price, validity, isOnline, isHidden, sortOrder } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    const db = readDatabase();
    const pkgIndex = db.packages.findIndex((p) => p.id === id);
    if (pkgIndex === -1) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const updatedPkg = {
      ...db.packages[pkgIndex],
      network: network || db.packages[pkgIndex].network,
      category: category || db.packages[pkgIndex].category,
      name: name || db.packages[pkgIndex].name,
      dataAmount: dataAmount || db.packages[pkgIndex].dataAmount,
      price: price !== undefined ? parseFloat(price) : db.packages[pkgIndex].price,
      validity: validity || db.packages[pkgIndex].validity,
      isOnline: isOnline !== undefined ? isOnline : db.packages[pkgIndex].isOnline,
      isHidden: isHidden !== undefined ? isHidden : db.packages[pkgIndex].isHidden,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : db.packages[pkgIndex].sortOrder,
    };

    db.packages[pkgIndex] = updatedPkg;
    db.packages.sort((a, b) => a.sortOrder - b.sortOrder);
    writeDatabase(db);

    logAudit(sessionData.id, sessionData.email, 'UPDATE_PACKAGE', `Updated package ${updatedPkg.name} (${updatedPkg.network})`);

    return NextResponse.json({ success: true, package: updatedPkg });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    const db = readDatabase();
    const pkg = db.packages.find((p) => p.id === id);
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    db.packages = db.packages.filter((p) => p.id !== id);
    writeDatabase(db);

    logAudit(sessionData.id, sessionData.email, 'DELETE_PACKAGE', `Deleted package ${pkg.name} (${pkg.network})`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
