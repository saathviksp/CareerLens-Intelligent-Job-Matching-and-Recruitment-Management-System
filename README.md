# CareerLens: Job, Skill and Recruitment Management System

[![DBMS Level 3 Project](https://img.shields.io/badge/DBMS-Level%203%20Project-indigo.svg)](https://pes.edu)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16%20with%20pgvector-blue.svg)](https://github.com/pgvector/pgvector)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black.svg)](https://nextjs.org)
[![Automated Tests](https://img.shields.io/badge/Tests-16%2F16%20Passing%20(100%25)-emerald.svg)](./docs/test-results/test_results.md)

**DBMS Experiential Learning - Level 3 Project**  
*Department of Computer Science and Engineering, PES University*

---

## 1. Project Information & Team Responsibilities

| Field | Value |
|:---|:---|
| **Section** | Section 19 |
| **Project Title** | CareerLens - Job, Skill and Recruitment Management System |
| **Architecture Option** | Option 2: SQL + Vector database (PostgreSQL 16 with pgvector) |
| **Roles** | Candidate, Recruiter |

### Team Members & Module Division

| Team Member | Registration No. | Database Contributions | Application Contributions |
|:---|:---|:---|:---|
| **Sai Harshith R** | `PES1UG24CS398` | Candidates, candidate_skills, resume_embeddings, stored function `compute_skill_score()`, skill-gap analysis (Q2), hybrid match query (Q1) | Profile &amp; resume editor, candidate skills table, ranked matches page (`/matches`), skill-gap view, candidate applications timeline |
| **Saathvik Shenoy Padubidri** | `PES1UG24CS394` | Jobs, job_skills, job_embeddings, application pipeline, status audit trigger `trg_status_history`, analytical views `v_job_funnel` &amp; `v_ranked_applicants` | Recruiter job management (`/recruiter/jobs`), ranked applicants page (`/recruiter/jobs/[id]/applicants`), pipeline state transition, funnel dashboard (`/recruiter/dashboard`) |
| **Joint Responsibility** | *Both Members* | ER diagram, 3NF relational schema DDL, database constraints, seed data plan, index design (GIN, HNSW, B-Tree) | Authentication (JWT + bcrypt), role middleware, application layout, automated test suite (T1-T16), documentation |

---

## 2. Problem Statement & Level 3 Solution

### The Problem
Traditional recruitment platforms fail on both ends of the hiring spectrum:
- **Candidates** apply blindly without understanding their concrete skill gaps or how accurately their experience translates to a role.
- **Recruiters** are overwhelmed with unstructured resumes and rely on simplistic keyword filters that overlook qualified applicants describing identical skills in different terms.

### The Solution: Hybrid Matching (Beyond CRUD)
CareerLens combines structured relational data with high-dimensional vector search inside **PostgreSQL 16**:
1. **Deterministic SQL Skill Overlap (60%):** A stored function (`compute_skill_score`) evaluates candidate proficiencies against weighted job requirements (1 to 5). If any mandatory requirement is missing, the candidate's score is halved in SQL.
2. **pgvector Semantic Similarity (40%):** Candidate resumes and job descriptions are converted into 384-dimensional dense vector embeddings (`all-MiniLM-L6-v2`) and queried via cosine distance (`<=>`) using HNSW vector indexing.
3. **Skill Gap Discovery:** Correlated subqueries (`NOT EXISTS`) isolate exact missing competencies, distinguishing critical mandatory requirements from recommended skills.
4. **Trigger-Audited Pipeline:** Recruiters transition applicants across pipeline stages (`applied` &rarr; `screening` &rarr; `interview` &rarr; `offer` &rarr; `hired`), with every change captured automatically by a database trigger into `application_status_history`.

---

## 3. Technology Stack & System Architecture

```text
Browser (React Pages)
       ▲
       │ HTTP / JSON
       ▼
Next.js App Router (UI & Role Middleware)
       ▲
       │
       ▼
Route Handlers (/api/* REST Endpoints)
       ▲
       │ Parameterized Queries (node-postgres connection pool)
       ▼
PostgreSQL 16 + pgvector Extension
 ├── Relational Engine: 12 Tables (3NF), Constraints, Triggers, Views, Functions
 └── Vector Engine: 384-d Cosine Embeddings (HNSW Indexing)
```

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons.
- **Backend / API:** Next.js Server Route Handlers (REST under `/api`), Edge Middleware role guards.
- **Database:** PostgreSQL 16 with `pgvector` extension.
- **DB Access:** `node-postgres` (`pg`) with connection pooling and parameterized queries (strictly no ORM).
- **Authentication:** `bcryptjs` password hashing with salted rounds, signed JWT in `httpOnly` cookie.
- **Embeddings:** `all-MiniLM-L6-v2` (384 dimensions) via `@xenova/transformers`.

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
│   ├── reset.ts                       # Database schema rebuild script (npm run db:reset)
│   └── seed/
│       ├── 01_skills.sql              # 25 catalog skills across 5 categories
│       ├── 02_companies_recruiters.sql# 4 companies and 4 recruiter user profiles
│       ├── 03_jobs.sql                # 15 jobs with weighted requirements across 6 archetypes
│       └── seed_runner.ts             # 20 candidates, 40 applications, 35 vector embeddings
├── app/
│   ├── layout.tsx                     # Global layout with role-aware navigation
│   ├── page.tsx                       # Landing page with Level 3 architectural overview
│   ├── globals.css                    # Tailwind CSS configuration
│   ├── (auth)/
│   │   ├── login/page.tsx             # Login page with 1-click evaluator accounts
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
│   └── api/                           # Secure REST Route Handlers
├── middleware.ts                      # Role authorization and unauthenticated route protection
├── lib/
│   ├── db.ts                          # PostgreSQL connection pool with parameterized queries
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

## 5. Prerequisites & Quick Start Guide

### Prerequisites
1. **Node.js:** v18+ (verified on Node.js v22).
2. **PostgreSQL 16** with `pgvector` extension enabled.
3. **Git**.

### Step 1: Environment Configuration
Create your `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Ensure your database connection string is properly configured:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/careerlens
JWT_SECRET=careerlens_super_secret_jwt_key_2026_pes_univ
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Initialize Database Schema (DDL)
Rebuilds the database schema, functions, triggers, views, and indexes:
```bash
npm run db:reset
```

### Step 4: Populate Seed Data
Fills the database with 25 skills, 4 companies, 4 recruiters, 15 jobs, 20 candidates, 40 applications with audit history, and 35 generated vector embeddings:
```bash
npm run db:seed
```

### Step 5: Run Automated Verification Suite (T1 - T16)
Executes all 16 test cases specified in the project definition and generates `docs/test-results/test_results.md`:
```bash
npm test
```
*Expected Result: `16 / 16 tests passed (100% success rate)`.*

### Step 6: Start Web Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 6. Pre-Seeded Evaluator Accounts

All test accounts use the password: `password123`.

| Role | Account Email | Target Profile / Responsibilities |
|:---|:---|:---|
| **Candidate** | `alex.morgan@example.com` | Senior Fullstack Engineer (React, Next.js, TypeScript, PostgreSQL). Top match for Job #1. |
| **Candidate** | `priya.sharma@example.com` | Senior Machine Learning Engineer (PyTorch, Python, LLMs). Top match for Job #2. |
| **Candidate** | `david.chen@example.com` | Staff Data Platform Engineer (Apache Kafka, PostgreSQL). Top match for Job #3. |
| **Candidate** | `emma.davis@example.com` | Junior Developer (useful for demonstrating skill gap on senior roles). |
| **Recruiter** | `recruiter1@nexusai.com` | Sarah Jenkins (VP of Engineering Talent, Nexus AI Labs). |
| **Recruiter** | `recruiter2@cloudscale.io` | Marcus Vance (Principal Recruiter, CloudScale Systems). |
| **Recruiter** | `recruiter3@fintechmatrix.com` | Elena Rostova (Talent Lead, FinTech Matrix). |
| **Recruiter** | `recruiter4@pixelcraft.dev` | David Kim (Senior Partner, PixelCraft Studio). |

---

## 7. Compliance Checklist (Level 3 Matrix)

| # | Requirement | Implementation in CareerLens |
|:---:|:---|:---|
| 1 | **Real-world Problem & Title** | CareerLens - Job, Skill and Recruitment Management System with hybrid matching |
| 2 | **2-Member Responsibilities** | Complete module division in DB and App (Sai Harshith: Candidate side; Saathvik Shenoy: Recruiter side) |
| 3 | **SQL + Vector Database** | PostgreSQL 16 with `pgvector` (Option 2: unified relational and vector engine) |
| 4 | **3NF Relational Schema** | 12 tables, 3 ENUMs, composite PKs on junction tables, explicit ON DELETE rules |
| 5 | **DDL Features** | `CREATE TYPE`, `CREATE EXTENSION`, `CREATE TABLE`, `ALTER TABLE` (tsvector), `CREATE INDEX`, `CREATE VIEW`, `CREATE FUNCTION`, `CREATE TRIGGER` |
| 6 | **Advanced Queries** | Queries Q1 through Q8 (CTE, vector cosine `<=>`, correlated subquery `NOT EXISTS`, window function `DENSE_RANK()`, `GROUP BY ... HAVING`, scalar subquery, `ts_rank`, date arithmetic) |
| 7 | **Advanced SQL Concepts** | Transactions (`apply_to_job`), Triggers (`trg_status_history`, `trg_job_deadline`), Stored Functions (`compute_skill_score`), Views (`v_job_funnel`, `v_ranked_applicants`), Indexes (Composite, GIN, HNSW), Full-Text Search (`tsvector`) |
| 8 | **Vector Semantic Search** | 384-d `all-MiniLM-L6-v2` embeddings stored in `vector(384)` with HNSW index using `vector_cosine_ops` |
| 9 | **Next.js Web Interface** | Responsive App Router interface with search, filters, job details, skill gap, matches, applications timeline, recruiter job posting, ranked applicants, and funnel dashboard |
| 10 | **Security & Credentials** | All credentials loaded from `.env` (no hard-coded secrets), parameterized SQL queries (no SQL injection), bcrypt password hashing, httpOnly JWT cookies |
| 11 | **Automated Tests** | 16 test cases (T1 - T16) verifying integrity, constraints, triggers, queries, and permissions |
