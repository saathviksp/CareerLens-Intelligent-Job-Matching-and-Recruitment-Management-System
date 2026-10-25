-- ============================================================================
-- CareerLens: Database Views
-- Job, Skill and Recruitment Management System
-- DBMS Experiential Learning - Level 3
-- ============================================================================

-- 1. Recruiter Funnel Analytics View (v_job_funnel)
-- Summarizes applicant pipeline per job with stage counts and hire conversion rates.
CREATE OR REPLACE VIEW v_job_funnel AS
SELECT 
    j.job_id,
    j.recruiter_id,
    j.company_id,
    c.name AS company_name,
    j.title,
    j.status AS job_status,
    j.openings,
    j.deadline,
    COUNT(a.application_id) AS total_applications,
    COUNT(a.application_id) FILTER (WHERE a.status = 'applied') AS count_applied,
    COUNT(a.application_id) FILTER (WHERE a.status = 'screening') AS count_screening,
    COUNT(a.application_id) FILTER (WHERE a.status = 'interview') AS count_interview,
    COUNT(a.application_id) FILTER (WHERE a.status = 'offer') AS count_offer,
    COUNT(a.application_id) FILTER (WHERE a.status = 'hired') AS count_hired,
    COUNT(a.application_id) FILTER (WHERE a.status = 'rejected') AS count_rejected,
    ROUND(
        100.0 * COUNT(a.application_id) FILTER (WHERE a.status = 'hired') / 
        NULLIF(COUNT(a.application_id), 0), 
        2
    ) AS hire_conversion_rate
FROM jobs j
JOIN companies c ON c.company_id = j.company_id
LEFT JOIN applications a ON a.job_id = j.job_id
GROUP BY j.job_id, j.recruiter_id, j.company_id, c.name, j.title, j.status, j.openings, j.deadline;

-- 2. Ranked Applicants View (v_ranked_applicants)
-- Ranks applicants per job by match score and submission time for recruiter review.
CREATE OR REPLACE VIEW v_ranked_applicants AS
SELECT 
    a.application_id,
    a.job_id,
    j.recruiter_id,
    j.title AS job_title,
    a.candidate_id,
    cand.full_name AS candidate_name,
    u.email AS candidate_email,
    cand.phone AS candidate_phone,
    cand.location AS candidate_location,
    cand.years_experience,
    cand.education,
    a.status,
    a.match_score,
    a.applied_at,
    DENSE_RANK() OVER (
        PARTITION BY a.job_id 
        ORDER BY a.match_score DESC NULLS LAST, a.applied_at ASC
    ) AS applicant_rank
FROM applications a
JOIN candidates cand ON cand.candidate_id = a.candidate_id
JOIN users u ON u.user_id = cand.user_id
JOIN jobs j ON j.job_id = a.job_id;
