import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Plus, Trash2, Upload, ShieldCheck, UserPlus, FileText } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import {
  fetchStudents, createStudent, deleteStudent,
  fetchKyc, uploadKyc, deleteKyc,
} from '../lib/api.js';

const inp = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
const roleLabel = { parent:'Parent', student:'Student', teacher:'Teacher', admin:'Admin' };

export default function DashboardPage() {
  const { user, isAuthed, isLoading, logout } = useAuth();

  if (isLoading) return <div className="mx-auto max-w-5xl px-4 py-20 text-slate-500">Loading your dashboard…</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">My Account</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Hi, {user.name.split(' ')[0]} 👋</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-2.5 py-0.5 text-xs font-semibold">{roleLabel[user.role]||user.role}</span>
            <span>{user.email}</span>{user.phone && <span>· {user.phone}</span>}
          </div>
        </div>
        <button onClick={()=>logout()} className="inline-flex items-center gap-1.5 rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <LogOut className="h-4 w-4"/> Sign out
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {user.role !== 'teacher' && <StudentsCard />}
        <KycCard />
      </div>
    </div>
  );
}

function StudentsCard() {
  const qc = useQueryClient();
  const { data: students = [], isLoading } = useQuery({ queryKey:['students'], queryFn: fetchStudents });
  const [form, setForm] = useState({ name:'', grade:'', board:'', subjects:'' });
  const [err, setErr] = useState('');
  const create = useMutation({
    mutationFn: () => createStudent(form),
    onSuccess: () => { setForm({name:'',grade:'',board:'',subjects:''}); setErr(''); qc.invalidateQueries({queryKey:['students']}); },
    onError: (e) => setErr(Object.values(e?.response?.data?.errors||{})[0]?.[0] || 'Could not add student.'),
  });
  const remove = useMutation({ mutationFn: deleteStudent, onSuccess: () => qc.invalidateQueries({queryKey:['students']}) });
  const set = k => e => setForm({...form,[k]:e.target.value});

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><UserPlus className="h-5 w-5 text-brand-600"/>My students</h2>

      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : students.length ? (
        <ul className="space-y-2 mb-5">
          {students.map(s => (
            <li key={s.id} className="flex items-center justify-between rounded-lg ring-1 ring-slate-100 px-3 py-2">
              <div>
                <div className="font-semibold text-sm text-slate-800">{s.name}</div>
                <div className="text-xs text-slate-500">{[s.grade, s.board, s.subjects].filter(Boolean).join(' · ') || 'No details yet'}</div>
              </div>
              <button onClick={()=>remove.mutate(s.id)} className="p-1.5 text-slate-400 hover:text-red-600" title="Remove"><Trash2 className="h-4 w-4"/></button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500 mb-5">No students yet. Add your child below.</p>}

      {err && <div className="mb-3 rounded-md bg-red-50 text-red-700 text-xs p-2">{err}</div>}
      <form onSubmit={e=>{e.preventDefault();create.mutate();}} className="space-y-2">
        <input required placeholder="Student name" value={form.name} onChange={set('name')} className={inp}/>
        <div className="grid grid-cols-3 gap-2">
          <input placeholder="Grade" value={form.grade} onChange={set('grade')} className={inp}/>
          <input placeholder="Board" value={form.board} onChange={set('board')} className={inp}/>
          <input placeholder="Subjects" value={form.subjects} onChange={set('subjects')} className={inp}/>
        </div>
        <button disabled={create.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <Plus className="h-4 w-4"/> {create.isPending?'Adding…':'Add student'}
        </button>
      </form>
    </section>
  );
}

function KycCard() {
  const qc = useQueryClient();
  const fileRef = useRef();
  const [type, setType] = useState('aadhaar');
  const [err, setErr] = useState('');
  const { data: docs = [], isLoading } = useQuery({ queryKey:['kyc'], queryFn: fetchKyc });
  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('type', type);
      fd.append('file', fileRef.current.files[0]);
      return uploadKyc(fd);
    },
    onSuccess: () => { if(fileRef.current) fileRef.current.value=''; setErr(''); qc.invalidateQueries({queryKey:['kyc']}); },
    onError: (e) => setErr(Object.values(e?.response?.data?.errors||{})[0]?.[0] || 'Upload failed.'),
  });
  const remove = useMutation({ mutationFn: deleteKyc, onSuccess: () => qc.invalidateQueries({queryKey:['kyc']}) });
  const statusColor = { pending:'bg-amber-50 text-amber-700', verified:'bg-green-50 text-green-700', rejected:'bg-red-50 text-red-700' };

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><ShieldCheck className="h-5 w-5 text-brand-600"/>KYC documents</h2>
      <p className="text-xs text-slate-500 mb-4">Upload Aadhaar, PAN, a photo or certificates. Files are stored privately and reviewed by our team.</p>

      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : docs.length ? (
        <ul className="space-y-2 mb-5">
          {docs.map(d => (
            <li key={d.id} className="flex items-center justify-between rounded-lg ring-1 ring-slate-100 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-slate-400 shrink-0"/>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-800 capitalize">{d.type}</div>
                  <div className="text-xs text-slate-500 truncate">{d.original_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[d.status]||'bg-slate-100 text-slate-600'}`}>{d.status}</span>
                <button onClick={()=>remove.mutate(d.id)} className="p-1.5 text-slate-400 hover:text-red-600" title="Remove"><Trash2 className="h-4 w-4"/></button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500 mb-5">No documents uploaded yet.</p>}

      {err && <div className="mb-3 rounded-md bg-red-50 text-red-700 text-xs p-2">{err}</div>}
      <form onSubmit={e=>{e.preventDefault(); if(fileRef.current?.files[0]) upload.mutate();}} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select value={type} onChange={e=>setType(e.target.value)} className={inp}>
            {['aadhaar','pan','photo','certificate','other'].map(t=><option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" required className="text-sm text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold"/>
        </div>
        <button disabled={upload.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <Upload className="h-4 w-4"/> {upload.isPending?'Uploading…':'Upload document'}
        </button>
        <p className="text-xs text-slate-400">JPG, PNG or PDF · up to 5 MB.</p>
      </form>
    </section>
  );
}
