'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

type RoleFilter = 'all' | 'mentee' | 'mentor' | 'admin';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [offset, setOffset] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'suspend' | 'activate'; name: string } | null>(null);
  const limit = 20;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, offset],
    queryFn: () => adminService.listUsers({
      search: search || undefined,
      role: roleFilter === 'all' ? undefined : roleFilter,
      limit,
      offset,
    }),
    placeholderData: (prev) => prev,
  });

  const suspend = useMutation({
    mutationFn: (id: string) => adminService.suspendUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setConfirmAction(null);
    },
  });

  const activate = useMutation({
    mutationFn: (id: string) => adminService.activateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setConfirmAction(null);
    },
  });

  const isPending = suspend.isPending || activate.isPending;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 text-sm mt-1">
          {data?.total !== undefined ? `${data.total} users total` : 'Loading...'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-64"
        />
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {(['all', 'mentee', 'mentor', 'admin'] as RoleFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setOffset(0); }}
              className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${
                roleFilter === r
                  ? 'bg-white text-slate-900 shadow-sm font-medium'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.users.length ? (
          <div className="text-center py-12 text-slate-500">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Roles</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Joined</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                  <td className="px-4 py-3 text-slate-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.isActive ? 'active' : 'suspended'} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.isActive ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmAction({ id: user.id, action: 'suspend', name: user.name })}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmAction({ id: user.id, action: 'activate', name: user.name })}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        Activate
                      </Button>
                    )}
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

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.action === 'suspend' ? 'Suspend User' : 'Activate User'}
        message={
          confirmAction?.action === 'suspend'
            ? `Are you sure you want to suspend ${confirmAction?.name}? They will lose access to the platform.`
            : `Restore access for ${confirmAction?.name}?`
        }
        confirmLabel={confirmAction?.action === 'suspend' ? 'Suspend' : 'Activate'}
        confirmVariant={confirmAction?.action === 'suspend' ? 'destructive' : 'default'}
        loading={isPending}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.action === 'suspend') suspend.mutate(confirmAction.id);
          else activate.mutate(confirmAction.id);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
