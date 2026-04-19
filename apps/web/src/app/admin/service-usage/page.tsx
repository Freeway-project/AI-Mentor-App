'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { StatsCard } from '@/components/admin/StatsCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';

type RangeFilter = 1 | 7 | 30 | 90;
type StatusFilter = 'all' | 'success' | 'failed';

const RANGE_OPTIONS: RangeFilter[] = [1, 7, 30, 90];

function ActivityIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h4l2-5 4 10 2-5h4" />
    </svg>
  );
}

function TokenIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.761 0-5 1.343-5 3s2.239 3 5 3 5 1.343 5 3-2.239 3-5 3m0-12c1.85 0 3.452.605 4.25 1.5M12 8V6m0 2v10m0 0v2m0-2c-1.85 0-3.452-.605-4.25-1.5" />
    </svg>
  );
}

function UsageIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M7 6h10M9 18h6" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.66 18h16.68a1 1 0 00.87-1.5l-7.5-13a1 1 0 00-1.74 0z" />
    </svg>
  );
}

function CostIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function humanize(value: string) {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatInteger(value?: number) {
  return new Intl.NumberFormat().format(value ?? 0);
}

function formatDuration(value?: number) {
  if (!value) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

function formatCost(value?: number) {
  if (!value) return '$0.00';
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

function formatMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return '—';

  const preview = Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== undefined && typeof value !== 'object')
    .slice(0, 3)
    .map(([key, value]) => `${humanize(key)}: ${String(value)}`);

  return preview.length ? preview.join(' • ') : '—';
}

export default function ServiceUsagePage() {
  const [days, setDays] = useState<RangeFilter>(30);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [service, setService] = useState('');
  const [provider, setProvider] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-service-usage', days, status, service, provider, offset],
    queryFn: () =>
      adminService.getServiceUsage({
        days,
        status: status === 'all' ? undefined : status,
        service: service || undefined,
        provider: provider || undefined,
        limit,
        offset,
      }),
    placeholderData: previousData => previousData,
  });

  const serviceOptions = Array.from(new Set((data?.services ?? []).map(item => item.service))).sort();
  const providerOptions = Array.from(new Set((data?.services ?? []).map(item => item.provider))).sort();
  const successRate = data?.overview.totalCalls
    ? Math.round((data.overview.successCount / data.overview.totalCalls) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Usage</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track tokens, call volume, failures, and cost across AI and infrastructure services.
          </p>
        </div>
        {isFetching && !isLoading ? (
          <div className="text-sm text-slate-500">Refreshing usage ledger…</div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex w-full flex-wrap gap-1 rounded-lg bg-slate-100 p-1 sm:w-auto">
          {RANGE_OPTIONS.map(option => (
            <button
              key={option}
              onClick={() => {
                setDays(option);
                setOffset(0);
              }}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                days === option
                  ? 'bg-white text-slate-900 shadow-sm font-medium'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {option === 1 ? '24h' : `${option}d`}
            </button>
          ))}
        </div>

        <select
          value={service}
          onChange={(event) => {
            setService(event.target.value);
            setOffset(0);
          }}
          className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-light sm:w-auto"
        >
          <option value="">All services</option>
          {serviceOptions.map(option => (
            <option key={option} value={option}>
              {humanize(option)}
            </option>
          ))}
        </select>

        <select
          value={provider}
          onChange={(event) => {
            setProvider(event.target.value);
            setOffset(0);
          }}
          className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-light sm:w-auto"
        >
          <option value="">All providers</option>
          {providerOptions.map(option => (
            <option key={option} value={option}>
              {humanize(option)}
            </option>
          ))}
        </select>

        <div className="flex w-full flex-wrap gap-1 rounded-lg bg-slate-100 p-1 sm:w-auto">
          {(['all', 'success', 'failed'] as StatusFilter[]).map(option => (
            <button
              key={option}
              onClick={() => {
                setStatus(option);
                setOffset(0);
              }}
              className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${
                status === option
                  ? 'bg-white text-slate-900 shadow-sm font-medium'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatsCard
          label="Service Calls"
          value={isLoading ? '...' : formatInteger(data?.overview.totalCalls)}
          icon={<ActivityIcon />}
          color="violet"
          sub={`${successRate}% success`}
        />
        <StatsCard
          label="Usage Units"
          value={isLoading ? '...' : formatInteger(data?.overview.totalUsage)}
          icon={<UsageIcon />}
          color="purple"
          sub={`${data?.overview.uniqueServices ?? 0} active service pairs`}
        />
        <StatsCard
          label="Tokens"
          value={isLoading ? '...' : formatInteger(data?.overview.totalTokens)}
          icon={<TokenIcon />}
          color="green"
          sub={`${formatInteger(data?.overview.promptTokens)} prompt / ${formatInteger(data?.overview.completionTokens)} completion`}
        />
        <StatsCard
          label="Failures"
          value={isLoading ? '...' : formatInteger(data?.overview.failureCount)}
          icon={<WarningIcon />}
          color="red"
          sub={`Avg latency ${formatDuration(data?.overview.averageDurationMs)}`}
        />
        <StatsCard
          label="Estimated Cost"
          value={isLoading ? '...' : formatCost(data?.overview.totalEstimatedCostUsd)}
          icon={<CostIcon />}
          color="amber"
          sub={`Window: ${days === 1 ? '24 hours' : `${days} days`}`}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Service Breakdown</h2>
          <p className="text-sm text-slate-500 mt-1">Grouped by service and provider.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.services.length ? (
          <div className="text-center py-12 text-slate-500">No usage recorded for this filter set</div>
        ) : (
          <table className="w-full text-sm min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">Service</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Provider</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Operations</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Calls</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Usage</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Tokens</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Failures</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Avg Latency</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Cost</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Last Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.services.map(group => (
                <tr key={`${group.service}:${group.provider}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{humanize(group.service)}</td>
                  <td className="px-4 py-3 text-slate-600">{humanize(group.provider)}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs">
                    <div className="line-clamp-2">{group.operations.map(humanize).join(', ') || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(group.totalCalls)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(group.totalUsage)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(group.totalTokens)}</td>
                  <td className="px-4 py-3">
                    <span className={group.failureCount > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {formatInteger(group.failureCount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDuration(group.averageDurationMs)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatCost(group.totalEstimatedCostUsd)}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {group.lastUsedAt ? new Date(group.lastUsedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Recent Usage Records</h2>
          <p className="text-sm text-slate-500 mt-1">Per-call ledger with status, tokens, and metadata.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.records.length ? (
          <div className="text-center py-12 text-slate-500">No individual usage records available</div>
        ) : (
          <table className="w-full text-sm min-w-[1180px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">Service</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Operation</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Usage</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Tokens</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Latency</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Cost</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Metadata</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.records.map(record => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{humanize(record.service)}</div>
                    <div className="text-slate-500">{humanize(record.provider)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{humanize(record.operation)}</div>
                    <div className="text-slate-500">{record.model || 'No model'}</div>
                    {record.errorMessage ? (
                      <div className="text-xs text-red-600 mt-1 max-w-xs line-clamp-2">{record.errorMessage}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatInteger(record.usageCount)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {record.totalTokens
                      ? `${formatInteger(record.totalTokens)} total`
                      : '—'}
                    <div className="text-xs text-slate-500 mt-1">
                      {record.promptTokens || record.completionTokens
                        ? `${formatInteger(record.promptTokens)} prompt / ${formatInteger(record.completionTokens)} completion`
                        : 'No token split'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDuration(record.durationMs)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatCost(record.estimatedCostUsd)}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-sm">
                    <div className="line-clamp-2">{formatMetadata(record.metadata)}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(record.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(data?.total ?? 0) > limit && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset(currentOffset => Math.max(0, currentOffset - limit))}
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
            onClick={() => setOffset(currentOffset => currentOffset + limit)}
            disabled={offset + limit >= (data?.total ?? 0)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
