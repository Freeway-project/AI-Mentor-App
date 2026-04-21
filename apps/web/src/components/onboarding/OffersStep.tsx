'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { appTheme } from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';

const PACKAGES = [
  { label: '½ session (30 min)', sessions: 0.5, minutes: 30 },
  { label: '1 session (60 min)', sessions: 1, minutes: 60 },
  { label: '5 sessions (5 × 60 min)', sessions: 5, minutes: 300 },
  { label: '10 sessions (10 × 60 min)', sessions: 10, minutes: 600 },
  { label: '20 sessions (20 × 60 min)', sessions: 20, minutes: 1200 },
];

const DISCOUNT_OPTIONS = [0, 5, 10, 15, 20, 25, 30];

interface OffersStepProps {
  mentorId: string;
  hourlyRate?: number;
  onComplete: () => void;
}

export function OffersStep({ mentorId: _mentorId, hourlyRate, onComplete }: OffersStepProps) {
  const [offers, setOffers] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [packageIndex, setPackageIndex] = useState(1); // default: 1 session
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.getMyOffers().then(setOffers).catch(() => {});
  }, []);

  const pkg = PACKAGES[packageIndex];
  const base = hourlyRate ? +(hourlyRate * pkg.sessions * (1 - discount / 100)).toFixed(2) : null;
  const gst = base !== null ? +(base * 0.05).toFixed(2) : null;
  const total = base !== null && gst !== null ? +(base + gst).toFixed(2) : null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (base === null) return;
    setError('');
    setLoading(true);
    try {
      const offer = await apiClient.createOffer({
        title,
        description: description || undefined,
        durationMinutes: pkg.minutes,
        price: base,
      });
      setOffers([...offers, offer]);
      setTitle('');
      setDescription('');
      setPackageIndex(1);
      setDiscount(0);
    } catch (err: any) {
      setError(err.message || 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (offerId: string) => {
    try {
      await apiClient.deleteOffer(offerId);
      setOffers(offers.filter((o) => o.id !== offerId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete offer');
    }
  };

  const inputCls = cn(appTheme.input, 'text-sm py-2.5');
  const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Session Offers</h2>
        <p className="mt-1 text-sm text-slate-600">
          Create packages for mentees to book. Each session is 60 minutes including call setup and wrap-up.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {offers.length > 0 && (
        <div className="space-y-2">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand/30"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{offer.title}</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {offer.durationMinutes} min &middot;{' '}
                  <span className="font-medium text-amber-700">${offer.price}</span>
                  {' '}(+5% GST)
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(offer.id)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="space-y-4 border-t border-slate-200 pt-5">
        <h3 className="text-sm font-semibold text-slate-800">Add an offer</h3>

        <div>
          <label className={labelCls}>Session Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
            placeholder="e.g. 1-on-1 Mentoring Session"
          />
        </div>

        <div>
          <label className={labelCls}>Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
            rows={2}
            placeholder="What will you cover in this session?"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Package</label>
            <select
              value={packageIndex}
              onChange={(e) => setPackageIndex(Number(e.target.value))}
              className={cn(inputCls, 'cursor-pointer')}
            >
              {PACKAGES.map((p, i) => (
                <option key={p.label} value={i}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Discount</label>
            <select
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className={cn(inputCls, 'cursor-pointer')}
            >
              {DISCOUNT_OPTIONS.map((d) => (
                <option key={d} value={d}>{d === 0 ? 'No discount' : `${d}% off`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing breakdown */}
        {hourlyRate ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm space-y-1">
            <p className="text-slate-600">
              ${hourlyRate}/hr × {pkg.sessions} session{pkg.sessions !== 1 ? 's' : ''}
              {discount > 0 && <> × {discount}% discount</>}
              {' '}= <span className="font-semibold text-slate-900">${base}</span>
            </p>
            <p className="text-slate-500 text-xs">+ ${gst} GST (5%) = <span className="font-semibold text-slate-800">${total} total</span></p>
          </div>
        ) : (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Set your hourly rate in the Expertise step to enable auto-pricing.
          </p>
        )}

        <Button
          type="submit"
          variant="outline"
          disabled={loading || base === null}
          className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
        >
          {loading ? 'Adding…' : '+ Add Offer'}
        </Button>
      </form>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={onComplete}
          disabled={offers.length === 0}
          className="bg-brand text-white hover:bg-brand-light"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}
