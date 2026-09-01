'use client';
import { useState } from 'react';
import { StickyNote, Send } from 'lucide-react';

function formatTime(d) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Stacked, timestamped note/chat thread — newest message on top so recent context
 * never gets lost. Purely presentational: the parent decides which notes are passed
 * in (already filtered to the right audience) and what onAdd does with a new message.
 */
export default function NotesTimeline({ notes = [], onAdd, placeholder = 'Add a note...', emptyLabel = 'No notes yet.', readOnly = false }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const sorted = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  async function submit() {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await onAdd(text.trim());
      setText('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {!readOnly && (
        <div className="flex gap-2 mb-4">
          <input
            className="input flex-1"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <button onClick={submit} disabled={saving} className="btn btn-primary btn-sm shrink-0 disabled:opacity-60 disabled:cursor-not-allowed">
            <Send size={14} /> {saving ? '...' : 'Send'}
          </button>
        </div>
      )}

      <div className="grid gap-3 max-h-80 overflow-y-auto pr-1">
        {sorted.length === 0 && (
          <p className="text-sm text-secondary flex items-center gap-2"><StickyNote size={15} /> {emptyLabel}</p>
        )}
        {sorted.map((n, i) => (
          <div key={n._id || i} className="bg-bglight rounded-xl p-4 text-sm">
            {n.field && (
              <div className="text-xs text-gold font-semibold mb-1">
                {n.field}: {n.oldValue} → {n.newValue}
              </div>
            )}
            <p>{n.text}</p>
            <div className="flex justify-between items-center mt-2 text-xs text-secondary flex-wrap gap-1">
              <span>{n.author}</span>
              <span className="flex items-center gap-2">
                {n.visibleToClient && <span className="text-success font-semibold">Client</span>}
                {n.visibleToVendor && <span className="text-gold font-semibold">Vendor</span>}
                {formatTime(n.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
