import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, Complaint, logAudit } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(^| )donmac_session=([^;]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(decodeURIComponent(match[2]));
    const db = readDatabase();

    // If admin, return all complaints. If customer, only return their own complaints.
    if (sessionData.role === 'admin') {
      return NextResponse.json(db.complaints);
    } else {
      const userComplaints = db.complaints.filter((c) => c.userId === sessionData.id);
      return NextResponse.json(userComplaints);
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
    const { subject, message, screenshotUrl } = await request.json();

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    const db = readDatabase();
    const newComplaint: Complaint = {
      id: `complaint-${Date.now()}`,
      userId: sessionData.id,
      userEmail: sessionData.email,
      subject,
      message,
      screenshotUrl: screenshotUrl || undefined,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.complaints.unshift(newComplaint);
    writeDatabase(db);

    logAudit(sessionData.id, sessionData.email, 'SUBMIT_COMPLAINT', `Submitted complaint: ${subject}`);

    return NextResponse.json({ success: true, complaint: newComplaint });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Support admin reply and status resolution
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

    const { id, adminReply, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }

    const db = readDatabase();
    const complaintIndex = db.complaints.findIndex((c) => c.id === id);
    if (complaintIndex === -1) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    db.complaints[complaintIndex] = {
      ...db.complaints[complaintIndex],
      adminReply: adminReply !== undefined ? adminReply : db.complaints[complaintIndex].adminReply,
      status: status !== undefined ? status : db.complaints[complaintIndex].status,
      updatedAt: new Date().toISOString(),
    };

    writeDatabase(db);

    logAudit(sessionData.id, sessionData.email, 'RESOLVE_COMPLAINT', `Admin updated status/reply on complaint ID ${id}`);

    return NextResponse.json({ success: true, complaint: db.complaints[complaintIndex] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
