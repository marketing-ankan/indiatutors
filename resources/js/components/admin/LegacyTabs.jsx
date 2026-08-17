import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, X } from 'lucide-react';
import {
  fetchAdminEvents, createAdminEvent, updateAdminEvent, deleteAdminEvent,
  fetchAdminVideoCourses, createAdminVideoCourse, updateAdminVideoCourse, deleteAdminVideoCourse,
  fetchAdminLessons, createAdminLesson, updateAdminLesson, deleteAdminLesson,
  fetchAdminQuestions, createAdminQuestion, updateAdminQuestion, deleteAdminQuestion,
  requestUploadUrl, uploadToR2,
  fetchAdminProposals, decideProposal,
  fetchAdminExamUpdates, createExamUpdate, updateExamUpdate, deleteExamUpdate,
  fetchAdminAnalytics, inr,
  fetchAdminPosts, createAdminPost, updateAdminPost, deleteAdminPost,
  fetchAdminWhatsappTestimonials, createWhatsappTestimonial, updateWhatsappTestimonial, deleteWhatsappTestimonial,
} from '../../lib/api.js';
import { errText, Modal, Chips, SearchBox, btnPrimary, btnGhost } from './AdminUI.jsx';
import { ImagePicker, CategorySelect } from './FormPickers.jsx';
// The public article renderer, so a draft preview cannot drift from the page
// the visitor will actually see.
import { PostBody } from '../../pages/BlogPostPage.jsx';

// Areas this platform has that the reference console does not: dated events,
// self-paced video courses (with the direct-to-R2 upload flow), teacher course
// proposals and exam updates. Moved here verbatim from the old Staff Console
// so the console rebuild does not quietly drop working features.

// Hoisted so inputs keep identity (and focus) across panel re-renders.
const F = ({ label, children }) => <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>{children}</label>;

// ---- Events -----------------------------------------------------------------

const eventBadge = { upcoming:'bg-green-50 text-green-700', completed:'bg-slate-100 text-slate-600', draft:'bg-amber-50 text-amber-700' };
const EVENT_BLANK = { title:'', icon:'🎓', category:'', description:'', starts_at:'', ends_at:'', mode:'Online', batch_size:'', session_duration:'', schedule_note:'', time_note:'', status:'upcoming' };

