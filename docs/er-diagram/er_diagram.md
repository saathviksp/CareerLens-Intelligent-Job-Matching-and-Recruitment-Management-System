# CareerLens: Entity-Relationship (ER) Diagram & Schema Documentation

## 1. Overview
CareerLens uses a relational PostgreSQL 16 schema augmented with `pgvector` for high-dimensional vector embeddings. The schema is normalized into Third Normal Form (3NF), resolving many-to-many relationships through junction tables and guaranteeing data integrity at the database engine level.

## 2. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o| CANDIDATES : "1:1 user_id"
    USERS ||--o| RECRUITERS : "1:1 user_id"
    COMPANIES ||--o{ RECRUITERS : "1:N company_id"
    COMPANIES ||--o{ JOBS : "1:N company_id"
    RECRUITERS ||--o{ JOBS : "1:N recruiter_id"
    
    CANDIDATES ||--o| RESUME_EMBEDDINGS : "1:1 candidate_id"
    JOBS ||--o| JOB_EMBEDDINGS : "1:1 job_id"
    
    CANDIDATES ||--o{ CANDIDATE_SKILLS : "1:N candidate_id"
    SKILLS ||--o{ CANDIDATE_SKILLS : "1:N skill_id"
    
    JOBS ||--o{ JOB_SKILLS : "1:N job_id"
    SKILLS ||--o{ JOB_SKILLS : "1:N skill_id"
    
    CANDIDATES ||--o{ APPLICATIONS : "1:N candidate_id"
    JOBS ||--o{ APPLICATIONS : "1:N job_id"
    
    APPLICATIONS ||--o{ APPLICATION_STATUS_HISTORY : "1:N application_id"

    USERS {
        int user_id PK "Identity"
        varchar email UK "Validated format"
        varchar password_hash "Bcrypt"
        user_role role "candidate | recruiter"
        timestamptz created_at
    }

    COMPANIES {
        int company_id PK "Identity"
        varchar name UK
        varchar industry
        varchar location
        varchar website
    }

    CANDIDATES {
        int candidate_id PK "Identity"
        int user_id FK,UK "ON DELETE CASCADE"
        varchar full_name
        varchar phone "Regex CHECK"
        varchar location
        varchar education
        numeric years_experience ">= 0"
        text summary
        text resume_text "Source for embedding"
        timestamptz updated_at
    }

    RECRUITERS {
        int recruiter_id PK "Identity"
        int user_id FK,UK "ON DELETE CASCADE"
        int company_id FK "ON DELETE RESTRICT"
        varchar full_name
        varchar designation
    }

    SKILLS {
        int skill_id PK "Identity"
        varchar name UK
        varchar category "Web, Data, DevOps, Database, Soft"
    }

    CANDIDATE_SKILLS {
        int candidate_id PK,FK "ON DELETE CASCADE"
        int skill_id PK,FK
        smallint proficiency "CHECK 1 to 5"
        numeric years_used "CHECK >= 0"
    }

    JOBS {
        int job_id PK "Identity"
        int recruiter_id FK
        int company_id FK
        varchar title
        text description
        varchar location
        int salary_min "CHECK <= salary_max"
        int salary_max "CHECK >= 0"
        smallint openings "CHECK > 0"
        date deadline "Trigger >= CURRENT_DATE"
        job_status status "open | closed"
        tsvector search_vector "Generated English FTS"
        timestamptz created_at
    }

    JOB_SKILLS {
        int job_id PK,FK "ON DELETE CASCADE"
        int skill_id PK,FK
        smallint weight "CHECK 1 to 5"
        boolean is_mandatory "DEFAULT false"
    }

    APPLICATIONS {
        int application_id PK "Identity"
        int candidate_id FK "ON DELETE CASCADE"
        int job_id FK "ON DELETE CASCADE"
        app_status status "applied, screening, interview, offer, hired, rejected"
        numeric match_score "CHECK 0 to 100"
        timestamptz applied_at
    }

    APPLICATION_STATUS_HISTORY {
        int history_id PK "Identity"
        int application_id FK "ON DELETE CASCADE"
        app_status old_status "NULL on initial apply"
        app_status new_status "NOT NULL"
        timestamptz changed_at
    }

    RESUME_EMBEDDINGS {
        int candidate_id PK,FK "ON DELETE CASCADE"
        vector embedding "vector(384) HNSW"
        varchar model_name "all-MiniLM-L6-v2"
        timestamptz updated_at
    }

    JOB_EMBEDDINGS {
        int job_id PK,FK "ON DELETE CASCADE"
        vector embedding "vector(384) HNSW"
        varchar model_name "all-MiniLM-L6-v2"
        timestamptz updated_at
    }
```

## 3. Relationships & Cardinalities Summary

| Parent Entity | Child Entity | Cardinality | Implementation & Foreign Key Rules |
|:---|:---|:---:|:---|
| `users` | `candidates` | 1 : 1 | `candidates.user_id` (UNIQUE, NOT NULL, `ON DELETE CASCADE`) |
| `users` | `recruiters` | 1 : 1 | `recruiters.user_id` (UNIQUE, NOT NULL, `ON DELETE CASCADE`) |
| `companies` | `recruiters` | 1 : N | `recruiters.company_id` (NOT NULL, `ON DELETE RESTRICT`) |
| `companies` | `jobs` | 1 : N | `jobs.company_id` (NOT NULL) |
| `recruiters` | `jobs` | 1 : N | `jobs.recruiter_id` (NOT NULL) |
| `candidates` | `candidate_skills` | 1 : N | `candidate_skills.candidate_id` (`ON DELETE CASCADE`, Composite PK) |
| `skills` | `candidate_skills` | 1 : N | `candidate_skills.skill_id` (Composite PK) |
| `jobs` | `job_skills` | 1 : N | `job_skills.job_id` (`ON DELETE CASCADE`, Composite PK) |
| `skills` | `job_skills` | 1 : N | `job_skills.skill_id` (Composite PK) |
| `candidates` | `applications` | 1 : N | `applications.candidate_id` (`ON DELETE CASCADE`) |
| `jobs` | `applications` | 1 : N | `applications.job_id` (`ON DELETE CASCADE`, UNIQUE with `candidate_id`) |
| `applications` | `application_status_history` | 1 : N | `application_status_history.application_id` (`ON DELETE CASCADE`) |
| `candidates` | `resume_embeddings` | 1 : 1 | `resume_embeddings.candidate_id` (PK is FK, `ON DELETE CASCADE`) |
| `jobs` | `job_embeddings` | 1 : 1 | `job_embeddings.job_id` (PK is FK, `ON DELETE CASCADE`) |
