-- ============================================================================
-- CareerLens: Stored Functions and Procedures
-- Job, Skill and Recruitment Management System
-- DBMS Experiential Learning - Level 3
-- ============================================================================

-- 1. Skill Score Function: Weighted overlap of job skills the candidate has (0-100)
-- If any mandatory skill is missing, the score is halved (multiplied by 0.5)
CREATE OR REPLACE FUNCTION compute_skill_score(p_cand INT, p_job INT) 
RETURNS NUMERIC AS $$
    SELECT COALESCE(ROUND(
        100.0 * SUM(js.weight) FILTER (WHERE cs.skill_id IS NOT NULL) / NULLIF(SUM(js.weight), 0)
        * CASE WHEN BOOL_OR(js.is_mandatory AND cs.skill_id IS NULL) THEN 0.5 ELSE 1 END, 2), 0)
    FROM job_skills js
    LEFT JOIN candidate_skills cs ON cs.skill_id = js.skill_id AND cs.candidate_id = p_cand
    WHERE js.job_id = p_job;
$$ LANGUAGE sql STABLE;

-- 2. Hybrid Match Score Function: Blends 60% SQL skill score + 40% pgvector semantic score
CREATE OR REPLACE FUNCTION compute_hybrid_score(p_cand INT, p_job INT) 
RETURNS NUMERIC AS $$
DECLARE
    v_skill_score NUMERIC;
    v_sem_score NUMERIC;
    v_res_emb vector(384);
    v_job_emb vector(384);
    v_dist FLOAT8;
BEGIN
    v_skill_score := compute_skill_score(p_cand, p_job);
    
    SELECT embedding INTO v_res_emb FROM resume_embeddings WHERE candidate_id = p_cand;
    SELECT embedding INTO v_job_emb FROM job_embeddings WHERE job_id = p_job;
    
    IF v_res_emb IS NOT NULL AND v_job_emb IS NOT NULL THEN
        -- Cosine distance operator <=>
        v_dist := v_job_emb <=> v_res_emb;
        v_sem_score := GREATEST(0.0, LEAST(100.0, 100.0 * (1.0 - v_dist)));
        RETURN ROUND(0.6 * v_skill_score + 0.4 * v_sem_score, 2);
    ELSE
        RETURN v_skill_score;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Transactional Application Procedure/Function: apply_to_job
-- Checks that job is open and deadline has not passed.
-- Computes the candidate's match score.
-- Inserts application and initial history record atomically.
-- Rolls back on any failure (duplicate, closed job, past deadline).
CREATE OR REPLACE FUNCTION apply_to_job(p_cand INT, p_job INT)
RETURNS TABLE (
    application_id INT,
    candidate_id INT,
    job_id INT,
    status app_status,
    match_score NUMERIC,
    applied_at TIMESTAMPTZ
) AS $$
DECLARE
    v_job_status job_status;
    v_deadline DATE;
    v_score NUMERIC;
    v_app_id INT;
    v_applied_at TIMESTAMPTZ;
BEGIN
    -- 1. Validate Job Existence, Status, and Deadline
    SELECT j.status, j.deadline INTO v_job_status, v_deadline
    FROM jobs j
    WHERE j.job_id = p_job;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job ID % does not exist', p_job USING ERRCODE = 'data_exception';
    END IF;

    IF v_job_status <> 'open' THEN
        RAISE EXCEPTION 'Job % is not open for applications (current status: %)', p_job, v_job_status USING ERRCODE = 'check_violation';
    END IF;

    IF v_deadline < CURRENT_DATE THEN
        RAISE EXCEPTION 'Job % application deadline (%) has already passed', p_job, v_deadline USING ERRCODE = 'check_violation';
    END IF;

    -- 2. Verify Candidate Exists
    IF NOT EXISTS (SELECT 1 FROM candidates WHERE candidates.candidate_id = p_cand) THEN
        RAISE EXCEPTION 'Candidate ID % does not exist', p_cand USING ERRCODE = 'data_exception';
    END IF;

    -- 3. Check for Duplicate Application
    IF EXISTS (SELECT 1 FROM applications a WHERE a.candidate_id = p_cand AND a.job_id = p_job) THEN
        RAISE EXCEPTION 'Candidate % has already applied to job %', p_cand, p_job USING ERRCODE = 'unique_violation';
    END IF;

    -- 4. Compute Match Score
    v_score := compute_hybrid_score(p_cand, p_job);
    v_applied_at := clock_timestamp();

    -- 5. Insert Application
    INSERT INTO applications (candidate_id, job_id, status, match_score, applied_at)
    VALUES (p_cand, p_job, 'applied', v_score, v_applied_at)
    RETURNING applications.application_id INTO v_app_id;

    -- 6. Insert Initial History Row
    INSERT INTO application_status_history (application_id, old_status, new_status, changed_at)
    VALUES (v_app_id, NULL, 'applied', v_applied_at);

    RETURN QUERY
    SELECT v_app_id, p_cand, p_job, 'applied'::app_status, v_score, v_applied_at;
END;
$$ LANGUAGE plpgsql;
