import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { generateEmbedding, formatVectorForPg } from '@/lib/embeddings';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const jobId = parseInt(params.id, 10);
    const session = await getSessionFromCookies();

    const jobRes = await query(
      `SELECT 
        j.job_id,
        j.recruiter_id,
        j.company_id,
        c.name AS company_name,
        c.industry,
        c.website,
        j.title,
        j.description,
        j.location,
        j.salary_min,
        j.salary_max,
        j.openings,
        j.deadline,
        j.status,
        j.created_at,
        r.full_name AS recruiter_name,
        COALESCE(
          json_agg(
            json_build_object(
              'skill_id', s.skill_id,
              'name', s.name,
              'category', s.category,
              'weight', js.weight,
              'is_mandatory', js.is_mandatory
            ) ORDER BY js.is_mandatory DESC, js.weight DESC
          ) FILTER (WHERE s.skill_id IS NOT NULL), '[]'
        ) AS required_skills
      FROM jobs j
      JOIN companies c ON c.company_id = j.company_id
      JOIN recruiters r ON r.recruiter_id = j.recruiter_id
      LEFT JOIN job_skills js ON js.job_id = j.job_id
      LEFT JOIN skills s ON s.skill_id = js.skill_id
      WHERE j.job_id = $1
      GROUP BY j.job_id, c.company_id, c.name, c.industry, c.website, r.full_name`,
      [jobId]
    );

    if (jobRes.rowCount === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobRes.rows[0];

    // If logged in as candidate, also check application status and match score
    let candidateMatch: any = null;
    let application: any = null;

    if (session?.candidateId) {
      const appRes = await query(
        `SELECT application_id, status, match_score, applied_at
         FROM applications
         WHERE candidate_id = $1 AND job_id = $2`,
        [session.candidateId, jobId]
      );
      if (appRes.rowCount && appRes.rowCount > 0) {
        application = appRes.rows[0];
      }

      // Compute live score breakdown
      const scoreRes = await query(
        `WITH r AS (SELECT embedding FROM resume_embeddings WHERE candidate_id = $1)
         SELECT 
           compute_skill_score($1, $2) AS skill_score,
           ROUND((100.0 * (1.0 - (je.embedding <=> r.embedding)))::numeric, 2) AS semantic_score,
           ROUND((0.6 * compute_skill_score($1, $2) + 0.4 * 100.0 * (1.0 - (je.embedding <=> r.embedding)))::numeric, 2) AS hybrid_score
         FROM jobs j
         JOIN job_embeddings je ON je.job_id = j.job_id, r
         WHERE j.job_id = $2`,
        [session.candidateId, jobId]
      );

      if (scoreRes.rowCount && scoreRes.rowCount > 0) {
        candidateMatch = scoreRes.rows[0];
      }
    }

    return NextResponse.json({ job, candidateMatch, application });
  } catch (err: any) {
    console.error('Fetch job error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'recruiter' || !session.recruiterId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = parseInt(params.id, 10);
    const body = await req.json();
    const { title, description, location, salaryMin, salaryMax, openings, deadline, status, skills } = body;

    // Check ownership
    const ownerRes = await query('SELECT recruiter_id FROM jobs WHERE job_id = $1', [jobId]);
    if (ownerRes.rowCount === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (ownerRes.rows[0].recruiter_id !== session.recruiterId) {
      return NextResponse.json({ error: 'Forbidden: You can only edit your own jobs' }, { status: 403 });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const updateRes = await client.query(
        `UPDATE jobs
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             location = COALESCE($3, location),
             salary_min = $4,
             salary_max = $5,
             openings = COALESCE($6, openings),
             deadline = COALESCE($7, deadline),
             status = COALESCE($8, status)
         WHERE job_id = $9
         RETURNING *`,
        [
          title,
          description,
          location,
          salaryMin ? parseInt(salaryMin, 10) : null,
          salaryMax ? parseInt(salaryMax, 10) : null,
          openings ? parseInt(openings, 10) : undefined,
          deadline,
          status,
          jobId,
        ]
      );

      if (Array.isArray(skills)) {
        await client.query('DELETE FROM job_skills WHERE job_id = $1', [jobId]);
        for (const sk of skills) {
          if (sk.skillId) {
            await client.query(
              `INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
               VALUES ($1, $2, $3, $4)`,
              [jobId, sk.skillId, sk.weight || 3, !!sk.isMandatory]
            );
          }
        }
      }

      // Re-generate job embedding if description or title changed
      if (title || description) {
        const skillsRes = await client.query(
          `SELECT string_agg(s.name, ', ') AS skill_names
           FROM job_skills js
           JOIN skills s ON s.skill_id = js.skill_id
           WHERE js.job_id = $1`,
          [jobId]
        );
        const finalJob = updateRes.rows[0];
        const textToEmbed = `${finalJob.title}. ${finalJob.description} Required Skills: ${skillsRes.rows[0]?.skill_names || ''}`;
        const vec = await generateEmbedding(textToEmbed);
        const vecStr = formatVectorForPg(vec);

        await client.query(
          `INSERT INTO job_embeddings (job_id, embedding, model_name, updated_at)
           VALUES ($1, $2::vector, 'all-MiniLM-L6-v2', now())
           ON CONFLICT (job_id) DO UPDATE SET
             embedding = EXCLUDED.embedding,
             updated_at = now()`,
          [jobId, vecStr]
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, job: updateRes.rows[0] });
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Update job error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'recruiter' || !session.recruiterId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = parseInt(params.id, 10);

    // Ownership check
    const ownerRes = await query('SELECT recruiter_id FROM jobs WHERE job_id = $1', [jobId]);
    if (ownerRes.rowCount === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (ownerRes.rows[0].recruiter_id !== session.recruiterId) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own jobs' }, { status: 403 });
    }

    // ON DELETE CASCADE automatically removes job_skills, applications, and job_embeddings
    await query('DELETE FROM jobs WHERE job_id = $1', [jobId]);

    return NextResponse.json({ success: true, message: 'Job deleted successfully' });
  } catch (err: any) {
    console.error('Delete job error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
