import { useQuery } from '@tanstack/react-query';
import { ReceiptText } from 'lucide-react';
import { fetchMyOrders, inr } from '../lib/api.js';

// Purchase history on the Account & orders page. Buyers previously had no
// receipt anywhere — and the refund policy implies refund requests, which need
// an order the customer can actually point at.
//
// Guest checkouts are not listed: an order placed while signed out is only
// linked by email, and an unverified email match is not proof of ownership.

const STATUS_STYLE = {
  paid:      'bg-green-50 text-green-700',
  pending:   'bg-amber-50 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const day = iso => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function MyOrdersCard() {
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['my-orders'], queryFn: fetchMyOrders });
  if (isLoading) return null;

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-100 p-5">
      <h2 className="flex items-center gap-2 font-bold text-slate-800">
        <ReceiptText className="h-4 w-4 text-brand-600" /> My Orders
      </h2>
      {!orders.length && (
        <p className="mt-3 text-sm text-slate-500">
          No orders yet. Anything you buy while signed in shows up here with its receipt number.
        </p>
      )}
      <div className="mt-3 divide-y divide-slate-100">
        {orders.map(o => (
          <div key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {(o.items || []).map(i => i.name).join(', ') || `Order #${o.id}`}
              </p>
              <p className="text-xs text-slate-500">#{o.id} · {day(o.created_at)}</p>
            </div>
            <span className="text-sm font-bold text-slate-800">{inr(o.total)}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[o.status] || 'bg-slate-100 text-slate-500'}`}>
              {o.status}
            </span>
          </div>
        ))}
      </div>
      {orders.length > 0 && (
        <p className="mt-2 text-[11px] text-slate-400">Need help with an order? Quote its number when you contact us.</p>
      )}
    </div>
  );
}
