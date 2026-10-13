import { useEffect, useId, useState } from 'react';
import { toast } from '../contexts/ToastContext';

export function RecipeNotes({ notes = '', onSave, disabled = false, localOnly = false }) {
  const [draft, setDraft] = useState(notes);
  const [saving, setSaving] = useState(false);
  const id = useId();
  useEffect(() => setDraft(notes), [notes]);
  const save = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(draft.trim());
      toast.success('Cooking notes saved');
    } catch {
      toast.error('Unable to save your notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return <form onSubmit={save} className="w-full max-w-md my-6 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
    <label htmlFor={id} className="block font-semibold text-zinc-900 dark:text-zinc-100">My cooking notes</label>
    <p className="text-sm text-zinc-500 my-2">Remember what worked for next time. Notes do not change the recipe or nutrition estimate.</p>
    {localOnly && <p className="text-xs text-zinc-500 mb-2">Guest notes are saved on this device.</p>}
    <textarea id={id} value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} rows={3} placeholder="Used less water; simmered five minutes longer…" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100" />
    <button type="submit" disabled={disabled || saving || draft.trim() === notes} className="mt-3 rounded-xl px-4 py-2 bg-amber-600 text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save notes'}</button>
  </form>;
}
