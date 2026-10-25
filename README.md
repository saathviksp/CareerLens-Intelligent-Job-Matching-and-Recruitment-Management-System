# CareerLens: Job, Skill and Recruitment Management System

[![DBMS Level 3 Project](https://img.shields.io/badge/DBMS-Level%203%20Project-indigo.svg)](https://pes.edu)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16%20with%20pgvector-blue.svg)](https://github.com/pgvector/pgvector)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black.svg)](https://nextjs.org)
[![Automated Tests](https://img.shields.io/badge/Tests-16%2F16%20Passing%20(100%25)-emerald.svg)](./docs/test-results/test_results.md)
[![License](https://img.shields.io/badge/License-Academic%20Use-slate.svg)]()

> **DBMS Experiential Learning - Level 3 Project**  
> **Department of Computer Science and Engineering, PES University**  
> **GitHub Repository:** [CareerLens-Intelligent-Job-Matching-and-Recruitment-Management-System](https://github.com/saathviksp/CareerLens-Intelligent-Job-Matching-and-Recruitment-Management-System)

---

## 1. Project Information & Team Responsibilities

| Metadata | Specification |
|:---|:---|
| **Course** | DBMS Experiential Learning (Level 3) |
| **Section** | Section 19 |
| **Project Title** | CareerLens - Job, Skill and Recruitment Management System |
| **Architecture Option** | **Option 2: SQL + Vector database** (PostgreSQL 16 with `pgvector`) |
| **Supported Roles** | Candidate, Recruiter |

### Team Members & Module Division

The project was developed as a two-member team with clean separation of database and application responsibilities:

| Team Member | Registration No. | Database Contributions | Application Contributions |
|:---|:---|:---|:---|
| **Sai Harshith R** | `PES1UG24CS398` | • `candidates`, `candidate_skills`, `resume_embeddings`<br/>• Stored function `compute_skill_score()`<br/>• Skill-gap analysis query (**Q2**)<br/>• Hybrid match ranking query (**Q1**)<br/>• Candidate seed generation script | • Candidate profile &amp; resume editor (`/profile`)<br/>• Candidate skills manager (proficiencies &amp; years)<br/>• AI hybrid recommendations page (`/matches`)<br/>• Live skill gap breakdown (`/jobs/[id]`)<br/>• Applications history timeline (`/applications`) |
| **Saathvik Shenoy Padubidri** | `PES1UG24CS394` | • `jobs`, `job_skills`, `job_embeddings`<br/>• Applications pipeline &amp; transactional apply<br/>• Status change audit trigger `trg_status_history`<br/>• Past deadline check trigger `trg_job_deadline`<br/>• Analytical views: `v_job_funnel` &amp; `v_ranked_applicants` | • Recruiter job management (`/recruiter/jobs`)<br/>• Post job modal with weighted skill picker<br/>• Ranked applicants review (`/recruiter/jobs/[id]/applicants`)<br/>• Pipeline stage state machine transitions<br/>• Funnel analytics dashboard (`/recruiter/dashboard`) |
| **Joint Responsibilities** | *Both Members* | • Normalized 3NF relational schema DDL<br/>• Foreign keys &amp; integrity constraints<br/>• Index design (GIN, HNSW, Composite)<br/>• Seeding catalog &amp; test data plan | • Authentication (JWT in `httpOnly` cookie + bcrypt)<br/>• Role middleware protection (`middleware.ts`)<br/>• UI Design with Tailwind CSS &amp; Navbar<br/>• Automated verification test suite (**T1 - T16**) |

---

## 2. Why This is Beyond CRUD (Level 3 Expectation)

Standard recruitment systems perform basic insert, read, update, and delete operations. CareerLens goes far beyond CRUD by computing core hiring value directly within the database engine:

1. **Deterministic SQL Skill Overlap Scoring:** A stored SQL function (`compute_skill_score`) evaluates candidate competencies against weighted job requirements ($1$ to $5$). If any mandatory requirement is missing, the candidate's score is halved ($0.5\times$) mathematically in SQL.
2. **Dense Vector Semantic Matching:** Unstructured resume text and job descriptions are transformed into 384-dimensional dense vector embeddings (`all-MiniLM-L6-v2`) and queried via cosine distance (`<=>`) utilizing HNSW indexing in `pgvector`.
3. **Hybrid Match Score Blending:**
   $$\text{Final Match Score} = 0.6 \times \text{Skill\_Score} + 0.4 \times \text{Semantic\_Score}$$
4. **Automated Skill Gap Analysis:** Correlated subqueries (`NOT EXISTS`) isolate exactly which competencies a candidate lacks, ordering critical mandatory requirements first.
5. **Trigger-Audited Pipeline State Machine:** Moving an applicant across hiring stages (`applied` &rarr; `screening` &rarr; `interview` &rarr; `offer` &rarr; `hired`) automatically fires database trigger `trg_status_history`, maintaining an immutable audit log with timestamps.
6. **Single-Pass Funnel Analytics:** Recruiter dashboard queries `v_job_funnel`, computing stage volumes and hire conversion rates via `COUNT(...) FILTER (WHERE ...)`.

---

## 3. System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Web Browser (Client)                 │
│      React Pages • Search • Filters • Dashboards       │
└───────────────────────────▲────────────────────────────┘
                            │ HTTP / JSON
┌───────────────────────────▼────────────────────────────┐
│              Next.js 14 App Router (Server)            │
│  ├── Edge Middleware (Role-Based Access Control)       │
│  └── REST Route Handlers (/api/* endpoints)            │
└───────────────────────────▲────────────────────────────┘
                            │ Parameterized SQL (pg pool)
┌───────────────────────────▼────────────────────────────┐
│          PostgreSQL 16 Database + pgvector             │
│  ├── Relational Engine (3NF):                          │
│  │   • 12 Normalized Tables & 3 ENUM Types             │
│  │   • Stored Procedures & Functions                   │
│  │   • AFTER UPDATE & BEFORE INSERT Triggers           │
│  │   • Analytical Views (v_job_funnel)                 │
│  │   • Full-Text Search tsvector (GIN Indexed)         │
│  └── Vector Engine (pgvector):                         │
│      • vector(384) Dense Embeddings                    │
│      • Fast Cosine Similarity with HNSW Index          │
└────────────────────────────────────────────────────────┘
```

---

## 4. Repository Structure

```text
careerlens/
├── db/
│   ├── 01_schema.sql                  # 12 Tables, 3 ENUMs, pgvector extension, ALTER TABLE tsvector
│   ├── 02_functions.sql               # compute_skill_score(), compute_hybrid_score(), apply_to_job()
│   ├── 03_triggers.sql                # trg_status_history, trg_job_deadline, trg_candidates_updated_at
│   ├── 04_views.sql                   # v_job_funnel, v_ranked_applicants
│   ├── 05_indexes.sql                 # GIN full-text index, HNSW vector indexes, B-Tree indexes
│   ├── reset.ts                       # Complete database schema reset script (npm run db:reset)
│   └── seed/
│       ├── 01_skills.sql              # 25 seeded skills across 5 categories
│       ├── 02_companies_recruiters.sql# 4 companies and 4 recruiter user profiles
│       ├── 03_jobs.sql                # 15 jobs with weighted requirements across 6 archetypes
│       └── seed_runner.ts             # 20 candidates, 40 applications, 35 vector embeddings
├── app/
│   ├── layout.tsx                     # Global layout with role-aware navigation
│   ├── page.tsx                       # Landing page with Level 3 architectural overview
│   ├── globals.css                    # Tailwind CSS configuration
│   ├── (auth)/
│   │   ├── login/page.tsx             # Login page with 1-click evaluator test accounts
│   │   └── register/page.tsx          # Dual candidate / recruiter registration
│   ├── jobs/
│   │   ├── page.tsx                   # Full-text search (tsvector + ts_rank) and filters
│   │   └── [id]/page.tsx              # Job details, live hybrid match %, skill gap, transactional apply
│   ├── matches/
│   │   └── page.tsx                   # Candidate AI hybrid recommendations (Query Q1)
│   ├── profile/
│   │   └── page.tsx                   # Candidate profile, resume editor, real-time embedding refresh
│   ├── applications/
│   │   └── page.tsx                   # Candidate application list and status history timeline
│   ├── recruiter/
│   │   ├── jobs/page.tsx              # Recruiter job postings table and creation modal
│   │   ├── jobs/[id]/applicants/page.tsx # Ranked applicants from v_ranked_applicants (Q3)
│   │   └── dashboard/page.tsx         # Funnel table and visual conversion chart (Q4)
│   └── api/                           # Secure REST Route Handlers (parameterized queries)
├── middleware.ts                      # Role authorization and unauthenticated route protection
├── lib/
│   ├── db.ts                          # PostgreSQL connection pool (node-postgres)
│   ├── auth.ts                        # Bcrypt password hashing and JWT session management
│   └── embeddings.ts                  # 384-dimensional vector embedding generator
├── docs/
│   ├── er-diagram/                    # Mermaid ER diagram and relationship specifications
│   ├── data-dictionary/               # Comprehensive data dictionary for all 12 tables
│   ├── queries/                       # Important SQL queries Q1 to Q8 with documented outputs
│   ├── screenshots/                   # Complete UI walkthrough and demonstration steps
│   └── test-results/                  # Automated verification report for T1 through T16
├── scripts/
│   ├── run_tests.ts                   # Automated test runner testing cases T1 to T16
│   └── verify_queries.ts              # Live query verification script for Q1, Q2, Q5, Q8
├── .env.example                       # Committed environment variables template
├── package.json
└── tsconfig.json
```

---

## 5. How to Set Up and Run

### Prerequisites
* **Node.js:** v18.0.0 or later (verified on Node.js v22).
* **PostgreSQL 16** with the **`pgvector`** extension installed.
* **Git**.

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/saathviksp/CareerLens-Intelligent-Job-Matching-and-Recruitment-Management-System.git
cd CareerLens-Intelligent-Job-Matching-and-Recruitment-Management-System
```

---

### Step 2: Configure PostgreSQL with pgvector

You can run PostgreSQL 16 with pgvector using any of the following methods:

#### Method A: Using Docker (Fastest & Platform-Independent)
```bash
docker run -d \
  --name careerlens-pg \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=careerlens \
  pgvector/pgvector:pg16
```

#### Method B: Native Linux / Ubuntu (WSL2 on Windows)
```bash
# Install PostgreSQL 16 and pgvector
sudo apt update
sudo apt install -y postgresql-16 postgresql-16-pgvector

# Start PostgreSQL service
sudo service postgresql start

# Create database and user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE careerlens;"
sudo -u postgres psql -d careerlens -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

---

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `.env` matches your database credentials:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/careerlens
JWT_SECRET=careerlens_super_secret_jwt_key_2026_pes_univ
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
```

---

### Step 4: Install Dependencies
```bash
npm install
```

---

### Step 5: Initialize Database Schema (DDL)
Recreates the database schema, custom types, functions, triggers, views, and indexes from scratch:
```bash
npm run db:reset
```
*Output: `Total base tables created: 12`.*

---

### Step 6: Populate Seed Data
Seeds 25 skills, 4 companies, 4 recruiters, 15 jobs, 20 candidates, 40 applications with audit history, and 35 vector embeddings:
```bash
npm run db:seed
```
*Output: Database counts verified:*
* `skills_count: 25`
* `companies_count: 4`
* `recruiters_count: 4`
* `jobs_count: 15`
* `candidates_count: 20`
* `applications_count: 40`
* `history_count: 90`
* `resume_emb_count: 20`
* `job_emb_count: 15`

---

### Step 7: Run Automated Verification Tests (T1 – T16)
Executes the automated test suite covering all 16 test cases from Section 17 of the project definition:
```bash
npm test
```
*Expected Result: `Verification Complete: 16/16 tests passed (100% SUCCESS RATE)`.*

---

### Step 8: Start the Web Application
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 6. Pre-Seeded Evaluator Test Accounts

All accounts share the default seed password: `password123`.

| Role | Account Email | Target Profile / Responsibilities |
|:---|:---|:---|
| **Candidate** | `alex.morgan@example.com` | Senior Fullstack Engineer (React, Next.js, TypeScript, PostgreSQL). Top match for Job #1. |
| **Candidate** | `priya.sharma@example.com` | Senior Machine Learning Engineer (PyTorch, Python, LLMs). Top match for Job #2. |
| **Candidate** | `david.chen@example.com` | Staff Data Platform Engineer (Apache Kafka, PostgreSQL). Top match for Job #3. |
| **Candidate** | `emma.davis@example.com` | Junior Developer (ideal for demonstrating missing skill gaps on senior jobs). |
| **Recruiter** | `recruiter1@nexusai.com` | Sarah Jenkins (VP of Engineering Talent, Nexus AI Labs). Manages AI/ML roles. |
| **Recruiter** | `recruiter2@cloudscale.io` | Marcus Vance (Principal Recruiter, CloudScale Systems). Manages DevOps roles. |
| **Recruiter** | `recruiter3@fintechmatrix.com` | Elena Rostova (Talent Lead, FinTech Matrix). Manages Database & FinTech roles. |
| **Recruiter** | `recruiter4@pixelcraft.dev` | David Kim (Senior Partner, PixelCraft Studio). Manages Frontend roles. |

*(The login page at `/login` includes 1-click login buttons for instant evaluation without typing).*

---

## 7. Demonstration Plan (How to Evaluate)

Follow this 8-step evaluation script matching Section 20 of the project definition:

1. **Database Design & Schema:**
   * Open `docs/er-diagram/er_diagram.md` and review the 12 normalized tables, junction tables, and pgvector tables.
   * Run `npm run db:reset` to show DDL execution (types, tables, constraints, functions, triggers, views, indexes).
2. **Database Implementation & Seeding:**
   * Run `npm run db:seed` to show deterministic seeding of 25 skills, 15 jobs, 20 candidates, 40 applications, and 35 vector embeddings.
3. **Recruiter Job Posting & DML:**
   * Log in as `recruiter1@nexusai.com`.
   * Visit `/recruiter/jobs`, click **Post New Job**, attach weighted skills (weights 1-5, mandatory flags), and submit.
   * Show that the job is inserted with its skills, and its 384-d vector embedding is automatically generated.
4. **Candidate AI Hybrid Matching (Query Q1):**
   * Log in as `alex.morgan@example.com`.
   * Visit `/matches` to see jobs ranked by the hybrid formula ($0.6 \times \text{Skill} + 0.4 \times \text{Semantic}$).
   * Note that *Senior Fullstack Engineer* ranks #1 with a $90.19\%$ hybrid score ($100\%$ SQL skill score + $75.5\%$ semantic similarity).
5. **Skill Gap Analysis (Query Q2) & Transactional Apply:**
   * Click on a job or log in as `emma.davis@example.com` (Junior Developer).
   * Notice the **Skill Gap Breakdown** showing missing mandatory skills (with alert explaining the 50% score penalty).
   * Click **Apply to Position** to execute the transactional `apply_to_job` stored procedure.
   * Click Apply a second time to show immediate rejection by the `UNIQUE(candidate_id, job_id)` constraint.
6. **Recruiter Pipeline & Trigger Audit Trail:**
   * Log in as `recruiter1@nexusai.com`.
   * Visit `/recruiter/jobs/1/applicants` to see candidates ranked by `v_ranked_applicants` (**Q3**).
   * Change a candidate's status from `applied` to `screening` or `interview`.
   * Notice the live confirmation verifying that trigger `trg_status_history` appended a new audit record into `application_status_history`.
   * Log back in as the candidate and visit `/applications` to view the updated status history timeline.
7. **Funnel Dashboard & Full-Text Search:**
   * As recruiter, visit `/recruiter/dashboard` to view the conversion funnel table and visual stage bars (**Q4**).
   * Visit `/jobs` and search for `"react developer"` to demonstrate GIN-indexed full-text search with `ts_rank` (**Q7**).
8. **Run Automated Test Suite:**
   * Run `npm test` in the terminal to verify all 16 test cases passing with 100% compliance.

---

## 8. Summary of Important Queries (Q1 – Q8)

| Query | Purpose | Key DBMS Concepts |
|:---|:---|:---|
| **Q1** | Ranked jobs for candidate (hybrid) | CTE, vector cosine distance (`<=>`), stored function, ORDER BY, LIMIT |
| **Q2** | Skill gap analysis | Correlated subquery (`NOT EXISTS`), JOIN, multi-level ORDER BY |
| **Q3** | Ranked applicants for a job | Database View (`v_ranked_applicants`), `DENSE_RANK()` window function |
| **Q4** | Recruiter funnel dashboard | Database View (`v_job_funnel`), aggregates, `FILTER (WHERE ...)` |
| **Q5** | Companies with > 2 open jobs | `GROUP BY`, `HAVING COUNT(*) > 2` |
| **Q6** | Jobs paying above average salary | Scalar subquery, aggregate function (`AVG`) |
| **Q7** | Full-text job search with rank | `tsvector`, `plainto_tsquery`, GIN index, `ts_rank` |
| **Q8** | Average days from applied to hired | Self-join on status history, date arithmetic, `EXTRACT(EPOCH)` |

Full SQL definitions and query explanations: [docs/queries/queries_guide.md](file:///C:/Users/llath/OneDrive/Desktop/dbms%20mini%20project/docs/queries/queries_guide.md).

---

## 9. Compliance Matrix (Guideline Checklist)

| # | Guideline Requirement | How CareerLens Satisfies It |
|:---:|:---|:---|
| 1 | **Unique Title & Problem** | CareerLens: Job, Skill and Recruitment Management System with hybrid matching |
| 2 | **2-Member Team Division** | Explicit module split in database and application (Sai Harshith: Candidate; Saathvik Shenoy: Recruiter) |
| 3 | **SQL + Vector Database** | Option 2: Unified relational PostgreSQL 16 + `pgvector` extension |
| 4 | **3NF Relational Schema** | 12 tables in 3NF, 3 ENUMs, 14 foreign keys with cascade/restrict rules |
| 5 | **DDL Statements** | `CREATE TYPE`, `CREATE EXTENSION`, `CREATE TABLE`, `ALTER TABLE` (tsvector), `CREATE INDEX`, `CREATE VIEW`, `CREATE FUNCTION`, `CREATE TRIGGER` |
| 6 | **DML & Advanced Queries** | Queries Q1 through Q8 (CTE, vector distance, window functions, `NOT EXISTS`, `HAVING`, scalar subqueries, date arithmetic) |
| 7 | **Advanced SQL Features** | Transactions (`apply_to_job`), Triggers (`trg_status_history`, `trg_job_deadline`), Stored Functions (`compute_skill_score`), Views (`v_job_funnel`, `v_ranked_applicants`), Indexes (Composite, GIN, HNSW), FTS (`tsvector`) |
| 8 | **Vector Semantic Search** | 384-d `all-MiniLM-L6-v2` dense vectors in `vector(384)` with HNSW index using `vector_cosine_ops` |
| 9 | **Web Interface (Next.js)** | Responsive App Router interface with search, filters, job details, skill gap, matches, applications timeline, recruiter job posting, ranked applicants, and funnel dashboard |
| 10 | **Security & Credentials** | All credentials loaded from `.env` (no hard-coded secrets), parameterized SQL queries (no SQL injection), bcrypt password hashing, httpOnly JWT cookies |
| 11 | **Automated Tests** | 16 test cases (T1 - T16) verifying integrity, constraints, triggers, queries, and permissions with 100% pass rate |
| 12 | **Git Commits & Documentation** | Individual commit log per member on GitHub with full documentation in `docs/` |
