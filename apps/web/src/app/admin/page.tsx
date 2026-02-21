'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { StatsCard } from '@/components/admin/StatsCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

function UsersIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function CoachIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function CreditIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function PendingIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  });

  const { data: pending } = useQuery({
    queryKey: ['admin-pending-coaches'],
    queryFn: () => adminService.listPendingCoaches(5),
  });

  const approve = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => adminService.approveCoach(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['admin-pending-coaches'] });
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => adminService.rejectCoach(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['admin-pending-coaches'] });
      setRejectingId(null);
    },
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Platform overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Total Users"
          value={statsLoading ? '...' : (stats?.totalUsers ?? 0)}
          icon={<UsersIcon />}
          color="blue"
        />
        <StatsCard
          label="Active Coaches"
          value={statsLoading ? '...' : (stats?.activeCoaches ?? 0)}
          icon={<CoachIcon />}
          color="green"
        />
        <StatsCard
          label="Pending Approval"
          value={statsLoading ? '...' : (stats?.pendingApproval ?? 0)}
          icon={<PendingIcon />}
          color="amber"
        />
        <StatsCard
          label="Credits in Circulation"
          value={statsLoading ? '...' : (stats?.credits.totalBalance ?? 0).toFixed(1)}
          icon={<CreditIcon />}
          color="purple"
          sub={`${(stats?.credits.totalHeld ?? 0).toFixed(1)} held`}
        />
      </div>

      {/* Session status breakdown */}
      {stats?.sessionsByStatus && Object.keys(stats.sessionsByStatus).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Sessions by Status</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.sessionsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <StatusBadge status={status} />
                <span className="text-sm font-medium text-slate-700">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending coach approvals */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Pending Coach Approvals</h2>
          {(pending?.total ?? 0) > 5 && (
            <a href="/admin/coaches" className="text-sm text-blue-600 hover:underline">
              View all {pending?.total}
            </a>
          )}
        </div>

        {!pending?.mentors.length ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">No pending approvals</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pending.mentors.map((coach) => (
              <div key={coach.id} className="px-5 py-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{coach.name}</p>
                    {coach.headline && <p className="text-sm text-slate-500">{coach.headline}</p>}
                    {coach.bio && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{coach.bio}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => approve.mutate({ id: coach.id })}
                      disabled={approve.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectingId(rejectingId === coach.id ? null : coach.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                {rejectingId === coach.id && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Rejection reason (required)"
                      value={rejectNote[coach.id] || ''}
                      onChange={(e) => setRejectNote((n) => ({ ...n, [coach.id]: e.target.value }))}
                      className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const note = rejectNote[coach.id];
                        if (note) reject.mutate({ id: coach.id, note });
                      }}
                      disabled={!rejectNote[coach.id] || reject.isPending}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Confirm
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
