import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { hashPassword, signToken, COOKIE_NAME } from '@/lib/auth';
import { generateEmbedding, formatVectorForPg } from '@/lib/embeddings';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, role, fullName, phone, location, education, yearsExperience, summary, resumeText, companyId, companyName } = body;

    if (!email || !password || !role || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role !== 'candidate' && role !== 'recruiter') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check existing email
    const existing = await query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // 1. Insert into users
      const userRes = await client.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id',
        [email, passwordHash, role]
      );
      const userId = userRes.rows[0].user_id;

      let candidateId: number | undefined;
      let recruiterId: number | undefined;
      let assignedCompanyId: number | undefined;

      if (role === 'candidate') {
        const text = resumeText || summary || `${fullName} Software Engineer`;
        const candRes = await client.query(
          `INSERT INTO candidates (user_id, full_name, phone, location, education, years_experience, summary, resume_text)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING candidate_id`,
          [userId, fullName, phone || null, location || null, education || null, Number(yearsExperience) || 0, summary || null, text]
        );
        candidateId = candRes.rows[0].candidate_id;

        // Generate and insert vector embedding
        const vec = await generateEmbedding(`${summary || ''}. ${text}`);
        await client.query(
          `INSERT INTO resume_embeddings (candidate_id, embedding, model_name)
           VALUES ($1, $2::vector, 'all-MiniLM-L6-v2')`,
          [candidateId, formatVectorForPg(vec)]
        );
      } else if (role === 'recruiter') {
        assignedCompanyId = companyId;

        // Create new company if requested and companyId not provided
        if (!assignedCompanyId && companyName) {
          const compRes = await client.query(
            'INSERT INTO companies (name, location) VALUES ($1, $2) RETURNING company_id',
            [companyName, location || 'Remote']
          );
          assignedCompanyId = compRes.rows[0].company_id;
        }

        if (!assignedCompanyId) {
          throw new Error('A company is required for recruiter registration');
        }

        const recRes = await client.query(
          `INSERT INTO recruiters (user_id, company_id, full_name, designation)
           VALUES ($1, $2, $3, $4)
           RETURNING recruiter_id`,
          [userId, assignedCompanyId, fullName, 'Recruiter']
        );
        recruiterId = recRes.rows[0].recruiter_id;
      }

      await client.query('COMMIT');

      // Generate session token
      const session = {
        userId,
        email,
        role,
        fullName,
        candidateId,
        recruiterId,
        companyId: assignedCompanyId,
      };

      const token = signToken(session);
      const response = NextResponse.json({ success: true, user: session });
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}
