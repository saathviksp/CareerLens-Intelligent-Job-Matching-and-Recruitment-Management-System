import { query } from '../lib/db';

async function verifyQueries() {
  console.log('--- Q1: Ranked Jobs for Candidate 1 ---');
  const q1 = await query(`
    WITH r AS (SELECT embedding FROM resume_embeddings WHERE candidate_id = 1)
    SELECT j.title, 
           compute_skill_score(1, j.job_id) AS skill_score,
           ROUND((100.0 * (1.0 - (je.embedding <=> r.embedding)))::numeric, 1) AS semantic_score,
           ROUND((0.6 * compute_skill_score(1, j.job_id) + 0.4 * 100.0 * (1.0 - (je.embedding <=> r.embedding)))::numeric, 2) AS hybrid_score
    FROM jobs j 
    JOIN job_embeddings je USING (job_id), r 
    WHERE j.status = 'open' 
    ORDER BY hybrid_score DESC
    LIMIT 3;
  `);
  console.table(q1.rows);

  console.log('--- Q2: Skill Gap for Candidate 7 on Job 1 ---');
  const q2 = await query(`
    SELECT s.name, js.weight, js.is_mandatory
    FROM job_skills js 
    JOIN skills s ON s.skill_id = js.skill_id
    WHERE js.job_id = 1 
      AND NOT EXISTS (
        SELECT 1 FROM candidate_skills cs 
        WHERE cs.candidate_id = 7 AND cs.skill_id = js.skill_id
      )
    ORDER BY js.is_mandatory DESC, js.weight DESC;
  `);
  console.table(q2.rows);

  console.log('--- Q5: Companies with > 2 Open Jobs ---');
  const q5 = await query(`
    SELECT c.name, COUNT(*) AS open_jobs
    FROM jobs j 
    JOIN companies c ON c.company_id = j.company_id
    WHERE j.status = 'open'
    GROUP BY c.name 
    HAVING COUNT(*) > 2;
  `);
  console.table(q5.rows);

  console.log('--- Q8: Average Days From Applied to Hired ---');
  const q8 = await query(`
    SELECT 
      ROUND(AVG(EXTRACT(EPOCH FROM (h_hired.changed_at - h_app.changed_at)) / 86400.0), 2) AS avg_days_to_hire,
      COUNT(DISTINCT a.application_id) AS hired_count
    FROM applications a
    JOIN application_status_history h_app 
      ON h_app.application_id = a.application_id AND h_app.new_status = 'applied' AND h_app.old_status IS NULL
    JOIN application_status_history h_hired 
      ON h_hired.application_id = a.application_id AND h_hired.new_status = 'hired';
  `);
  console.table(q8.rows);

  process.exit(0);
}

verifyQueries().catch(console.error);
