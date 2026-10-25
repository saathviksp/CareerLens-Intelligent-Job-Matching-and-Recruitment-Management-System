'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Building, MapPin, Calendar, Clock, 
  CheckCircle2, XCircle, AlertCircle, Trash2, ArrowRight, Sparkles 
} from 'lucide-react';

interface HistoryItem {
  history_id: number;
  old_status: string | null;
  new_status: string;
  changed_at: string;
}

interface Application {
  application_id: number;
  job_id: number;
  job_title: string;
  company_name: string;
  job_location: string;
  job_status: string;
  status: string;
  match_score: number;
  applied_at: string;
  timeline: HistoryItem[];
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const fetchApplications = () => {
    setLoading(true);
    fetch('/api/applications')
      .then((res) => res.json())
      .then((data) => {
        if (data.applications) setApplications(data.applications);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (applicationId: number) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    setWithdrawingId(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, { method: 'DELETE' });
      if (res.ok) {
        setApplications(applications.filter((a) => a.application_id !== applicationId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hired':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'offer':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'interview':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold';
      case 'screening':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-semibold';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 font-medium';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl">
        <span className="text-xs font-bold tracking-wider uppercase text-indigo-300">
          Trigger-Based Audit History • FR8 &amp; FR10
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">Application Pipeline &amp; Status Timeline</h1>
        <p className="text-slate-300 text-sm mt-1">
          Every recruiter update triggers an automatic audit row in <code className="bg-indigo-900 text-indigo-200 px-1.5 py-0.5 rounded text-xs">application_status_history</code>.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No applications submitted yet</h3>
          <p className="text-sm text-slate-500 mt-1">Explore job openings or view your AI hybrid matches.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href="/matches"
              className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl"
            >
              View AI Matches
            </Link>
            <Link
              href="/jobs"
              className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div
              key={app.application_id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
            >
              {/* Job Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      {app.company_name}
                    </span>
                    <span>•</span>
                    <span>Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    <Link href={`/jobs/${app.job_id}`} className="hover:text-indigo-600 transition">
                      {app.job_title}
                    </Link>
                  </h3>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className={`inline-block text-xs uppercase px-3 py-1 rounded-full border ${getStatusBadge(app.status)}`}>
                      {app.status}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      Match: <strong className="text-slate-800">{app.match_score}%</strong>
                    </p>
                  </div>

                  {app.status !== 'hired' && (
                    <button
                      onClick={() => handleWithdraw(app.application_id)}
                      disabled={withdrawingId === app.application_id}
                      title="Withdraw application"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Audit Timeline Stepper */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Audit Trail History ({app.timeline.length} stage transitions)
                </p>

                <div className="relative pl-6 space-y-4 border-l-2 border-indigo-100 ml-2">
                  {app.timeline.map((step, idx) => (
                    <div key={step.history_id || idx} className="relative group">
                      {/* Bullet icon */}
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 capitalize text-sm">
                            {step.new_status}
                          </span>
                          {step.old_status && (
                            <span className="text-slate-500 ml-2">
                              (transitioned from <em className="font-medium">{step.old_status}</em>)
                            </span>
                          )}
                          {!step.old_status && (
                            <span className="text-slate-500 ml-2">(initial submission)</span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono mt-0.5 sm:mt-0">
                          {new Date(step.changed_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
