import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { skillId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const skillId = parseInt(params.skillId, 10);
    const { proficiency, yearsUsed } = await req.json();

    if (proficiency < 1 || proficiency > 5) {
      return NextResponse.json({ error: 'Proficiency must be between 1 and 5' }, { status: 400 });
    }

    await query(
      `UPDATE candidate_skills
       SET proficiency = $1, years_used = $2
       WHERE candidate_id = $3 AND skill_id = $4`,
      [proficiency, Number(yearsUsed) || 0, session.candidateId, skillId]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { skillId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session || session.role !== 'candidate') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const skillId = parseInt(params.skillId, 10);

    await query(
      'DELETE FROM candidate_skills WHERE candidate_id = $1 AND skill_id = $2',
      [session.candidateId, skillId]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
