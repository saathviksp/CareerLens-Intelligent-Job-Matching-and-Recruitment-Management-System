import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'recruiter' || !session.recruiterId) {
      return NextResponse.json({ error: 'Unauthorized: Recruiter access required' }, { status: 401 });
    }

    const appId = parseInt(params.id, 10);
    const { status } = await req.json();

    const allowed = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid application status' }, { status: 400 });
    }

    // Ownership check via jobs.recruiter_id
    const checkRes = await query(
      `SELECT a.application_id, a.status AS current_status, j.recruiter_id
       FROM applications a
       JOIN jobs j ON j.job_id = a.job_id
       WHERE a.application_id = $1`,
      [appId]
    );

    if (checkRes.rowCount === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (checkRes.rows[0].recruiter_id !== session.recruiterId) {
      return NextResponse.json({ error: 'Forbidden: You can only update applications for your own jobs' }, { status: 403 });
    }

    // Update status - triggers trg_status_history automatically
    const updateRes = await query(
      `UPDATE applications
       SET status = $1::app_status
       WHERE application_id = $2
       RETURNING *`,
      [status, appId]
    );

    // Fetch latest history trail
    const historyRes = await query(
      `SELECT history_id, old_status, new_status, changed_at
       FROM application_status_history
       WHERE application_id = $1
       ORDER BY changed_at DESC`,
      [appId]
    );

    return NextResponse.json({
      success: true,
      application: updateRes.rows[0],
      latestHistory: historyRes.rows[0],
      fullTimeline: historyRes.rows,
    });
  } catch (err: any) {
    console.error('Update application status error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