export function EventsTab() {
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

  // Render the stored instant in IST, which is what the server stores and what
  // the list row beside this form displays.
  //
  // This was `String(v).replace(' ','T').slice(0,16)`, which chopped the API's
  // UTC ISO string and presented it as if it were local: a 10:00 IST event
  // opened showing 04:30, and saving that back moved the event 5.5 hours
  // earlier. The same screen showed 04:30 in the field and 10:00 in the row
  // next to it. Pinned to Asia/Kolkata rather than the browser's zone so a
  // staff member travelling does not silently reschedule an event.
  const toIst = v => {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v).replace(' ', 'T').slice(0, 16);
    const p = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata', hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).formatToParts(d).map(x => [x.type, x.value]),
    );
    // en-CA gives 24-hour time, but midnight can come back as "24".
    const hour = p.hour === '24' ? '00' : p.hour;
    return `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}`;
  };

  // Back out in the format the API stores: a plain IST wall-clock string.
  //
  // Correcting only the DISPLAY was not enough. The form submits its state, so a
  // field the admin never touched still posted the raw UTC string the API had
  // returned, and the event moved 5.5 hours on a save that changed only the mode.
  //
  // Nor is an ISO instant right here: reads and writes are asymmetric. The column
  // holds a naive datetime that reads interpret as IST (the seeder writes
  // '2026-07-29 08:00:00' and the API serialises it as 02:30Z), but a write keeps
  // whatever wall-clock it is handed — so posting "…T02:30:00Z" stored 02:30 and
  // shifted the event again. Passing IST wall-clock in and out is the only
  // representation both halves agree on.
  const fromIst = v => (v ? `${v.replace('T', ' ')}:00` : null);
  const set = k => e => setEditing(s => ({ ...s, [k]: e.target.value }));

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-slate-500">Dated events shown on /events-workshops with public detail + registration pages.</p>
        <button onClick={()=>setEditing({ ...EVENT_BLANK })} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700">+ New Event</button>
      </div>

      {editing && (
        <form onSubmit={e=>{e.preventDefault(); save.mutate({ ...editing, starts_at: fromIst(editing.starts_at), ends_at: fromIst(editing.ends_at) });}} className="mb-6 rounded-2xl ring-1 ring-brand-100 bg-brand-50/40 p-5 grid gap-3 sm:grid-cols-2">
          <F label="Title *"><input required value={editing.title} onChange={set('title')} className={inp}/></F>
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <F label="Icon"><input value={editing.icon||''} onChange={set('icon')} className={inp}/></F>
            <F label="Category"><input value={editing.category||''} onChange={set('category')} className={inp} placeholder="e.g. Mind Sports"/></F>
          </div>
          <F label="Starts (IST)"><input type="datetime-local" value={editing.starts_at || ''} onChange={set('starts_at')} className={inp}/></F>
          <F label="Ends (IST)"><input type="datetime-local" value={editing.ends_at || ''} onChange={set('ends_at')} className={inp}/></F>
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
          {/* The API validated this and the public event page displayed it, but
              no form ever sent it — so every event was permanently "Online" and
              an in-person workshop could not be described as one. */}
          <F label="Mode">
            <select value={editing.mode||'Online'} onChange={set('mode')} className={inp}>
              {['Online','In person','Hybrid'].map(s=><option key={s}>{s}</option>)}
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
              <button onClick={()=>setEditing({ ...ev, starts_at: toIst(ev.starts_at), ends_at: toIst(ev.ends_at) })} className="rounded-lg ring-1 ring-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:ring-brand-300">Edit</button>
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

// ---- Video courses ----------------------------------------------------------

const VC_BLANK = { title:'', subtitle:'', description:'', price:0, level:'Beginner', category:'', thumbnail_url:'', position:0, is_published:true };
const LESSON_BLANK = { title:'', provider:'r2', video_id:'', duration_seconds:0, is_preview:false };
// The first two lessons of a course are the free previews and come from YouTube;
// everything after is an uploaded file behind the paywall. Encoded here so the
// add form opens in the right mode instead of making the admin remember.
const FREE_PREVIEW_COUNT = 2;
const blankLesson = (existingCount) => {
  const free = existingCount < FREE_PREVIEW_COUNT;
  return { ...LESSON_BLANK, provider: free ? 'youtube' : 'r2', is_preview: free };
};

// Reads a video file's duration in the browser so the admin doesn't have to
// count seconds by hand. Resolves 0 rather than rejecting — a missing duration
// is cosmetic and must never block the upload.
const readDuration = file => new Promise(resolve => {
  const url = URL.createObjectURL(file);
  const probe = document.createElement('video');
  probe.preload = 'metadata';
  const done = v => { URL.revokeObjectURL(url); resolve(v); };
  probe.onloadedmetadata = () => done(Math.round(probe.duration) || 0);
  probe.onerror = () => done(0);
  probe.src = url;
});

// Picks a lesson video and sends it straight from the browser to R2 using a
// presigned PUT from our API. The bytes never touch the app server: shared
// hosting would reject a 300 MB POST outright, and routing video through it
// would undo the whole point of R2's free egress.
function VideoUploader({ courseId, onUploaded }) {
  const [pct, setPct] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const pick = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';           // let the same file be re-picked after a failure
    if (!file) return;
    setError(''); setDone(''); setPct(0);
    try {
      const duration = await readDuration(file);
      const { key, upload_url } = await requestUploadUrl({
        courseId, filename: file.name, contentType: file.type || 'video/mp4',
      });
      await uploadToR2({ uploadUrl: upload_url, file, onProgress: setPct });
      setDone(key);
      onUploaded({ key, duration });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        (err?.response ? `Upload rejected by R2 (${err.response.status}). Check the token has Object Write and the bucket allows CORS from this domain.`
                       : 'Upload failed — check your connection and try again.')
      );
    } finally { setPct(null); }
  };

  return (
    <div className="w-full basis-full">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900">
        <input type="file" accept="video/mp4,video/webm" onChange={pick} className="hidden" disabled={pct !== null} />
        {pct !== null ? `Uploading… ${pct}%` : 'Upload video file'}
      </label>
      {pct !== null && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-brand-600 transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      )}
      {done && <p className="mt-1 text-[10px] text-green-700">Uploaded → <span className="font-mono">{done}</span></p>}
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

// Two ways to give a lesson its video, matching how the courses are actually
// made: the free previews are YouTube links pasted in, the paid lessons are
// files we upload. Bunny stays supported by the API but is off this form — it
// has no credentials configured and offering a third choice only invites the
// wrong one. `onChange` takes a patch; the caller merges it.
function SourcePicker({ courseId, value, onChange, inp }) {
  const isLink = value.provider === 'youtube';
  const tab = on => `rounded-lg px-2.5 py-1 text-[11px] font-bold ${on ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
  return (
    <div className="w-full basis-full rounded-lg bg-white p-3 ring-1 ring-slate-100">
      <div className="mb-2 flex gap-1.5">
        <button type="button" className={tab(isLink)}
          onClick={() => onChange({ provider: 'youtube', video_id: '', is_preview: true })}>Paste a link</button>
        <button type="button" className={tab(!isLink)}
          onClick={() => onChange({ provider: 'r2', video_id: '' })}>Upload a file</button>
      </div>

      {isLink ? (
        <>
          <input value={value.video_id} onChange={e => onChange({ video_id: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=…" className={inp + ' w-full'} />
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
            Any YouTube link works — watch, share, embed or Shorts. It is saved as a free
            preview: a YouTube video is public to anyone holding the link, so paid lessons
            must be uploaded as files instead.
          </p>
        </>
      ) : (
        <>
          <VideoUploader courseId={courseId}
            onUploaded={({ key, duration }) => onChange(
              duration ? { provider: 'r2', video_id: key, duration_seconds: duration }
                       : { provider: 'r2', video_id: key })} />
          {value.video_id
            ? <p className="mt-1 break-all font-mono text-[10px] text-slate-500">{value.video_id}</p>
            : <p className="mt-1 text-[10px] text-slate-500">Uploaded files play only for people who have bought the course.</p>}
        </>
      )}
    </div>
  );
}

// The transcript is what the study assistant answers from — no transcript, no
// assistant on that lesson. Saving a new one clears the cached AI summary so it
// regenerates from the current text instead of serving a stale recap.
function TranscriptEditor({ lesson, onSave, inp }) {
  const [text, setText] = useState(lesson.transcript || '');
  const dirty = text !== (lesson.transcript || '');
  return (
    <div className="mt-2 w-full basis-full">
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={6}
        placeholder="Paste the lesson transcript here. The study assistant answers only from this text."
        className={inp+' w-full font-mono leading-relaxed'} />
      <div className="mt-1 flex items-center gap-3">
        <button type="button" disabled={!dirty || onSave.isPending}
          onClick={()=>onSave.mutate({ id: lesson.id, transcript: text })}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50">
          Save transcript
        </button>
        <span className="text-[10px] text-slate-500">{text.length.toLocaleString()} characters</span>
      </div>
    </div>
  );
}

/**
 * F7 — author the question ladder for one lesson.
 *
 * Lives inside the lesson row because a question belongs to a lesson the way a
 * transcript does. The form enforces the invariant the scorer stands on: the
 * correct answer is picked FROM the options (a radio on each row), so it is
 * impossible to author a question whose right answer is not among its choices
 * — the server rejects that too, but the UI should not let it be expressed.
 *
 * Deleting shows the attempt count in the confirm: answer history dies with
 * the question (cascade), and an author erasing evidence should know it.
 */
const Q_BLANK = { level: 1, topic: '', prompt: '', options: [{ key: 'a', text: '' }, { key: 'b', text: '' }, { key: 'c', text: '' }, { key: 'd', text: '' }], correct_key: 'a', explanation: '' };

function QuestionsManager({ lesson }) {
  const qc = useQueryClient();
  const { data: questions = [], isLoading } = useQuery({ queryKey: ['admin-questions', lesson.id], queryFn: () => fetchAdminQuestions(lesson.id) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-questions', lesson.id] });
  const [editing, setEditing] = useState(null);   // Q_BLANK copy, or a row copy with id
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: p => p.id ? updateAdminQuestion(p) : createAdminQuestion({ lessonId: lesson.id, ...p }),
    onSuccess: () => { invalidate(); setEditing(null); setError(''); },
    onError: e => setError(errText(e)),
  });
  const del = useMutation({ mutationFn: deleteAdminQuestion, onSuccess: invalidate });
  const patch = useMutation({ mutationFn: updateAdminQuestion, onSuccess: invalidate });

  const inp = 'w-full rounded-lg ring-1 ring-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500';
  const setOpt = (i, text) => setEditing(s => ({ ...s, options: s.options.map((o, j) => j === i ? { ...o, text } : o) }));
  // Dropping an option that was marked correct must move the mark, not strand it.
  const dropOpt = (i) => setEditing(s => {
    const options = s.options.filter((_, j) => j !== i);
    const correct_key = options.some(o => o.key === s.correct_key) ? s.correct_key : options[0]?.key;
    return { ...s, options, correct_key };
  });

  const byLevel = [1, 2, 3].map(lv => [lv, questions.filter(q => q.level === lv)]);

  return (
    <div className="mt-2 w-full rounded-lg bg-brand-50/40 p-3 ring-1 ring-brand-100">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Question bank — levels unlock at 80%, weak-area topics come from these
        </p>
        {!editing && (
          <button onClick={() => { setError(''); setEditing({ ...Q_BLANK, options: Q_BLANK.options.map(o => ({ ...o })) }); }}
            className="text-[10px] font-bold text-brand-600 hover:text-brand-700">+ Add question</button>
        )}
      </div>

      {isLoading ? <p className="mt-2 text-xs text-slate-400">Loading…</p> : (
        <div className="mt-2 space-y-2">
          {byLevel.map(([lv, rows]) => rows.length > 0 && (
            <div key={lv}>
              <p className="text-[10px] font-bold text-slate-400">LEVEL {lv}</p>
              {rows.map(q => (
                <div key={q.id} className="mt-1 flex flex-wrap items-center gap-2 rounded-md bg-white px-2.5 py-1.5 ring-1 ring-slate-100">
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{q.prompt}</span>
                  {q.topic && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{q.topic}</span>}
                  <span className="text-[10px] text-slate-400">{q.attempts} answered</span>
                  {!q.is_published && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">hidden</span>}
                  <button onClick={() => patch.mutate({ ...q, is_published: !q.is_published })}
                    className="text-[10px] font-semibold text-slate-500 hover:text-brand-700">{q.is_published ? 'hide' : 'publish'}</button>
                  <button onClick={() => { setError(''); setEditing({ ...q, options: (q.options || []).map(o => ({ ...o })) }); }}
                    className="text-[10px] font-semibold text-brand-600">edit</button>
                  <button onClick={() => {
                    if (confirm(q.attempts > 0
                      ? `Delete this question AND the ${q.attempts} recorded answer(s) to it? Weak-area history for those answers is lost.`
                      : 'Delete this question?')) del.mutate(q.id);
                  }} className="text-[10px] font-bold text-slate-500 hover:text-red-600">delete</button>
                </div>
              ))}
            </div>
          ))}
          {!questions.length && !editing && <p className="text-xs text-slate-400">No questions yet — the quiz section stays hidden for learners until there are some.</p>}
        </div>
      )}

      {editing && (
        <form onSubmit={e => { e.preventDefault(); save.mutate(editing); }} className="mt-3 space-y-2 rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <div className="flex flex-wrap gap-2">
            <label className="text-[10px] font-bold text-slate-500">LEVEL
              <select value={editing.level} onChange={e => setEditing(s => ({ ...s, level: Number(e.target.value) }))} className={inp + ' mt-0.5'}>
                {[1, 2, 3].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <label className="flex-1 text-[10px] font-bold text-slate-500">TOPIC (drives weak-area detection)
              <input value={editing.topic || ''} onChange={e => setEditing(s => ({ ...s, topic: e.target.value }))}
                placeholder="e.g. fractions" className={inp + ' mt-0.5'} />
            </label>
          </div>
          <label className="block text-[10px] font-bold text-slate-500">QUESTION *
            <textarea required rows={2} value={editing.prompt} onChange={e => setEditing(s => ({ ...s, prompt: e.target.value }))} className={inp + ' mt-0.5'} />
          </label>

          <p className="text-[10px] font-bold text-slate-500">OPTIONS — tick the correct one *</p>
          {editing.options.map((o, i) => (
            <div key={o.key} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={editing.correct_key === o.key}
                onChange={() => setEditing(s => ({ ...s, correct_key: o.key }))} />
              <span className="w-4 text-center text-[10px] font-bold text-slate-400">{o.key}</span>
              <input required value={o.text} onChange={e => setOpt(i, e.target.value)} className={inp} placeholder={`Option ${o.key}`} />
              {editing.options.length > 2 && (
                <button type="button" onClick={() => dropOpt(i)} className="text-[10px] font-bold text-slate-400 hover:text-red-600">✕</button>
              )}
            </div>
          ))}
          {editing.options.length < 6 && (
            <button type="button" onClick={() => setEditing(s => {
              const used = s.options.map(o => o.key);
              const next = 'abcdef'.split('').find(k => !used.includes(k));
              return next ? { ...s, options: [...s.options, { key: next, text: '' }] } : s;
            })} className="text-[10px] font-semibold text-brand-600">+ option</button>
          )}

          <label className="block text-[10px] font-bold text-slate-500">EXPLANATION (shown after submitting — the teaching moment)
            <input value={editing.explanation || ''} onChange={e => setEditing(s => ({ ...s, explanation: e.target.value }))} className={inp + ' mt-0.5'} />
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={save.isPending}
              className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {editing.id ? 'Save' : 'Add question'}
            </button>
            <button type="button" onClick={() => { setEditing(null); setError(''); }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

function LessonsManager({ course }) {
  const qc = useQueryClient();
  const { data: lessons = [] } = useQuery({ queryKey:['admin-lessons', course.id], queryFn:()=>fetchAdminLessons(course.id) });
  const invalidate = () => { qc.invalidateQueries({ queryKey:['admin-lessons', course.id] }); qc.invalidateQueries({ queryKey:['admin-videos'] }); };
  const [nl, setNl] = useState(() => blankLesson(0));
  const [openTranscript, setOpenTranscript] = useState(null);
  const [openQuestions, setOpenQuestions] = useState(null);
  // Lessons arrive after the first render, so the opening mode is only correct
  // once they land. Re-defaulting a PRISTINE form is safe; a form the admin has
  // already typed into is left alone.
  useEffect(() => {
    setNl(s => (s.title || s.video_id) ? s : blankLesson(lessons.length));
  }, [lessons.length]);
  const add = useMutation({ mutationFn: p => createAdminLesson({ courseId: course.id, ...p }), onSuccess: () => { invalidate(); setNl(blankLesson(lessons.length + 1)); } });
  const patch = useMutation({ mutationFn: ({ id, ...p }) => updateAdminLesson({ courseId: course.id, id, ...p }), onSuccess: invalidate });
  const del = useMutation({ mutationFn: id => deleteAdminLesson({ courseId: course.id, id }), onSuccess: invalidate });
  const inp = 'rounded-lg ring-1 ring-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500';
  const previewCount = lessons.filter(l => l.is_preview).length;
  // Which lesson is "first" decides which are free, so order has to be editable.
  // Swaps the two rows' stored positions; the list re-sorts on invalidate.
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= lessons.length) return;
    const a = lessons[i], b = lessons[j];
    patch.mutate({ id: a.id, position: b.position });
    patch.mutate({ id: b.id, position: a.position });
  };

  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Playlist ({lessons.length} lessons)</p>
      <p className="mb-2 text-[11px] text-slate-500">
        {previewCount === FREE_PREVIEW_COUNT
          ? `First ${FREE_PREVIEW_COUNT} are free previews — everything else needs a purchase.`
          : `${previewCount} free ${previewCount === 1 ? 'preview' : 'previews'} — the plan is ${FREE_PREVIEW_COUNT}. Use the arrows to reorder.`}
      </p>
      <div className="space-y-1.5">
        {lessons.map((l, i) => (
          <div key={l.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
            <span className="flex flex-col leading-none">
              <button type="button" onClick={()=>move(i,-1)} disabled={i===0} title="Move up"
                className="text-[9px] text-slate-400 hover:text-brand-600 disabled:opacity-25">▲</button>
              <button type="button" onClick={()=>move(i,1)} disabled={i===lessons.length-1} title="Move down"
                className="text-[9px] text-slate-400 hover:text-brand-600 disabled:opacity-25">▼</button>
            </span>
            <span className="text-xs font-semibold text-slate-700">{l.position + 1}. {l.title}</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{l.provider}:{l.video_id}</span>
            {l.is_preview ? <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700">FREE</span>
              : <button onClick={()=>patch.mutate({ id:l.id, is_preview:true })} className="text-[10px] font-semibold text-brand-600">make preview</button>}
            {l.is_preview && <button onClick={()=>patch.mutate({ id:l.id, is_preview:false })} className="text-[10px] font-semibold text-slate-500">make paid</button>}
            <button onClick={()=>setOpenTranscript(t => t===l.id ? null : l.id)} className="text-[10px] font-semibold text-brand-600">
              {l.transcript ? 'transcript ✓' : 'add transcript'}
            </button>
            <button onClick={()=>setOpenQuestions(q => q===l.id ? null : l.id)} className="text-[10px] font-semibold text-brand-600">
              {openQuestions === l.id ? 'hide questions' : 'questions'}
            </button>
            <button onClick={()=>{ if(confirm('Delete lesson?')) del.mutate(l.id); }} className="ml-auto text-[10px] font-bold text-slate-500 hover:text-red-600">Delete</button>
            {openTranscript === l.id && <TranscriptEditor lesson={l} onSave={patch} inp={inp} />}
            {openQuestions === l.id && <QuestionsManager lesson={l} />}
          </div>
        ))}
      </div>
      <form onSubmit={e=>{e.preventDefault(); add.mutate(nl);}} className="mt-3 flex flex-wrap items-center gap-2">
        <p className="w-full basis-full text-[11px] font-bold uppercase tracking-wide text-slate-500">Add video</p>
        <SourcePicker courseId={course.id} value={nl} inp={inp}
          onChange={patch => setNl(s => ({ ...s, ...patch }))} />
        <input required value={nl.title} onChange={e=>setNl(s=>({...s,title:e.target.value}))} placeholder="Lesson title" className={inp+' flex-1 min-w-[140px]'} />
        <input type="number" min="0" value={nl.duration_seconds} onChange={e=>setNl(s=>({...s,duration_seconds:Number(e.target.value)}))} placeholder="sec" className={inp+' w-16'} />
        {/* Forced on for YouTube — the server does the same, this only stops the
            box looking editable when it is not. */}
        <label className="flex items-center gap-1 text-xs text-slate-600" title={nl.provider==='youtube' ? 'YouTube lessons are always free previews' : ''}>
          <input type="checkbox" checked={nl.provider==='youtube' ? true : nl.is_preview} disabled={nl.provider==='youtube'}
            onChange={e=>setNl(s=>({...s,is_preview:e.target.checked}))} className="accent-brand-600" />free preview
        </label>
        <button type="submit" disabled={add.isPending || !nl.video_id} className="rounded-lg bg-brand-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-brand-700 disabled:opacity-60">+ Add</button>
        {add.isError && <p className="w-full basis-full text-[10px] text-red-600">{add.error?.response?.data?.message || 'Could not add that lesson.'}</p>}
      </form>
    </div>
  );
}

export function VideoCoursesTab() {
  const qc = useQueryClient();
  // isError matters: without it a 401 or a 500 rendered the same "No video
  // courses yet." as a genuinely empty table, which is exactly how an auth
  // failure got mistaken for missing data.
  const { data: courses = [], isLoading, isError, error } = useQuery({ queryKey:['admin-videos'], queryFn: fetchAdminVideoCourses });
  const invalidate = () => { qc.invalidateQueries({ queryKey:['admin-videos'] }); qc.invalidateQueries({ queryKey:['video-courses'] }); };
  const [editing, setEditing] = useState(null);
  const [openId, setOpenId] = useState(null);
  const save = useMutation({ mutationFn: p => p.id ? updateAdminVideoCourse(p) : createAdminVideoCourse(p), onSuccess: () => { invalidate(); setEditing(null); } });
  const del = useMutation({ mutationFn: deleteAdminVideoCourse, onSuccess: invalidate });
  const inp = 'w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
  const set = k => e => setEditing(s => ({
    ...s,
    [k]: k === 'is_published' ? e.target.checked
       : (k === 'price' || k === 'position') ? Number(e.target.value)
       : e.target.value,
  }));

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-slate-500">Self-paced video courses on /video-courses. Add lessons and mark which are free previews.</p>
        <button onClick={()=>setEditing({ ...VC_BLANK })} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700">+ New Video Course</button>
      </div>

      {editing && (
        <form onSubmit={e=>{e.preventDefault(); save.mutate(editing);}} className="mb-6 rounded-2xl ring-1 ring-brand-100 bg-brand-50/40 p-5 grid gap-3 sm:grid-cols-2">
          <F label="Title *"><input required value={editing.title} onChange={set('title')} className={inp}/></F>
          <F label="Price (₹)"><input type="number" min="0" value={editing.price} onChange={set('price')} className={inp}/></F>
          <F label="Level"><input value={editing.level||''} onChange={set('level')} className={inp} placeholder="Beginner"/></F>
          {/* Was a free-text box. Typing a category by hand produced near
              duplicates that then filtered as two different things. */}
          <CategorySelect value={editing.category} onChange={v => setEditing(s => ({ ...s, category: v }))} />
          <div className="sm:col-span-2"><F label="Subtitle"><input value={editing.subtitle||''} onChange={set('subtitle')} className={inp}/></F></div>
          <div className="sm:col-span-2"><F label="Description"><textarea rows={2} value={editing.description||''} onChange={set('description')} className={inp}/></F></div>
          {/* Was a free-text path nobody could be expected to remember, where a
              typo silently rendered a broken image. Now a picker over what the
              site actually ships. */}
          <div className="sm:col-span-2">
            <ImagePicker label="Thumbnail" value={editing.thumbnail_url}
              onChange={v => setEditing(s => ({ ...s, thumbnail_url: v }))} />
            <p className="mt-1 text-[11px] text-slate-500">
              Shown on the course card. Leave blank for the default play icon.
            </p>
          </div>
          <F label="Order"><input type="number" value={editing.position ?? 0} onChange={set('position')} className={inp}
            placeholder="0" /></F>
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
            <input type="checkbox" checked={!!editing.is_published} onChange={set('is_published')} className="accent-brand-600" />
            Published — visible on the site and in the header menu
          </label>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button type="submit" disabled={save.isPending} className="rounded-lg bg-brand-600 text-white px-5 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">{editing.id?'Save':'Create'}</button>
            <button type="button" onClick={()=>setEditing(null)} className="rounded-lg ring-1 ring-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? <p className="text-slate-500 py-10 text-center">Loading…</p>
      : isError ? (
        <p className="py-10 text-center text-red-600">
          Could not load video courses ({error?.response?.status || 'network error'}).
          {error?.response?.status === 401 ? ' Your session expired — sign in again.' : ' Try reloading.'}
        </p>
      )
      : !courses.length ? <p className="text-slate-500 py-10 text-center">No video courses yet.</p>
      : (
        <div className="space-y-3">
          {courses.map(c => (
            <div key={c.id} className="rounded-2xl ring-1 ring-slate-100 bg-white p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-bold text-sm">{c.title}</span>
                <span className="text-sm font-extrabold text-brand-600">₹{Number(c.price).toLocaleString('en-IN')}</span>
                <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs">{c.lessons_count} lessons</span>
                {!c.is_published && <span className="rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-xs font-bold">hidden</span>}
                <div className="ml-auto flex gap-2">
                  <a href={`/video-courses/${c.slug}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-600 hover:underline">View ↗</a>
                  <button onClick={()=>setOpenId(openId===c.id?null:c.id)} className="text-xs font-bold text-slate-600 hover:text-brand-700">{openId===c.id?'Hide lessons':'Lessons'}</button>
                  <button onClick={()=>setEditing({ ...c })} className="text-xs font-bold text-slate-600 hover:text-brand-700">Edit</button>
                  <button onClick={()=>{ if(confirm(`Delete "${c.title}" and its lessons?`)) del.mutate(c.id); }} className="text-xs font-bold text-slate-600 hover:text-red-600">Delete</button>
                </div>
              </div>
              {openId===c.id && <LessonsManager course={c} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Analytics ---------------------------------------------------------------

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

/** Monthly trend: one series, thin columns, direct value labels. */
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

export function AnalyticsTab() {
  const { data: d, isLoading } = useQuery({ queryKey:['admin-analytics'], queryFn: fetchAdminAnalytics });
  if (isLoading) return <p className="text-slate-500 py-10 text-center">Loading analytics…</p>;
  if (!d) return null;
  const t = d.totals;
  const TILES = [
    ['Parents', t.parents], ['Teachers', t.teachers, `${t.teachers_approved} approved · ${t.teachers_pending} pending`],
    ['Students', t.students], ['Listed tutors', t.tutors_listed],
    ['Bookings', t.demos_total, `${t.demos_new} new · ${t.demos_converted} converted`],
    ['Active enrolments', t.enrollments_active], ['Classes logged', t.classes_logged],
    ['Paid revenue', inr(t.revenue_paid ?? 0), `${t.orders_paid ?? 0} of ${t.orders_total ?? 0} orders paid`],
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
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <TrendBars title="Bookings / month" points={d.trend.demos}/>
        <TrendBars title="Enrolments / month" points={d.trend.enrollments}/>
        <TrendBars title="Signups / month" points={d.trend.signups}/>
        {d.trend.orders && <TrendBars title="Orders / month" points={d.trend.orders}/>}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <BarList title="Bookings by city" items={d.demos_by_city}/>
        <BarList title="Bookings by subject" items={d.demos_by_subject}/>
        <BarList title="Listed tutors by city" items={d.tutors_by_city}/>
      </div>
    </div>
  );
}

// ---- Content: teacher proposals + exam updates -------------------------------

// Blog first: this tab is called Content, and the blog IS the content. It used
// to sit last, below the proposals queue and a tall exam-update form, with its
// own write-form above its list — so the one thing the tab exists to show, what
// is actually published, was two screens down and easy to miss entirely.
export function ContentTab() {
  return (
    <div className="mt-5 space-y-8">
      <div>
        <h3 className="font-heading text-lg font-extrabold text-[#0B1220]">Blog</h3>
        <p className="text-sm text-slate-500">
          Posts on <a href="/blog" target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:underline">/blog</a>. Drafts are visible here only.
        </p>
        <BlogPanel />
      </div>
      <div className="border-t border-slate-100 pt-6">
        <h3 className="font-heading text-lg font-extrabold text-[#0B1220]">WhatsApp testimonials</h3>
        <p className="text-sm text-slate-500">
          Screenshots of real WhatsApp chats, shown on the homepage and the courses page. Until the
          first screenshot is published, visitors see demo cards; from the first one on, only your
          real screenshots show. Uploads survive deploys — they live outside the site build.
        </p>
        <WhatsappPanel />
      </div>
      <div className="border-t border-slate-100 pt-6">
        <h3 className="font-heading text-lg font-extrabold text-[#0B1220]">Exam updates</h3>
        <p className="text-sm text-slate-500">Published to the exam-updates feed on every learner's dashboard.</p>
        <ExamUpdatesPanel />
      </div>
      <div className="border-t border-slate-100 pt-6">
        <h3 className="font-heading text-lg font-extrabold text-[#0B1220]">Course proposals</h3>
        <p className="text-sm text-slate-500">Subjects teachers have asked to teach. Approving one adds it to their profile.</p>
        <ProposalsPanel />
      </div>
    </div>
  );
}

function ProposalsPanel() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const { data } = useQuery({ queryKey:['admin-proposals', status], queryFn:()=>fetchAdminProposals(status) });
  const act = useMutation({ mutationFn:({id,s})=>decideProposal(id, s), onSuccess:()=>{ qc.invalidateQueries({queryKey:['admin-proposals']}); qc.invalidateQueries({queryKey:['admin-overview']}); } });
  const proposals = data?.data ?? [];
  const badge = { pending:'bg-amber-50 text-amber-700', approved:'bg-green-50 text-green-700', rejected:'bg-red-50 text-red-700' };

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        {['pending','approved','rejected',''].map(s => (
          <button key={s||'all'} onClick={()=>setStatus(s)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${status===s?'bg-brand-600 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{s?s[0].toUpperCase()+s.slice(1):'All'}</button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
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
              <div className="mt-3 flex flex-wrap gap-2">
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

// ---- WhatsApp testimonials --------------------------------------------------

// Screenshots of real WhatsApp chats, shown on the homepage / courses page.
// The public section shows demo cards until the first screenshot is published,
// then switches to the real ones outright. Uploads land in storage/ — the one
// directory the deploy never wipes — and are served back through the API, so
// unlike every other image on this site they do NOT ride in the git repo.

function WhatsappPanel() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({ queryKey:['admin-whatsapp-testimonials'], queryFn: fetchAdminWhatsappTestimonials });
  const [file, setFile] = useState(null);       // the chosen screenshot (File)
  const [label, setLabel] = useState('');
  const [position, setPosition] = useState(0);
  const [editingId, setEditingId] = useState(null); // editing = label/order only; the image itself is immutable
  const reset = () => { setFile(null); setLabel(''); setPosition(0); setEditingId(null); };
  const invalidate = () => { qc.invalidateQueries({queryKey:['admin-whatsapp-testimonials']}); qc.invalidateQueries({queryKey:['whatsapp-testimonials']}); };

  const save = useMutation({
    mutationFn: () => {
      if (editingId) return updateWhatsappTestimonial(editingId, { label: label || null, position: Number(position) || 0 });
      const fd = new FormData();
      fd.append('image', file);
      if (label) fd.append('label', label);
      fd.append('position', Number(position) || 0);
      return createWhatsappTestimonial(fd);
    },
    onSuccess: () => { reset(); invalidate(); },
  });
  const toggle = useMutation({ mutationFn: ({id, pub}) => updateWhatsappTestimonial(id, { is_published: pub }), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteWhatsappTestimonial, onSuccess: () => { reset(); invalidate(); } });
  const inp = "w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  const edit = t => { setEditingId(t.id); setFile(null); setLabel(t.label ?? ''); setPosition(t.position ?? 0); };

  return (
    <div className="mt-4 space-y-5">
      <form onSubmit={e=>{e.preventDefault(); if (editingId || file) save.mutate();}} className="rounded-xl ring-1 ring-slate-100 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-bold text-sm">{editingId ? 'Edit label / order' : 'Upload a chat screenshot'}</h4>
          {editingId && <button type="button" onClick={reset} className="text-xs font-semibold text-slate-500 hover:text-slate-800">Cancel — upload a new one instead</button>}
        </div>

        {/* The image is chosen on upload and never edited — to change it,
            delete the card and upload the right screenshot. */}
        {!editingId && (
          <div className="flex flex-wrap items-center gap-3">
            {file
              ? <img src={URL.createObjectURL(file)} alt="Selected screenshot preview" className="h-24 w-16 rounded-md object-cover object-top ring-1 ring-slate-200"/>
              : <div className="grid h-24 w-16 place-items-center rounded-md bg-slate-100 text-[10px] text-slate-400">none</div>}
            <label className="cursor-pointer rounded-lg ring-1 ring-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
              {file ? 'Change screenshot' : 'Choose screenshot…'}
              <input type="file" accept="image/*" className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
            {file && <span className="text-xs text-slate-500">{file.name} · {(file.size/1024).toFixed(0)} KB</span>}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-2">
          <F label="Label (optional) — who or which class, used as the image's alt text">
            <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g. Sruthi English Class" className={inp} maxLength={120}/>
          </F>
          <F label="Order — lower numbers show first">
            <input type="number" min="0" value={position} onChange={e=>setPosition(e.target.value)} className={inp + ' max-w-[8rem]'}/>
          </F>
        </div>
        {save.isError && <p className="text-xs text-red-600">{errText(save.error)}</p>}
        <button disabled={save.isPending || (!editingId && !file)} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          {save.isPending ? (editingId ? 'Saving…' : 'Uploading…') : editingId ? 'Save changes' : 'Upload & publish'}
        </button>
      </form>

      <div className="space-y-2">
        {items.length ? items.map(t => (
          <div key={t.id} className="rounded-xl ring-1 ring-slate-100 bg-white p-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <img src={t.image_url} alt={t.label || 'WhatsApp chat screenshot'} loading="lazy"
                className="h-24 w-16 shrink-0 rounded-md object-cover object-top ring-1 ring-slate-200"/>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-800">{t.label || 'Untitled screenshot'}</div>
                <div className="text-xs text-slate-500 mt-0.5">{[`added ${t.created_at}`, t.position ? `order ${t.position}` : null].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={()=>toggle.mutate({id:t.id, pub:!t.is_published})}
                title={t.is_published ? 'Unpublish' : 'Publish'}
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.is_published?'bg-green-50 text-green-700':'bg-slate-100 text-slate-500'}`}>
                {t.is_published?'Published':'Draft'}
              </button>
              <button onClick={()=>edit(t)} className={btnGhost}>Edit</button>
              <button onClick={()=>{ if (confirm(`Delete “${t.label || 'this screenshot'}”? This cannot be undone.`)) remove.mutate(t.id); }}
                className="p-1.5 text-slate-400 hover:text-red-600" title="Delete"><X className="h-4 w-4"/></button>
            </div>
          </div>
        )) : <p className="text-slate-500 py-8 text-center">No screenshots yet — the site is showing the demo cards.</p>}
      </div>
    </div>
  );
}

const EXAM_BLANK = { title:'', body:'', exam_date:'', link_url:'' };

function ExamUpdatesPanel() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({ queryKey:['admin-exam-updates'], queryFn: fetchAdminExamUpdates });
  const [form, setForm] = useState(EXAM_BLANK);
  // The API has always accepted every field on update; only the publish toggle
  // ever used it, so a typo in a published update could be fixed only by
  // deleting and retyping it — beside an unconfirmed delete button.
  const [editingId, setEditingId] = useState(null);
  const reset = () => { setForm(EXAM_BLANK); setEditingId(null); };
  const invalidate = () => { qc.invalidateQueries({queryKey:['admin-exam-updates']}); qc.invalidateQueries({queryKey:['exam-updates']}); };

  const payload = () => ({ ...form, exam_date: form.exam_date || null, link_url: form.link_url || null });
  const save = useMutation({
    mutationFn: () => editingId ? updateExamUpdate(editingId, payload()) : createExamUpdate(payload()),
    onSuccess: () => { reset(); invalidate(); },
  });
  const toggle = useMutation({ mutationFn: ({id, pub}) => updateExamUpdate(id, { is_published: pub }), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteExamUpdate, onSuccess: () => { reset(); invalidate(); } });
  const inp = "w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  const edit = u => {
    setEditingId(u.id);
    setForm({ title:u.title ?? '', body:u.body ?? '', exam_date:(u.exam_date ?? '').slice(0,10), link_url:u.link_url ?? '' });
  };

  return (
    <div className="mt-4 space-y-5">
      <form onSubmit={e=>{e.preventDefault();save.mutate();}} className="rounded-xl ring-1 ring-slate-100 bg-white p-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-bold text-sm">{editingId ? 'Edit exam update' : 'Publish an exam update'}</h4>
          {editingId && <button type="button" onClick={reset} className="text-xs font-semibold text-slate-500 hover:text-slate-800">Cancel — write a new one instead</button>}
        </div>
        <input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Title (e.g. JEE Main 2027 registration opens)" className={inp}/>
        <textarea rows={2} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Details (optional)" className={inp}/>
        <div className="grid sm:grid-cols-2 gap-2">
          <input type="date" value={form.exam_date} onChange={e=>setForm({...form,exam_date:e.target.value})} className={inp}/>
          <input value={form.link_url} onChange={e=>setForm({...form,link_url:e.target.value})} placeholder="Link (optional)" className={inp}/>
        </div>
        {save.isError && <p className="text-xs text-red-600">{errText(save.error)}</p>}
        <button disabled={save.isPending} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          {save.isPending ? 'Saving…' : editingId ? 'Save changes' : 'Publish update'}
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
              <button onClick={()=>edit(u)} className="rounded-lg ring-1 ring-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
              {/* Every other destructive button in this console confirms first. */}
              <button onClick={()=>{ if (confirm(`Delete “${u.title}”? This cannot be undone.`)) remove.mutate(u.id); }}
                className="p-1.5 text-slate-400 hover:text-red-600" title="Delete"><X className="h-4 w-4"/></button>
            </div>
          </div>
        )) : <p className="text-slate-500 py-8 text-center">No exam updates yet.</p>}
      </div>
    </div>
  );
}

// ---- Blog -------------------------------------------------------------------

// The Post model, the /posts API and the public /blog pages all already existed;
// the only missing piece was any way to write one without a database client, so
// the blog was frozen at whatever the seeder inserted.
//
// Publishing is a toggle, not a one-way door: a live post can be pulled back to
// draft to fix a typo and republished without moving in the feed, because
// `published_at` is stamped once, on the first publish, and kept.

const POST_BLANK = { title:'', slug:'', excerpt:'', body:'', image_url:'', author:'', is_published:false, published_at:'' };

const POST_FILTERS = [
  { key: '', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
];

// The IST calendar date of a timestamp. NOT `.slice(0,10)`: the API serialises
// datetimes as UTC ISO, and midnight IST is 18:30 the PREVIOUS day in UTC — so
// slicing walked the publish date back one day on every idle edit-save cycle.
// Same disease, same cure as the event form's 5.5-hour shift.
const istDate = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso).slice(0, 10)
    : d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

// List-first, like every other console tab. The write-form used to sit ABOVE
// the list, so the inventory — the thing this tab exists to show — started two
// screens down and with zero posts was easy to miss entirely.
function BlogPanel() {
  const qc = useQueryClient();
  const [modal, setModal]   = useState(null);   // null | {} (new) | a post (edit)
  const [filter, setFilter] = useState('');
  const [q, setQ]           = useState('');
  const [rowErr, setRowErr] = useState('');

  const { data: posts = [], isLoading } = useQuery({ queryKey:['admin-posts'], queryFn: fetchAdminPosts });
  // All three: the console list, the public index, and any open post page.
  const invalidate = () => {
    qc.invalidateQueries({queryKey:['admin-posts']});
    qc.invalidateQueries({queryKey:['posts']});
    qc.invalidateQueries({queryKey:['post']});
  };

  const [preview, setPreview] = useState(null); // a post shown as the site renders it

  const toggle = useMutation({ mutationFn: ({id, pub}) => updateAdminPost({ id, is_published: pub }),
    onSuccess: () => { setRowErr(''); invalidate(); }, onError: e => setRowErr(errText(e)) });
  const remove = useMutation({ mutationFn: deleteAdminPost,
    onSuccess: () => { setRowErr(''); invalidate(); }, onError: e => setRowErr(errText(e)) });

  // Duplicate — the fastest way to write the next post in a series, and a safe
  // way to try a rewrite without touching what is already live. Always lands as
  // a DRAFT with its own new web address, so a copy can never quietly replace
  // the published original. `slug` is deliberately omitted: the API generates
  // (and de-duplicates) it from the title, and rejects the field on create.
  const copy = useMutation({
    mutationFn: p => createAdminPost({
      title: `${p.title} (copy)`, excerpt: p.excerpt ?? null, body: p.body ?? null,
      image_url: p.image_url ?? null, author: p.author ?? null,
      is_published: false, published_at: null,
    }),
    onSuccess: () => { setRowErr(''); invalidate(); }, onError: e => setRowErr(errText(e)),
  });

  const published = posts.filter(p => p.is_published).length;
  const shown = posts.filter(p =>
    (filter === '' || (filter === 'published' ? p.is_published : !p.is_published)) &&
    (q === '' || `${p.title} ${p.author ?? ''}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setModal({})} className={btnPrimary}><Plus className="h-4 w-4"/>New post</button>
        <Chips options={POST_FILTERS} value={filter} onChange={setFilter} />
        <SearchBox value={q} onChange={setQ} placeholder="Search title or author…" className="sm:max-w-xs" />
        {posts.length > 0 && (
          <span className="text-xs text-slate-400">{published} published · {posts.length - published} draft{posts.length - published === 1 ? '' : 's'}</span>
        )}
      </div>

      {rowErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{rowErr}</p>}

      <div className="space-y-2">
        {isLoading && <p className="text-slate-500 py-8 text-center">Loading posts…</p>}
        {!isLoading && !posts.length && (
          <p className="text-slate-500 py-10 text-center">No posts yet — “New post” writes the first one.</p>
        )}
        {!isLoading && posts.length > 0 && !shown.length && (
          <p className="text-slate-500 py-8 text-center">No posts match.</p>
        )}
        {shown.map(p => (
          <div key={p.id} className="rounded-xl ring-1 ring-slate-100 bg-white p-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              {/* The cover, because a post list without its art makes the admin
                  open each row just to see which post it is. */}
              {p.image_url
                ? <img src={p.image_url} alt="" loading="lazy" className="h-14 w-20 shrink-0 rounded-md object-cover ring-1 ring-slate-200"/>
                : <span className="grid h-14 w-20 shrink-0 place-items-center rounded-md bg-slate-100 font-heading text-lg font-bold text-slate-400">{(p.title || '?')[0]}</span>}
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-800">{p.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {[p.published_at ? `published ${istDate(p.published_at)}` : 'never published', p.author, `/blog/${p.slug}`].filter(Boolean).join(' · ')}
                </div>
                {p.excerpt && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.excerpt}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={()=>toggle.mutate({id:p.id, pub:!p.is_published})}
                title={p.is_published ? 'Unpublish' : 'Publish'}
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.is_published?'bg-green-50 text-green-700':'bg-slate-100 text-slate-500'}`}>
                {p.is_published?'Published':'Draft'}
              </button>
              {/* Published posts open the real page; a draft 404s there, so it
                  gets the same article rendered in a preview instead — the
                  point of a draft is to read it before anyone else can. */}
              {p.is_published
                ? <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className={btnGhost}>View ↗</a>
                : <button onClick={()=>setPreview(p)} className={btnGhost}>Preview</button>}
              <button onClick={()=>setModal(p)} className={btnGhost}>Edit</button>
              <button onClick={()=>copy.mutate(p)} disabled={copy.isPending} className={btnGhost} title="Duplicate as a new draft">Copy</button>
              <button onClick={()=>{ if (confirm(`Delete “${p.title}”? This cannot be undone.`)) remove.mutate(p.id); }}
                className="p-1.5 text-slate-400 hover:text-red-600" title="Delete"><X className="h-4 w-4"/></button>
            </div>
          </div>
        ))}
      </div>

      {modal && <PostForm post={modal.id ? modal : null} onClose={() => setModal(null)} onSaved={invalidate} />}
      {preview && <PostPreview post={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

/** A draft as the public page will render it — same PostBody, same date format. */
function PostPreview({ post, onClose }) {
  return (
    <Modal title="Preview" subtitle={`Draft · will publish at /blog/${post.slug}`} onClose={onClose} wide>
      <article>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-slate-900">{post.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {[post.published_at ? istDate(post.published_at) : 'not dated yet', post.author].filter(Boolean).join(' · ')}
        </p>
        {post.image_url && <img src={post.image_url} alt="" className="mt-4 w-full rounded-xl object-cover"/>}
        <div className="mt-4"><PostBody body={post.body}/></div>
      </article>
    </Modal>
  );
}

function PostForm({ post, onClose, onSaved }) {
  const [form, setForm] = useState(post ? {
    title: post.title ?? '', slug: post.slug ?? '', excerpt: post.excerpt ?? '', body: post.body ?? '',
    image_url: post.image_url ?? '', author: post.author ?? '', is_published: !!post.is_published,
    published_at: istDate(post.published_at),
  } : POST_BLANK);
  const [err, setErr] = useState('');
  const inp = "w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form, excerpt: form.excerpt || null, body: form.body || null,
                        image_url: form.image_url || null, author: form.author || null,
                        // Blank means "stamp it on first publish", which is what
                        // the API does. Sending '' would fail date validation.
                        published_at: form.published_at || null };
      // The slug is generated from the title when a post is created and is
      // rejected by the API on create, so only send it when editing.
      if (!post) delete payload.slug;
      return post ? updateAdminPost({ id: post.id, ...payload }) : createAdminPost(payload);
    },
    onSuccess: () => { onSaved(); onClose(); },
    onError: e => setErr(errText(e)),
  });

  return (
    <Modal title={post ? 'Edit post' : 'Write a post'}
      subtitle={post ? `/blog/${post.slug}` : 'The web address is generated from the title.'}
      onClose={onClose} wide>
      <form onSubmit={e=>{e.preventDefault();save.mutate();}} className="space-y-3">
        <F label="Title"><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="How to choose a home tutor" className={inp}/></F>
        <F label="Summary — shown on the blog index and in link previews">
          <textarea rows={2} value={form.excerpt} onChange={e=>setForm({...form,excerpt:e.target.value})} className={inp}/>
        </F>
        <F label="Post"><textarea rows={10} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Write the post. Blank lines separate paragraphs." className={inp}/></F>

        <div className="grid sm:grid-cols-2 gap-3">
          {/* Same picker the courses use — typing a path by hand was how broken
              images got saved. */}
          <ImagePicker label="Cover image" value={form.image_url} onChange={v=>setForm({...form,image_url:v})}/>
          <F label="Author (optional)"><input value={form.author} onChange={e=>setForm({...form,author:e.target.value})} placeholder="IndiaTutors Online" className={inp}/></F>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {/* Accepted by the API from the start, but no field ever sent it, so a
              post could not be backdated or dated ahead of its publish click. */}
          <F label="Publish date — leave blank to stamp it when you publish">
            <input type="date" value={form.published_at} onChange={e=>setForm({...form,published_at:e.target.value})} className={inp}/>
          </F>
          {post && (
            <F label="Web address">
              <input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} className={inp}/>
              <span className="mt-1 block text-[11px] text-slate-400">
                /blog/{form.slug || '…'} — changing this breaks any link already shared. It is generated from the
                title on creation and does not follow later edits, so fix a typo here.
              </span>
            </F>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={form.is_published} onChange={e=>setForm({...form,is_published:e.target.checked})} className="h-4 w-4 rounded"/>
          Publish now — visible to everyone at /blog
        </label>

        {err && <p className="text-sm font-semibold text-red-600">{err}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={save.isPending} className={btnPrimary + ' flex-1'}>
            {save.isPending ? 'Saving…' : post ? 'Save changes' : form.is_published ? 'Publish post' : 'Save as draft'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
