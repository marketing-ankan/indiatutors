import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, MapPin, CalendarDays, Wallet, UserCheck, Loader2, Phone } from 'lucide-react';
import { fetchCategoriesTree } from '../../lib/api.js';
import AddressBlock, { cleanAddress } from './AddressBlock.jsx';
import { Field, field, Section, Check, ChipGroup, RadioCards } from './FormBits.jsx';
import {
  GRADE_OPTIONS, BOARDS, VENUES, GOALS, URGENCY, LANGUAGES, WEEKDAYS,
} from '../../data/physical.js';

/**
 * "Find me a home tutor" — the student side of a match.
 *
 * Every field maps to a filter or a rank in the assignment app; nothing is
 * asked out of habit. The ordering follows what a parent can answer without
 * thinking (child, subjects, address) before what they have to decide
 * (timings, budget, teacher preferences), so the form does not stall on
 * question three.
 *
 * Used both signed-out on /physical-classes and signed-in from the dashboard;
 * `showContact` is the only difference, because an account already told us who
 * to call.
 */

export const EMPTY_REQUIREMENT = {
  country: 'India', venue_preference: 'student_home', preferred_teacher_gender: 'any',
  learner_count: 1, subjects: [], preferred_days: [], languages: [],
  relationship: 'parent', whatsapp_consent: true,
};

const TIME_WINDOWS = [
  { label: 'Before school (6–9am)', start: '06:00', end: '09:00' },
  { label: 'Morning (9am–12pm)',    start: '09:00', end: '12:00' },
  { label: 'Afternoon (12–4pm)',    start: '12:00', end: '16:00' },
  { label: 'After school (4–7pm)',  start: '16:00', end: '19:00' },
  { label: 'Evening (7–10pm)',      start: '19:00', end: '22:00' },
];

