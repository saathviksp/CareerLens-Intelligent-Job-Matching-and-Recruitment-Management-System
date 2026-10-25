import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'candidate' || !session.candidateId) {
      return NextResponse.json({ error: 'Unauthorized: Candidate login required' }, { status: 401 });
    }

    // Q1: Ranked jobs for candidate (hybrid: 60% skills overlap, 40% pgvector semantic similarity)
    const res = await query(
      `WITH r AS (
         SELECT embedding 
         FROM resume_embeddings 
         WHERE candidate_id = $1
       )
       SELECT 
         j.job_id,
         j.title,
         c.name AS company_name,
         c.industry,
         j.location,
         j.salary_min,
         j.salary_max,
         j.deadline,
         compute_skill_score($1, j.job_id) AS skill_score,
         ROUND((100.0 * (1.0 - (je.embedding <=> r.embedding)))::numeric, 2) AS semantic_score,
         ROUND(
           (0.6 * compute_skill_score($1, j.job_id) + 
            0.4 * 100.0 * (1.0 - (je.embedding <=> r.embedding)))::numeric, 
           2
         ) AS hybrid_score,
         COALESCE(
           json_agg(
             json_build_object(
               'skill_id', s.skill_id,
               'name', s.name,
               'weight', js.weight,
               'is_mandatory', js.is_mandatory
             )
           ) FILTER (WHERE s.skill_id IS NOT NULL), '[]'
         ) AS required_skills,
         EXISTS (
           SELECT 1 FROM applications a 
           WHERE a.candidate_id = $1 AND a.job_id = j.job_id
         ) AS already_applied
       FROM jobs j
       JOIN companies c ON c.company_id = j.company_id
       JOIN job_embeddings je USING (job_id), r
       LEFT JOIN job_skills js ON js.job_id = j.job_id
       LEFT JOIN skills s ON s.skill_id = js.skill_id
       WHERE j.status = 'open'
       GROUP BY j.job_id, c.name, c.industry, je.embedding, r.embedding
       ORDER BY hybrid_score DESC
       LIMIT 15`,
      [session.candidateId]
    );

    return NextResponse.json({ matches: res.rows });
  } catch (err: any) {
    console.error('Matches error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
