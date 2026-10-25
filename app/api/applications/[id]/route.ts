import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'candidate' || !session.candidateId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appId = parseInt(params.id, 10);

    // Ownership check
    const appRes = await query('SELECT candidate_id FROM applications WHERE application_id = $1', [appId]);
    if (appRes.rowCount === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (appRes.rows[0].candidate_id !== session.candidateId) {
      return NextResponse.json({ error: 'Forbidden: You can only withdraw your own applications' }, { status: 403 });
    }

    await query('DELETE FROM applications WHERE application_id = $1', [appId]);

    return NextResponse.json({ success: true, message: 'Application withdrawn successfully' });
  } catch (err: any) {
    console.error('Withdraw application error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
