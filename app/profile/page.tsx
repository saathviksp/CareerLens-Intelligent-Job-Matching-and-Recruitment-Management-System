'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, GraduationCap, Clock, FileText, Sparkles, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SkillCatalog {
  skill_id: number;
  name: string;
  category: string;
}

interface CandidateSkill {
  skill_id: number;
  name: string;
  category: string;
  proficiency: number;
  years_used: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [candidateSkills, setCandidateSkills] = useState<CandidateSkill[]>([]);
  const [allSkills, setAllSkills] = useState<SkillCatalog[]>([]);

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [education, setEducation] = useState('');
  const [yearsExperience, setYearsExperience] = useState('0');
  const [summary, setSummary] = useState('');
  const [resumeText, setResumeText] = useState('');

  // Add skill form state
  const [selectedSkillId, setSelectedSkillId] = useState<number | ''>('');
  const [proficiency, setProficiency] = useState(4);
  const [yearsUsed, setYearsUsed] = useState(2);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/skills'),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setProfile(pData.candidate);
        setCandidateSkills(pData.skills || []);

        setFullName(pData.candidate.full_name || '');
        setPhone(pData.candidate.phone || '');
        setLocation(pData.candidate.location || '');
        setEducation(pData.candidate.education || '');
        setYearsExperience(pData.candidate.years_experience?.toString() || '0');
        setSummary(pData.candidate.summary || '');
        setResumeText(pData.candidate.resume_text || '');
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        setAllSkills(sData.skills || []);
        if (sData.skills?.length > 0) setSelectedSkillId(sData.skills[0].skill_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          location,
          education,
          yearsExperience: parseFloat(yearsExperience) || 0,
          summary,
          resumeText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update profile');
        setSaving(false);
        return;
      }

      setMessage('Profile updated and vector embedding regenerated successfully!');
      setProfile(data.candidate);
    } catch {
      setError('Network error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) return;
    setAddingSkill(true);
    setError('');

    try {
      const res = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: selectedSkillId,
          proficiency,
          yearsUsed,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to add skill');
        setAddingSkill(false);
        return;
      }

      fetchProfile();
    } catch {
      setError('Error adding skill');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleDeleteSkill = async (skillId: number) => {
    try {
      const res = await fetch(`/api/profile/skills/${skillId}`, { method: 'DELETE' });
      if (res.ok) {
        setCandidateSkills(candidateSkills.filter((s) => s.skill_id !== skillId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500">
        Loading profile and skills...
      </div>
    );
  }

  // Filter skills not yet added
  const availableSkills = allSkills.filter(
    (sk) => !candidateSkills.some((cs) => cs.skill_id === sk.skill_id)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-extrabold tracking-tight">Candidate Profile &amp; Skills</h1>
        <p className="text-slate-300 text-sm mt-1">
          Update your details and resume text. Any edits regenerate your 384-dimensional vector embedding in real-time.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-2">
              <User className="w-5 h-5 text-indigo-600" />
              <span>Personal Information</span>
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0100"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Education
                  </label>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Years Exp
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Professional Summary
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Resume Text (Vector Embedding Source) *
                  </label>
                  <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    vector(384)
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-indigo-100"
              >
                {saving ? 'Updating Profile & Generating Vector...' : 'Save Profile & Refresh Embeddings'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Skills Manager */}
        <div className="space-y-6">
          {/* Add Skill Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              <span>Add Verified Skill</span>
            </h2>

            <form onSubmit={handleAddSkill} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Skill
                </label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableSkills.map((sk) => (
                    <option key={sk.skill_id} value={sk.skill_id}>
                      {sk.name} ({sk.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Proficiency (1-5)
                  </label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5].map((p) => (
                      <option key={p} value={p}>
                        Level {p} {p === 5 ? '(Expert)' : p === 1 ? '(Novice)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Years Used
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={yearsUsed}
                    onChange={(e) => setYearsUsed(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addingSkill || !selectedSkillId}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition"
              >
                {addingSkill ? 'Adding...' : 'Add to Profile'}
              </button>
            </form>
          </div>

          {/* Current Skills List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Your Skills ({candidateSkills.length})</h2>
            </div>

            {candidateSkills.length === 0 ? (
              <p className="text-xs text-slate-500">No skills added yet.</p>
            ) : (
              <div className="space-y-2.5">
                {candidateSkills.map((sk) => (
                  <div
                    key={sk.skill_id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{sk.name}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                        <span>{sk.category}</span>
                        <span>•</span>
                        <span>{sk.years_used} yrs</span>
                        <span>•</span>
                        <span className="font-semibold text-indigo-600">Level {sk.proficiency}/5</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(sk.skill_id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Remove skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
