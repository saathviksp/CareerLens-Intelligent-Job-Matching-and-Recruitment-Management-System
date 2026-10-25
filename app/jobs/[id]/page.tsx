'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building, MapPin, DollarSign, Calendar, Users, 
  Sparkles, CheckCircle2, AlertTriangle, ArrowLeft, Send, ShieldAlert, Award
} from 'lucide-react';

interface SkillReq {
  skill_id: number;
  name: string;
  category: string;
  weight: number;
  is_mandatory: boolean;
}

interface MissingSkill {
  skill_id: number;
  name: string;
  category: string;
  weight: number;
  is_mandatory: boolean;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [candidateMatch, setCandidateMatch] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [missingSkills, setMissingSkills] = useState<MissingSkill[]>([]);
  const [matchedSkills, setMatchedSkills] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  const fetchJobData = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error('Job not found');
      const data = await res.json();
      setJob(data.job);
      setCandidateMatch(data.candidateMatch);
      setApplication(data.application);

      // If user is candidate, fetch skill gap
      if (data.candidateMatch) {
        const gapRes = await fetch(`/api/jobs/${jobId}/skill-gap`);
        if (gapRes.ok) {
          const gapData = await gapRes.json();
          setMissingSkills(gapData.missingSkills || []);
          setMatchedSkills(gapData.matchedSkills || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const handleApply = async () => {
    setApplying(true);
    setApplyError('');
    setApplySuccess(false);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: parseInt(jobId, 10) }),
      });

      const data = await res.json();
      if (!res.ok) {
        setApplyError(data.error || 'Failed to submit application');
        setApplying(false);
        return;
      }

      setApplySuccess(true);
      setApplication(data.application);
    } catch {
      setApplyError('Network error submitting application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading job specifications &amp; match vectors...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">Job Not Found</h2>
        <Link href="/jobs" className="mt-4 inline-block text-indigo-600 hover:underline text-sm font-semibold">
          &larr; Back to all jobs
        </Link>
      </div>
    );
  }

  const isClosed = job.status === 'closed';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs Directory</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full flex items-center space-x-1">
                <Building className="w-3.5 h-3.5" />
                <span>{job.company_name}</span>
              </span>
              {isClosed ? (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                  Position Closed
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Accepting Applications
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{job.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{job.location || 'Remote'}</span>
              </div>
              {job.salary_max && (
                <div className="flex items-center space-x-1 font-semibold text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                  <span>${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max / 1000).toFixed(0)}k per annum</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Apply / Status Button */}
          <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
            {application ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-right">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Application Submitted</span>
                </div>
                <p className="text-xs text-emerald-600 mt-1 capitalize font-medium">Current Status: {application.status}</p>
                <Link
                  href="/applications"
                  className="mt-2 inline-block text-xs font-semibold text-emerald-800 underline"
                >
                  View status history timeline &rarr;
                </Link>
              </div>
            ) : isClosed ? (
              <div className="bg-slate-100 text-slate-500 font-semibold px-6 py-3 rounded-xl text-sm">
                Applications Closed
              </div>
            ) : candidateMatch ? (
              <div>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md shadow-indigo-200 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{applying ? 'Submitting Application...' : 'Apply to this Position'}</span>
                </button>
                <p className="text-[11px] text-slate-400 text-right mt-1.5">Executed inside database transaction</p>
              </div>
            ) : (
              <Link
                href={`/login?redirect=/jobs/${job.job_id}`}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-indigo-100"
              >
                Sign in as Candidate to Apply
              </Link>
            )}

            {applyError && (
              <p className="text-xs font-semibold text-rose-600 mt-1">{applyError}</p>
            )}
            {applySuccess && (
              <p className="text-xs font-semibold text-emerald-600 mt-1">Application recorded successfully!</p>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Live Match & Skill Gap Section */}
      {candidateMatch && (
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-amber-400 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>AI Hybrid Match Score Breakdown</span>
              </span>
              <h2 className="text-2xl font-bold mt-1">Your Live Candidate Fit</h2>
            </div>

            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur px-5 py-3 rounded-2xl border border-white/15">
              <span className="text-3xl font-extrabold text-amber-400">
                {candidateMatch.hybrid_score}%
              </span>
              <div className="text-left text-[11px] text-slate-300 leading-tight">
                <p className="font-bold text-white">Hybrid Match</p>
                <p>0.6 Skill + 0.4 Sem</p>
              </div>
            </div>
          </div>

          {/* Subscores */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-xs font-semibold text-slate-300 uppercase">Deterministic SQL Skill Overlap (60%)</p>
              <p className="text-2xl font-extrabold text-white mt-1">{candidateMatch.skill_score}%</p>
              <p className="text-xs text-slate-400 mt-1">
                Computed via stored SQL function <code className="text-indigo-300">compute_skill_score()</code> based on required skill weights (1-5).
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-xs font-semibold text-slate-300 uppercase">pgvector Semantic Similarity (40%)</p>
              <p className="text-2xl font-extrabold text-white mt-1">{candidateMatch.semantic_score}%</p>
              <p className="text-xs text-slate-400 mt-1">
                Computed via 384-d cosine distance <code className="text-indigo-300">100 × (1 - distance)</code> between resume and job description.
              </p>
            </div>
          </div>

          {/* Q2 Skill Gap Breakdown */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm font-bold text-white mb-3">Skill Gap Analysis (Query Q2)</h3>

            {missingSkills.length === 0 ? (
              <div className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 rounded-xl p-3 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>You possess all required skills for this position!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {missingSkills.some(s => s.is_mandatory) && (
                  <div className="bg-rose-500/20 text-rose-200 border border-rose-500/30 rounded-xl p-3 text-xs flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Missing Mandatory Requirements: </span>
                      <span>Missing mandatory skills reduces your SQL skill score by 50%.</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((sk) => (
                    <div
                      key={sk.skill_id}
                      className={`text-xs px-3 py-1.5 rounded-xl border flex items-center space-x-2 ${
                        sk.is_mandatory
                          ? 'bg-rose-950/60 border-rose-500/40 text-rose-200 font-bold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300'
                      }`}
                    >
                      <span>{sk.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded">
                        Weight: {sk.weight}
                      </span>
                      {sk.is_mandatory && (
                        <span className="text-[10px] bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded">
                          MANDATORY
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Description */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Job Description</h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {job.description}
          </p>
        </div>

        {/* Required Skills Table */}
        <div className="pt-6 border-t border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Required Competencies &amp; Weights</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Skill Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Weight (1 - 5)</th>
                  <th className="px-4 py-3 rounded-r-xl">Requirement Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {job.required_skills?.map((sk: SkillReq) => (
                  <tr key={sk.skill_id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{sk.name}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{sk.category}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((w) => (
                          <div
                            key={w}
                            className={`w-3.5 h-3.5 rounded-full ${
                              w <= sk.weight ? 'bg-indigo-600' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-slate-500 ml-2 font-mono">({sk.weight}/5)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {sk.is_mandatory ? (
                        <span className="inline-flex items-center text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                          Mandatory Requirement
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          Preferred / Optional
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
