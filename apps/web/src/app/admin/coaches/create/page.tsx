'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminService, MentorExtractedFields } from '@/services/admin.service';

const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 bg-white text-slate-900 placeholder:text-slate-400 text-sm';
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider';

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  function addTag(value: string) {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag));
  }

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-slate-300 rounded-xl bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-brand/50">
        {tags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-brand/10 text-brand text-xs font-medium px-2 py-0.5 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-brand leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">Press Enter or comma to add</p>
    </div>
  );
}

interface SuccessResult {
  mentor: { id: string };
  user: { id: string; email: string; name: string };
  isExistingUser: boolean;
  generatedPassword?: string;
}

export default function CreateMentorPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [hourlyRate, setHourlyRate] = useState('');
  const [autoPassword, setAutoPassword] = useState(true);
  const [password, setPassword] = useState('');

  // Resume parsing
  const [parsedNote, setParsedNote] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SuccessResult | null>(null);
  const [copied, setCopied] = useState(false);

  function applyParsedFields(fields: MentorExtractedFields) {
    const filled: string[] = [];
    if (fields.email && !email) { setEmail(fields.email); filled.push('email'); }
    if (fields.name && !name) { setName(fields.name); filled.push('name'); }
    if (fields.headline) { setHeadline(fields.headline); filled.push('headline'); }
    if (fields.bio) { setBio(fields.bio); filled.push('bio'); }
    if (fields.specialties.length > 0) { setSpecialties(fields.specialties); filled.push('specialties'); }
    if (fields.expertise.length > 0) { setExpertise(fields.expertise); filled.push('expertise'); }
    if (fields.languages.length > 0) { setLanguages(fields.languages); filled.push('languages'); }
    return filled;
  }

  async function handleResumeUpload(file: File) {
    setParsing(true);
    setParseError('');
    setParsedNote('');
    try {
      const { mentorFields } = await adminService.parseResumeForMentor(file);
      const filled = applyParsedFields(mentorFields);
      const summary = filled.length > 0
        ? `Auto-filled: ${filled.join(', ')}. Review and edit as needed.`
        : 'Resume parsed but no fields could be extracted. Fill in the form manually.';
      setParsedNote(summary);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse resume');
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await adminService.createCoach({
        email: email.trim(),
        name: name.trim(),
        headline: headline.trim() || undefined,
        bio: bio.trim() || undefined,
        specialties,
        expertise,
        languages,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        password: autoPassword ? undefined : password || undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to create mentor');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setEmail(''); setName(''); setHeadline(''); setBio('');
    setSpecialties([]); setExpertise([]); setLanguages(['English']);
    setHourlyRate(''); setAutoPassword(true); setPassword('');
    setParsedNote(''); setParseError(''); setError(''); setResult(null); setCopied(false);
  }

  async function copyPassword() {
    if (result?.generatedPassword) {
      await navigator.clipboard.writeText(result.generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Mentor created!</h2>
              <p className="text-sm text-slate-500">{result.user.name} — {result.user.email}</p>
            </div>
          </div>

          {result.isExistingUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
              A new mentor profile was linked to the existing account for <strong>{result.user.email}</strong>.
            </div>
          )}

          {result.generatedPassword && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Generated Password</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 break-all">
                  {result.generatedPassword}
                </code>
                <button
                  onClick={copyPassword}
                  className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-medium transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-amber-600">Share this with the mentor — it won&apos;t be shown again.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand text-white rounded-xl text-sm font-medium transition-colors"
            >
              Create Another
            </button>
            <Link
              href={`/admin/coaches/${result.mentor.id}`}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium text-center transition-colors"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/coaches" className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Mentor</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create a mentor account on behalf of a coach</p>
        </div>
      </div>

      {/* Resume Upload */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Upload Resume (Optional)</h2>
          <p className="text-xs text-slate-400 mt-0.5">PDF or DOCX — we&apos;ll auto-fill the form fields below</p>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-brand-light hover:bg-brand/50 transition-colors"
        >
          {parsing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Parsing resume...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-slate-500">Click to upload PDF or DOCX</p>
              <p className="text-xs text-slate-400">Max 15 MB</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleResumeUpload(file);
            e.target.value = '';
          }}
        />

        {parsedNote && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {parsedNote}
          </div>
        )}

        {parseError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
            {parseError}
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
        <h2 className="text-sm font-semibold text-slate-700">Mentor Details</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
            {error}
            <button type="button" onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="mentor@example.com"
              className={inputCls}
            />
            <p className="text-xs text-slate-400 mt-1">If email exists, a new profile is linked to that account</p>
          </div>
          <div>
            <label className={labelCls}>Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Headline</label>
          <input
            type="text"
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder="e.g. Senior Software Engineer at Google"
            maxLength={120}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Professional summary..."
            rows={4}
            maxLength={1000}
            className={inputCls + ' resize-none'}
          />
          <p className="text-xs text-slate-400 mt-1">{bio.length}/1000</p>
        </div>

        <TagInput
          label="Specialties"
          tags={specialties}
          onChange={setSpecialties}
          placeholder="e.g. Career Coaching, Software Engineering"
        />

        <TagInput
          label="Expertise"
          tags={expertise}
          onChange={setExpertise}
          placeholder="e.g. React, System Design, Interview Prep"
        />

        <TagInput
          label="Languages"
          tags={languages}
          onChange={setLanguages}
          placeholder="e.g. English, Spanish"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Hourly Rate (USD)</label>
            <input
              type="number"
              value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value)}
              placeholder="e.g. 100"
              min="0"
              step="1"
              className={inputCls}
            />
          </div>
        </div>

        {/* Password */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Login Credentials</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoPassword}
              onChange={e => setAutoPassword(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            <span className="text-sm text-slate-700">Auto-generate password (recommended)</span>
          </label>

          {!autoPassword && (
            <div>
              <label className={labelCls}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Set a password for the mentor"
                minLength={8}
                className={inputCls}
              />
            </div>
          )}
          {autoPassword && (
            <p className="text-xs text-slate-400">
              A secure password will be generated and shown after creation.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Mentor'}
          </button>
          <Link
            href="/admin/coaches"
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
