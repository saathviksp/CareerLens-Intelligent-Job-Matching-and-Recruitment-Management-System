-- ============================================================================
-- CareerLens: Database Schema DDL
-- Job, Skill and Recruitment Management System
-- DBMS Experiential Learning - Level 3
-- ============================================================================

-- 1. Enable Vector Extension (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Enumerated Types
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('candidate', 'recruiter');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM ('open', 'closed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_status') THEN
        CREATE TYPE app_status AS ENUM ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected');
    END IF;
END $$;

-- 3. Users Table (Authentication Identity & Role)
CREATE TABLE IF NOT EXISTS users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email LIKE '%_@_%._%'),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Companies Table (Recruiting Organizations)
CREATE TABLE IF NOT EXISTS companies (
    company_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    industry VARCHAR(100),
    location VARCHAR(100),
    website VARCHAR(200)
);

-- 5. Candidates Table (Candidate Profiles)
CREATE TABLE IF NOT EXISTS candidates (
    candidate_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(15) CHECK (phone ~ '^[0-9+ -]{7,15}$'),
    location VARCHAR(100),
    education VARCHAR(150),
    years_experience NUMERIC(3,1) DEFAULT 0 CHECK (years_experience >= 0),
    summary TEXT,
    resume_text TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Recruiters Table (Recruiter Profiles linked to Company)
CREATE TABLE IF NOT EXISTS recruiters (
    recruiter_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    company_id INT NOT NULL REFERENCES companies(company_id) ON DELETE RESTRICT,
    full_name VARCHAR(120) NOT NULL,
    designation VARCHAR(80)
);

-- 7. Skills Table (Catalog of Seeded Skills)
CREATE TABLE IF NOT EXISTS skills (
    skill_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(80) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL
);

-- 8. Candidate Skills Junction Table (M:N Candidate <-> Skill)
CREATE TABLE IF NOT EXISTS candidate_skills (
    candidate_id INT NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skills(skill_id),
    proficiency SMALLINT NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
    years_used NUMERIC(3,1) DEFAULT 0 CHECK (years_used >= 0),
    PRIMARY KEY (candidate_id, skill_id)
);

-- 9. Jobs Table (Job Postings)
CREATE TABLE IF NOT EXISTS jobs (
    job_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recruiter_id INT NOT NULL REFERENCES recruiters(recruiter_id),
    company_id INT NOT NULL REFERENCES companies(company_id),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(100),
    salary_min INT,
    salary_max INT,
    openings SMALLINT DEFAULT 1 CHECK (openings > 0),
    deadline DATE NOT NULL,
    status job_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_salary_range CHECK (salary_min >= 0 AND salary_min <= salary_max)
);

-- Demonstration of ALTER TABLE to add full-text generated search_vector column
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE jobs ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || description)) STORED;
    END IF;
END $$;

-- 10. Job Skills Junction Table (M:N Job <-> Required Skills with weights)
CREATE TABLE IF NOT EXISTS job_skills (
    job_id INT NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skills(skill_id),
    weight SMALLINT NOT NULL CHECK (weight BETWEEN 1 AND 5),
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (job_id, skill_id)
);

-- 11. Applications Table (M:N Candidate <-> Job Applications)
CREATE TABLE IF NOT EXISTS applications (
    application_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    job_id INT NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    status app_status NOT NULL DEFAULT 'applied',
    match_score NUMERIC(5,2) CHECK (match_score >= 0 AND match_score <= 100),
    applied_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_candidate_job UNIQUE (candidate_id, job_id)
);

-- 12. Application Status History Table (1:N Audit Trail)
CREATE TABLE IF NOT EXISTS application_status_history (
    history_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    application_id INT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    old_status app_status,
    new_status app_status NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Resume Embeddings Table (Vector Embeddings 384 dimensions)
CREATE TABLE IF NOT EXISTS resume_embeddings (
    candidate_id INT PRIMARY KEY REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    embedding vector(384) NOT NULL,
    model_name VARCHAR(60) DEFAULT 'all-MiniLM-L6-v2',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Job Embeddings Table (Vector Embeddings 384 dimensions)
CREATE TABLE IF NOT EXISTS job_embeddings (
    job_id INT PRIMARY KEY REFERENCES jobs(job_id) ON DELETE CASCADE,
    embedding vector(384) NOT NULL,
    model_name VARCHAR(60) DEFAULT 'all-MiniLM-L6-v2',
    updated_at TIMESTAMPTZ DEFAULT now()
);
