import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LogOut, Plus, Trash2, Upload, ShieldCheck, UserPlus, FileText, CalendarClock, GraduationCap, Briefcase, Save, Users, BookOpen, NotebookPen, ChevronDown, ChevronUp, ListChecks, FolderOpen, Link2, Download, Lightbulb } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import {
  fetchStudents, createStudent, deleteStudent,
  fetchKyc, uploadKyc, deleteKyc, fetchMyDemoRequests, fetchMyEnrollments,
  fetchTeacherProfile, updateTeacherProfile,
  fetchTeacherStudents, fetchTeacherDemos, fetchClassLogs, addClassLog,
  fetchCurriculum, addCurriculumItem, updateCurriculumItem, deleteCurriculumItem,
  fetchMaterials, uploadMaterial, deleteMaterial, downloadMaterial,
  fetchMyProposals, submitProposal, fetchMyEnrollmentDetail,
  requestReschedule, fetchTeacherReschedules, decideReschedule,
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

      {user.role === 'teacher' ? (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <TeacherProfileCard />
            <KycCard />
          </div>
          <TeacherClassroom />
          <div className="grid lg:grid-cols-2 gap-6">
            <TeacherReschedulesCard />
            <TeacherProposalsCard />
          </div>
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <RequestsCard />
            <EnrollmentsCard />
          </div>
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <StudentsCard />
            <KycCard />
          </div>
        </>
      )}
    </div>
  );
}

