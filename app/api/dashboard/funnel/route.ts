import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'recruiter' || !session.recruiterId) {
      return NextResponse.json({ error: 'Unauthorized: Recruiter access required' }, { status: 401 });
    }

    // Q4 Recruiter funnel: applications per status per job from view v_job_funnel
    const jobsFunnelRes = await query(
      `SELECT 
        job_id,
        recruiter_id,
        company_id,
        company_name,
        title,
        job_status,
        openings,
        deadline,
        total_applications,
        count_applied,
        count_screening,
        count_interview,
        count_offer,
        count_hired,
        count_rejected,
        hire_conversion_rate
       FROM v_job_funnel
       WHERE recruiter_id = $1
       ORDER BY total_applications DESC, job_id DESC`,
      [session.recruiterId]
    );

    // Aggregate overall metrics for recruiter
    const summaryRes = await query(
      `SELECT 
        COUNT(DISTINCT j.job_id) AS total_jobs,
        COUNT(a.application_id) AS total_candidates_applied,
        COUNT(a.application_id) FILTER (WHERE a.status = 'screening') AS total_screening,
        COUNT(a.application_id) FILTER (WHERE a.status = 'interview') AS total_interview,
        COUNT(a.application_id) FILTER (WHERE a.status = 'offer') AS total_offer,
        COUNT(a.application_id) FILTER (WHERE a.status = 'hired') AS total_hired,
        COUNT(a.application_id) FILTER (WHERE a.status = 'rejected') AS total_rejected,
        ROUND(100.0 * COUNT(a.application_id) FILTER (WHERE a.status = 'hired') / NULLIF(COUNT(a.application_id), 0), 2) AS overall_conversion_rate
       FROM jobs j
       LEFT JOIN applications a ON a.job_id = j.job_id
       WHERE j.recruiter_id = $1`,
      [session.recruiterId]
    );

    return NextResponse.json({
      summary: summaryRes.rows[0],
      jobs: jobsFunnelRes.rows,
    });
  } catch (err: any) {
    console.error('Funnel dashboard error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
