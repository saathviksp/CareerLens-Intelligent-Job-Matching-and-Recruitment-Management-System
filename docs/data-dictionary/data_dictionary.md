# CareerLens: Relational Data Dictionary & Schema Specification

This data dictionary outlines the 12 relational tables, 3 PostgreSQL ENUM types, constraints, and business justifications used across the CareerLens Job, Skill and Recruitment Management System.

---

## 1. Custom PostgreSQL Types (ENUMs)

### `user_role`
* **Values:** `'candidate'`, `'recruiter'`
* **Usage:** Enforces strict role-based access control directly in `users.role`.

### `job_status`
* **Values:** `'open'`, `'closed'`
* **Usage:** Controls application intake in `jobs.status`. Applications can only be submitted to jobs with status `'open'`.

### `app_status`
* **Values:** `'applied'`, `'screening'`, `'interview'`, `'offer'`, `'hired'`, `'rejected'`
* **Usage:** Dictates the recruiter pipeline progression and state machine transitions in `applications.status` and `application_status_history`.

---

## 2. Table Specifications

### 2.1 `users`
*Stores user login credentials, hashed passwords, and system roles.*

| Column | Type | Nullable | Constraints & Defaults | Description |
|:---|:---|:---:|:---|:---|
| `user_id` | INT | NO | GENERATED ALWAYS AS IDENTITY, PRIMARY KEY | Unique surrogate primary key. |
| `email` | VARCHAR(255) | NO | UNIQUE, CHECK (`email LIKE '%_@_%._%'`) | Account login identifier. Validated by pattern CHECK constraint. |
| `password_hash` | VARCHAR(255) | NO | - | Bcrypt salted hash (cost factor 10). Plain text passwords never stored. |
| `role` | `user_role` | NO | - | Role enum (`candidate` or `recruiter`). Enforced at DB and middleware levels. |
| `created_at` | TIMESTAMPTZ | NO | DEFAULT `now()` | Timestamp of account registration. |

---

### 2.2 `companies`
*Organizations hiring on the platform.*

| Column | Type | Nullable | Constraints & Defaults | Description |
|:---|:---|:---:|:---|:---|
| `company_id` | INT | NO | GENERATED ALWAYS AS IDENTITY, PRIMARY KEY | Unique company surrogate key. |
| `name` | VARCHAR(150) | NO | UNIQUE | Company legal or brand name. |
| `industry` | VARCHAR(100) | YES | - | Primary industry vertical (e.g. AI, DevOps, FinTech). |
| `location` | VARCHAR(100) | YES | - | Corporate headquarters location. |
| `website` | VARCHAR(200) | YES | - | Official web URL. |

---

### 2.3 `candidates`
*Candidate professional profiles, resumes, and summary data.*

| Column | Type | Nullable | Constraints & Defaults | Description |
|:---|:---|:---:|:---|:---|
| `candidate_id` | INT | NO | GENERATED ALWAYS AS IDENTITY, PRIMARY KEY | Unique candidate identifier. |
| `user_id` | INT | NO | UNIQUE, FK `users(user_id)` ON DELETE CASCADE | 1:1 foreign key link to user identity. |
| `full_name` | VARCHAR(120) | NO | - | Candidate full display name. |
| `phone` | VARCHAR(15) | YES | CHECK (`phone ~ '^[0-9+ -]{7,15}$'`) | Contact phone number validated by regex constraint. |
| `location` | VARCHAR(100) | YES | - | Current geographic location. |
| `education` | VARCHAR(150) | YES | - | Highest degree or institution. |
| `years_experience` | NUMERIC(3,1) | NO | DEFAULT `0`, CHECK (`>= 0`) | Total years of relevant professional experience. |
| `summary` | TEXT | YES | - | Professional executive summary. |
| `resume_text` | TEXT | NO | - | Unstructured resume text used for 384-d semantic embedding generation. |
| `updated_at` | TIMESTAMPTZ | NO | DEFAULT `now()` | Automatically updated via trigger on modification. |

