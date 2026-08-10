import { useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';

// The shared vocabulary of the console: filter chips, search, tables, pagers,
// status badges and modals. Every tab is built from these, so a change to the
// table idiom lands in nine places at once instead of none.

export const inp = 'w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
export const inpSm = 'rounded-lg ring-1 ring-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500';
export const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50';
export const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-lg ring-1 ring-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50';

/** Pill filter row. Wraps rather than scrolls, so it survives a 360px viewport. */
export function Chips({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {options.map(o => {
        const active = value === o.key;
        return (
          <button key={o.key ?? 'all'} type="button" onClick={() => onChange(o.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            {o.label}
            {o.count != null && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <label className={`relative flex-1 min-w-[180px] ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={inp + ' pl-9'} />
    </label>
  );
}

/**
 * min-w forces the table to keep its shape and the wrapper to scroll, instead
 * of the columns crushing together — and the wrapper, not the page, is what
 * scrolls sideways.
 */
export function AdminTable({ cols, rows, renderRow, loading, empty, minWidth = 720 }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            {cols.map(c => <th key={c} className="px-3 py-2 font-bold whitespace-nowrap">{c}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading && (
            <tr><td colSpan={cols.length} className="px-3 py-10 text-center text-slate-400">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </td></tr>
          )}
          {!loading && !rows.length && (
            <tr><td colSpan={cols.length} className="px-3 py-10 text-center text-slate-400">{empty}</td></tr>
          )}
          {!loading && rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ meta, page, setPage }) {
  const last = meta?.last_page ?? 1;
  if (last <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
        className="rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">Previous</button>
      <span className="text-slate-500">Page {meta.current_page} of {last} · {meta.total} total</span>
      <button disabled={page >= last} onClick={() => setPage(p => p + 1)}
        className="rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">Next</button>
    </div>
  );
}

// One colour map for every status word the platform uses, so "pending" looks
// the same whether it is a booking, an order or a review.
const STATUS_TONE = {
  new: 'bg-amber-50 text-amber-700', pending: 'bg-amber-50 text-amber-700', reviewing: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700', paid: 'bg-green-50 text-green-700', converted: 'bg-green-50 text-green-700',
  active: 'bg-green-50 text-green-700', published: 'bg-green-50 text-green-700',
  scheduled: 'bg-blue-50 text-blue-700', enrolled: 'bg-blue-50 text-blue-700',
  contacted: 'bg-indigo-50 text-indigo-700', completed: 'bg-teal-50 text-teal-700',
  rejected: 'bg-red-50 text-red-700', missed: 'bg-red-50 text-red-700', no_show: 'bg-red-50 text-red-700',
  cancelled: 'bg-slate-100 text-slate-600', closed: 'bg-slate-100 text-slate-600', draft: 'bg-slate-100 text-slate-600',
};

// Multi-word statuses would otherwise render as "No_show".
const STATUS_LABEL = { no_show: 'No show' };

export function StatusBadge({ status, children }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold capitalize whitespace-nowrap ${STATUS_TONE[status] || 'bg-slate-100 text-slate-600'}`}>
      {children ?? STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function Modal({ title, subtitle, onClose, children, wide = false }) {
  // Escape closes it — a modal you can only leave with the mouse is a modal
  // that traps keyboard users.
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={`w-full rounded-2xl bg-white p-5 shadow-xl ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-extrabold text-[#0B1220]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', danger = true, busy, error, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-slate-600">{message}</p>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex gap-2">
        <button onClick={onClose} className="flex-1 rounded-lg ring-1 ring-slate-200 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        <button onClick={onConfirm} disabled={busy}
          className={`flex-1 rounded-lg py-2 text-sm font-bold text-white disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function Tile({ label, value, sub, tone }) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm ring-1 ${tone === 'warn' ? 'bg-amber-50 ring-amber-100' : 'bg-white ring-slate-100'}`}>
      <div className={`text-2xl font-extrabold tabular-nums ${tone === 'warn' ? 'text-amber-900' : 'text-slate-900'}`}>{value}</div>
      <div className="mt-0.5 text-xs font-semibold text-slate-500">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

/** Every mutation surfaces its server message rather than a generic failure. */
export const errText = (e, fallback = 'Something went wrong — please try again.') =>
  e?.response?.data?.message
  || Object.values(e?.response?.data?.errors || {})[0]?.[0]
  || fallback;

export const day = iso => iso
  ? new Date(iso.replace(' ', 'T')).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';
