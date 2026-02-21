const statusConfig: Record<string, { label: string; className: string }> = {
  draft:        { label: 'Draft',       className: 'bg-slate-100 text-slate-600' },
  booked:       { label: 'Booked',      className: 'bg-blue-100 text-blue-700' },
  confirmed:    { label: 'Confirmed',   className: 'bg-indigo-100 text-indigo-700' },
  in_progress:  { label: 'In Progress', className: 'bg-purple-100 text-purple-700' },
  completed:    { label: 'Completed',   className: 'bg-green-100 text-green-700' },
  cancelled:    { label: 'Cancelled',   className: 'bg-red-100 text-red-700' },
  rescheduled:  { label: 'Rescheduled', className: 'bg-amber-100 text-amber-700' },
  no_show:      { label: 'No Show',     className: 'bg-orange-100 text-orange-700' },
  refunded:     { label: 'Refunded',    className: 'bg-pink-100 text-pink-700' },
  pending:      { label: 'Pending',     className: 'bg-amber-100 text-amber-700' },
  approved:     { label: 'Approved',    className: 'bg-green-100 text-green-700' },
  rejected:     { label: 'Rejected',    className: 'bg-red-100 text-red-700' },
  active:       { label: 'Active',      className: 'bg-green-100 text-green-700' },
  suspended:    { label: 'Suspended',   className: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
