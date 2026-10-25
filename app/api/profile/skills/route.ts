import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skillId, proficiency, yearsUsed } = await req.json();

    if (!skillId || !proficiency) {
      return NextResponse.json({ error: 'Skill and proficiency are required' }, { status: 400 });
    }

    if (proficiency < 1 || proficiency > 5) {
      return NextResponse.json({ error: 'Proficiency must be between 1 and 5' }, { status: 400 });
    }

    await query(
      `INSERT INTO candidate_skills (candidate_id, skill_id, proficiency, years_used)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (candidate_id, skill_id) DO UPDATE SET
         proficiency = EXCLUDED.proficiency,
         years_used = EXCLUDED.years_used`,
      [session.candidateId, skillId, proficiency, Number(yearsUsed) || 0]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Add skill error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