export default function RequirementForm({
  value, onChange, showContact = true, students = [], submitting, error, onSubmit, submitLabel = 'Find me a tutor',
}) {
  const { data: cats = [] } = useQuery({ queryKey: ['categories', 'tree'], queryFn: fetchCategoriesTree });
  const [openMore, setOpenMore] = useState(false);

  // De-duplicated: "Mathematics" exists under both academic categories, and two
  // identical chips that toggle together look broken.
  const subjectOptions = [...new Set(cats.flatMap(c => (c.children?.length ? c.children : [c])).map(s => s.name))];
  const set = (patch) => onChange({ ...value, ...patch });
  const setField = (k) => (e) => set({ [k]: e.target.value });
  const setNum = (k) => (e) => set({ [k]: e.target.value === '' ? null : Number(e.target.value) });

  const windowOn = (w) => (value.preferred_time_windows || []).some(x => x.start === w.start);
  const toggleWindow = (w) => {
    const cur = value.preferred_time_windows || [];
    set({
      preferred_time_windows: windowOn(w)
        ? cur.filter(x => x.start !== w.start)
        : [...cur, { start: w.start, end: w.end }],
    });
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      {/* --- The learner --- */}
      <Section icon={GraduationCap} title="Who needs the tutor?">
        {students.length > 0 && (
          <Field className="mb-3" label="Which child?">
            <select className={field} value={value.student_id ?? ''}
              onChange={e => {
                const id = e.target.value ? Number(e.target.value) : null;
                const s = students.find(x => x.id === id);
                set({
                  student_id: id,
                  learner_name: s?.name ?? value.learner_name,
                  board: s?.board || value.board,
                });
              }}>
              <option value="">Someone else / not listed</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}{s.grade ? ` · ${s.grade}` : ''}</option>)}
            </select>
          </Field>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Student's name">
            <input className={field} value={value.learner_name ?? ''} onChange={setField('learner_name')}
              placeholder="e.g. Riya" />
          </Field>
          <Field label="Class" required>
            <select className={field} value={value.grade ?? ''} onChange={setNum('grade')}>
              <option value="">Select class…</option>
              {GRADE_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </Field>
          <Field label="Board">
            <select className={field} value={value.board ?? ''} onChange={setField('board')}>
              <option value="">Not sure / other</option>
              {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
        </div>

        <Field className="mt-3" label="Subjects you need help with" required>
          <ChipGroup options={subjectOptions.slice(0, 40)} value={value.subjects || []}
            onChange={subjects => set({ subjects })} />
          <input className={`${field} mt-2`} placeholder="Something not listed? Type it and press Enter"
            onKeyDown={e => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              const v = e.target.value.trim();
              if (v && !(value.subjects || []).includes(v)) set({ subjects: [...(value.subjects || []), v] });
              e.target.value = '';
            }} />
        </Field>

        <Field className="mt-3" label="What's the goal?">
          <select className={field} value={value.goal ?? ''} onChange={setField('goal')}>
            <option value="">Select…</option>
            {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </Field>

        {value.goal === 'competitive' && (
          <Field className="mt-3" label="Which exam?">
            <input className={field} value={value.exam_target ?? ''} onChange={setField('exam_target')}
              placeholder="JEE Main, NEET, NTSE…" />
          </Field>
        )}
      </Section>

      {/* --- Where --- */}
      <AddressBlock value={value} onChange={set} title="Where will classes happen?"
        description="We match on real distance, so the teacher you get is one who can realistically keep turning up." />

      <Section icon={MapPin} title="Class location">
        <RadioCards options={VENUES} value={value.venue_preference} onChange={v => set({ venue_preference: v })} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {value.venue_preference !== 'teacher_place' && (
            <Field label="Furthest a teacher should travel" hint="km — closer teachers are more reliable">
              <input type="number" min={1} max={100} className={field} placeholder="8"
                value={value.max_teacher_distance_km ?? ''} onChange={setNum('max_teacher_distance_km')} />
            </Field>
          )}
          {value.venue_preference !== 'student_home' && (
            <Field label="How far would you travel?" hint="km">
              <input type="number" min={0} max={100} className={field} placeholder="5"
                value={value.willing_to_travel_km ?? ''} onChange={setNum('willing_to_travel_km')} />
            </Field>
          )}
        </div>
      </Section>

      {/* --- When --- */}
      <Section icon={CalendarDays} title="When would classes suit you?"
        description="We only suggest teachers who are actually free then — this is the single biggest reason a match falls through.">
        <Field label="Days that work">
          <ChipGroup options={WEEKDAYS.map(d => ({ value: d.n, label: d.short }))}
            value={value.preferred_days || []} onChange={days => set({ preferred_days: days })} />
        </Field>

        <Field className="mt-3" label="Times that work">
          <div className="flex flex-wrap gap-1.5">
            {TIME_WINDOWS.map(w => (
              <button key={w.start} type="button" onClick={() => toggleWindow(w)} aria-pressed={windowOn(w)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1 transition ${
                  windowOn(w) ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-700 ring-slate-200 hover:ring-brand-400'}`}>
                {windowOn(w) ? '✓ ' : ''}{w.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Classes a week">
            <input type="number" min={1} max={14} className={field} placeholder="3"
              value={value.sessions_per_week ?? ''} onChange={setNum('sessions_per_week')} />
          </Field>
          <Field label="Length of a class" hint="minutes">
            <input type="number" min={30} max={300} step={15} className={field} placeholder="90"
              value={value.session_minutes ?? ''} onChange={setNum('session_minutes')} />
          </Field>
          <Field label="How soon?">
            <select className={field} value={value.urgency ?? ''} onChange={setField('urgency')}>
              <option value="">Select…</option>
              {URGENCY.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* --- Budget & teacher preferences. Collapsed: they are the questions
              parents stall on, and none of them is required to submit. --- */}
      <button type="button" onClick={() => setOpenMore(v => !v)}
        className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700">
        {openMore ? 'Hide' : 'Add'} budget &amp; teacher preferences
        <span className="ml-1 font-normal text-slate-400">· optional, but it gets you a better match</span>
      </button>

      {openMore && (
        <>
          <Section icon={Wallet} title="Budget">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="From" hint="₹ / hour">
                <input type="number" min={0} className={field} placeholder="400"
                  value={value.budget_min_hourly ?? ''} onChange={setNum('budget_min_hourly')} />
              </Field>
              <Field label="Up to" hint="₹ / hour">
                <input type="number" min={0} className={field} placeholder="800"
                  value={value.budget_max_hourly ?? ''} onChange={setNum('budget_max_hourly')} />
              </Field>
              <Field label="Or a monthly budget" hint="₹">
                <input type="number" min={0} className={field} placeholder="6000"
                  value={value.budget_monthly ?? ''} onChange={setNum('budget_monthly')} />
              </Field>
            </div>
          </Section>

          <Section icon={UserCheck} title="Teacher preferences">
            <Field label="Teacher's gender">
              <RadioCards value={value.preferred_teacher_gender || 'any'}
                onChange={v => set({ preferred_teacher_gender: v })}
                options={[
                  { value: 'any', label: 'No preference' },
                  { value: 'female', label: 'Female teacher' },
                  { value: 'male', label: 'Male teacher' },
                ]} />
            </Field>

            <Field className="mt-3" label="Languages the teacher should teach in">
              <ChipGroup options={LANGUAGES} value={value.preferred_teacher_languages || []}
                onChange={v => set({ preferred_teacher_languages: v })} />
            </Field>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Minimum experience" hint="years">
                <input type="number" min={0} max={50} className={field} placeholder="3"
                  value={value.min_teacher_experience ?? ''} onChange={setNum('min_teacher_experience')} />
              </Field>
              <Field label="How many students in the class?" hint="e.g. two siblings together">
                <input type="number" min={1} max={20} className={field}
                  value={value.learner_count ?? 1} onChange={setNum('learner_count')} />
              </Field>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Check label="A small group class is fine" hint="usually cheaper per hour"
                checked={value.group_ok} onChange={v => set({ group_ok: v })} />
              <Check label="The student needs extra learning support"
                checked={value.special_needs} onChange={v => set({ special_needs: v })} />
            </div>

            {value.special_needs && (
              <Field className="mt-3" label="Tell us what would help">
                <textarea rows={2} className={field} value={value.special_needs_note ?? ''}
                  onChange={setField('special_needs_note')}
                  placeholder="So we match a teacher who has done this before." />
              </Field>
            )}

            <Field className="mt-3" label="Anything else?">
              <textarea rows={2} className={field} value={value.focus_areas ?? ''} onChange={setField('focus_areas')}
                placeholder="Weak in trigonometry; needs help with handwriting; prefers a patient teacher…" />
            </Field>
          </Section>
        </>
      )}

      {/* --- Contact --- */}
      {showContact && (
        <Section icon={Phone} title="How should we reach you?">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Your name" required>
              <input className={field} value={value.contact_name ?? ''} onChange={setField('contact_name')}
                placeholder="Parent / guardian name" />
            </Field>
            <Field label="Phone / WhatsApp" required>
              <input className={field} value={value.contact_phone ?? ''} onChange={setField('contact_phone')}
                inputMode="tel" placeholder="+91 98765 43210" />
            </Field>
            <Field label="Email">
              <input type="email" className={field} value={value.contact_email ?? ''} onChange={setField('contact_email')}
                placeholder="you@example.com" />
            </Field>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Best time to call">
              <input className={field} value={value.best_time_to_call ?? ''} onChange={setField('best_time_to_call')}
                placeholder="e.g. after 6pm" />
            </Field>
            <div className="flex items-end pb-1">
              <Check label="You can reach me on WhatsApp" checked={value.whatsapp_consent}
                onChange={v => set({ whatsapp_consent: v })} />
            </div>
          </div>
        </Section>
      )}

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">{error}</p>}

      <button type="submit" disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : submitLabel}
      </button>
    </form>
  );
}

/** Strip UI-only keys and empty strings before posting. */
export const cleanRequirement = (v) => {
  const out = cleanAddress(v);
  Object.keys(out).forEach(k => { if (out[k] === '') out[k] = null; });
  return out;
};
