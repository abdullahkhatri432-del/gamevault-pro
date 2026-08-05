import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

const db = getDb();

const getReportsByReporter = db.prepare(`
  SELECT ar.*, o.game, o.status as order_status 
  FROM anomaly_reports ar 
  LEFT JOIN orders o ON ar.order_id = o.id 
  WHERE ar.reporter_email = @email 
  ORDER BY ar.created_at DESC
`);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
  }

  const reports = getReportsByReporter.all({ email: user.email });
  return NextResponse.json({ reports });
}
