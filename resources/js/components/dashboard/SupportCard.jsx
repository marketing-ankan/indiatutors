import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, Plus, X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import {
  fetchSupportTickets, openSupportTicket, replySupportTicket, closeSupportTicket, fetchMyEnrollments,
} from '../../lib/api.js';
import { errText } from '../admin/AdminUI.jsx';

/**
 * Help & support, for parents and students.
 *
 * Before this there was no way to reach anyone from inside an account. A
 * reschedule request went to the teacher and only ever meant "move a class";
 * everything else — a billing question, a teacher who did not turn up, "how do I
 * open the material" — meant leaving the product for the public contact form,
 * which wrote to a table nothing in the codebase read.
 *
 * A thread rather than a form, because the half that was missing is the reply.
 */

const CATEGORIES = [
  { value: 'classes',   label: 'Classes & teachers' },
  { value: 'billing',   label: 'Payments & billing' },
  { value: 'technical', label: 'Something is broken' },
  { value: 'other',     label: 'Something else' },
];

const STATUS = {
  open:     ['bg-amber-50 text-amber-700', 'Waiting for us'],
  answered: ['bg-green-50 text-green-700', 'We replied'],
  closed:   ['bg-slate-100 text-slate-500', 'Closed'],
};

const field = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40';

export default function SupportCard() {
  const qc = useQueryClient();
  const [composing, setComposing] = useState(false);
  const [sent, setSent] = useState(null);
  const [form, setForm] = useState({ subject: '', message: '', category: '', enrollment_id: '' });

  const { data: tickets = [], isLoading } = useQuery({ queryKey: ['support-tickets'], queryFn: fetchSupportTickets });
  const { data: enrolments = [] } = useQuery({ queryKey: ['my-enrollments'], queryFn: fetchMyEnrollments });

  const open = useMutation({
    mutationFn: () => openSupportTicket({
      subject: form.subject,
      message: form.message,
      category: form.category || null,
      enrollment_id: form.enrollment_id || null,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      setForm({ subject: '', message: '', category: '', enrollment_id: '' });
      setComposing(false);
      setSent(res?.message || 'Sent.');
    },
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold"><LifeBuoy className="h-5 w-5 text-brand-600" />Help &amp; support</h2>
          <p className="mt-0.5 text-xs text-slate-500">Ask us anything about classes, payments or your account — we reply right here.</p>
        </div>
        {!composing && (
          <button onClick={() => { setSent(null); setComposing(true); }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" /> Ask a question
          </button>
        )}
      </header>

      {sent && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 ring-1 ring-green-100">
          <CheckCircle2 className="h-4 w-4" /> {sent}
        </p>
      )}

      {composing && (
        <form onSubmit={e => { e.preventDefault(); open.mutate(); }}
          className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex justify-end">
            <button type="button" onClick={() => setComposing(false)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
          <input required value={form.subject} onChange={set('subject')} className={field}
            placeholder="What's it about? e.g. Class did not happen on Tuesday" />
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={form.category} onChange={set('category')} className={field}>
              <option value="">Choose a topic…</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {enrolments.length > 0 && (
              <select value={form.enrollment_id} onChange={set('enrollment_id')} className={field}>
                <option value="">Not about a specific class</option>
                {enrolments.map(e => (
                  <option key={e.id} value={e.id}>{[e.course?.name || e.plan, e.student].filter(Boolean).join(' · ')}</option>
                ))}
              </select>
            )}
          </div>
          <textarea required rows={4} value={form.message} onChange={set('message')} className={field}
            placeholder="Tell us what happened. Dates and names help us sort it out faster." />
          {open.isError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errText(open.error)}</p>}
          <button disabled={open.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
            {open.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="py-4 text-sm text-slate-400">Loading…</p>
      ) : tickets.length === 0 ? (
        !composing && (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            Nothing open. If something isn't right, tell us — we'd rather hear it.
          </p>
        )
      ) : (
        <ul className="space-y-2">
          {tickets.map(t => <Thread key={t.id} ticket={t} />)}
        </ul>
      )}
    </section>
  );
}

function Thread({ ticket }) {
  const qc = useQueryClient();
  // Anything we have replied to opens by default: the reply is the point, and
  // burying it behind a click is how it goes unread.
  const [open, setOpen] = useState(ticket.status === 'answered');
  const [reply, setReply] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['support-tickets'] });
  const send  = useMutation({ mutationFn: () => replySupportTicket({ id: ticket.id, message: reply }), onSuccess: () => { setReply(''); invalidate(); } });
  const close = useMutation({ mutationFn: () => closeSupportTicket(ticket.id), onSuccess: invalidate });

  const [tone, label] = STATUS[ticket.status] ?? STATUS.open;

  return (
    <li className="rounded-lg border border-slate-200">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{ticket.subject}</p>
          <p className="text-xs text-slate-500">
            <span className="font-mono">{ticket.code}</span>
            {ticket.messages?.length ? ` · ${ticket.messages.length} message${ticket.messages.length === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{label}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-3">
          <ul className="space-y-2">
            {(ticket.messages ?? []).map(m => (
              <li key={m.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                m.is_staff ? 'bg-brand-50 text-slate-800 ring-1 ring-brand-100' : 'ml-auto bg-white text-slate-700 ring-1 ring-slate-200'}`}>
                <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {m.is_staff ? (m.author || 'IndiaTutors team') : 'You'}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
              </li>
            ))}
          </ul>

          {ticket.status !== 'closed' ? (
            <form onSubmit={e => { e.preventDefault(); if (reply.trim()) send.mutate(); }} className="flex flex-wrap gap-2">
              <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Reply…"
                className={`${field} min-w-[180px] flex-1`} />
              <button disabled={send.isPending || !reply.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">
                <Send className="h-4 w-4" /> Send
              </button>
              <button type="button" onClick={() => close.mutate()} disabled={close.isPending}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 ring-1 ring-slate-200 hover:bg-white">
                Close
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-500">This conversation is closed. Ask a new question if you need us again.</p>
          )}
        </div>
      )}
    </li>
  );
}
