'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { StatsCard } from '@/components/admin/StatsCard';
import { Button } from '@/components/ui/button';

function CoinIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const TX_TYPE_LABELS: Record<string, string> = {
  purchase: 'Purchase',
  hold: 'Hold',
  deduct: 'Deduct',
  refund: 'Refund',
  return: 'Return',
};

const TX_TYPE_COLORS: Record<string, string> = {
  purchase: 'bg-green-100 text-green-700',
  hold: 'bg-amber-100 text-amber-700',
  deduct: 'bg-red-100 text-red-700',
  refund: 'bg-blue-100 text-blue-700',
  return: 'bg-purple-100 text-purple-700',
};

type TxTypeFilter = 'all' | 'purchase' | 'hold' | 'deduct' | 'refund' | 'return';

export default function CreditsPage() {
  const [txType, setTxType] = useState<TxTypeFilter>('all');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-credits', txType, offset],
    queryFn: () => adminService.listCredits({
      type: txType === 'all' ? undefined : txType,
      limit,
      offset,
    }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Credits</h1>
        <p className="text-slate-500 text-sm mt-1">Credit balances and transaction history</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Credits in Circulation"
          value={statsLoading ? '...' : (stats?.credits.totalBalance ?? 0).toFixed(1)}
          icon={<CoinIcon />}
          color="purple"
        />
        <StatsCard
          label="Credits Held"
          value={statsLoading ? '...' : (stats?.credits.totalHeld ?? 0).toFixed(1)}
          icon={<CoinIcon />}
          color="amber"
        />
        <StatsCard
          label="Credits Spent"
          value={statsLoading ? '...' : (stats?.credits.totalSpent ?? 0).toFixed(1)}
          icon={<CoinIcon />}
          color="red"
        />
      </div>

      {/* Type filter */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit flex-wrap">
        {(['all', 'purchase', 'hold', 'deduct', 'refund', 'return'] as TxTypeFilter[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTxType(t); setOffset(0); }}
            className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${
              txType === t
                ? 'bg-white text-slate-900 shadow-sm font-medium'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'all' ? 'All' : TX_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.transactions.length ? (
          <div className="text-center py-12 text-slate-500">No transactions found</div>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">User</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Balance After</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Description</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-900">{tx.userId}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TX_TYPE_COLORS[tx.type] ?? 'bg-slate-100 text-slate-700'}`}>
                      {TX_TYPE_LABELS[tx.type] ?? tx.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${tx.type === 'deduct' || tx.type === 'hold' ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.type === 'deduct' || tx.type === 'hold' ? '-' : '+'}{tx.amount.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{tx.balanceAfter.toFixed(1)}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{tx.description}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
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
