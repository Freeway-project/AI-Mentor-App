'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, AdminCoach } from '@/services/admin.service';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';

type Tab = 'pending' | 'all';

function CoachCard({ coach, onApprove, onReject }: {
  coach: AdminCoach;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
}) {
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900 truncate">{coach.name}</p>
            <StatusBadge status={coach.approvalStatus} />
          </div>
          {coach.headline && <p className="text-sm text-slate-500 mt-0.5">{coach.headline}</p>}
          {coach.bio && <p className="text-sm text-slate-400 mt-1 line-clamp-3">{coach.bio}</p>}
          <p className="text-xs text-slate-400 mt-2">
            Applied {new Date(coach.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {coach.approvalStatus === 'pending' && (
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <Button
            size="sm"
            onClick={() => onApprove(coach.id)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowReject(!showReject)}>
            Reject
          </Button>
        </div>
      )}

      {showReject && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Reason for rejection..."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
          />
          <Button
            size="sm"
            onClick={() => { if (rejectNote) onReject(coach.id, rejectNote); }}
            disabled={!rejectNote}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Send
          </Button>
        </div>
      )}

      {coach.approvalNote && (
        <p className="text-xs text-slate-500 bg-slate-50 rounded px-2 py-1">
          Note: {coach.approvalNote}
        </p>
      )}
    </div>
  );
}

export default function CoachesPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [offset, setOffset] = useState(0);
  const limit = 12;
  const qc = useQueryClient();

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-coaches-pending', offset],
    queryFn: () => adminService.listPendingCoaches(limit, offset),
    enabled: tab === 'pending',
  });

  const { data: all, isLoading: allLoading } = useQuery({
    queryKey: ['admin-coaches-all', offset],
    queryFn: () => adminService.listCoaches({ limit, offset }),
    enabled: tab === 'all',
  });

  const approve = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => adminService.approveCoach(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coaches-pending'] });
      qc.invalidateQueries({ queryKey: ['admin-coaches-all'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => adminService.rejectCoach(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coaches-pending'] });
      qc.invalidateQueries({ queryKey: ['admin-coaches-all'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const coaches = tab === 'pending' ? pending?.mentors : all?.mentors;
  const total = tab === 'pending' ? pending?.total : all?.total;
  const loading = tab === 'pending' ? pendingLoading : allLoading;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Coach Management</h1>
        <p className="text-slate-500 text-sm mt-1">Review and approve coach applications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['pending', 'all'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setOffset(0); }}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t === 'pending' ? 'Pending Approval' : 'All Coaches'}
            {t === 'pending' && (pending?.total ?? 0) > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">
                {pending?.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : coaches?.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {tab === 'pending' ? 'No coaches pending approval' : 'No coaches found'}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coaches?.map((coach) => (
            <CoachCard
              key={coach.id}
              coach={coach}
              onApprove={(id) => approve.mutate({ id })}
              onReject={(id, note) => reject.mutate({ id, note })}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(total ?? 0) > limit && (
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
            {offset + 1}–{Math.min(offset + limit, total ?? 0)} of {total}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset((o) => o + limit)}
            disabled={offset + limit >= (total ?? 0)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