function TeacherProfileCard() {
  const qc = useQueryClient();
  const { data: p, isLoading } = useQuery({ queryKey:['teacher-profile'], queryFn: fetchTeacherProfile });
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const value = form ?? (p ? {
    headline:p.headline||'', qualification:p.qualification||'', subjects:p.subjects||'', languages:p.languages||'',
    experience_years:p.experience_years||'', fee_hourly:p.fee_hourly||'', city:p.city||'', teaching_mode:p.teaching_mode||'online',
    service_areas:p.service_areas||'', bio:p.bio||'', slots:p.availability?.slots||'', days:p.availability?.days||[],
  } : null);
  const set = k => e => { setSaved(false); setForm({ ...value, [k]: e.target.value }); };
  const toggleDay = d => { setSaved(false); const days = value.days.includes(d) ? value.days.filter(x=>x!==d) : [...value.days, d]; setForm({ ...value, days }); };
  const save = useMutation({
    mutationFn: () => updateTeacherProfile({ ...value, experience_years: value.experience_years?Number(value.experience_years):null, fee_hourly: value.fee_hourly?Number(value.fee_hourly):null, availability:{ days:value.days, slots:value.slots } }),
    onSuccess: () => { setSaved(true); qc.invalidateQueries({queryKey:['teacher-profile']}); },
  });
  const statusBadge = { pending:'bg-amber-50 text-amber-700', approved:'bg-green-50 text-green-700', rejected:'bg-red-50 text-red-700' };
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  if (isLoading || !value) return <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6 text-sm text-slate-400">Loading profile…</section>;

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold flex items-center gap-2"><Briefcase className="h-5 w-5 text-brand-600"/>Teacher profile</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge[p.status]||'bg-slate-100'}`}>{p.status}</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">Complete your profile so our team can review and approve you.</p>
      <form onSubmit={e=>{e.preventDefault();save.mutate();}} className="space-y-3">
        <input value={value.headline} onChange={set('headline')} placeholder="Headline (e.g. Physics & Math mentor)" className={inp}/>
        <div className="grid grid-cols-2 gap-2">
          <input value={value.qualification} onChange={set('qualification')} placeholder="Qualification" className={inp}/>
          <input value={value.subjects} onChange={set('subjects')} placeholder="Subjects (comma-sep)" className={inp}/>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" value={value.experience_years} onChange={set('experience_years')} placeholder="Years exp." className={inp}/>
          <input type="number" value={value.fee_hourly} onChange={set('fee_hourly')} placeholder="₹/hour" className={inp}/>
          <input value={value.languages} onChange={set('languages')} placeholder="Languages" className={inp}/>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={value.teaching_mode} onChange={set('teaching_mode')} className={inp}>
            <option value="online">Online</option><option value="home">Home tuition</option><option value="both">Online & Home</option>
          </select>
          <input value={value.city} onChange={set('city')} placeholder="City" className={inp}/>
        </div>
        <input value={value.service_areas} onChange={set('service_areas')} placeholder="Service areas / pincodes (e.g. 700001, Salt Lake)" className={inp}/>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Availability</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {DAYS.map(d => <button type="button" key={d} onClick={()=>toggleDay(d)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value.days.includes(d)?'bg-brand-600 text-white':'bg-slate-100 text-slate-600'}`}>{d}</button>)}
          </div>
          <input value={value.slots} onChange={set('slots')} placeholder="Time slots (e.g. 5-8pm weekdays)" className={inp}/>
        </div>
        <textarea rows={3} value={value.bio} onChange={set('bio')} placeholder="Short bio" className={inp}/>
        <div className="flex items-center gap-3">
          <button disabled={save.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
            <Save className="h-4 w-4"/> {save.isPending?'Saving…':'Save profile'}
          </button>
          {saved && <span className="text-sm text-green-600 font-semibold">Saved ✓</span>}
        </div>
      </form>
    </section>
  );
}

function TeacherClassroom() {
  const { data: profile } = useQuery({ queryKey:['teacher-profile'], queryFn: fetchTeacherProfile });
  const approved = profile?.status === 'approved';
  const { data: roster = [], isLoading } = useQuery({ queryKey:['teacher-students'], queryFn: fetchTeacherStudents, enabled: approved });
  const { data: demos = [] } = useQuery({ queryKey:['teacher-demos'], queryFn: fetchTeacherDemos, enabled: approved });

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><Users className="h-5 w-5 text-brand-600"/>My classroom</h2>
      <p className="text-xs text-slate-500 mb-4">Students assigned to you, their upcoming demos, and the class progress you log.</p>

      {!approved ? (
        <div className="rounded-lg bg-amber-50 text-amber-800 text-sm p-4">
          Your classroom unlocks once our team approves your teacher profile. Complete your profile and KYC above to speed things up.
        </div>
      ) : (
        <>
          {demos.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Upcoming demos</h3>
              <ul className="divide-y divide-slate-100">
                {demos.map(d => (
                  <li key={d.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{d.course?.name || d.subject || 'Demo class'}</div>
                      <div className="text-xs text-slate-500">{[d.student, d.grade, d.mode, d.city].filter(Boolean).join(' · ')}</div>
                    </div>
                    <span className="text-xs text-slate-500">{d.scheduled_at ? new Date(d.scheduled_at).toLocaleString() : 'To be scheduled'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">My students</h3>
          {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : roster.length ? (
            <ul className="space-y-2">
              {roster.map(e => <RosterRow key={e.id} e={e} />)}
            </ul>
          ) : <p className="text-sm text-slate-500">No students assigned yet. Once a demo is converted to an enrollment, your students appear here.</p>}
        </>
      )}
    </section>
  );
}

function RosterRow({ e }) {
  const [open, setOpen] = useState(false);
  const statusColor = { active:'bg-green-50 text-green-700', paused:'bg-amber-50 text-amber-700', completed:'bg-blue-50 text-blue-700', cancelled:'bg-slate-100 text-slate-600' };
  return (
    <li className="rounded-lg ring-1 ring-slate-100 overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-slate-800">{e.student || 'Student'}</div>
          <div className="text-xs text-slate-500">{[e.course, e.plan, `${e.classes_count||0} class${e.classes_count===1?'':'es'} logged`, e.last_class_on && `last ${e.last_class_on}`].filter(Boolean).join(' · ')}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor[e.status]||'bg-slate-100 text-slate-600'}`}>{e.status}</span>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400"/> : <ChevronDown className="h-4 w-4 text-slate-400"/>}
        </div>
      </button>
      {open && <ClassroomTabs enrollmentId={e.id} />}
    </li>
  );
}

