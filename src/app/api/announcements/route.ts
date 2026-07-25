import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, Announcement, logAudit } from '@/lib/db';

export async function GET() {
  const db = readDatabase();
  return NextResponse.json(db.announcements);
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

    const { title, content, networkSpecific, scheduledFor } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and Content are required' }, { status: 400 });
    }

    const db = readDatabase();
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      networkSpecific: networkSpecific || null,
      scheduledFor: scheduledFor || undefined,
      createdAt: new Date().toISOString(),
    };

    db.announcements.unshift(newAnn);
    writeDatabase(db);

    logAudit(sessionData.id, sessionData.email, 'CREATE_ANNOUNCEMENT', `Created announcement: ${title}`);

    return NextResponse.json({ success: true, announcement: newAnn });
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
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    const db = readDatabase();
    db.announcements = db.announcements.filter((a) => a.id !== id);
    writeDatabase(db);

    logAudit(sessionData.id, sessionData.email, 'DELETE_ANNOUNCEMENT', `Deleted announcement ID: ${id}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
