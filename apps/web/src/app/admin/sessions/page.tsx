'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';

type StatusFilter = 'all' | 'booked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'booked', label: 'Booked' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

export default function SessionsPage() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sessions', status, dateFrom, dateTo, offset],
    queryFn: () => adminService.listSessions({
      status: status === 'all' ? undefined : status,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit,
      offset,
    }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
        <p className="text-slate-500 text-sm mt-1">
          {data?.total !== undefined ? `${data.total} sessions total` : 'Loading...'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatus(opt.value); setOffset(0); }}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                status === opt.value
                  ? 'bg-white text-slate-900 shadow-sm font-medium'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center text-sm text-slate-600">
          <label>From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setOffset(0); }}
            className="px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
          />
          <label>To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setOffset(0); }}
            className="px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setOffset(0); }}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.meetings.length ? (
          <div className="text-center py-12 text-slate-500">No sessions found</div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">Mentee</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Coach</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Scheduled</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Duration</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Credits</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.meetings.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-900">{session.menteeName ?? session.menteeId}</td>
                  <td className="px-4 py-3 text-slate-900">{session.mentorName ?? session.mentorId}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {session.scheduledAt
                      ? new Date(session.scheduledAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {session.duration ? `${session.duration} min` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {session.creditCost !== undefined ? session.creditCost.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={session.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {(data?.total ?? 0) > limit && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
            disabled={offset === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            {offset + 1}–{Math.min(offset + limit, data?.total ?? 0)} of {data?.total}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset((o) => o + limit)}
            disabled={offset + limit >= (data?.total ?? 0)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
