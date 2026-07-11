import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { submitDemoRequest, fetchCourse, fetchTutor, fetchStudents } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

const empty = { name:'',email:'',phone_country_code:'+91',phone:'',subject:'',grade:'',board:'',mode:'online',city:'',country:'India',timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,message:'',whatsapp_consent:true,marketing_consent:false,course_id:null,student_id:null };
const inp = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

// The live page's five booking flows — same form engine, different framing.
const BOOKING_TYPES = [
  { key:'demo',     pill:'Free Demo',       heading:'Book a Free Demo Class',       sub:'One-on-one session with world-class tutors.',            mode:'online', cta:'Request Free Demo' },
  { key:'group',    pill:'Group Classes',   heading:'Book a Free Group-Class Demo', sub:'Learn together in small, interactive batches.',          mode:'online', cta:'Request Group-Class Demo' },
  { key:'workshop', pill:'Workshops',       heading:'Book a Free Workshop',         sub:'Hands-on workshops, bootcamps & masterclasses.',         mode:'online', cta:'Reserve Workshop Seat' },
  { key:'free',     pill:'Free Classes',    heading:'Book a Free Class',            sub:'Try a complimentary class — zero cost, no card.',        mode:'online', cta:'Request Free Class' },
  { key:'physical', pill:'Physical Tutor',  heading:'Find a Physical Home Tutor',   sub:'Get a verified in-person tutor in your locality.',       mode:'home',   cta:'Find My Home Tutor' },
];

