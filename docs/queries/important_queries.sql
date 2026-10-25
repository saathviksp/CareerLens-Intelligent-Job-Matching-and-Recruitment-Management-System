-- ============================================================================
-- CareerLens: Important Queries Demonstration (Q1 - Q8)
-- DBMS Experiential Learning - Level 3
-- PES University - Department of Computer Science and Engineering
-- ============================================================================

-- ============================================================================
-- Q1: Ranked Jobs for Candidate (Hybrid: 60% Skills Overlap + 40% Semantic Vector Similarity)
-- Concepts Demonstrated: Common Table Expressions (CTE), pgvector cosine operator (<=>),
-- Stored Function Invocation, Mathematical Blending, ORDER BY DESC, LIMIT.
-- ============================================================================
WITH r AS (
    SELECT embedding 
    FROM resume_embeddings 
    WHERE candidate_id = 1
)
SELECT 
    j.job_id,
    j.title,
    c.name AS company_name,
    j.location,
    j.salary_min,
    j.salary_max,
    compute_skill_score(1, j.job_id) AS skill_score,
    ROUND((100.0 * (1.0 - (je.embedding <=> r.embedding)))::numeric, 2) AS semantic_score,
    ROUND(
        (0.6 * compute_skill_score(1, j.job_id) + 
         0.4 * 100.0 * (1.0 - (je.embedding <=> r.embedding)))::numeric, 
        2
    ) AS hybrid_score
FROM jobs j
JOIN companies c ON c.company_id = j.company_id
JOIN job_embeddings je USING (job_id), r
WHERE j.status = 'open'
ORDER BY hybrid_score DESC
LIMIT 10;


-- ============================================================================
-- Q2: Skill Gap Analysis: Required Skills the Candidate Lacks, Ordered by Importance
-- Concepts Demonstrated: Correlated Subquery with NOT EXISTS, JOIN, Multi-level ORDER BY.
-- Shows candidate exactly which mandatory and optional requirements they must acquire.
-- ============================================================================
SELECT 
    s.name AS missing_skill,
    s.category,
    js.weight,
    js.is_mandatory,
    CASE 
        WHEN js.is_mandatory THEN 'CRITICAL (Score halved if missing)' 
        ELSE 'RECOMMENDED' 
    END AS priority_level
FROM job_skills js 
JOIN skills s ON s.skill_id = js.skill_id
WHERE js.job_id = 1
  AND NOT EXISTS (
      SELECT 1 
      FROM candidate_skills cs
      WHERE cs.candidate_id = 7 
        AND cs.skill_id = js.skill_id
  )
ORDER BY js.is_mandatory DESC, js.weight DESC;


-- ============================================================================
-- Q3: Ranked Applicants for a Job (From View v_ranked_applicants)
-- Concepts Demonstrated: Database View, DENSE_RANK() Window Function, Filtered Output.
-- ============================================================================
SELECT 
    applicant_rank,
    candidate_name,
    candidate_email,
    candidate_phone,
    years_experience,
    match_score,
    status,
    applied_at
FROM v_ranked_applicants
WHERE job_id = 1
ORDER BY applicant_rank ASC;


-- ============================================================================
-- Q4: Recruiter Funnel: Applications Per Status Per Job with Conversion Metrics
-- Concepts Demonstrated: View Querying, Aggregation, FILTER (WHERE ...) Clauses.
-- ============================================================================
SELECT 
    job_id,
    title,
    job_status,
    total_applications,
    count_applied,
    count_screening,
    count_interview,
    count_offer,
    count_hired,
    count_rejected,
    hire_conversion_rate || '%' AS hire_rate
FROM v_job_funnel
WHERE recruiter_id = 1
ORDER BY total_applications DESC;


-- ============================================================================
-- Q5: Companies with More Than 2 Open Jobs
-- Concepts Demonstrated: GROUP BY, HAVING Clause, Aggregates.
-- ============================================================================
SELECT 
    c.company_id,
    c.name AS company_name,
    c.industry,
    COUNT(j.job_id) AS open_jobs_count
FROM jobs j 
JOIN companies c ON c.company_id = j.company_id
WHERE j.status = 'open'
GROUP BY c.company_id, c.name, c.industry
HAVING COUNT(j.job_id) > 2 
ORDER BY open_jobs_count DESC;


-- ============================================================================
-- Q6: Jobs Paying Above the Platform Average Salary
-- Concepts Demonstrated: Scalar Subquery, Aggregate Function (AVG), Salary Ordering.
-- ============================================================================
SELECT 
    j.job_id,
    j.title,
    c.name AS company_name,
    j.salary_min,
    j.salary_max,
    ROUND((SELECT AVG(salary_max) FROM jobs)::numeric, 2) AS platform_avg_salary_max,
    j.salary_max - ROUND((SELECT AVG(salary_max) FROM jobs)::numeric, 0) AS premium_above_avg
FROM jobs j
JOIN companies c ON c.company_id = j.company_id
WHERE j.salary_max > (SELECT AVG(salary_max) FROM jobs)
ORDER BY j.salary_max DESC;


-- ============================================================================
-- Q7: Full-Text Job Search with Natural Language Rank
-- Concepts Demonstrated: tsvector, plainto_tsquery, GIN Index Search, ts_rank Ordering.
-- ============================================================================
SELECT 
    j.job_id,
    j.title,
    c.name AS company_name,
    j.location,
    ROUND(ts_rank(j.search_vector, plainto_tsquery('english', 'react typescript frontend'))::numeric, 4) AS relevance_rank
FROM jobs j
JOIN companies c ON c.company_id = j.company_id
WHERE j.search_vector @@ plainto_tsquery('english', 'react typescript frontend')
ORDER BY relevance_rank DESC;


-- ============================================================================
-- Q8: Average Days Elapsed from Application to Hire
-- Concepts Demonstrated: Self-Join on History Table, Date Arithmetic, EPOCH Extraction, AVG.
-- ============================================================================
SELECT 
    ROUND(AVG(EXTRACT(EPOCH FROM (h_hired.changed_at - h_app.changed_at)) / 86400.0), 2) AS avg_days_to_hire,
    COUNT(DISTINCT a.application_id) AS total_hired_applications_measured
FROM applications a
JOIN application_status_history h_app 
  ON h_app.application_id = a.application_id 
 AND h_app.new_status = 'applied' 
 AND h_app.old_status IS NULL
JOIN application_status_history h_hired 
  ON h_hired.application_id = a.application_id 
 AND h_hired.new_status = 'hired';
