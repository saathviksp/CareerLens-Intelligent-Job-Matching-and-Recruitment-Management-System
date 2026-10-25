import React from 'react';
import Link from 'next/link';
import { Briefcase, Sparkles, Database, Layers, ArrowRight, ShieldCheck, CheckCircle2, TrendingUp, Cpu } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-12">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 mb-6">
          <Database className="w-3.5 h-3.5" />
          <span>PostgreSQL 16 + pgvector • Option 2 Hybrid Matching</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Intelligent Recruitment Powered by <span className="text-indigo-600">SQL Logic</span> &amp; <span className="text-violet-600">Vector Embeddings</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal">
          CareerLens goes far beyond basic CRUD: computed skill overlap in stored SQL functions, 384-dimensional semantic search in pgvector, skill-gap analysis, and trigger-audited pipelines.
        </p>

        {/* Quick Demo Credentials / Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/jobs"
            className="px-6 py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition flex items-center space-x-2"
          >
            <span>Explore Open Jobs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition"
          >
            Candidate / Recruiter Login
          </Link>
        </div>

        {/* Level 3 Highlights Banner */}
        <div className="mt-12 bg-indigo-50/60 border border-indigo-100 rounded-2xl p-6 text-left max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900">Hybrid Match Score Formula</p>
              <p className="text-xs text-slate-600 mt-0.5">
                <code className="text-indigo-700 bg-indigo-100/70 px-1 py-0.5 rounded">0.6 × Skill_Score + 0.4 × Semantic_Score</code>
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900">Trigger-Audited History</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Every status transition is automatically written to <code className="text-indigo-700 bg-indigo-100/70 px-1 py-0.5 rounded">application_status_history</code>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Beyond Simple CRUD (Level 3 DBMS)</h2>
          <p className="text-slate-600 text-sm mt-1">Demonstrating sophisticated relational constraints, stored procedures, triggers, views, and vector math.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Stored Function Matching</h3>
            <p className="text-slate-600 text-sm mt-2">
              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700">compute_skill_score()</code> evaluates weighted candidate overlap. If any mandatory skill is absent, the score is mathematically halved in SQL.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">pgvector Cosine Search</h3>
            <p className="text-slate-600 text-sm mt-2">
              Unstructured resume text and job descriptions are converted into 384-dimensional embeddings indexed with HNSW, measuring conceptual synergy.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Funnel Analytics View</h3>
            <p className="text-slate-600 text-sm mt-2">
              Recruiters track conversion rates using <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700">v_job_funnel</code>, aggregating pipeline volumes with single-pass <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">FILTER (WHERE ...)</code> clauses.
            </p>
          </div>
        </div>
      </section>

      {/* Role Demonstration Portal */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl">
            <span className="text-xs font-bold tracking-wider uppercase text-indigo-400">Instant Evaluation Demo</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2">Experience Both Platform Roles</h2>
            <p className="text-slate-300 text-sm sm:text-base mt-2">
              Log in with pre-seeded test accounts to evaluate candidate hybrid matching, skill gap discovery, recruiter job posting, and funnel analytics.
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-indigo-300">Candidate Role</span>
                <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded">Candidate 1</span>
              </div>
              <p className="font-bold text-lg mt-1">Alex Morgan</p>
              <p className="text-xs text-slate-300 mt-0.5">alex.morgan@example.com</p>
              <p className="text-xs text-slate-400 mt-2">Target profile: Fullstack React &amp; PostgreSQL specialist.</p>
              <Link
                href="/login?email=alex.morgan@example.com"
                className="mt-4 inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-300 hover:text-white transition"
              >
                <span>Login as Candidate Alex</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-violet-300">Recruiter Role</span>
                <span className="text-xs bg-violet-500/30 text-violet-200 px-2 py-0.5 rounded">Nexus AI Labs</span>
              </div>
              <p className="font-bold text-lg mt-1">Sarah Jenkins</p>
              <p className="text-xs text-slate-300 mt-0.5">recruiter1@nexusai.com</p>
              <p className="text-xs text-slate-400 mt-2">VP of Engineering Talent managing AI engineering jobs.</p>
              <Link
                href="/login?email=recruiter1@nexusai.com"
                className="mt-4 inline-flex items-center space-x-1.5 text-xs font-bold text-violet-300 hover:text-white transition"
              >
                <span>Login as Recruiter Sarah</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
