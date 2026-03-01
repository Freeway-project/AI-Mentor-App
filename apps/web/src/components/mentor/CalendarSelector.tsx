'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface Calendar {
  id: string;
  summary: string;
}

export function CalendarSelector() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [writeCalendarId, setWriteCalendarId] = useState('primary');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.getGoogleCalendars()
      .then(data => {
        setCalendars(data.calendars);
        setSelectedIds(data.selectedCalendarIds);
        setWriteCalendarId(data.writeCalendarId || 'primary');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleCalendar = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.saveSelectedCalendars(selectedIds, writeCalendarId);
      toast.success('Calendar settings saved');
    } catch {
      toast.error('Failed to save calendar settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading calendars...</p>;
  }

  if (!calendars.length) {
    return <p className="text-sm text-slate-500">No calendars found in your Google account.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-400 mb-2">
          Select calendars to check for busy times (blocks slots when you have events):
        </p>
        <div className="space-y-2">
          {calendars.map(cal => (
            <label key={cal.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedIds.includes(cal.id)}
                onChange={() => toggleCalendar(cal.id)}
                className="w-4 h-4 rounded accent-violet-500"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                {cal.summary}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1.5">
          Create booking events in:
        </label>
        <select
          value={writeCalendarId}
          onChange={e => setWriteCalendarId(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500"
        >
          {calendars.map(cal => (
            <option key={cal.id} value={cal.id}>
              {cal.summary}
            </option>
          ))}
          <option value="primary">Primary Calendar</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save calendar settings'}
      </button>
    </div>
  );
}
