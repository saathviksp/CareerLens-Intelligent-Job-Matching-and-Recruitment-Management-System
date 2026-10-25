'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Briefcase, MapPin, DollarSign, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

interface MatchJob {
  job_id: number;
  title: string;
  company_name: string;
  industry: string;
  location: string;
  salary_min: number;
  salary_max: number;
  deadline: string;
  skill_score: number;
  semantic_score: number;
  hybrid_score: number;
  already_applied: boolean;
  required_skills: {
    skill_id: number;
    name: string;
    weight: number;
    is_mandatory: boolean;
  }[];
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((data) => {
        if (data.matches) setMatches(data.matches);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="max-w-3xl">
          <span className="text-xs font-bold tracking-wider uppercase text-amber-400 flex items-center space-x-1.5 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Analytical Query Q1 • Hybrid Vector + SQL Matching</span>
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">Your Personalized AI Job Matches</h1>
          <p className="text-slate-300 text-sm mt-1">
            Every position is ranked by combining your deterministic skill match (60%) with 384-dimensional pgvector semantic cosine similarity (40%).
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No matches found yet</h3>
          <p className="text-sm text-slate-500 mt-1">Make sure you have added skills and resume text in your profile.</p>
          <Link
            href="/profile"
            className="mt-4 inline-block px-5 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl"
          >
            Update Profile &amp; Skills
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((job, idx) => (
            <div
              key={job.job_id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {job.company_name}
                  </span>
                  {job.already_applied && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Applied</span>
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-900 hover:text-indigo-600 transition">
                  <Link href={`/jobs/${job.job_id}`}>{job.title}</Link>
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.location || 'Remote'}</span>
                  </div>
                  {job.salary_max && (
                    <div className="flex items-center space-x-1 text-emerald-600 font-semibold">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max / 1000).toFixed(0)}k</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Skill tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.required_skills?.map((sk) => (
                    <span
                      key={sk.skill_id}
                      className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        sk.is_mandatory
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sk.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Match Score Badge */}
              <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="text-right">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-2xl shadow-sm">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xl font-black">{job.hybrid_score}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Hybrid Fit Score</p>
                </div>

                <div className="flex md:flex-col items-end gap-1 text-[11px] text-slate-500">
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    SQL Skill Overlap: <strong className="text-slate-800">{job.skill_score}%</strong>
                  </span>
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    Semantic Match: <strong className="text-slate-800">{job.semantic_score}%</strong>
                  </span>
                </div>

                <Link
                  href={`/jobs/${job.job_id}`}
                  className="mt-1 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
