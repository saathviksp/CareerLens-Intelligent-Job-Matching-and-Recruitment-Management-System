'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, ArrowLeft, Mail, Phone, MapPin, Briefcase, 
  Sparkles, CheckCircle2, Clock, ShieldCheck, Award 
} from 'lucide-react';

interface Applicant {
  application_id: number;
  job_id: number;
  candidate_id: number;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  candidate_location: string;
  years_experience: number;
  education: string;
  status: string;
  match_score: number;
  applied_at: string;
  applicant_rank: number;
}

export default function JobApplicantsPage() {
  const params = useParams();
  const jobId = params?.id as string;

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const fetchApplicants = async () => {
    try {
      const [appRes, jobRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}/applicants`),
        fetch(`/api/jobs/${jobId}`),
      ]);

      if (appRes.ok) {
        const appData = await appRes.json();
        setApplicants(appData.applicants || []);
      }
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJobTitle(jobData.job?.title || `Job #${jobId}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchApplicants();
    }
  }, [jobId]);

  const handleStatusChange = async (applicationId: number, nextStatus: string) => {
    setUpdatingId(applicationId);
    setToast('');

    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update application status');
        setUpdatingId(null);
        return;
      }

      setApplicants(
        applicants.map((a) =>
          a.application_id === applicationId ? { ...a, status: nextStatus } : a
        )
      );

      setToast(
        `Application moved to '${nextStatus}'. Trigger 'trg_status_history' recorded audit row #${data.latestHistory?.history_id || 'new'}.`
      );
    } catch {
      alert('Network error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          href="/recruiter/jobs"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Manage Jobs</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-amber-400">
            Database View: v_ranked_applicants • Query Q3
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">{jobTitle}</h1>
          <p className="text-slate-300 text-sm mt-1">
            Applicants ranked by DENSE_RANK() over computed match scores. Status updates fire audit trigger.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur px-5 py-3 rounded-2xl border border-white/10 text-right shrink-0">
          <p className="text-2xl font-extrabold text-amber-400">{applicants.length}</p>
          <p className="text-xs text-slate-300">Total Applicants</p>
        </div>
      </div>

      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center space-x-2 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{toast}</span>
        </div>
      )}

      {/* Applicants List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No applicants yet for this job</h3>
          <p className="text-sm text-slate-500 mt-1">Candidate applications submitted will appear here ranked by score.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Candidate Information</th>
                  <th className="px-6 py-4">Experience</th>
                  <th className="px-6 py-4">Hybrid Match</th>
                  <th className="px-6 py-4">Pipeline Stage (Triggered)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicants.map((a) => (
                  <tr key={a.application_id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center ${
                            a.applicant_rank === 1
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
                              : a.applicant_rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : a.applicant_rank === 3
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{a.applicant_rank}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{a.candidate_name}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center space-x-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{a.candidate_email}</span>
                        </span>
                        {a.candidate_phone && (
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{a.candidate_phone}</span>
                          </span>
                        )}
                        {a.candidate_location && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{a.candidate_location}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">{a.years_experience} years</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{a.education || 'N/A'}</p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="inline-flex items-center space-x-1.5 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-black text-indigo-900 text-sm">{a.match_score}%</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <select
                          disabled={updatingId === a.application_id}
                          value={a.status}
                          onChange={(e) => handleStatusChange(a.application_id, e.target.value)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="applied">Applied</option>
                          <option value="screening">Screening</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        {updatingId === a.application_id && (
                          <span className="text-[10px] text-indigo-600 animate-pulse">Saving...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
