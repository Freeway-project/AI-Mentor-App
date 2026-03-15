'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface OffersStepProps {
  mentorId: string;
  onComplete: () => void;
}

export function OffersStep({ mentorId, onComplete }: OffersStepProps) {
  const [offers, setOffers] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.getMyOffers().then(setOffers).catch(() => { });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const offer = await apiClient.createOffer({
        title,
        description: description || undefined,
        durationMinutes: Number(durationMinutes),
        price: Number(price),
      });
      setOffers([...offers, offer]);
      setTitle('');
      setDescription('');
      setDurationMinutes('60');
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

  const inputCls = 'w-full px-3 py-2.5 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 bg-slate-800/60 text-white placeholder:text-slate-500 text-sm';
  const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Session Offers</h2>
        <p className="text-sm text-slate-400 mt-1">Define what types of sessions you offer to mentees.</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Existing offers */}
      {offers.length > 0 && (
        <div className="space-y-2">
          {offers.map((offer) => (
            <div key={offer.id} className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:border-violet-500/20 transition-colors">
              <div>
                <p className="font-semibold text-white text-sm">{offer.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {offer.durationMinutes} min &middot; <span className="text-amber-400 font-medium">${offer.price}</span>
                </p>
              </div>
              <button
                onClick={() => handleDelete(offer.id)}
                className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add offer form */}
      <form onSubmit={handleAdd} className="space-y-3 border-t border-slate-700/50 pt-5">
        <h3 className="text-sm font-semibold text-slate-300">Add an offer</h3>

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
            <label className={labelCls}>Duration (minutes)</label>
            <input
              type="number"
              required
              min="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className={inputCls}
            />
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
        </div>

        <Button type="submit" variant="outline" disabled={loading} className="bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200">
          {loading ? 'Adding…' : '+ Add Offer'}
        </Button>
      </form>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onComplete}
          disabled={offers.length === 0}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}