---

### 2.4 `recruiters`
*Recruiter profiles associated with a hiring organization.*

| Column | Type | Nullable | Constraints & Defaults | Description |
|:---|:---|:---:|:---|:---|
| `recruiter_id` | INT | NO | GENERATED ALWAYS AS IDENTITY, PRIMARY KEY | Unique recruiter identifier. |
| `user_id` | INT | NO | UNIQUE, FK `users(user_id)` ON DELETE CASCADE | 1:1 foreign key link to user identity. |
| `company_id` | INT | NO | FK `companies(company_id)` ON DELETE RESTRICT | Hiring company affiliation. Company deletion blocked if recruiters exist. |
| `full_name` | VARCHAR(120) | NO | - | Recruiter full name. |
| `designation` | VARCHAR(80) | YES | - | Corporate title (e.g., VP of Engineering Talent). |

---

### 2.5 `skills`
*Standardized catalogue of platform skills.*

| Column | Type | Nullable | Constraints & Defaults | Description |
|:---|:---|:---:|:---|:---|
| `skill_id` | INT | NO | GENERATED ALWAYS AS IDENTITY, PRIMARY KEY | Unique skill identifier. |
| `name` | VARCHAR(80) | NO | UNIQUE | Canonical skill name (e.g., PostgreSQL, React, PyTorch). |
| `category` | VARCHAR(50) | NO | - | Skill domain (Web, Database, DevOps, Data, Soft). |

---

### 2.6 `candidate_skills`
*M:N Junction associating candidates with verified proficiencies.*

| Column | Type | Nullable | Constraints & Defaults | Description |
|:---|:---|:---:|:---|:---|
| `candidate_id` | INT | NO | FK `candidates(candidate_id)` ON DELETE CASCADE | Composite primary key component. |
| `skill_id` | INT | NO | FK `skills(skill_id)` | Composite primary key component. |
| `proficiency` | SMALLINT | NO | CHECK (`proficiency BETWEEN 1 AND 5`) | Candidate self-assessed skill level (1 to 5). |
| `years_used` | NUMERIC(3,1) | NO | DEFAULT `0`, CHECK (`>= 0`) | Time spent practicing this skill. |

---

### 2.7 `jobs`
*Job postings published by recruiters.*

| Column | Type | Nullable | Constraints & Defaults | Description |
|:---|:---|:---:|:---|:---|
| `job_id` | INT | NO | GENERATED ALWAYS AS IDENTITY, PRIMARY KEY | Unique job posting identifier. |
| `recruiter_id` | INT | NO | FK `recruiters(recruiter_id)` | Authoring recruiter. |
| `company_id` | INT | NO | FK `companies(company_id)` | Hiring organization. |
| `title` | VARCHAR(150) | NO | - | Job title. |
| `description` | TEXT | NO | - | Unstructured job description (source for pgvector embedding). |
| `location` | VARCHAR(100) | YES | - | Job location or 'Remote'. |
| `salary_min` | INT | YES | CHECK (`salary_min >= 0`) | Lower salary bound. |
| `salary_max` | INT | YES | CHECK (`salary_max >= salary_min`) | Upper salary bound. Verified via `chk_salary_range`. |
| `openings` | SMALLINT | NO | DEFAULT `1`, CHECK (`openings > 0`) | Available position count. |
| `deadline` | DATE | NO | Trigger: cannot be past date | Expiration date of posting. Checked via `trg_job_deadline`. |
| `status` | `job_status` | NO | DEFAULT `'open'` | Status enum (`open` or `closed`). |
| `created_at` | TIMESTAMPTZ | NO | DEFAULT `now()` | Date posting was submitted. |
| `search_vector` | TSVECTOR | YES | GENERATED ALWAYS AS (`to_tsvector(...)`) STORED | Full-text search tsvector generated across title and description. |

---

### 2.8 `job_skills`
*M:N Junction defining weighted requirements for each job.*

