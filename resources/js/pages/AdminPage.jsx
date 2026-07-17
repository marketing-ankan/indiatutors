import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, ChevronDown, ChevronUp, UserCheck, GraduationCap, Check, X } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { fetchAdminDemoRequests, fetchDemoTutors, assignDemo, convertDemo, fetchAdminTeachers, approveTeacher, fetchAdminProposals, decideProposal, fetchAdminAnalytics, fetchAdminExamUpdates, createExamUpdate, updateExamUpdate, deleteExamUpdate, fetchAdminOrders, updateAdminOrder, fetchAdminEvents, createAdminEvent, updateAdminEvent, deleteAdminEvent } from '../lib/api.js';

const STATUSES = ['', 'new', 'scheduled', 'converted', 'closed'];
const badge = { new:'bg-amber-50 text-amber-700', scheduled:'bg-blue-50 text-blue-700', converted:'bg-green-50 text-green-700', closed:'bg-slate-100 text-slate-600' };

export default function AdminPage() {
  const { user, isAuthed, isLoading } = useAuth();
  const [tab, setTab] = useState('demos');
  const [status, setStatus] = useState('');
  const isAdmin = isAuthed && user?.role === 'admin';
  const { data } = useQuery({ queryKey:['admin-demos', status], queryFn:()=>fetchAdminDemoRequests(status), enabled: isAdmin && tab==='demos' });

  if (isLoading) return <div className="mx-auto max-w-5xl px-4 py-20 text-slate-500">Loading…</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-3"/>
      <h1 className="text-2xl font-extrabold">Admins only</h1>
      <p className="text-slate-500 mt-2">Your account doesn't have access to the staff console.</p>
    </div>
  );

  const reqs = data?.data ?? [];
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Staff Console</h1>

      <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100">
        {[['demos','Demo Requests'],['orders','Orders'],['events','Events'],['teachers','Teacher Applications'],['proposals','Course Proposals'],['exams','Exam Updates'],['analytics','Analytics']].map(([k,label]) => (
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${tab===k?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>{label}</button>
        ))}
      </div>

      {tab === 'demos' ? (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button key={s||'all'} onClick={()=>setStatus(s)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${status===s?'bg-brand-600 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {s ? s[0].toUpperCase()+s.slice(1) : 'All'}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {reqs.length ? reqs.map(r => <DemoRow key={r.id} r={r} />) : <p className="text-slate-500 py-10 text-center">No demo requests.</p>}
          </div>
        </>
      ) : tab === 'orders' ? (
        <OrdersPanel />
      ) : tab === 'events' ? (
        <EventsPanel />
      ) : tab === 'teachers' ? (
        <TeachersPanel />
      ) : tab === 'proposals' ? (
        <ProposalsPanel />
      ) : tab === 'exams' ? (
        <ExamUpdatesPanel />
      ) : (
        <AnalyticsPanel />
      )}
    </div>
  );
}

const eventBadge = { upcoming:'bg-green-50 text-green-700', completed:'bg-slate-100 text-slate-600', draft:'bg-amber-50 text-amber-700' };
const EVENT_BLANK = { title:'', icon:'🎓', category:'', description:'', starts_at:'', ends_at:'', mode:'Online', batch_size:'', session_duration:'', schedule_note:'', time_note:'', status:'upcoming' };
// Hoisted so inputs keep identity (and focus) across EventsPanel re-renders.
const F = ({ label, children }) => <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>{children}</label>;

function EventsPanel() {
  const qc = useQueryClient();
  const { data: events = [], isLoading } = useQuery({ queryKey:['admin-events'], queryFn: fetchAdminEvents });
  const invalidate = () => { qc.invalidateQueries({ queryKey:['admin-events'] }); qc.invalidateQueries({ queryKey:['events'] }); };
  const [editing, setEditing] = useState(null); // null | {…event} (id null = new)
  const save = useMutation({
    mutationFn: p => p.id ? updateAdminEvent(p) : createAdminEvent(p),
    onSuccess: () => { invalidate(); setEditing(null); },
  });
  const patch = useMutation({ mutationFn: updateAdminEvent, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteAdminEvent, onSuccess: invalidate });

  const inp = 'w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
  const toLocal = v => v ? String(v).replace(' ', 'T').slice(0, 16) : '';
  const set = k => e => setEditing(s => ({ ...s, [k]: e.target.value }));

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">Dated events shown on /events-workshops with public detail + registration pages.</p>
        <button onClick={()=>setEditing({ ...EVENT_BLANK })} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700">+ New Event</button>
      </div>

      {editing && (
        <form onSubmit={e=>{e.preventDefault(); save.mutate(editing);}} className="mb-6 rounded-2xl ring-1 ring-brand-100 bg-brand-50/40 p-5 grid gap-3 sm:grid-cols-2">
          <F label="Title *"><input required value={editing.title} onChange={set('title')} className={inp}/></F>
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <F label="Icon"><input value={editing.icon||''} onChange={set('icon')} className={inp}/></F>
            <F label="Category"><input value={editing.category||''} onChange={set('category')} className={inp} placeholder="e.g. Mind Sports"/></F>
          </div>
          <F label="Starts"><input type="datetime-local" value={toLocal(editing.starts_at)} onChange={set('starts_at')} className={inp}/></F>
          <F label="Ends"><input type="datetime-local" value={toLocal(editing.ends_at)} onChange={set('ends_at')} className={inp}/></F>
          <F label="Batch size"><input value={editing.batch_size||''} onChange={set('batch_size')} className={inp} placeholder="10–15 students"/></F>
          <F label="Session duration"><input value={editing.session_duration||''} onChange={set('session_duration')} className={inp} placeholder="1 hour per session"/></F>
          <F label="Schedule note"><input value={editing.schedule_note||''} onChange={set('schedule_note')} className={inp}/></F>
          <F label="Time note"><input value={editing.time_note||''} onChange={set('time_note')} className={inp} placeholder="8:00 am – 5:00 pm (Asia/Kolkata)"/></F>
          <div className="sm:col-span-2"><F label="Description"><textarea rows={3} value={editing.description||''} onChange={set('description')} className={inp}/></F></div>
          <F label="Status">
            <select value={editing.status||'upcoming'} onChange={set('status')} className={inp}>
              {['upcoming','completed','draft'].map(s=><option key={s}>{s}</option>)}
            </select>
          </F>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={save.isPending} className="rounded-lg bg-brand-600 text-white px-5 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">{editing.id?'Save changes':'Create event'}</button>
            <button type="button" onClick={()=>setEditing(null)} className="rounded-lg ring-1 ring-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
          </div>
          {save.isError && <p className="sm:col-span-2 text-xs text-red-600">Could not save — check the fields (end must be after start).</p>}
        </form>
      )}

      <div className="space-y-3">
        {isLoading ? <p className="text-slate-500 py-10 text-center">Loading events…</p>
        : !events.length ? <p className="text-slate-500 py-10 text-center">No events yet — create the first one.</p>
        : events.map(ev => (
          <div key={ev.id} className="rounded-2xl ring-1 ring-slate-100 bg-white p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xl">{ev.icon}</span>
              <span className="font-bold">{ev.title}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${eventBadge[ev.status]||''}`}>{ev.status}</span>
              {ev.starts_at && <span className="text-sm text-slate-500">{new Date(ev.starts_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}{ev.ends_at?` – ${new Date(ev.ends_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`:''}</span>}
              <a href={`/events/${ev.slug}`} target="_blank" rel="noreferrer" className="ml-auto text-xs font-semibold text-brand-600 hover:underline">View page ↗</a>
            </div>
            {ev.description && <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">{ev.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={()=>setEditing({ ...ev })} className="rounded-lg ring-1 ring-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:ring-brand-300">Edit</button>
              {ev.status !== 'completed' && <button onClick={()=>patch.mutate({ id:ev.id, status:'completed' })} className="rounded-lg ring-1 ring-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-green-700">Mark completed</button>}
              {ev.status !== 'upcoming' && <button onClick={()=>patch.mutate({ id:ev.id, status:'upcoming' })} className="rounded-lg ring-1 ring-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-green-700">Mark upcoming</button>}
              {ev.status !== 'draft' && <button onClick={()=>patch.mutate({ id:ev.id, status:'draft' })} className="rounded-lg ring-1 ring-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-amber-700">Unpublish</button>}
              <button onClick={()=>{ if(confirm(`Delete "${ev.title}"?`)) remove.mutate(ev.id); }} className="rounded-lg ring-1 ring-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-red-600 hover:ring-red-200">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const orderBadge = { pending:'bg-amber-50 text-amber-700', paid:'bg-green-50 text-green-700', cancelled:'bg-slate-100 text-slate-600' };

function OrdersPanel() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({ queryKey:['admin-orders', status], queryFn:()=>fetchAdminOrders(status) });
  const update = useMutation({ mutationFn: updateAdminOrder, onSuccess: ()=>qc.invalidateQueries({ queryKey:['admin-orders'] }) });
  const orders = data?.data ?? [];

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        {['','pending','paid','cancelled'].map(s => (
          <button key={s||'all'} onClick={()=>setStatus(s)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${status===s?'bg-brand-600 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            {s ? s[0].toUpperCase()+s.slice(1) : 'All'}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {isLoading ? <p className="text-slate-500 py-10 text-center">Loading orders…</p>
        : !orders.length ? <p className="text-slate-500 py-10 text-center">No orders{status ? ` with status “${status}”` : ''} yet.</p>
        : orders.map(o => (
          <div key={o.id} className="rounded-2xl ring-1 ring-slate-100 bg-white p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-bold">#{o.id}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${orderBadge[o.status]||'bg-slate-100 text-slate-600'}`}>{o.status}</span>
              <span className="text-sm text-slate-500">{new Date(o.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'})}</span>
              <span className="ml-auto font-heading font-extrabold text-brand-600">₹{Number(o.total).toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-2 text-sm text-slate-700">
              <strong>{o.first_name} {o.last_name||''}</strong> · {o.email}{o.phone ? ` · ${o.phone}` : ''}
              <span className="block text-xs text-slate-400 mt-0.5">{[o.address_1, o.address_2, o.city, o.state, o.postcode, o.country].filter(Boolean).join(', ')}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(o.items||[]).map(i => (
                <span key={i.id} className="rounded-full bg-slate-50 ring-1 ring-slate-100 px-3 py-1 text-xs text-slate-600">{i.name} · ₹{Number(i.price).toLocaleString('en-IN')}</span>
              ))}
            </div>
            {o.razorpay_payment_id && <p className="mt-2 text-xs text-slate-400">Razorpay payment: {o.razorpay_payment_id}</p>}
            {o.order_notes && <p className="mt-2 text-xs italic text-slate-500">“{o.order_notes}”</p>}
            <div className="mt-3 flex gap-2">
              {o.status !== 'paid' && (
                <button onClick={()=>update.mutate({ id:o.id, status:'paid' })} disabled={update.isPending}
                  className="inline-flex items-center gap-1 rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-green-700 disabled:opacity-60"><Check className="h-3.5 w-3.5"/>Mark paid</button>
              )}
              {o.status !== 'cancelled' && (
                <button onClick={()=>update.mutate({ id:o.id, status:'cancelled' })} disabled={update.isPending}
                  className="inline-flex items-center gap-1 rounded-lg bg-white ring-1 ring-slate-200 text-slate-600 px-3 py-1.5 text-xs font-bold hover:text-red-600 hover:ring-red-200 disabled:opacity-60"><X className="h-3.5 w-3.5"/>Cancel</button>
              )}
              {o.status !== 'pending' && (
                <button onClick={()=>update.mutate({ id:o.id, status:'pending' })} disabled={update.isPending}
                  className="rounded-lg bg-white ring-1 ring-slate-200 text-slate-600 px-3 py-1.5 text-xs font-bold hover:text-amber-600 hover:ring-amber-200 disabled:opacity-60">Reopen as pending</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ExamUpdatesPanel() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({ queryKey:['admin-exam-updates'], queryFn: fetchAdminExamUpdates });
  const [form, setForm] = useState({ title:'', body:'', exam_date:'', link_url:'' });
  const invalidate = () => { qc.invalidateQueries({queryKey:['admin-exam-updates']}); qc.invalidateQueries({queryKey:['exam-updates']}); };
  const create = useMutation({
    mutationFn: () => createExamUpdate({ ...form, exam_date: form.exam_date || null, link_url: form.link_url || null }),
    onSuccess: () => { setForm({title:'',body:'',exam_date:'',link_url:''}); invalidate(); },
  });
  const toggle = useMutation({ mutationFn: ({id, pub}) => updateExamUpdate(id, { is_published: pub }), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteExamUpdate, onSuccess: invalidate });
  const inp = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="mt-5 space-y-5">
      <form onSubmit={e=>{e.preventDefault();create.mutate();}} className="rounded-xl ring-1 ring-slate-100 bg-white p-4 space-y-2">
        <h3 className="font-bold text-sm">Publish an exam update</h3>
        <input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Title (e.g. JEE Main 2027 registration opens)" className={inp}/>
        <textarea rows={2} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Details (optional)" className={inp}/>
        <div className="grid sm:grid-cols-2 gap-2">
          <input type="date" value={form.exam_date} onChange={e=>setForm({...form,exam_date:e.target.value})} className={inp}/>
          <input value={form.link_url} onChange={e=>setForm({...form,link_url:e.target.value})} placeholder="Link (optional)" className={inp}/>
        </div>
        <button disabled={create.isPending} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          {create.isPending?'Publishing…':'Publish update'}
        </button>
      </form>

      <div className="space-y-2">
        {items.length ? items.map(u => (
          <div key={u.id} className="rounded-xl ring-1 ring-slate-100 bg-white p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-sm text-slate-800">{u.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{[u.exam_date && `Exam: ${u.exam_date}`, `added ${u.created_at}`].filter(Boolean).join(' · ')}</div>
              {u.body && <p className="text-sm text-slate-600 mt-1">{u.body}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={()=>toggle.mutate({id:u.id, pub:!u.is_published})}
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.is_published?'bg-green-50 text-green-700':'bg-slate-100 text-slate-500'}`}>
                {u.is_published?'Published':'Draft'}
              </button>
              <button onClick={()=>remove.mutate(u.id)} className="p-1.5 text-slate-400 hover:text-red-600" title="Delete"><X className="h-4 w-4"/></button>
            </div>
          </div>
        )) : <p className="text-slate-500 py-8 text-center">No exam updates yet.</p>}
      </div>
    </div>
  );
}

/** Single-series bars: brand hue carries magnitude; identity lives in the row label. */
function BarList({ title, items }) {
  const max = Math.max(1, ...items.map(i => i.count));
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-800 mb-3">{title}</h3>
      {items.length ? (
        <ul className="space-y-2">
          {items.map(i => (
            <li key={i.label} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-2" title={`${i.label}: ${i.count}`}>
              <span className="text-xs text-slate-600 truncate">{i.label}</span>
              <span className="h-3 rounded-r bg-brand-600" style={{ width: `${Math.max(2,(i.count/max)*100)}%` }}/>
              <span className="text-xs font-semibold text-slate-700 text-right tabular-nums">{i.count}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-slate-400">No data yet.</p>}
    </div>
  );
}

/** Monthly trend: one series, thin columns, direct value labels on hover via title. */
function TrendBars({ title, points }) {
  const max = Math.max(1, ...points.map(p => p.count));
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-800 mb-3">{title}</h3>
      <div className="flex items-end gap-2 h-24">
        {points.map(p => (
          <div key={p.month} className="flex-1 flex flex-col items-center gap-1" title={`${p.month}: ${p.count}`}>
            <span className="text-[10px] font-semibold text-slate-600 tabular-nums">{p.count}</span>
            <div className="w-full rounded-t bg-brand-600" style={{ height: `${Math.max(3,(p.count/max)*72)}px` }}/>
            <span className="text-[10px] text-slate-400">{p.month.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  const { data: d, isLoading } = useQuery({ queryKey:['admin-analytics'], queryFn: fetchAdminAnalytics });
  if (isLoading) return <p className="text-slate-500 py-10 text-center">Loading analytics…</p>;
  if (!d) return null;
  const t = d.totals;
  const TILES = [
    ['Parents', t.parents], ['Teachers', t.teachers, `${t.teachers_approved} approved · ${t.teachers_pending} pending`],
    ['Students', t.students], ['Listed tutors', t.tutors_listed],
    ['Demo requests', t.demos_total, `${t.demos_new} new · ${t.demos_converted} converted`],
    ['Active enrollments', t.enrollments_active], ['Classes logged', t.classes_logged],
    ['Awaiting action', t.proposals_pending + t.reschedules_pending, `${t.proposals_pending} proposals · ${t.reschedules_pending} reschedules`],
  ];

  return (
    <div className="mt-5 space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TILES.map(([label, n, sub]) => (
          <div key={label} className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-4">
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{n}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">{label}</div>
            {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <TrendBars title="Demo requests / month" points={d.trend.demos}/>
        <TrendBars title="Enrollments / month" points={d.trend.enrollments}/>
        <TrendBars title="Signups / month" points={d.trend.signups}/>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <BarList title="Demos by city" items={d.demos_by_city}/>
        <BarList title="Demos by subject" items={d.demos_by_subject}/>
        <BarList title="Listed tutors by city" items={d.tutors_by_city}/>
      </div>
    </div>
  );
}

function ProposalsPanel() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const { data } = useQuery({ queryKey:['admin-proposals', status], queryFn:()=>fetchAdminProposals(status) });
  const act = useMutation({ mutationFn:({id,s})=>decideProposal(id, s), onSuccess:()=>qc.invalidateQueries({queryKey:['admin-proposals']}) });
  const proposals = data?.data ?? [];
  const badge = { pending:'bg-amber-50 text-amber-700', approved:'bg-green-50 text-green-700', rejected:'bg-red-50 text-red-700' };

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        {['pending','approved','rejected',''].map(s => (
          <button key={s||'all'} onClick={()=>setStatus(s)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${status===s?'bg-brand-600 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{s?s[0].toUpperCase()+s.slice(1):'All'}</button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {proposals.length ? proposals.map(p => (
          <div key={p.id} className="rounded-xl ring-1 ring-slate-100 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-800">{p.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{p.teacher?.name} · {p.teacher?.email} · {p.created_at}</div>
                {p.description && <p className="text-sm text-slate-600 mt-1.5">{p.description}</p>}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${badge[p.status]||'bg-slate-100'}`}>{p.status}</span>
            </div>
            {p.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <button disabled={act.isPending} onClick={()=>act.mutate({id:p.id,s:'approved'})} className="inline-flex items-center gap-1 rounded-lg bg-green-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-60"><Check className="h-4 w-4"/>Approve — adds to their subjects</button>
                <button disabled={act.isPending} onClick={()=>act.mutate({id:p.id,s:'rejected'})} className="inline-flex items-center gap-1 rounded-lg ring-1 ring-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><X className="h-4 w-4"/>Reject</button>
              </div>
            )}
          </div>
        )) : <p className="text-slate-500 py-10 text-center">No course proposals.</p>}
      </div>
    </>
  );
}

function TeachersPanel() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const { data } = useQuery({ queryKey:['admin-teachers', status], queryFn:()=>fetchAdminTeachers(status) });
  const act = useMutation({ mutationFn:({id,s})=>approveTeacher(id, s), onSuccess:()=>qc.invalidateQueries({queryKey:['admin-teachers']}) });
  const teachers = data?.data ?? [];
  const badge = { pending:'bg-amber-50 text-amber-700', approved:'bg-green-50 text-green-700', rejected:'bg-red-50 text-red-700' };

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        {['pending','approved','rejected',''].map(s => (
          <button key={s||'all'} onClick={()=>setStatus(s)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${status===s?'bg-brand-600 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{s?s[0].toUpperCase()+s.slice(1):'All'}</button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {teachers.length ? teachers.map(t => (
          <div key={t.id} className="rounded-xl ring-1 ring-slate-100 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-800">{t.teacher?.name || 'Teacher'} <span className="text-slate-400 font-normal">· {t.teacher?.email}</span></div>
                <div className="text-sm text-slate-700 mt-0.5">{t.headline || <span className="text-slate-400">No headline yet</span>}</div>
                <div className="text-xs text-slate-500 mt-1">{[t.qualification, t.subjects && `Subjects: ${t.subjects}`, t.experience_years && `${t.experience_years}y exp`, t.fee_hourly && `₹${t.fee_hourly}/hr`, t.city, t.teaching_mode].filter(Boolean).join(' · ')}</div>
                {t.service_areas && <div className="text-xs text-slate-500 mt-0.5">Areas: {t.service_areas}</div>}
                {t.availability?.slots && <div className="text-xs text-slate-500 mt-0.5">Available: {(t.availability.days||[]).join(', ')} · {t.availability.slots}</div>}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${badge[t.status]||'bg-slate-100'}`}>{t.status}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button disabled={act.isPending} onClick={()=>act.mutate({id:t.id,s:'approved'})} className="inline-flex items-center gap-1 rounded-lg bg-green-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-60"><Check className="h-4 w-4"/>Approve</button>
              <button disabled={act.isPending} onClick={()=>act.mutate({id:t.id,s:'rejected'})} className="inline-flex items-center gap-1 rounded-lg ring-1 ring-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><X className="h-4 w-4"/>Reject</button>
            </div>
          </div>
        )) : <p className="text-slate-500 py-10 text-center">No teacher applications.</p>}
      </div>
    </>
  );
}

function DemoRow({ r }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tutorId, setTutorId] = useState(r.assigned_tutor?.id ? String(r.assigned_tutor.id) : '');
  const [plan, setPlan] = useState('');
  const { data: tutors = [] } = useQuery({ queryKey:['demo-tutors', r.id], queryFn:()=>fetchDemoTutors(r.id), enabled: open });
  const invalidate = () => qc.invalidateQueries({ queryKey:['admin-demos'] });
  const assign  = useMutation({ mutationFn:()=>assignDemo(r.id, { assigned_tutor_id: tutorId||null, status:'scheduled' }), onSuccess: invalidate });
  const convert = useMutation({ mutationFn:()=>convertDemo(r.id, { tutor_id: tutorId||null, plan: plan||null }), onSuccess: invalidate });

  return (
    <div className="rounded-xl ring-1 ring-slate-100 bg-white overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-slate-800 truncate">
            {r.course?.name || r.subject || 'General enquiry'}
            {r.student && <span className="text-slate-400 font-normal"> · for {r.student}</span>}
          </div>
          <div className="text-xs text-slate-500 truncate">{r.name} · {r.phone}{r.city?` · ${r.city}`:''} · {r.created_at}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${badge[r.status]||'bg-slate-100'}`}>{r.status}</span>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400"/> : <ChevronDown className="h-4 w-4 text-slate-400"/>}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50">
          <div className="text-xs text-slate-500">Email: {r.email} · Mode: {r.mode||'—'} · Grade: {r.grade||'—'} {r.account && <>· <span className="text-brand-700 font-semibold">registered account</span></>}</div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assign a tutor (matched by subject/city)</label>
            <select value={tutorId} onChange={e=>setTutorId(e.target.value)} className="w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm">
              <option value="">— Select tutor —</option>
              {tutors.map(t => <option key={t.id} value={t.id}>{t.name} · {(t.subjects||[]).slice(0,2).join(', ')} · {t.city}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button disabled={assign.isPending} onClick={()=>assign.mutate()} className="inline-flex items-center gap-1.5 rounded-lg bg-white ring-1 ring-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60">
              <UserCheck className="h-4 w-4 text-brand-600"/> Assign & schedule
            </button>
            <input value={plan} onChange={e=>setPlan(e.target.value)} placeholder="Plan (e.g. Starter)" className="rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm"/>
            <button disabled={convert.isPending || !r.student} title={!r.student?'Needs a linked student':''} onClick={()=>convert.mutate()} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-3 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-50">
              <GraduationCap className="h-4 w-4"/> Convert to enrollment
            </button>
          </div>
          {convert.isError && <p className="text-xs text-red-600">{convert.error?.response?.data?.message || 'Could not convert.'}</p>}
          {convert.isSuccess && <p className="text-xs text-green-600 font-semibold">Enrolled ✓</p>}
          {!r.student && <p className="text-xs text-amber-600">This request has no linked student profile, so it can't be converted to an enrollment.</p>}
        </div>
      )}
    </div>
  );
}
