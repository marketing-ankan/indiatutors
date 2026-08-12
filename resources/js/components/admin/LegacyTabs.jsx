import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import {
  fetchAdminEvents, createAdminEvent, updateAdminEvent, deleteAdminEvent,
  fetchAdminVideoCourses, createAdminVideoCourse, updateAdminVideoCourse, deleteAdminVideoCourse,
  fetchAdminLessons, createAdminLesson, updateAdminLesson, deleteAdminLesson,
  fetchAdminQuestions, createAdminQuestion, updateAdminQuestion, deleteAdminQuestion,
  requestUploadUrl, uploadToR2,
  fetchAdminProposals, decideProposal,
  fetchAdminExamUpdates, createExamUpdate, updateExamUpdate, deleteExamUpdate,
  fetchAdminAnalytics, inr,
} from '../../lib/api.js';
import { errText } from './AdminUI.jsx';

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
  const toLocal = v => v ? String(v).replace(' ', 'T').slice(0, 16) : '';
  const set = k => e => setEditing(s => ({ ...s, [k]: e.target.value }));

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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

// ---- Video courses ----------------------------------------------------------

const VC_BLANK = { title:'', subtitle:'', description:'', price:0, level:'Beginner', category:'', is_published:true };
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
  const { data: courses = [], isLoading } = useQuery({ queryKey:['admin-videos'], queryFn: fetchAdminVideoCourses });
  const invalidate = () => { qc.invalidateQueries({ queryKey:['admin-videos'] }); qc.invalidateQueries({ queryKey:['video-courses'] }); };
  const [editing, setEditing] = useState(null);
  const [openId, setOpenId] = useState(null);
  const save = useMutation({ mutationFn: p => p.id ? updateAdminVideoCourse(p) : createAdminVideoCourse(p), onSuccess: () => { invalidate(); setEditing(null); } });
  const del = useMutation({ mutationFn: deleteAdminVideoCourse, onSuccess: invalidate });
  const inp = 'w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
  const set = k => e => setEditing(s => ({ ...s, [k]: k==='price' ? Number(e.target.value) : e.target.value }));

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
          <F label="Category"><input value={editing.category||''} onChange={set('category')} className={inp}/></F>
          <div className="sm:col-span-2"><F label="Subtitle"><input value={editing.subtitle||''} onChange={set('subtitle')} className={inp}/></F></div>
          <div className="sm:col-span-2"><F label="Description"><textarea rows={2} value={editing.description||''} onChange={set('description')} className={inp}/></F></div>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={save.isPending} className="rounded-lg bg-brand-600 text-white px-5 py-2 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">{editing.id?'Save':'Create'}</button>
            <button type="button" onClick={()=>setEditing(null)} className="rounded-lg ring-1 ring-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? <p className="text-slate-500 py-10 text-center">Loading…</p>
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

export function ContentTab() {
  return (
    <div className="mt-5 space-y-8">
      <div>
        <h3 className="font-heading text-lg font-extrabold text-[#0B1220]">Course proposals</h3>
        <p className="text-sm text-slate-500">Subjects teachers have asked to teach. Approving one adds it to their profile.</p>
        <ProposalsPanel />
      </div>
      <div className="border-t border-slate-100 pt-6">
        <h3 className="font-heading text-lg font-extrabold text-[#0B1220]">Exam updates</h3>
        <p className="text-sm text-slate-500">Published to the exam-updates feed on every learner's dashboard.</p>
        <ExamUpdatesPanel />
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
  const inp = "w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="mt-4 space-y-5">
      <form onSubmit={e=>{e.preventDefault();create.mutate();}} className="rounded-xl ring-1 ring-slate-100 bg-white p-4 space-y-2">
        <h4 className="font-bold text-sm">Publish an exam update</h4>
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
