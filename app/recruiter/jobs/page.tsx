'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, Plus, Users, Calendar, DollarSign, 
  Trash2, ToggleLeft, ToggleRight, ArrowRight, AlertCircle, CheckCircle2, X 
} from 'lucide-react';

interface Skill {
  skill_id: number;
  name: string;
  category: string;
}

interface JobSkillInput {
  skillId: number;
  weight: number;
  isMandatory: boolean;
}

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Remote');
  const [salaryMin, setSalaryMin] = useState('130000');
  const [salaryMax, setSalaryMax] = useState('180000');
  const [openings, setOpenings] = useState('1');
  const [deadline, setDeadline] = useState('');

  // Skills attached to new job
  const [selectedSkills, setSelectedSkills] = useState<JobSkillInput[]>([]);
  const [activeSkillId, setActiveSkillId] = useState<number | ''>('');
  const [activeWeight, setActiveWeight] = useState(4);
  const [activeMandatory, setActiveMandatory] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRecruiterJobs = () => {
    setLoading(true);
    fetch('/api/jobs?mine=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.jobs) setJobs(data.jobs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecruiterJobs();

    // Default deadline 30 days in future
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDeadline(d.toISOString().split('T')[0]);

    fetch('/api/skills')
      .then((res) => res.json())
      .then((data) => {
        if (data.skills) {
          setSkillsCatalog(data.skills);
          if (data.skills.length > 0) setActiveSkillId(data.skills[0].skill_id);
        }
      })
      .catch(console.error);
  }, []);

  const handleAddSkillToJob = () => {
    if (!activeSkillId) return;
    if (selectedSkills.some((s) => s.skillId === activeSkillId)) return;

    setSelectedSkills([
      ...selectedSkills,
      { skillId: activeSkillId, weight: activeWeight, isMandatory: activeMandatory },
    ]);
  };

  const handleRemoveSkillFromJob = (id: number) => {
    setSelectedSkills(selectedSkills.filter((s) => s.skillId !== id));
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location,
          salaryMin: parseInt(salaryMin, 10),
          salaryMax: parseInt(salaryMax, 10),
          openings: parseInt(openings, 10),
          deadline,
          skills: selectedSkills,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create job posting');
        setSaving(false);
        return;
      }

      setSuccess('Job created and vector embeddings generated successfully!');
      setShowCreateModal(false);
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedSkills([]);
      fetchRecruiterJobs();
    } catch {
      setError('Network error creating job');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (jobId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setJobs(jobs.map((j) => (j.job_id === jobId ? { ...j, status: nextStatus } : j)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job posting? This will cascade delete associated applications, skills, and embeddings.')) {
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        setJobs(jobs.filter((j) => j.job_id !== jobId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-950 to-indigo-900 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-violet-300">
            Recruiter Management Portal
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Manage Your Job Postings</h1>
          <p className="text-slate-300 text-sm mt-1">
            Create, update, close, and review applicant rankings for positions in your organization.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-2xl text-sm transition shadow-md flex items-center space-x-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Job</span>
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Jobs Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No jobs posted yet</h3>
          <p className="text-sm text-slate-500 mt-1">Create your first job posting to start receiving ranked applicants.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-5 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl"
          >
            Post a Job
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Job Title &amp; Location</th>
                  <th className="px-6 py-4">Compensation</th>
                  <th className="px-6 py-4">Deadline</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.job_id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{job.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{job.location || 'Remote'} • {job.openings} opening{job.openings > 1 ? 's' : ''}</p>
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      ${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max / 1000).toFixed(0)}k
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(job.deadline).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(job.job_id, job.status)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                          job.status === 'open'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle Open/Closed status"
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                        <span className="capitalize">{job.status}</span>
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        href={`/recruiter/jobs/${job.job_id}/applicants`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>View Applicants</span>
                      </Link>

                      <button
                        onClick={() => handleDeleteJob(job.job_id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Post a New Job Opportunity</h2>
                <p className="text-xs text-slate-500 mt-0.5">With weighted required skills &amp; pgvector embeddings</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Systems Architect"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Job Description (Vector Embedding Source) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of responsibilities, technologies, requirements..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA or Remote"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Application Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Min Salary ($)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Max Salary ($)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Openings
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Skill Picker */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Attach Weighted Required Skills
                </label>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <select
                    value={activeSkillId}
                    onChange={(e) => setActiveSkillId(parseInt(e.target.value, 10))}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {skillsCatalog.map((s) => (
                      <option key={s.skill_id} value={s.skill_id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>

                  <select
                    value={activeWeight}
                    onChange={(e) => setActiveWeight(parseInt(e.target.value, 10))}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5].map((w) => (
                      <option key={w} value={w}>
                        Weight {w} {w === 5 ? '(Highest)' : ''}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeMandatory}
                      onChange={(e) => setActiveMandatory(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-rose-600">Mandatory</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddSkillToJob}
                    className="px-3 py-2 bg-slate-800 text-white font-semibold rounded-xl text-xs hover:bg-slate-900 transition"
                  >
                    Add Skill
                  </button>
                </div>

                {/* Selected skills pill list */}
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((sk) => {
                    const skName = skillsCatalog.find((s) => s.skill_id === sk.skillId)?.name || `Skill ${sk.skillId}`;
                    return (
                      <div
                        key={sk.skillId}
                        className={`text-xs px-3 py-1 rounded-xl border flex items-center space-x-1.5 ${
                          sk.isMandatory
                            ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{skName}</span>
                        <span className="text-[10px] text-slate-500">W:{sk.weight}</span>
                        {sk.isMandatory && <span className="text-[10px] text-rose-600">*</span>}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkillFromJob(sk.skillId)}
                          className="hover:text-rose-600 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {saving ? 'Creating & Generating Vector...' : 'Publish Posting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
