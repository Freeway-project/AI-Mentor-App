'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { appTheme } from '@/components/ui/app-theme';
import { cn } from '@/lib/utils';

const SESSION_MINUTES = 60;

interface OffersStepProps {
  mentorId: string;
  onComplete: () => void;
}

export function OffersStep({ mentorId: _mentorId, onComplete }: OffersStepProps) {
  const [offers, setOffers] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.getMyOffers().then(setOffers).catch(() => {});
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const offer = await apiClient.createOffer({
        title,
        description: description || undefined,
        durationMinutes: SESSION_MINUTES,
        price: Number(price),
      });
      setOffers([...offers, offer]);
      setTitle('');
      setDescription('');
      setPrice('');
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
        <p className="mt-1 text-sm text-slate-600">Define what types of sessions you offer to mentees.</p>
        <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Each session is <strong>{SESSION_MINUTES} minutes</strong> total, including time to join the call, wrap up,
          and any virtual setup — not just the conversation itself.
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
                  {offer.durationMinutes} min (standard session) &middot;{' '}
                  <span className="font-medium text-amber-700">${offer.price}</span>
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

      <form onSubmit={handleAdd} className="space-y-3 border-t border-slate-200 pt-5">
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

        <div>
          <label className={labelCls}>Duration</label>
          <div className={cn(inputCls, 'cursor-not-allowed bg-slate-50 text-slate-600')}>
            {SESSION_MINUTES} minutes (fixed)
          </div>
        </div>

        <div>
          <label className={labelCls}>Price (USD)</label>
          <input
            type="number"
            required
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputCls}
            placeholder="e.g. 75"
          />
        </div>

        <Button
          type="submit"
          variant="outline"
          disabled={loading}
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
