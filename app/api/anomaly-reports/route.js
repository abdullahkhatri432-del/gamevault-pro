import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRequest } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { sanitizeString, truncate } from '@/lib/validate';
import { verifyOrderOwnership } from '@/lib/auth-guard';

const db = getDb();

function ensureAnomalyTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS anomaly_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      reporter_email TEXT NOT NULL,
      report_type TEXT NOT NULL DEFAULT 'order_discrepancy',
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      updated_at TEXT
    );
  `);

  const columns = db.prepare('PRAGMA table_info(anomaly_reports)').all();
  const existingColumns = new Set(columns.map((col) => col.name));
  if (!existingColumns.has('updated_at')) {
    try {
      db.exec('ALTER TABLE anomaly_reports ADD COLUMN updated_at TEXT');
    } catch (e) {
      if (!/duplicate column/i.test(String(e?.message || ''))) {
        throw e;
      }
    }
  }
}

ensureAnomalyTable();

const insertReport = db.prepare('INSERT INTO anomaly_reports (order_id, reporter_email, report_type, description, status) VALUES (@orderId, @reporterEmail, @reportType, @description, @status)');
const getReportsByOrder = db.prepare('SELECT * FROM anomaly_reports WHERE order_id = @orderId ORDER BY created_at DESC');
const getReportsByOrderAndEmail = db.prepare('SELECT * FROM anomaly_reports WHERE order_id = @orderId AND reporter_email = @email ORDER BY created_at DESC');
const getAllReports = db.prepare('SELECT * FROM anomaly_reports ORDER BY created_at DESC');
const getReportsByReporter = db.prepare('SELECT * FROM anomaly_reports WHERE reporter_email = @email ORDER BY created_at DESC');
const updateReportStatus = db.prepare('UPDATE anomaly_reports SET status = @status, admin_notes = @adminNotes, updated_at = @updatedAt, resolved_at = @resolvedAt WHERE id = @id');
const getReportById = db.prepare('SELECT * FROM anomaly_reports WHERE id = @id');

export async function GET(request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');

  if (orderId) {
    if (await isAdminRequest()) {
      const reports = getReportsByOrder.all({ orderId });
      return NextResponse.json({ reports });
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
    }
    const check = await verifyOrderOwnership(orderId, user);
    if (!check.ok) {
      return check.response;
    }
    const reports = getReportsByOrderAndEmail.all({ orderId, email: user.email });
    return NextResponse.json({ reports });
  }

  if (await isAdminRequest()) {
    const reports = getAllReports.all();
    return NextResponse.json({ reports });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
  }

  const reports = getReportsByReporter.all({ email: user.email });
  return NextResponse.json({ reports });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
  }

  const body = await request.json();
  const orderId = truncate(sanitizeString(body.orderId), 100);
  const description = truncate(sanitizeString(body.description), 5000);
  const reportType = truncate(sanitizeString(body.reportType || 'order_discrepancy'), 50);

  if (!orderId || !description) {
    return NextResponse.json({ message: 'Order ID and description are required.' }, { status: 400 });
  }

  const order = db.prepare('SELECT id, email, status, delivered_at, created_at FROM orders WHERE id = @id').get({ id: orderId });
  if (!order) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
  }

  const check = await verifyOrderOwnership(orderId, user);
  if (!check.ok) {
    return check.response;
  }

  const deliveryTime = order.delivered_at || order.created_at;
  const hoursSinceDelivery = (new Date() - new Date(deliveryTime)) / (1000 * 60 * 60);

  if (hoursSinceDelivery > 24) {
    return NextResponse.json({
      message: 'The 24-hour reporting window has passed. Reports must be submitted within 24 hours of delivery.',
      warrantyVoided: true,
    }, { status: 400 });
  }

  insertReport.run({ orderId, reporterEmail: user.email, reportType, description, status: 'submitted' });

  return NextResponse.json({ message: 'Anomaly report submitted. Your 30-Day Anti-Ban Warranty remains active.' }, { status: 201 });
}

export async function PATCH(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  }

  const body = await request.json();
  const { id, status, adminNotes } = body;

  const allowedStatuses = ['under_review', 'approved', 'rejected', 'resolved'];
  if (!id || !allowedStatuses.includes(status)) {
    return NextResponse.json({ message: 'Valid report ID and status are required.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const resolvedAt = status === 'resolved' ? now : null;

  updateReportStatus.run({ id, status, adminNotes: adminNotes || '', updatedAt: now, resolvedAt });

  return NextResponse.json({ message: 'Report updated.' });
}
