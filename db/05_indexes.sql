-- ============================================================================
-- CareerLens: Database Indexes
-- Job, Skill and Recruitment Management System
-- DBMS Experiential Learning - Level 3
-- ============================================================================

-- 1. Full-Text Search Index (GIN)
CREATE INDEX IF NOT EXISTS idx_jobs_search 
ON jobs USING GIN (search_vector);

-- 2. Composite Filter Index for Recruiter Pipeline Queries
CREATE INDEX IF NOT EXISTS idx_apps_job_status 
ON applications (job_id, status);

-- 3. Foreign Key & Lookup Indexes (B-Tree)
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter 
ON jobs (recruiter_id);

CREATE INDEX IF NOT EXISTS idx_jobs_company 
ON jobs (company_id);

CREATE INDEX IF NOT EXISTS idx_jobs_status 
ON jobs (status);

CREATE INDEX IF NOT EXISTS idx_candidates_user 
ON candidates (user_id);

CREATE INDEX IF NOT EXISTS idx_recruiters_user 
ON recruiters (user_id);

CREATE INDEX IF NOT EXISTS idx_candidate_skills_cand 
ON candidate_skills (candidate_id);

CREATE INDEX IF NOT EXISTS idx_job_skills_job 
ON job_skills (job_id);

CREATE INDEX IF NOT EXISTS idx_apps_candidate 
ON applications (candidate_id);

CREATE INDEX IF NOT EXISTS idx_history_app 
ON application_status_history (application_id);

-- 4. HNSW Vector Indexes for Fast Cosine Similarity Search (pgvector)
CREATE INDEX IF NOT EXISTS idx_job_emb_hnsw 
ON job_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_resume_emb_hnsw 
ON resume_embeddings USING hnsw (embedding vector_cosine_ops);
