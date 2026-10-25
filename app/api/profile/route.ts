import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { generateEmbedding, formatVectorForPg } from '@/lib/embeddings';

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const candRes = await query(
      `SELECT c.candidate_id, c.user_id, c.full_name, c.phone, c.location, c.education, 
              c.years_experience, c.summary, c.resume_text, c.updated_at, u.email
       FROM candidates c
       JOIN users u ON u.user_id = c.user_id
       WHERE c.candidate_id = $1`,
      [session.candidateId]
    );

    if (candRes.rowCount === 0) {
      return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 });
    }

    const candidate = candRes.rows[0];

    const skillsRes = await query(
      `SELECT cs.skill_id, s.name, s.category, cs.proficiency, cs.years_used
       FROM candidate_skills cs
       JOIN skills s ON s.skill_id = cs.skill_id
       WHERE cs.candidate_id = $1
       ORDER BY cs.proficiency DESC, s.name ASC`,
      [session.candidateId]
    );

    return NextResponse.json({
      candidate,
      skills: skillsRes.rows,
    });
  } catch (err: any) {
    console.error('Fetch profile error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, phone, location, education, yearsExperience, summary, resumeText } = body;

    if (!fullName || !resumeText) {
      return NextResponse.json({ error: 'Full name and resume text are required' }, { status: 400 });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const updateRes = await client.query(
        `UPDATE candidates
         SET full_name = $1,
             phone = $2,
             location = $3,
             education = $4,
             years_experience = $5,
             summary = $6,
             resume_text = $7
         WHERE candidate_id = $8
         RETURNING *`,
        [fullName, phone || null, location || null, education || null, Number(yearsExperience) || 0, summary || null, resumeText, session.candidateId]
      );

      // Re-generate vector embedding
      // Aggregate current skill names
      const skillsRes = await client.query(
        `SELECT string_agg(s.name, ', ') AS skill_names
         FROM candidate_skills cs
         JOIN skills s ON s.skill_id = cs.skill_id
         WHERE cs.candidate_id = $1`,
        [session.candidateId]
      );
      const skillNames = skillsRes.rows[0]?.skill_names || '';

      const embeddingText = `${summary || ''}. ${resumeText}. Skills: ${skillNames}`;
      const vec = await generateEmbedding(embeddingText);
      const vecStr = formatVectorForPg(vec);

      await client.query(
        `INSERT INTO resume_embeddings (candidate_id, embedding, model_name, updated_at)
         VALUES ($1, $2::vector, 'all-MiniLM-L6-v2', now())
         ON CONFLICT (candidate_id) DO UPDATE SET
           embedding = EXCLUDED.embedding,
           updated_at = now()`,
        [session.candidateId, vecStr]
      );

      await client.query('COMMIT');

      return NextResponse.json({ success: true, candidate: updateRes.rows[0] });
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
