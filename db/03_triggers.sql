-- ============================================================================
-- CareerLens: Database Triggers
-- Job, Skill and Recruitment Management System
-- DBMS Experiential Learning - Level 3
-- ============================================================================

-- 1. Audit Trigger: Logs Every Application Status Transition
-- Fires AFTER UPDATE on applications whenever status changes.
CREATE OR REPLACE FUNCTION log_status_change() 
RETURNS trigger AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO application_status_history(application_id, old_status, new_status, changed_at)
        VALUES (NEW.application_id, OLD.status, NEW.status, clock_timestamp());
    END IF;
    RETURN NEW;
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_status_history ON applications;
CREATE TRIGGER trg_status_history 
AFTER UPDATE ON applications
FOR EACH ROW 
EXECUTE FUNCTION log_status_change();

-- 2. Validation Trigger: Rejects Job Postings with Past Deadlines
-- Fires BEFORE INSERT or UPDATE on jobs.
CREATE OR REPLACE FUNCTION check_job_deadline() 
RETURNS trigger AS $$
BEGIN
    IF NEW.deadline < CURRENT_DATE THEN
        RAISE EXCEPTION 'Job deadline (%) cannot be in the past (Current date: %)', NEW.deadline, CURRENT_DATE
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_deadline ON jobs;
CREATE TRIGGER trg_job_deadline 
BEFORE INSERT OR UPDATE ON jobs
FOR EACH ROW 
EXECUTE FUNCTION check_job_deadline();

-- 3. Automatic updated_at timestamp trigger for candidates
CREATE OR REPLACE FUNCTION set_candidate_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at := clock_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_candidates_updated_at ON candidates;
CREATE TRIGGER trg_candidates_updated_at
BEFORE UPDATE ON candidates
FOR EACH ROW
EXECUTE FUNCTION set_candidate_updated_at();