function ClassroomTabs({ enrollmentId }) {
  const [tab, setTab] = useState('log');
  const tabs = [['log','Class log',BookOpen],['curriculum','Curriculum',ListChecks],['materials','Materials',FolderOpen]];
  return (
    <div className="border-t border-slate-100 bg-slate-50">
      <div className="flex gap-1 px-3 pt-2">
        {tabs.map(([k,label,Icon]) => (
          <button key={k} onClick={()=>setTab(k)} className={`inline-flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-bold ${tab===k?'bg-white text-brand-700 ring-1 ring-slate-100 ring-b-0':'text-slate-500 hover:text-slate-700'}`}>
            <Icon className="h-3.5 w-3.5"/>{label}
          </button>
        ))}
      </div>
      {tab==='log' && <ClassLogPanel enrollmentId={enrollmentId} />}
      {tab==='curriculum' && <CurriculumPanel enrollmentId={enrollmentId} />}
      {tab==='materials' && <MaterialsPanel enrollmentId={enrollmentId} />}
    </div>
  );
}

function CurriculumPanel({ enrollmentId }) {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey:['curriculum', enrollmentId], queryFn:()=>fetchCurriculum(enrollmentId) });
  const [form, setForm] = useState({ topic:'', details:'' });
  const invalidate = () => qc.invalidateQueries({queryKey:['curriculum', enrollmentId]});
  const add = useMutation({ mutationFn:()=>addCurriculumItem(enrollmentId, form), onSuccess:()=>{ setForm({topic:'',details:''}); invalidate(); } });
  const setStatus = useMutation({ mutationFn:({id,status})=>updateCurriculumItem(enrollmentId, id, {status}), onSuccess:invalidate });
  const remove = useMutation({ mutationFn:(id)=>deleteCurriculumItem(enrollmentId, id), onSuccess:invalidate });
  const statusColor = { pending:'bg-slate-100 text-slate-600', in_progress:'bg-blue-50 text-blue-700', done:'bg-green-50 text-green-700' };
  const NEXT = { pending:'in_progress', in_progress:'done', done:'pending' };

  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-slate-500">Define the curriculum classwise — tap a status chip to advance it (pending → in progress → done). Parents see this as the progress tracker.</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : items.length ? (
        <ol className="space-y-1.5">
          {items.map((it, i) => (
            <li key={it.id} className="flex items-center gap-2 rounded-md bg-white ring-1 ring-slate-100 px-3 py-2">
              <span className="text-xs font-bold text-slate-400 w-5">{i+1}.</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-slate-800">{it.topic}</div>
                {it.details && <div className="text-xs text-slate-500">{it.details}</div>}
              </div>
              <button onClick={()=>setStatus.mutate({id:it.id, status:NEXT[it.status]})} className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor[it.status]}`} title="Click to advance">
                {it.status.replace('_',' ')}
              </button>
              <button onClick={()=>remove.mutate(it.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5"/></button>
            </li>
          ))}
        </ol>
      ) : <p className="text-sm text-slate-500">No curriculum yet — add the first topic below.</p>}
      <form onSubmit={e=>{e.preventDefault();add.mutate();}} className="space-y-2">
        <input required value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} placeholder="Topic (e.g. Quadratic equations)" className={inp}/>
        <input value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="Details (optional)" className={inp}/>
        <button disabled={add.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <Plus className="h-4 w-4"/>{add.isPending?'Adding…':'Add topic'}
        </button>
      </form>
    </div>
  );
}

function MaterialsPanel({ enrollmentId }) {
  const qc = useQueryClient();
  const fileRef = useRef();
  const { data: items = [], isLoading } = useQuery({ queryKey:['materials', enrollmentId], queryFn:()=>fetchMaterials(enrollmentId) });
  const [form, setForm] = useState({ type:'note', title:'', link_url:'' });
  const [err, setErr] = useState('');
  const invalidate = () => qc.invalidateQueries({queryKey:['materials', enrollmentId]});
  const add = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('type', form.type); fd.append('title', form.title);
      if (form.link_url) fd.append('link_url', form.link_url);
      if (fileRef.current?.files[0]) fd.append('file', fileRef.current.files[0]);
      return uploadMaterial(enrollmentId, fd);
    },
    onSuccess: () => { setForm({type:'note',title:'',link_url:''}); if(fileRef.current) fileRef.current.value=''; setErr(''); invalidate(); },
    onError: (e) => setErr(e?.response?.data?.message || Object.values(e?.response?.data?.errors||{})[0]?.[0] || 'Upload failed.'),
  });
  const remove = useMutation({ mutationFn:(id)=>deleteMaterial(enrollmentId, id), onSuccess:invalidate });
  const TYPES = [['note','Note'],['ppt','PPT'],['lesson_plan','Lesson plan'],['question_bank','Question bank'],['homework','Homework'],['other','Other']];

  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-slate-500">Share notes, PPTs, lesson plans, question banks or homework — parents can download them from their dashboard.</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : items.length ? (
        <ul className="space-y-1.5">
          {items.map(m => (
            <li key={m.id} className="flex items-center gap-2 rounded-md bg-white ring-1 ring-slate-100 px-3 py-2">
              <FileText className="h-4 w-4 text-slate-400 shrink-0"/>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-slate-800">{m.title}</div>
                <div className="text-xs text-slate-500 capitalize">{m.type.replace('_',' ')}{m.original_name && ` · ${m.original_name}`}</div>
              </div>
              {m.has_file && <button onClick={()=>downloadMaterial(m.id, m.original_name)} className="p-1.5 text-slate-400 hover:text-brand-600" title="Download"><Download className="h-4 w-4"/></button>}
              {m.link_url && <a href={m.link_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-brand-600" title="Open link"><Link2 className="h-4 w-4"/></a>}
              <button onClick={()=>remove.mutate(m.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5"/></button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">Nothing shared yet.</p>}
      {err && <div className="rounded-md bg-red-50 text-red-700 text-xs p-2">{err}</div>}
      <form onSubmit={e=>{e.preventDefault();add.mutate();}} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className={inp}>
            {TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
          <input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Title" className={inp}/>
        </div>
        <div className="grid grid-cols-2 gap-2 items-center">
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt" className="text-sm text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold"/>
          <input value={form.link_url} onChange={e=>setForm({...form,link_url:e.target.value})} placeholder="…or paste a link (video, Drive)" className={inp}/>
        </div>
        <button disabled={add.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <Upload className="h-4 w-4"/>{add.isPending?'Sharing…':'Share material'}
        </button>
      </form>
    </div>
  );
}

function TeacherProposalsCard() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey:['my-proposals'], queryFn: fetchMyProposals });
  const [form, setForm] = useState({ title:'', description:'' });
  const add = useMutation({
    mutationFn: () => submitProposal(form),
    onSuccess: () => { setForm({title:'',description:''}); qc.invalidateQueries({queryKey:['my-proposals']}); },
  });
  const badge = { pending:'bg-amber-50 text-amber-700', approved:'bg-green-50 text-green-700', rejected:'bg-red-50 text-red-700' };

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><Lightbulb className="h-5 w-5 text-brand-600"/>Propose a course</h2>
      <p className="text-xs text-slate-500 mb-4">Want to teach a new subject? Propose it — once our team approves, it's added to your profile.</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : items.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {items.map(p => (
            <li key={p.id} className="flex items-center justify-between rounded-md ring-1 ring-slate-100 px-3 py-2">
              <span className="font-semibold text-sm text-slate-800">{p.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${badge[p.status]||'bg-slate-100'}`}>{p.status}</span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={e=>{e.preventDefault();add.mutate();}} className="space-y-2">
        <input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Subject / course title (e.g. Astronomy)" className={inp}/>
        <textarea rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Short description (optional)" className={inp}/>
        <button disabled={add.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <Plus className="h-4 w-4"/>{add.isPending?'Submitting…':'Submit proposal'}
        </button>
      </form>
    </section>
  );
}

