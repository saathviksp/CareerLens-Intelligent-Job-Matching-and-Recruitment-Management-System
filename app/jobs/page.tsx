'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, DollarSign, Briefcase, Filter, Calendar, Sparkles, Building, ArrowRight } from 'lucide-react';

interface Skill {
  skill_id: number;
  name: string;
  category: string;
}

interface Job {
  job_id: number;
  company_name: string;
  title: string;
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  openings: number;
  deadline: string;
  rank: number;
  required_skills: {
    skill_id: number;
    name: string;
    weight: number;
    is_mandatory: boolean;
  }[];
}

function JobsListContent() {
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [skillId, setSkillId] = useState('');

  // Fetch skills for filter dropdown
  useEffect(() => {
    fetch('/api/skills')
      .then((res) => res.json())
      .then((data) => {
        if (data.skills) setSkillsCatalog(data.skills);
      })
      .catch(() => {});
  }, []);

  const fetchJobs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (location) params.set('location', location);
    if (salaryMin) params.set('salaryMin', salaryMin);
    if (skillId) params.set('skillId', skillId);

    fetch(`/api/jobs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.jobs) setJobs(data.jobs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, [location, salaryMin, skillId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleResetFilters = () => {
    setQ('');
    setLocation('');
    setSalaryMin('');
    setSkillId('');
    fetchJobs();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="max-w-3xl">
          <span className="text-xs font-bold tracking-wider uppercase text-indigo-300">
            PostgreSQL Full-Text Search (tsvector + GIN Index)
          </span>
          <h1 className="text-3xl font-extrabold mt-1">Explore Verified Opportunities</h1>
          <p className="text-slate-300 text-sm mt-1">
            Search jobs with linguistic stemming and natural language ranking via <code className="bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 rounded text-xs">ts_rank</code>.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by keywords, title, or skills (e.g. 'react developer', 'kafka', 'kubernetes')..."
              className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-indigo-950"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-slate-700 text-xs font-semibold uppercase tracking-wider">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filters:</span>
          </div>

          {/* Location */}
          <div className="relative">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Locations</option>
              <option value="San Francisco">San Francisco, CA</option>
              <option value="Austin">Austin, TX</option>
              <option value="New York">New York, NY</option>
              <option value="Seattle">Seattle, WA</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          {/* Min Salary */}
          <div className="relative">
            <select
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Min Salary</option>
              <option value="100000">$100k+</option>
              <option value="140000">$140k+</option>
              <option value="160000">$160k+</option>
              <option value="180000">$180k+</option>
            </select>
          </div>

          {/* Required Skill */}
          <div className="relative">
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[180px]"
            >
              <option value="">Filter by Skill</option>
              {skillsCatalog.map((s) => (
                <option key={s.skill_id} value={s.skill_id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {(q || location || salaryMin || skillId) && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No matching jobs found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your keyword query or filter criteria.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.job_id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {job.company_name}
                  </span>
                  {job.rank > 0 && (
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      FTS Rank: {job.rank.toFixed(3)}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition">
                  <Link href={`/jobs/${job.job_id}`}>{job.title}</Link>
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Meta details */}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
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

                  <div className="flex items-center space-x-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due {new Date(job.deadline).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Required Skills */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {job.required_skills.slice(0, 4).map((sk) => (
                    <span
                      key={sk.skill_id}
                      className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        sk.is_mandatory
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {sk.name} {sk.is_mandatory && '*'}
                    </span>
                  ))}
                  {job.required_skills.length > 4 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{job.required_skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {job.openings} opening{job.openings > 1 ? 's' : ''}
                </span>
                <Link
                  href={`/jobs/${job.job_id}`}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                >
                  <span>View &amp; Apply</span>
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

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8 text-center text-slate-500">Loading jobs...</div>}>
      <JobsListContent />
    </Suspense>
  );
}
