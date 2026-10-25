import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { generateEmbedding, formatVectorForPg } from '@/lib/embeddings';

export async function GET(req: Request) {
  try {
    const session = await getSessionFromCookies();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get('q')?.trim() || '';
    const location = searchParams.get('location')?.trim() || '';
    const salaryMin = searchParams.get('salaryMin');
    const skillId = searchParams.get('skillId');
    const mine = searchParams.get('mine') === 'true';

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (mine && session?.recruiterId) {
      conditions.push(`j.recruiter_id = $${paramIdx++}`);
      params.push(session.recruiterId);
    } else {
      conditions.push(`j.status = 'open'`);
    }

    if (location) {
      conditions.push(`(j.location ILIKE $${paramIdx} OR (j.location IS NULL AND 'Remote' ILIKE $${paramIdx}))`);
      params.push(`%${location}%`);
      paramIdx++;
    }

    if (salaryMin) {
      conditions.push(`j.salary_max >= $${paramIdx++}`);
      params.push(parseInt(salaryMin, 10));
    }

    if (skillId) {
      conditions.push(`EXISTS (SELECT 1 FROM job_skills js WHERE js.job_id = j.job_id AND js.skill_id = $${paramIdx++})`);
      params.push(parseInt(skillId, 10));
    }

    let ftsSelect = '0.0 AS rank';
    let orderBy = 'j.created_at DESC';

    if (q) {
      conditions.push(`j.search_vector @@ plainto_tsquery('english', $${paramIdx})`);
      ftsSelect = `ts_rank(j.search_vector, plainto_tsquery('english', $${paramIdx})) AS rank`;
      orderBy = `rank DESC, j.created_at DESC`;
      params.push(q);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        j.job_id,
        j.recruiter_id,
        j.company_id,
        c.name AS company_name,
        j.title,
        j.description,
        j.location,
        j.salary_min,
        j.salary_max,
        j.openings,
        j.deadline,
        j.status,
        j.created_at,
        ${ftsSelect},
        COALESCE(
          json_agg(
            json_build_object(
              'skill_id', s.skill_id,
              'name', s.name,
              'weight', js.weight,
              'is_mandatory', js.is_mandatory
            )
          ) FILTER (WHERE s.skill_id IS NOT NULL), '[]'
        ) AS required_skills
      FROM jobs j
      JOIN companies c ON c.company_id = j.company_id
      LEFT JOIN job_skills js ON js.job_id = j.job_id
      LEFT JOIN skills s ON s.skill_id = js.skill_id
      ${whereClause}
      GROUP BY j.job_id, c.name
      ORDER BY ${orderBy}
    `;

    const res = await query(sql, params);
    return NextResponse.json({ jobs: res.rows });
  } catch (err: any) {
    console.error('Job search error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'recruiter' || !session.recruiterId || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Only registered recruiters can post jobs' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, location, salaryMin, salaryMax, openings, deadline, skills } = body;

    if (!title || !description || !deadline) {
      return NextResponse.json({ error: 'Title, description, and deadline are required' }, { status: 400 });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const jobRes = await client.query(
        `INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open')
         RETURNING *`,
        [
          session.recruiterId,
          session.companyId,
          title,
          description,
          location || 'Remote',
          salaryMin ? parseInt(salaryMin, 10) : null,
          salaryMax ? parseInt(salaryMax, 10) : null,
          openings ? parseInt(openings, 10) : 1,
          deadline,
        ]
      );
      const newJob = jobRes.rows[0];

      // Insert skills
      const skillNames: string[] = [];
      if (Array.isArray(skills) && skills.length > 0) {
        for (const sk of skills) {
          if (sk.skillId) {
            await client.query(
              `INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (job_id, skill_id) DO UPDATE SET
                 weight = EXCLUDED.weight,
                 is_mandatory = EXCLUDED.is_mandatory`,
              [newJob.job_id, sk.skillId, sk.weight || 3, !!sk.isMandatory]
            );
          }
        }

        const skillNamesRes = await client.query(
          `SELECT name FROM skills WHERE skill_id = ANY($1::int[])`,
          [skills.map(s => s.skillId)]
        );
        skillNames.push(...skillNamesRes.rows.map(r => r.name));
      }

      // Generate embedding and save to job_embeddings
      const textToEmbed = `${title}. ${description} Required Skills: ${skillNames.join(', ')}`;
      const vec = await generateEmbedding(textToEmbed);
      const vecStr = formatVectorForPg(vec);

      await client.query(
        `INSERT INTO job_embeddings (job_id, embedding, model_name, updated_at)
         VALUES ($1, $2::vector, 'all-MiniLM-L6-v2', now())
         ON CONFLICT (job_id) DO UPDATE SET
           embedding = EXCLUDED.embedding,
           updated_at = now()`,
        [newJob.job_id, vecStr]
      );

      await client.query('COMMIT');
      return NextResponse.json({ success: true, job: newJob });
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Create job error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
