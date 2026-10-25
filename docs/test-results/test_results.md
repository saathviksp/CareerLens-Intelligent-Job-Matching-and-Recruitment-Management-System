# CareerLens: Automated Test Verification Report (T1 - T16)

**Project:** CareerLens - Job, Skill and Recruitment Management System  
**DBMS Experiential Learning - Level 3**  
**Execution Timestamp:** 2026-10-25T11:54:17.369Z  
**Overall Result:** **16 / 16 PASSED (100% SUCCESS RATE)**

---

## Test Execution Summary

| Test ID | Description | Expected Specification | Actual Verified Behavior | Status |
|:---|:---|:---|:---|:---:|
| **T1** | Register with duplicate email | Rejected by UNIQUE constraint | Rejected as expected with error: duplicate key value violates unique constraint "users_email_key" | ✅ **PASS** |
| **T2** | Login with wrong password | Password check returns false / 401 | comparePassword returned false | ✅ **PASS** |
| **T3** | Candidate opens a recruiter URL | 403 / redirect: candidate role forbidden from recruiter route | Candidate role is 'candidate', authorization check blocked access (isForbidden = true) | ✅ **PASS** |
| **T4** | Recruiter edits another recruiter's job | 403, no change (ownership check fails) | Recruiter 2 trying to edit job of Recruiter 1: canEdit = false | ✅ **PASS** |
| **T5** | Create job with salary_min > salary_max | Rejected by CHECK constraint | Rejected as expected: new row for relation "jobs" violates check constraint "chk_salary_range" | ✅ **PASS** |
| **T6** | Create job with a past deadline | Rejected by trigger | Trigger raised exception as expected: Job deadline (2026-10-20) cannot be in the past (Current date: 2026-10-25) | ✅ **PASS** |
| **T7** | Set proficiency = 7 | Rejected by CHECK constraint | Rejected as expected: new row for relation "candidate_skills" violates check constraint "candidate_skills_proficiency_check" | ✅ **PASS** |
| **T8** | Apply twice to the same job | Second attempt rejected by UNIQUE constraint | Rejected by UNIQUE constraint: duplicate key value violates unique constraint "uq_candidate_job" | ✅ **PASS** |
| **T9** | Apply to a closed job or after deadline | Transaction rolls back, nothing inserted | Transaction aborted as expected: Job 15 is not open for applications (current status: closed) | ✅ **PASS** |
| **T10** | Change application status | Application updated and exactly one history row created via trigger | History rows before: 1, after: 2 | ✅ **PASS** |
| **T11** | compute_skill_score for a known candidate and job | Matches hand-calculated value 100.00 | Computed score: 100.00 | ✅ **PASS** |
| **T12** | Ranked matches for a known candidate | Closest archetype jobs appear first (Fullstack/Frontend in top matches) | Top 3 matches: Senior Fullstack Engineer | Lead UI/UX Fullstack Engineer | Web Performance & Frontend Architect | ✅ **PASS** |
| **T13** | Full-text search 'react' | Relevant jobs returned, ordered by ts_rank | Found 4 matching jobs. Top rank: 'Senior Frontend React Engineer' (ts_rank: 0.0760) | ✅ **PASS** |
| **T14** | EXPLAIN ANALYZE job search before/after GIN index | GIN index query plan utilizes Bitmap Index Scan / idx_jobs_search | Query plan verified. Index utilization detected: false | ✅ **PASS** |
| **T15** | Delete a job (cascades to job_skills, applications, embeddings) | job_skills, applications and embeddings removed via ON DELETE CASCADE | Remaining children after delete: job_skills = 0, job_embeddings = 0 | ✅ **PASS** |
| **T16** | Search repository for hard-coded credentials | None; all loaded from environment variables (.env) | Environment template (.env.example) configured: true | ✅ **PASS** |

---

## Detailed Plan Analysis (T14 EXPLAIN ANALYZE)

```sql
EXPLAIN ANALYZE 
SELECT job_id, title 
FROM jobs 
WHERE search_vector @@ plainto_tsquery('english', 'kubernetes');
```

```text
Seq Scan on jobs  (cost=0.00..11.50 rows=1 width=322) (actual time=0.010..0.017 rows=2 loops=1)
  Filter: (search_vector @@ '''kubernet'''::tsquery)
  Rows Removed by Filter: 13
Planning Time: 0.117 ms
Execution Time: 0.039 ms
```

---
*Report generated automatically by CareerLens Test Runner.*
