# CareerLens: User Interface & Demonstration Walkthrough

This guide provides a structured walkthrough of the CareerLens web application, detailing the user interfaces, role flows, and the underlying PostgreSQL features exercised at each step.

---

## 1. Landing Page (`/`)
* **Role:** Public / All Users
* **Features Demonstrated:**
  - System architecture highlights: Option 2 (SQL + Vector database inside PostgreSQL 16).
  - Mathematical formula display: `0.6 × Skill_Score + 0.4 × Semantic_Score`.
  - Quick 1-click evaluator login buttons for both Candidate (Alex Morgan) and Recruiter (Sarah Jenkins).

---

## 2. Job Search & Filtering (`/jobs`)
* **Role:** Public, Candidate, Recruiter
* **DBMS Concepts Exercised:**
  - **Full-Text Search (Q7):** `search_vector @@ plainto_tsquery('english', $1)` ordered by `ts_rank(search_vector, ...) DESC`.
  - **GIN Indexing:** `idx_jobs_search` accelerates text searches across titles and descriptions.
  - **Dynamic SQL Filtering:** Multi-conditional filtering on location, salary minimum (`salary_max >= $1`), and required skills (`EXISTS (SELECT 1 FROM job_skills ...)`).
* **UI Features:**
  - Natural language keyword search box.
  - Real-time location, salary, and skill filter dropdowns.
  - Interactive job cards showing salary range, application deadlines, required skill tags, and mandatory requirement pills.

---

## 3. Job Details & Skill Gap Analysis (`/jobs/[id]`)
* **Role:** Candidate & Recruiter
* **DBMS Concepts Exercised:**
  - **Transactional Application (FR7):** Calls stored procedure `apply_to_job(p_cand, p_job)` within an ACID transaction.
  - **Integrity Validation:** Blocks applications if duplicate (`UNIQUE(candidate_id, job_id)`), if position is closed (`status = 'closed'`), or if deadline has passed (`deadline < CURRENT_DATE`).
  - **Live Skill Gap (Q2):** Correlated `NOT EXISTS` query identifying required skills the candidate lacks, ordering mandatory requirements first.
* **UI Features:**
  - Full job specification with mandatory vs optional skill flags.
  - Candidate Fit card showing real-time Hybrid Score, SQL Skill Overlap %, and pgvector Semantic Match %.
  - Visual Skill Gap breakdown warning candidate about missing mandatory requirements that penalize their score.
  - One-click "Apply to Position" button with immediate transactional status feedback.

---

## 4. AI Hybrid Job Recommendations (`/matches`)
* **Role:** Candidate
* **DBMS Concepts Exercised:**
  - **Hybrid Vector Scoring (Q1):** CTE retrieving candidate's 384-dimensional vector embedding from `resume_embeddings`, calculating cosine distance (`<=>`) against `job_embeddings`, and blending with `compute_skill_score()`.
  - **HNSW Vector Indexes:** `idx_job_emb_hnsw` and `idx_resume_emb_hnsw` enable sub-millisecond nearest-neighbor search.
* **UI Features:**
  - Ranked job cards with position rankings (#1, #2, #3...).
  - Score breakdown badges displaying both deterministic skill overlap and semantic similarity.
  - Instant application status indicator ("Applied").

---

## 5. Candidate Profile & Resume Text (`/profile`)
* **Role:** Candidate
* **DBMS Concepts Exercised:**
  - **DML Operations:** `INSERT`, `UPDATE`, `DELETE` across `candidates` and `candidate_skills`.
  - **Constraint Validation:** Regex check on phone numbers, non-negative experience, proficiency range check (1 to 5).
  - **Real-Time Vector Generation (FR12):** Updating resume text automatically recalculates the 384-dimensional unit vector embedding and updates `resume_embeddings`.
* **UI Features:**
  - Personal information and resume editor.
  - Skill catalogue picker to add new competencies with proficiency rating (1-5) and years of experience.
  - Ability to delete or adjust existing competencies.

---

## 6. Applications & Status Timeline (`/applications`)
* **Role:** Candidate
* **DBMS Concepts Exercised:**
  - **Trigger-Maintained Audit Trail (FR8, FR10):** Displays all rows from `application_status_history` populated by `trg_status_history`.
  - **Transactional Withdrawal:** `DELETE FROM applications WHERE application_id = $1` cascades to clean history entries.
* **UI Features:**
  - Application cards with match scores and status pills (`applied`, `screening`, `interview`, `offer`, `hired`, `rejected`).
  - Interactive audit timeline stepper displaying each transition timestamp and stage progression.
  - Application withdrawal button.

---

## 7. Recruiter Job Management (`/recruiter/jobs`)
* **Role:** Recruiter
* **DBMS Concepts Exercised:**
  - **Atomic Multi-Table Insertion:** Transaction creating job row and multiple `job_skills` rows.
  - **Trigger Validation (T6):** `trg_job_deadline` rejects past deadlines with error code `check_violation`.
  - **Cascade Deletion (T15):** Deleting a job posting cascades to remove `job_skills`, `applications`, and `job_embeddings`.
* **UI Features:**
  - Table of active postings owned by recruiter.
  - "Post New Job" modal with interactive skill picker (weights 1-5 and mandatory toggle).
  - Open/Closed status toggle button.
  - Delete posting button with confirmation.

---

## 8. Ranked Applicants & Pipeline Transitions (`/recruiter/jobs/[id]/applicants`)
* **Role:** Recruiter
* **DBMS Concepts Exercised:**
  - **Analytical View (Q3):** Queries `v_ranked_applicants` utilizing window function `DENSE_RANK() OVER (PARTITION BY a.job_id ORDER BY a.match_score DESC NULLS LAST)`.
  - **Pipeline Trigger (FR10, T10):** Updating candidate status executes `log_status_change()`, appending a new immutable record into `application_status_history`.
* **UI Features:**
  - Ranked applicant list (#1, #2...) with hybrid match scores.
  - Full candidate contact details, experience, and education.
  - Interactive status dropdown (`applied` -> `screening` -> `interview` -> `offer` -> `hired` -> `rejected`).
  - Live notification verifying trigger execution and history row ID.

---

## 9. Recruiter Funnel Analytics Dashboard (`/recruiter/dashboard`)
* **Role:** Recruiter
* **DBMS Concepts Exercised:**
  - **Analytical Aggregation (Q4):** `v_job_funnel` aggregating pipeline metrics using `COUNT(...) FILTER (WHERE ...)` in a single query pass.
  - **Conversion Rate Arithmetic:** `ROUND(100.0 * hires / total, 2)`.
* **UI Features:**
  - KPI overview cards: Total Postings, Active Candidates, Offers, Successful Hires.
  - Visual conversion funnel bar charts demonstrating attrition across pipeline stages.
  - Per-job breakdown table with stage counts and hire conversion percentages.
