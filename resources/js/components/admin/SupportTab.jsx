import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Send, Loader2, User, Globe } from 'lucide-react';
import {
  fetchAdminSupport, fetchAdminSupportTicket, replyAdminSupport, updateAdminSupport,
} from '../../lib/api.js';
import {
  AdminTable, Chips, SearchBox, Pager, StatusBadge, Modal, btnGhost, errText, day,
} from './AdminUI.jsx';

/**
 * The inbox.
 *
 * Seven public forms — the footer, the contact page, tutor enquiries, curriculum
 * downloads, the pricing page and refer-and-earn — have always written to a
 * table that nothing in this codebase read back. There was no route, no tab and
 * no export: every one of those people was told "we'll be in touch soon" when
 * nobody could have been. They now arrive here, along with support threads
 * raised from inside an account, in one queue.
 *
 * Sorted waiting-on-us first, so the tab opens on the work rather than on
 * whatever happened most recently.
 */
export default function SupportTab() {
  const [status, setStatus] = useState('open');
  const [source, setSource] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-support', status, source, q, page],
    queryFn: () => fetchAdminSupport({ status: status ?? '', source: source ?? '', q, page }),
  });

  const rows = data?.data ?? [];
  const counts = data?.counts ?? {};

  return (
    <div className="pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <Chips value={status} onChange={v => { setStatus(v); setPage(1); }} options={[
          { key: 'open', label: 'Needs a reply', count: counts.open },
          { key: 'answered', label: 'Answered', count: counts.answered },
          { key: 'closed', label: 'Closed', count: counts.closed },
          { key: null, label: 'All' },
        ]} />
        <Chips value={source} onChange={v => { setSource(v); setPage(1); }} options={[
          { key: null, label: 'Everywhere' },
          { key: 'contact_form', label: 'Website forms' },
          { key: 'dashboard', label: 'From an account' },
        ]} />
        <SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Code, subject, name, email or phone…" />
      </div>

      <AdminTable minWidth={980} loading={isLoading} rows={rows}
        empty="Nothing here."
        cols={['Ticket', 'From', 'Subject', 'Where from', 'Status', '']}
        renderRow={t => (
          <tr key={t.id} className="align-top">
            <td className="px-3 py-3">
              <p className="font-mono text-xs font-bold text-slate-500">{t.code}</p>
              <p className="text-xs text-slate-400">{day(t.created_at)}</p>
            </td>
            <td className="px-3 py-3">
              <p className="font-semibold text-slate-800">{t.name || '—'}</p>
              <p className="text-xs text-slate-500">{t.email || t.phone || '—'}</p>
              {t.has_account
                ? <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700"><User className="h-3 w-3" />{t.role}</span>
                : <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-400"><Globe className="h-3 w-3" />visitor</span>}
            </td>
            <td className="px-3 py-3 text-slate-700">
              <p className="line-clamp-2">{t.subject}</p>
              <p className="text-xs text-slate-400">{t.messages} message{t.messages === 1 ? '' : 's'}</p>
            </td>
            <td className="px-3 py-3 text-xs text-slate-500">
              {t.source === 'dashboard' ? 'Their account' : 'Website form'}
              {t.category && <p className="capitalize text-slate-400">{t.category}</p>}
            </td>
            <td className="px-3 py-3"><StatusBadge status={t.status === 'answered' ? 'scheduled' : t.status}>{
              t.status === 'open' ? 'Needs reply' : t.status === 'answered' ? 'Answered' : 'Closed'
            }</StatusBadge></td>
            <td className="px-3 py-3">
              <button className={btnGhost} onClick={() => setOpenId(t.id)}><Mail className="h-3.5 w-3.5" /> Open</button>
            </td>
          </tr>
        )} />

      <Pager meta={data?.meta} page={page} setPage={setPage} />

      {openId && <TicketModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function TicketModal({ id, onClose }) {
  const qc = useQueryClient();
  const [reply, setReply] = useState('');

  const { data: t, isLoading } = useQuery({ queryKey: ['admin-support-ticket', id], queryFn: () => fetchAdminSupportTicket(id) });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-support'] });
    qc.invalidateQueries({ queryKey: ['admin-support-ticket', id] });
  };
  // What happened to the last reply. Held here rather than derived from the
  // ticket, because "we could not send this" is an event, not a state the
  // ticket carries — and it is the one thing staff must read before moving on.
  const [delivery, setDelivery] = useState(null);
  const send  = useMutation({
    mutationFn: () => replyAdminSupport({ id, message: reply }),
    onSuccess: ({ delivery }) => { setReply(''); setDelivery(delivery); refresh(); },
  });
  const close = useMutation({ mutationFn: () => updateAdminSupport({ id, status: 'closed' }), onSuccess: () => { refresh(); onClose(); } });

  return (
    <Modal wide title={t?.subject || 'Ticket'} subtitle={t ? `${t.code} · ${t.source === 'dashboard' ? 'from their account' : 'website form'}` : ''} onClose={onClose}>
      {isLoading || !t ? (
        <p className="py-8 text-center text-slate-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></p>
      ) : (
        <>
          <ul className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            {(t.messages ?? []).map(m => (
              <li key={m.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                m.is_staff ? 'ml-auto bg-brand-50 text-slate-800 ring-1 ring-brand-100' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'}`}>
                <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {m.is_staff ? `${m.author || 'Staff'} (us)` : (m.author || 'Customer')}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
              </li>
            ))}
          </ul>

          <form onSubmit={e => { e.preventDefault(); if (reply.trim()) send.mutate(); }} className="mt-4 border-t border-slate-100 pt-3">
            <textarea rows={3} value={reply} onChange={e => setReply(e.target.value)}
              placeholder="Write a reply — we'll tell you below how it reached them."
              className="w-full rounded-lg px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {send.isError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errText(send.error)}</p>}
            {delivery && (
              <p className={`mt-2 rounded-lg px-3 py-2 text-sm ${
                delivery.status === 'undelivered'
                  ? 'bg-amber-50 font-semibold text-amber-900 ring-1 ring-amber-200'
                  : 'bg-green-50 text-green-800'}`}>
                {delivery.status === 'undelivered' ? 'Saved, but not sent. ' : 'Reply sent. '}
                {delivery.detail}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <button disabled={send.isPending || !reply.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">
                {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send reply
              </button>
              {t.status !== 'closed' && (
                <button type="button" className={btnGhost} disabled={close.isPending} onClick={() => close.mutate()}>Close ticket</button>
              )}
            </div>
            {!t.messages?.[0]?.is_staff && (
              <p className="mt-2 text-[11px] text-slate-400">
                Someone with an account reads the reply on their dashboard. A website enquiry is emailed instead —
                and if email is not configured on the server, the reply is saved but stays yours to send, and the
                ticket stays in <em>Needs a reply</em> until you close it.
              </p>
            )}
          </form>
        </>
      )}
    </Modal>
  );
}
