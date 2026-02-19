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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Session Offers</h2>
        <p className="text-sm text-slate-500">Define what types of sessions you offer.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Existing offers */}
      {offers.length > 0 && (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div key={offer.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{offer.title}</p>
                <p className="text-sm text-slate-500">
                  {offer.durationMinutes} min - ${offer.price}
                </p>
              </div>
              <button
                onClick={() => handleDelete(offer.id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add offer form */}
      <form onSubmit={handleAdd} className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-medium text-slate-700">Add an offer</h3>

        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Session title (e.g. 1-on-1 Mentoring)"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Description (optional)"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Duration (minutes)</label>
            <input
              type="number"
              required
              min="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Price (USD)</label>
            <input
              type="number"
              required
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <Button type="submit" variant="outline" disabled={loading}>
          {loading ? 'Adding...' : 'Add Offer'}
        </Button>
      </form>

      <div className="flex justify-end">
        <Button onClick={onComplete} disabled={offers.length === 0}>
          Continue
        </Button>
      </div>
    </div>
  );
}
