import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, ChevronDown, ChevronUp, UserCheck, GraduationCap, Check, X } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { fetchAdminDemoRequests, fetchDemoTutors, assignDemo, convertDemo, fetchAdminTeachers, approveTeacher, fetchAdminProposals, decideProposal } from '../lib/api.js';

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

      <div className="mt-5 flex gap-2 border-b border-slate-100">
        {[['demos','Demo Requests'],['teachers','Teacher Applications'],['proposals','Course Proposals']].map(([k,label]) => (
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
      ) : tab === 'teachers' ? (
        <TeachersPanel />
      ) : (
        <ProposalsPanel />
      )}
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