export default function BookDemoPage() {
  const [params] = useSearchParams();
  const courseSlug = params.get('course');
  const tutorSlug = params.get('tutor');
  const { user, isAuthed } = useAuth();
  // ?subject= prefill (exam dropdown, plan cards, course accordion CTAs)
  const [form, setForm] = useState({ ...empty, subject: params.get('subject') || '' });
  const [ok, setOk] = useState(false);
  // ?type= deep-links a specific flow (e.g. /book-demo?type=group)
  const [typeKey, setTypeKey] = useState(
    BOOKING_TYPES.some(t => t.key === params.get('type')) ? params.get('type') : 'demo'
  );
  const bookingType = BOOKING_TYPES.find(t => t.key === typeKey);
  const switchType = (t) => { setTypeKey(t.key); setForm(f => ({ ...f, mode: t.mode })); };

  // If arriving from a course or tutor page, resolve it to prefill nicely + link it.
  const { data: course } = useQuery({ queryKey:['course', courseSlug], queryFn:()=>fetchCourse(courseSlug), enabled: !!courseSlug });
  const { data: tutor }  = useQuery({ queryKey:['tutor', tutorSlug], queryFn:()=>fetchTutor(tutorSlug), enabled: !!tutorSlug });
  const { data: students = [] } = useQuery({ queryKey:['students'], queryFn: fetchStudents, enabled: isAuthed });
  useEffect(() => { if (course) setForm(f => ({ ...f, subject: f.subject || course.name, course_id: course.id })); }, [course]);
  useEffect(() => { if (tutor) setForm(f => ({ ...f, message: f.message || `I'd like to request a demo with ${tutor.name}.` })); }, [tutor]);
  // Prefill contact details for a signed-in user.
  useEffect(() => { if (user) setForm(f => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || user.phone || '' })); }, [user]);

  const pickStudent = (id) => {
    const s = students.find(x => String(x.id) === String(id));
    setForm(f => ({ ...f, student_id: id ? Number(id) : null,
      grade: s?.grade || f.grade, board: s?.board || f.board, subject: s?.subjects || f.subject }));
  };

  // Record which flow was requested so the staff console sees it.
  const mutation = useMutation({
    mutationFn: () => submitDemoRequest({
      ...form,
      message: typeKey === 'demo' ? form.message : `[${bookingType.heading}] ${form.message}`.trim(),
    }),
    onSuccess: ()=>{ setOk(true); setForm(empty); },
  });
  const set = k => e => setForm({...form, [k]: e.target.type==='checkbox'?e.target.checked:e.target.value});

  if (ok) return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-3xl">✓</div>
      <h1 className="mt-6 text-2xl font-extrabold">Request received!</h1>
      <p className="mt-2 text-slate-600">Our team will reach out on WhatsApp within 24 hours to match a tutor and schedule your free demo.</p>
      <button onClick={()=>setOk(false)} className="mt-6 text-brand-600 font-semibold">Book another demo →</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Booking-flow pills, like the live page */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {BOOKING_TYPES.map(t => (
          <button key={t.key} type="button" onClick={()=>switchType(t)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${typeKey===t.key?'bg-brand-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {t.pill}
          </button>
        ))}
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight">{bookingType.heading}</h1>
      <p className="text-slate-500 mt-2">{bookingType.sub} Fill this in and we'll match you with a verified tutor — it's free with no commitment.</p>
      {(course || tutor) && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-50 text-brand-700 px-3 py-1.5 text-sm font-medium ring-1 ring-brand-100">
          Booking a demo for <b>{course?.name || tutor?.name}</b>
        </div>
      )}
      <form onSubmit={e=>{e.preventDefault();mutation.mutate();}} className="mt-8 space-y-4 bg-white p-6 rounded-xl ring-1 ring-slate-100">
        {isAuthed && students.length > 0 && (
          <div className="rounded-lg bg-brand-50 ring-1 ring-brand-100 p-3">
            <label className="block text-xs font-semibold text-brand-800 mb-1">Which student is this demo for?</label>
            <select value={form.student_id ?? ''} onChange={e=>pickStudent(e.target.value)} className={inp}>
              <option value="">Not sure yet / myself</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}{s.grade?` · ${s.grade}`:''}</option>)}
            </select>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Full name*</label><input required value={form.name} onChange={set('name')} className={inp}/></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Email*</label><input required type="email" value={form.email} onChange={set('email')} className={inp}/></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Phone*</label><input required value={form.phone} onChange={set('phone')} className={inp}/></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label><input value={form.subject} onChange={set('subject')} placeholder="e.g. Class 10 Math" className={inp}/></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
            <select value={form.grade} onChange={set('grade')} className={inp}>
              <option value="">Select…</option>
              {['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12','College','Adult'].map(g=><option key={g}>{g}</option>)}
            </select></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Board</label>
            <select value={form.board} onChange={set('board')} className={inp}>
              <option value="">Select…</option>
              {['CBSE','ICSE','IB','IGCSE','State','US','UK','Other'].map(b=><option key={b}>{b}</option>)}
            </select></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Mode</label>
            <select value={form.mode} onChange={set('mode')} className={inp}><option value="online">Online</option><option value="home">Home tutor</option></select></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">City</label><input value={form.city} onChange={set('city')} className={inp}/></div>
        </div>
        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Anything specific we should know?</label><textarea rows={3} value={form.message} onChange={set('message')} className={inp}/></div>
        <div className="space-y-2 text-sm text-slate-600">
          <label className="flex gap-2 items-start"><input type="checkbox" checked={form.whatsapp_consent} onChange={set('whatsapp_consent')} className="mt-1"/>You may contact me on WhatsApp about this demo.</label>
          <label className="flex gap-2 items-start"><input type="checkbox" checked={form.marketing_consent} onChange={set('marketing_consent')} className="mt-1"/>Send me occasional updates on new courses and offers.</label>
        </div>
        {mutation.isError && <div className="rounded-md bg-red-50 text-red-700 text-sm p-3">{mutation.error?.response?.data?.message||'Something went wrong. Please try again.'}</div>}
        <button disabled={mutation.isPending} className="w-full rounded-lg bg-brand-600 text-white py-3 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          {mutation.isPending?'Submitting…':bookingType.cta}
        </button>
      </form>
    </div>
  );
}