function ClassLogPanel({ enrollmentId }) {
  const qc = useQueryClient();
  const { data: logs = [], isLoading } = useQuery({ queryKey:['class-logs', enrollmentId], queryFn:()=>fetchClassLogs(enrollmentId) });
  const today = new Date().toISOString().slice(0,10);
  const empty = { topic:'', held_on:today, duration_min:'', homework:'', notes:'', status:'completed' };
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState('');
  const set = k => e => setForm({ ...form, [k]: e.target.value });
  const add = useMutation({
    mutationFn: () => addClassLog(enrollmentId, { ...form, duration_min: form.duration_min?Number(form.duration_min):null }),
    onSuccess: () => { setForm(empty); setErr(''); qc.invalidateQueries({queryKey:['class-logs', enrollmentId]}); qc.invalidateQueries({queryKey:['teacher-students']}); },
    onError: (e) => setErr(Object.values(e?.response?.data?.errors||{})[0]?.[0] || 'Could not save the class.'),
  });
  const statusColor = { completed:'bg-green-50 text-green-700', scheduled:'bg-blue-50 text-blue-700', missed:'bg-red-50 text-red-700' };

  return (
    <div className="p-3 space-y-3">
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : logs.length ? (
        <ul className="space-y-1.5">
          {logs.map(l => (
            <li key={l.id} className="rounded-md bg-white ring-1 ring-slate-100 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-slate-800">{l.topic}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500">{l.held_on}{l.duration_min?` · ${l.duration_min}m`:''}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[l.status]||'bg-slate-100 text-slate-600'}`}>{l.status}</span>
                </div>
              </div>
              {(l.homework || l.notes) && <div className="text-xs text-slate-500 mt-1">{[l.homework && `HW: ${l.homework}`, l.notes].filter(Boolean).join(' · ')}</div>}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">No classes logged yet.</p>}

      {err && <div className="rounded-md bg-red-50 text-red-700 text-xs p-2">{err}</div>}
      <form onSubmit={ev=>{ev.preventDefault();add.mutate();}} className="space-y-2">
        <input required value={form.topic} onChange={set('topic')} placeholder="Topic covered (e.g. Quadratic equations)" className={inp}/>
        <div className="grid grid-cols-3 gap-2">
          <input type="date" required value={form.held_on} onChange={set('held_on')} className={inp}/>
          <input type="number" value={form.duration_min} onChange={set('duration_min')} placeholder="Mins" className={inp}/>
          <select value={form.status} onChange={set('status')} className={inp}>
            <option value="completed">Completed</option><option value="scheduled">Scheduled</option><option value="missed">Missed</option>
          </select>
        </div>
        <input value={form.homework} onChange={set('homework')} placeholder="Homework assigned (optional)" className={inp}/>
        <textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Notes / progress (optional)" className={inp}/>
        <button disabled={add.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          <NotebookPen className="h-4 w-4"/> {add.isPending?'Saving…':'Log this class'}
        </button>
      </form>
    </div>
  );
}

function EnrollmentsCard() {
  const { data: items = [], isLoading } = useQuery({ queryKey:['my-enrollments'], queryFn: fetchMyEnrollments });
  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><GraduationCap className="h-5 w-5 text-brand-600"/>My enrollments</h2>
      <p className="text-xs text-slate-500 mb-4">Open a class to see the teacher, curriculum progress, class history and shared materials.</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : items.length ? (
        <ul className="space-y-2">
          {items.map(e => <ParentEnrollmentRow key={e.id} e={e} />)}
        </ul>
      ) : <p className="text-sm text-slate-500">No active enrollments yet. Once you complete a demo, your enrolled classes appear here.</p>}
    </section>
  );
}

function ParentEnrollmentRow({ e }) {
  const [open, setOpen] = useState(false);
  const statusColor = { active:'bg-green-50 text-green-700', paused:'bg-amber-50 text-amber-700', completed:'bg-blue-50 text-blue-700', cancelled:'bg-slate-100 text-slate-600' };
  return (
    <li className="rounded-lg ring-1 ring-slate-100 overflow-hidden">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-slate-800">{e.course?.name || e.plan || 'Enrollment'}</div>
          <div className="text-xs text-slate-500">{[e.student, e.tutor?.name && `with ${e.tutor.name}`, e.plan].filter(Boolean).join(' · ')}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor[e.status]||'bg-slate-100 text-slate-600'}`}>{e.status}</span>
          {open ? <ChevronUp className="h-4 w-4 text-slate-400"/> : <ChevronDown className="h-4 w-4 text-slate-400"/>}
        </div>
      </button>
      {open && <ParentEnrollmentDetail id={e.id} />}
    </li>
  );
}

function ParentEnrollmentDetail({ id }) {
  const { data: d, isLoading } = useQuery({ queryKey:['my-enrollment', id], queryFn:()=>fetchMyEnrollmentDetail(id) });
  const curStatus = { pending:'bg-slate-100 text-slate-500', in_progress:'bg-blue-50 text-blue-700', done:'bg-green-50 text-green-700' };
  const logStatus = { completed:'bg-green-50 text-green-700', scheduled:'bg-blue-50 text-blue-700', missed:'bg-red-50 text-red-700' };
  if (isLoading) return <div className="border-t border-slate-100 bg-slate-50 p-4 text-sm text-slate-400">Loading…</div>;
  if (!d) return null;
  const done = (d.curriculum||[]).filter(c=>c.status==='done').length;

  return (
    <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
      {d.teacher && (
        <div className="flex items-center gap-3 rounded-lg bg-white ring-1 ring-slate-100 p-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold overflow-hidden shrink-0">
            {d.teacher.image_url ? <img src={d.teacher.image_url} alt="" className="w-full h-full object-cover"/> : (d.teacher.name||'?')[0]}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-slate-900">{d.teacher.name}</div>
            <div className="text-xs text-slate-500">{[d.teacher.qualification, d.teacher.experience_years && `${d.teacher.experience_years}y exp`, (d.teacher.subjects||[]).slice(0,3).join(', '), d.teacher.city].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Curriculum progress</h4>
          {d.curriculum?.length > 0 && <span className="text-xs font-semibold text-slate-500">{done}/{d.curriculum.length} done</span>}
        </div>
        {d.curriculum?.length ? (
          <ol className="space-y-1">
            {d.curriculum.map((c,i) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span className="text-xs font-bold text-slate-400 w-4">{i+1}.</span>
                <span className="flex-1 text-slate-700">{c.topic}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${curStatus[c.status]}`}>{c.status.replace('_',' ')}</span>
              </li>
            ))}
          </ol>
        ) : <p className="text-xs text-slate-400">The teacher hasn't published a curriculum yet.</p>}
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Class history</h4>
        {d.classes?.length ? (
          <ul className="space-y-1">
            {d.classes.map(l => (
              <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-700 truncate">{l.topic}</span>
                <span className="flex items-center gap-2 shrink-0 text-xs text-slate-500">{l.held_on}<span className={`rounded-full px-2 py-0.5 font-semibold ${logStatus[l.status]||'bg-slate-100'}`}>{l.status}</span></span>
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-slate-400">No classes logged yet.</p>}
      </div>

      <RescheduleBlock id={id} reschedules={d.reschedules || []} />

      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Materials from the teacher</h4>
        {d.materials?.length ? (
          <ul className="space-y-1">
            {d.materials.map(m => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0"/>
                <span className="flex-1 text-slate-700 truncate">{m.title} <span className="text-xs text-slate-400 capitalize">({m.type.replace('_',' ')})</span></span>
                {m.has_file && <button onClick={()=>downloadMaterial(m.id, m.original_name)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"><Download className="h-3.5 w-3.5"/>Download</button>}
                {m.link_url && <a href={m.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"><Link2 className="h-3.5 w-3.5"/>Open</a>}
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-slate-400">Nothing shared yet.</p>}
      </div>
    </div>
  );
}

function RequestsCard() {
  const { data: reqs = [], isLoading } = useQuery({ queryKey:['my-demo-requests'], queryFn: fetchMyDemoRequests });
  const statusColor = { new:'bg-amber-50 text-amber-700', scheduled:'bg-blue-50 text-blue-700', converted:'bg-green-50 text-green-700', enrolled:'bg-green-50 text-green-700', closed:'bg-slate-100 text-slate-600' };

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><CalendarClock className="h-5 w-5 text-brand-600"/>My demo requests</h2>
        <Link to="/book-demo" className="text-sm font-semibold text-brand-600 hover:text-brand-700">+ Book a demo</Link>
      </div>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : reqs.length ? (
        <ul className="divide-y divide-slate-100">
          {reqs.map(r => (
            <li key={r.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-semibold text-sm text-slate-800">{r.course?.name || r.subject || 'General enquiry'}</div>
                <div className="text-xs text-slate-500">
                  {[r.student, r.grade, r.mode].filter(Boolean).join(' · ')}{r.created_at && ` · requested ${r.created_at}`}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor[r.status]||'bg-slate-100 text-slate-600'}`}>{r.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No demo requests yet. <Link to="/book-demo" className="text-brand-600 font-semibold">Book your first free demo →</Link></p>
      )}
    </section>
  );
}

function RescheduleBlock({ id, reschedules }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ preferred_date:'', reason:'' });
  const send = useMutation({
    mutationFn: () => requestReschedule(id, { preferred_date: form.preferred_date || null, reason: form.reason || null }),
    onSuccess: () => { setForm({preferred_date:'',reason:''}); setShowForm(false); qc.invalidateQueries({queryKey:['my-enrollment', id]}); },
  });
  const badge = { pending:'bg-amber-50 text-amber-700', accepted:'bg-green-50 text-green-700', declined:'bg-red-50 text-red-700' };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Reschedule requests</h4>
        <button onClick={()=>setShowForm(s=>!s)} className="text-xs font-semibold text-brand-600 hover:text-brand-700">{showForm?'Cancel':'+ Request reschedule'}</button>
      </div>
      {reschedules.length > 0 && (
        <ul className="space-y-1 mb-2">
          {reschedules.map(r => (
            <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-700 truncate">{[r.preferred_date && `Prefer ${r.preferred_date}`, r.reason].filter(Boolean).join(' — ') || `Requested ${r.created_at}`}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize shrink-0 ${badge[r.status]||'bg-slate-100'}`}>{r.status}</span>
            </li>
          ))}
        </ul>
      )}
      {showForm && (
        <form onSubmit={e=>{e.preventDefault();send.mutate();}} className="space-y-2 rounded-lg bg-white ring-1 ring-slate-100 p-3">
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.preferred_date} onChange={e=>setForm({...form,preferred_date:e.target.value})} className={inp}/>
            <input value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Reason (optional)" className={inp}/>
          </div>
          {send.isError && <p className="text-xs text-red-600">Could not send — check the date (today or later).</p>}
          <button disabled={send.isPending} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-xs font-bold hover:bg-brand-700 disabled:opacity-60">
            {send.isPending?'Sending…':'Send to teacher'}
          </button>
        </form>
      )}
      {!showForm && reschedules.length === 0 && <p className="text-xs text-slate-400">Need to move a class? Send your teacher a reschedule request.</p>}
    </div>
  );
}

function TeacherReschedulesCard() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey:['teacher-reschedules'], queryFn: fetchTeacherReschedules });
  const act = useMutation({ mutationFn:({id,s})=>decideReschedule(id, s), onSuccess:()=>qc.invalidateQueries({queryKey:['teacher-reschedules']}) });
  const badge = { pending:'bg-amber-50 text-amber-700', accepted:'bg-green-50 text-green-700', declined:'bg-red-50 text-red-700' };
  const pending = items.filter(r=>r.status==='pending');
  const past = items.filter(r=>r.status!=='pending').slice(0,5);

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-1"><CalendarClock className="h-5 w-5 text-brand-600"/>Reschedule requests</h2>
      <p className="text-xs text-slate-500 mb-4">Parents' requests to move a class — accept or decline, and they're notified instantly.</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading…</p> : pending.length || past.length ? (
        <ul className="space-y-2">
          {pending.map(r => (
            <li key={r.id} className="rounded-lg ring-1 ring-slate-100 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-800">{r.student || 'Student'}{r.course && <span className="text-slate-400 font-normal"> · {r.course}</span>}</div>
                  <div className="text-xs text-slate-500">{[r.preferred_date && `Prefers ${r.preferred_date}`, r.reason].filter(Boolean).join(' — ') || `Requested ${r.created_at}`}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button disabled={act.isPending} onClick={()=>act.mutate({id:r.id,s:'accepted'})} className="rounded-md bg-green-600 text-white px-2.5 py-1.5 text-xs font-bold hover:bg-green-700 disabled:opacity-60">Accept</button>
                  <button disabled={act.isPending} onClick={()=>act.mutate({id:r.id,s:'declined'})} className="rounded-md ring-1 ring-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Decline</button>
                </div>
              </div>
            </li>
          ))}
          {past.map(r => (
            <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm opacity-70">
              <span className="text-slate-600 truncate">{r.student}{r.preferred_date && ` · ${r.preferred_date}`}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${badge[r.status]}`}>{r.status}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">No reschedule requests.</p>}
    </section>
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
