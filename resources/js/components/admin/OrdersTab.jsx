import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { fetchAdminOrders, updateAdminOrder, deleteAdminOrder, inr } from '../../lib/api.js';
import {
  AdminTable, Chips, SearchBox, Pager, StatusBadge, ConfirmDialog,
  btnGhost, inpSm, errText, day,
} from './AdminUI.jsx';

const STATUSES = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'cancelled', label: 'Cancelled' },
];

const monthOptions = () => {
  const out = [{ key: '', label: 'All months' }];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    });
  }
  return out;
};

export default function OrdersTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [month, setMonth] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, month, q, page],
    queryFn: () => fetchAdminOrders({ status, month, q, page }),
    placeholderData: prev => prev,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-orders'] });
    qc.invalidateQueries({ queryKey: ['admin-overview'] });
  };
  const update = useMutation({ mutationFn: updateAdminOrder, onSuccess: refresh, onError: e => setError(errText(e)) });
  const remove = useMutation({ mutationFn: deleteAdminOrder, onSuccess: () => { setDeleting(null); refresh(); } });

  const rows = data?.data ?? [];
  const reset = fn => v => { fn(v); setPage(1); };

  return (
    <div className="mt-5">
      <div className="space-y-2">
        <Chips options={monthOptions()} value={month} onChange={reset(setMonth)} />
        <div className="flex flex-wrap items-center gap-3">
          <Chips options={STATUSES} value={status} onChange={reset(setStatus)} />
          <SearchBox value={q} onChange={reset(setQ)} placeholder="Search customer, email, #id…" className="sm:max-w-xs" />
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <AdminTable
        cols={['Order', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions']}
        rows={rows}
        loading={isLoading}
        empty="No orders match these filters."
        minWidth={980}
        renderRow={o => (
          <tr key={o.id} className="align-top">
            {/* The order NUMBER is what a customer reads out on the phone, so
                it leads. The database id stays visible underneath because
                every other console screen and the audit log still key on it. */}
            <td className="px-3 py-3 font-bold text-slate-800">
              {o.order_number || `#${o.id}`}
              {o.invoice_number && (
                <span className="mt-0.5 block text-[11px] font-semibold text-green-700">{o.invoice_number}</span>
              )}
              <a href={o.invoice_url} target="_blank" rel="noopener noreferrer"
                className="mt-1 block text-[11px] font-semibold text-brand-600 hover:underline">
                Invoice PDF ↓
              </a>
            </td>
            <td className="px-3 py-3">
              <div className="text-slate-800">{o.customer}</div>
              <div className="text-xs text-slate-500">{o.email}</div>
              {/* Guest checkout is the common case; only say "account" when there is one. */}
              {o.user
                ? <div className="text-[11px] font-semibold text-brand-700">Account: {o.user.email}</div>
                : <div className="text-[11px] text-slate-400">Guest checkout</div>}
            </td>
            <td className="px-3 py-3 text-slate-600">
              {(o.items || []).map(i => i.name).join(', ') || <span className="text-slate-400">—</span>}
            </td>
            <td className="px-3 py-3 font-bold tabular-nums text-slate-800">{inr(o.total)}</td>
            <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
            <td className="px-3 py-3 whitespace-nowrap text-slate-500">{day(o.created_at)}</td>
            <td className="px-3 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <select defaultValue={o.status} disabled={update.isPending}
                  onChange={e => { setError(''); update.mutate({ id: o.id, status: e.target.value }); }}
                  className={inpSm}>
                  {['pending', 'paid', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => setDeleting(o)} disabled={o.status === 'paid'}
                  title={o.status === 'paid' ? 'A paid order is the record behind any access it granted — cancel it instead' : 'Delete'}
                  className={btnGhost + ' hover:text-red-600 hover:ring-red-200'}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        )}
      />
      <Pager meta={data?.meta} page={page} setPage={setPage} />

      {deleting && (
        <ConfirmDialog
          title={`Delete order #${deleting.id}?`}
          message={`${deleting.customer}'s order for ${inr(deleting.total)} will be removed permanently.`}
          busy={remove.isPending}
          error={remove.isError ? errText(remove.error) : ''}
          onConfirm={() => remove.mutate(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
