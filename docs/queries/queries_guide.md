# CareerLens: Database Operations (DML) & Important Queries Guide

This guide details the core queries demonstrated in CareerLens, mapping them to the advanced DBMS concepts required for Level 3 evaluation.

---

## Query Index

| Query ID | Purpose | Core Concepts Demonstrated | Output Summary |
|:---|:---|:---|:---|
| **Q1** | Ranked jobs for candidate (hybrid score) | CTE, vector cosine distance (`<=>`), function call, mathematical blending, ORDER BY, LIMIT | Top 10 jobs ranked by 60% SQL skill overlap + 40% pgvector semantic score |
| **Q2** | Skill gap analysis (missing skills) | Correlated subquery (`NOT EXISTS`), JOIN, composite ordering by weight & mandatory flag | Identifies missing skills with priority classification |
| **Q3** | Ranked applicants for a job | Database View (`v_ranked_applicants`), `DENSE_RANK()` window function | Recruiter view of candidates ranked by match score |
| **Q4** | Recruiter hiring funnel analytics | Database View (`v_job_funnel`), aggregate metrics, `FILTER (WHERE ...)` | Pipeline distribution and hire conversion rate per job |
| **Q5** | Companies with more than 2 open jobs | `GROUP BY`, `HAVING COUNT(*) > 2` | Filters aggregate groups meeting threshold |
| **Q6** | Jobs paying above the platform average salary | Scalar Subquery, `AVG()` aggregate | Returns top-paying jobs and salary premium above platform average |
| **Q7** | Full-text job search with rank | `tsvector`, `plainto_tsquery`, `ts_rank` ordering, GIN index | Natural language keyword search ranked by linguistic relevance |
| **Q8** | Average days from application to hire | Self-join on status history, timestamp date arithmetic, `EXTRACT(EPOCH)` | Calculates turnaround cycle time across hiring pipeline |

---

## Detailed Query Implementations

### Q1: Ranked Jobs for Candidate (Hybrid Match)
```sql
WITH r AS (
    SELECT embedding 
    FROM resume_embeddings 
    WHERE candidate_id = $1
)
SELECT 
    j.job_id,
    j.title,
    c.name AS company_name,
    j.location,
    j.salary_min,
    j.salary_max,
    compute_skill_score($1, j.job_id) AS skill_score,
    ROUND((100.0 * (1.0 - (je.embedding <=> r.embedding)))::numeric, 2) AS semantic_score,
    ROUND(
        (0.6 * compute_skill_score($1, j.job_id) + 
         0.4 * 100.0 * (1.0 - (je.embedding <=> r.embedding)))::numeric, 
        2
    ) AS hybrid_score
FROM jobs j
JOIN companies c ON c.company_id = j.company_id
JOIN job_embeddings je USING (job_id), r
WHERE j.status = 'open'
ORDER BY hybrid_score DESC
LIMIT 10;
```
* **Explanation:** Solves the core problem statement: candidates describe abilities in natural language while jobs require specific technologies. By combining the deterministic SQL skill score (from stored function `compute_skill_score`) with pgvector semantic similarity (`<=>`), candidates see positions where they excel in both concrete skills and overall context.

---

### Q2: Skill Gap Analysis
```sql
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
WHERE js.job_id = $2
  AND NOT EXISTS (
      SELECT 1 
      FROM candidate_skills cs
      WHERE cs.candidate_id = $1 
        AND cs.skill_id = js.skill_id
  )
ORDER BY js.is_mandatory DESC, js.weight DESC;
```
* **Explanation:** Uses a correlated `NOT EXISTS` subquery to isolate skills present in `job_skills` that do not appear in the candidate's verified profile. Prioritizes mandatory skills first so the candidate understands why their match score was penalized.

---

### Q3: Ranked Applicants for a Job
```sql
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
WHERE job_id = $1
ORDER BY applicant_rank ASC;
```
* **Explanation:** Queries the analytical view `v_ranked_applicants`, which encapsulates the window function `DENSE_RANK() OVER (PARTITION BY a.job_id ORDER BY a.match_score DESC NULLS LAST, a.applied_at ASC)`.

---

### Q4: Recruiter Funnel Analytics
```sql
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
WHERE recruiter_id = $1
ORDER BY total_applications DESC;
```
* **Explanation:** Demonstrates high-performance aggregate pivoting using `COUNT(...) FILTER (WHERE ...)` to compute a complete recruitment funnel in a single pass without expensive sub-selects.

---

### Q5: Companies with More Than 2 Open Jobs
```sql
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
```
* **Explanation:** Groups jobs by hiring company and applies a `HAVING` condition to filter organizations with active bulk recruitment pipelines.

---

### Q6: Jobs Paying Above the Platform Average Salary
```sql
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
```
* **Explanation:** Uses a scalar subquery in the `WHERE` clause to dynamically compare each posting's upper salary range against the overall platform average.

---

### Q7: Full-Text Job Search with Natural Language Rank
```sql
SELECT 
    j.job_id,
    j.title,
    c.name AS company_name,
    j.location,
    ROUND(ts_rank(j.search_vector, plainto_tsquery('english', $1))::numeric, 4) AS relevance_rank
FROM jobs j
JOIN companies c ON c.company_id = j.company_id
WHERE j.search_vector @@ plainto_tsquery('english', $1)
ORDER BY relevance_rank DESC;
```
* **Explanation:** Exploits PostgreSQL's GIN-indexed `tsvector` generated column (`search_vector`) and English natural language stemming parser (`plainto_tsquery`) to return keyword-relevant job postings ranked by BM25-like relevance scoring (`ts_rank`).

---

### Q8: Average Days from Application to Hire
```sql
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
```
* **Explanation:** Performs an analytical self-join on the trigger-maintained `application_status_history` table to calculate the exact duration elapsed from the initial `'applied'` audit timestamp to the `'hired'` status transition.
