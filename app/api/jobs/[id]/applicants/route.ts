import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'recruiter' || !session.recruiterId) {
      return NextResponse.json({ error: 'Unauthorized: Recruiter access required' }, { status: 401 });
    }

    const jobId = parseInt(params.id, 10);

    // Verify recruiter ownership of this job
    const ownerRes = await query('SELECT recruiter_id FROM jobs WHERE job_id = $1', [jobId]);
    if (ownerRes.rowCount === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (ownerRes.rows[0].recruiter_id !== session.recruiterId) {
      return NextResponse.json({ error: 'Forbidden: You can only view applicants for your own jobs' }, { status: 403 });
    }

    // Q3: Ranked applicants for a job from database view v_ranked_applicants
    const res = await query(
      `SELECT 
        application_id,
        job_id,
        candidate_id,
        candidate_name,
        candidate_email,
        candidate_phone,
        candidate_location,
        years_experience,
        education,
        status,
        match_score,
        applied_at,
        applicant_rank
      FROM v_ranked_applicants
      WHERE job_id = $1
      ORDER BY applicant_rank ASC`,
      [jobId]
    );

    return NextResponse.json({ applicants: res.rows });
  } catch (err: any) {
    console.error('Fetch applicants error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
