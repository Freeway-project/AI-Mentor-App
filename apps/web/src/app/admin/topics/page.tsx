'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { topicService, Topic } from '@/services/topic.service';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

function TopicForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Partial<Topic>;
  onSave: (data: { name: string; category: string; description: string; isActive?: boolean }) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Leadership Coaching"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Category *</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Business, Tech, Wellness"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional description..."
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!name || !category || loading}
          onClick={() => onSave({ name, category, description })}
        >
          {loading ? 'Saving...' : initial?.id ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
}

export default function TopicsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Topic | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-topics', offset],
    queryFn: () => topicService.listTopics({ limit, offset, includeInactive: true }),
    placeholderData: (prev) => prev,
  });

  const create = useMutation({
    mutationFn: topicService.createTopic,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-topics'] });
      setShowCreate(false);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => topicService.updateTopic(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-topics'] });
      setEditingId(null);
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => topicService.updateTopic(id, { isActive: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-topics'] });
      setDeactivateTarget(null);
    },
  });

  const activate = useMutation({
    mutationFn: (id: string) => topicService.updateTopic(id, { isActive: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-topics'] }),
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Topic Catalog</h1>
          <p className="text-slate-500 text-sm mt-1">
            {data?.total !== undefined ? `${data.total} topics` : 'Loading...'}
          </p>
        </div>
        {!showCreate && (
          <Button onClick={() => setShowCreate(true)}>
            + Add Topic
          </Button>
        )}
      </div>

      {showCreate && (
        <TopicForm
          onSave={(d) => create.mutate(d)}
          onCancel={() => setShowCreate(false)}
          loading={create.isPending}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.topics.length ? (
        <div className="text-center py-12 text-slate-500">No topics yet</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {data.topics.map((topic) => (
            <div key={topic.id} className="px-5 py-4 space-y-3">
              {editingId === topic.id ? (
                <TopicForm
                  initial={topic}
                  onSave={(d) => update.mutate({ id: topic.id, data: d })}
                  onCancel={() => setEditingId(null)}
                  loading={update.isPending}
                />
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900">{topic.name}</p>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {topic.category}
                      </span>
                      {!topic.isActive && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                      <span className="text-xs text-slate-400">{topic.mentorCount} coaches</span>
                    </div>
                    {topic.description && (
                      <p className="text-sm text-slate-500 mt-0.5">{topic.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(topic.id)}
                    >
                      Edit
                    </Button>
                    {topic.isActive ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeactivateTarget(topic)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => activate.mutate(topic.id)}
                        disabled={activate.isPending}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
        open={!!deactivateTarget}
        title="Deactivate Topic"
        message={`Deactivate "${deactivateTarget?.name}"? Coaches with this topic will still keep it, but it won't appear in search.`}
        confirmLabel="Deactivate"
        confirmVariant="destructive"
        loading={deactivate.isPending}
        onConfirm={() => { if (deactivateTarget) deactivate.mutate(deactivateTarget.id); }}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
