'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, Users, Award, Briefcase, ChevronRight, 
  Layers, CheckCircle2, ArrowRight 
} from 'lucide-react';

interface JobFunnel {
  job_id: number;
  company_name: string;
  title: string;
  job_status: string;
  openings: number;
  deadline: string;
  total_applications: number;
  count_applied: number;
  count_screening: number;
  count_interview: number;
  count_offer: number;
  count_hired: number;
  count_rejected: number;
  hire_conversion_rate: number;
}

export default function RecruiterDashboardPage() {
  const [funnelData, setFunnelData] = useState<JobFunnel[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/funnel')
      .then((res) => res.json())
      .then((data) => {
        if (data.jobs) setFunnelData(data.jobs);
        if (data.summary) setSummary(data.summary);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalApps = Number(summary?.total_candidates_applied) || 0;
  const totalScreening = Number(summary?.total_screening) || 0;
  const totalInterview = Number(summary?.total_interview) || 0;
  const totalOffer = Number(summary?.total_offer) || 0;
  const totalHired = Number(summary?.total_hired) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-indigo-300">
            Analytical View: v_job_funnel • Query Q4 &amp; FR11
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Recruitment Funnel Dashboard</h1>
          <p className="text-slate-300 text-sm mt-1">
            Real-time pipeline metrics and stage conversion rates computed via single-pass SQL FILTER clauses.
          </p>
        </div>

        <Link
          href="/recruiter/jobs"
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-indigo-950 flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
        >
          <span>Manage Jobs</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Postings</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{summary?.total_jobs || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Hiring jobs published</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Applications</span>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">{totalApps}</p>
              <p className="text-xs text-slate-500 mt-1">Candidates in active pipeline</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Offers Extended</span>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">{totalOffer}</p>
              <p className="text-xs text-slate-500 mt-1">Final offer stage</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Successful Hires</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-emerald-600">{totalHired}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {summary?.overall_conversion_rate || 0}% rate
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Overall pipeline conversion</p>
            </div>
          </div>

          {/* Visual Funnel Progression */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Aggregate Recruitment Conversion Funnel</h2>

            <div className="space-y-4">
              {/* Stage 1: Applied */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>1. Applied (Top of Funnel)</span>
                  <span>{totalApps} Candidates (100%)</span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Stage 2: Screening */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>2. Screening</span>
                  <span>
                    {totalScreening} Candidates ({totalApps > 0 ? ((totalScreening / totalApps) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${totalApps > 0 ? (totalScreening / totalApps) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Stage 3: Interview */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>3. Interviewing</span>
                  <span>
                    {totalInterview} Candidates ({totalApps > 0 ? ((totalInterview / totalApps) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${totalApps > 0 ? (totalInterview / totalApps) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Stage 4: Offer */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>4. Job Offer</span>
                  <span>
                    {totalOffer} Candidates ({totalApps > 0 ? ((totalOffer / totalApps) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${totalApps > 0 ? (totalOffer / totalApps) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Stage 5: Hired */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>5. Hired (Bottom of Funnel)</span>
                  <span>
                    {totalHired} Hires ({summary?.overall_conversion_rate || 0}%)
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${summary?.overall_conversion_rate || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Per-Job Funnel Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Per-Job Pipeline Breakdown (View: v_job_funnel)</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Job Title</th>
                    <th className="px-4 py-4 text-center">Applied</th>
                    <th className="px-4 py-4 text-center">Screening</th>
                    <th className="px-4 py-4 text-center">Interview</th>
                    <th className="px-4 py-4 text-center">Offer</th>
                    <th className="px-4 py-4 text-center">Hired</th>
                    <th className="px-4 py-4 text-center">Rejected</th>
                    <th className="px-6 py-4 text-right">Hire Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {funnelData.map((job) => (
                    <tr key={job.job_id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <Link
                          href={`/recruiter/jobs/${job.job_id}/applicants`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition"
                        >
                          {job.title}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">{job.openings} openings • Status: {job.job_status}</p>
                      </td>

                      <td className="px-4 py-4 text-center font-bold text-slate-800">
                        {job.count_applied}
                      </td>

                      <td className="px-4 py-4 text-center font-semibold text-blue-600">
                        {job.count_screening}
                      </td>

                      <td className="px-4 py-4 text-center font-semibold text-violet-600">
                        {job.count_interview}
                      </td>

                      <td className="px-4 py-4 text-center font-semibold text-amber-600">
                        {job.count_offer}
                      </td>

                      <td className="px-4 py-4 text-center font-bold text-emerald-600">
                        {job.count_hired}
                      </td>

                      <td className="px-4 py-4 text-center text-rose-500">
                        {job.count_rejected}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="font-extrabold text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          {job.hire_conversion_rate || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
