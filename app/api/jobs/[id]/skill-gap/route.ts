import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'candidate' || !session.candidateId) {
      return NextResponse.json({ error: 'Unauthorized: Candidate login required' }, { status: 401 });
    }

    const jobId = parseInt(params.id, 10);

    // Q2 Skill Gap: required skills the candidate lacks, ordered by weight and mandatory flag
    const res = await query(
      `SELECT s.skill_id, s.name, s.category, js.weight, js.is_mandatory
       FROM job_skills js
       JOIN skills s ON s.skill_id = js.skill_id
       WHERE js.job_id = $2
         AND NOT EXISTS (
           SELECT 1 
           FROM candidate_skills cs
           WHERE cs.candidate_id = $1 
             AND cs.skill_id = js.skill_id
         )
       ORDER BY js.is_mandatory DESC, js.weight DESC`,
      [session.candidateId, jobId]
    );

    // Also get matched skills candidate has
    const matchedRes = await query(
      `SELECT s.skill_id, s.name, s.category, js.weight, js.is_mandatory, cs.proficiency, cs.years_used
       FROM job_skills js
       JOIN skills s ON s.skill_id = js.skill_id
       JOIN candidate_skills cs ON cs.skill_id = js.skill_id AND cs.candidate_id = $1
       WHERE js.job_id = $2
       ORDER BY js.weight DESC`,
      [session.candidateId, jobId]
    );

    return NextResponse.json({
      missingSkills: res.rows,
      matchedSkills: matchedRes.rows,
    });
  } catch (err: any) {
    console.error('Skill gap query error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