| Column | Type | Nullable | Constraints & Defaults | Description |
|:---|:---|:---:|:---|:---|
| `job_id` | INT | NO | FK `jobs(job_id)` ON DELETE CASCADE | Composite primary key component. |
| `skill_id` | INT | NO | FK `skills(skill_id)` | Composite primary key component. |
| `weight` | SMALLINT | NO | CHECK (`weight BETWEEN 1 AND 5`) | Relative importance weight assigned by recruiter. |
| `is_mandatory` | BOOLEAN | NO | DEFAULT `false` | If true, missing this skill halves candidate's SQL skill score. |

---

### 2.9 `applications`
*M:N Junction recording candidate job applications.*

| Column | Type | Nullable | Constraints & Defaults | Description |
|:---|:---|:---:|:---|:---|
| `application_id` | INT | NO | GENERATED ALWAYS AS IDENTITY, PRIMARY KEY | Unique application identifier. |
| `candidate_id` | INT | NO | FK `candidates(candidate_id)` ON DELETE CASCADE | Candidate applying. |
| `job_id` | INT | NO | FK `jobs(job_id)` ON DELETE CASCADE | Target job posting. |
| `status` | `app_status` | NO | DEFAULT `'applied'` | Current stage in recruitment pipeline. |
| `match_score` | NUMERIC(5,2) | YES | CHECK (`match_score BETWEEN 0 AND 100`) | Computed hybrid match score (0.00 to 100.00). |
| `applied_at` | TIMESTAMPTZ | NO | DEFAULT `now()` | Exact submission timestamp. |

*Composite Unique Constraint:* `(candidate_id, job_id)` prevents duplicate applications.

---

### 2.10 `application_status_history`
*Audit trail tracking all stage changes.*

| Column | Type | Nullable | Constraints & Defaults | Description |
|:---|:---|:---:|:---|:---|
| `history_id` | INT | NO | GENERATED ALWAYS AS IDENTITY, PRIMARY KEY | Unique audit entry identifier. |
| `application_id` | INT | NO | FK `applications(application_id)` ON DELETE CASCADE | Linked application. |
| `old_status` | `app_status` | YES | - | Previous stage (NULL for initial application). |
| `new_status` | `app_status` | NO | - | New updated stage. |
| `changed_at` | TIMESTAMPTZ | NO | DEFAULT `now()` | Exact timestamp recorded automatically by trigger. |

---

### 2.11 `resume_embeddings`
*High-dimensional vector embeddings for candidate resumes.*

| Column | Type | Nullable | Constraints & Defaults | Description |
|:---|:---|:---:|:---|:---|
| `candidate_id` | INT | NO | PRIMARY KEY, FK `candidates(candidate_id)` ON DELETE CASCADE | 1:1 mapping with candidate record. |
| `embedding` | `vector(384)` | NO | HNSW Index (`vector_cosine_ops`) | 384-dimensional unit vector embedding. |
| `model_name` | VARCHAR(60) | NO | DEFAULT `'all-MiniLM-L6-v2'` | Name of embedding model used. |
| `updated_at` | TIMESTAMPTZ | NO | DEFAULT `now()` | Generation timestamp. |

---

### 2.12 `job_embeddings`
*High-dimensional vector embeddings for job postings.*

| Column | Type | Nullable | Constraints & Defaults | Description |
|:---|:---|:---:|:---|:---|
| `job_id` | INT | NO | PRIMARY KEY, FK `jobs(job_id)` ON DELETE CASCADE | 1:1 mapping with job record. |
| `embedding` | `vector(384)` | NO | HNSW Index (`vector_cosine_ops`) | 384-dimensional unit vector embedding. |
| `model_name` | VARCHAR(60) | NO | DEFAULT `'all-MiniLM-L6-v2'` | Name of embedding model used. |
| `updated_at` | TIMESTAMPTZ | NO | DEFAULT `now()` | Generation timestamp. |
