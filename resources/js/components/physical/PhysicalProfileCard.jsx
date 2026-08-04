import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Home, MapPin, BookOpen, CalendarDays, UserCheck, Save, Loader2, CheckCircle2,
  AlertTriangle, ChevronRight, ChevronLeft, Power,
} from 'lucide-react';
import { fetchPhysicalProfile, savePhysicalProfile, setPhysicalStatus } from '../../lib/api.js';
import AddressBlock, { cleanAddress } from './AddressBlock.jsx';
import RadiusPicker from './RadiusPicker.jsx';
import AvailabilityGrid from './AvailabilityGrid.jsx';
import OfferingsEditor from './OfferingsEditor.jsx';
import { Field, field, Section, Check, ChipGroup, RadioCards } from './FormBits.jsx';
import { GENDERS, LANGUAGES } from '../../data/physical.js';
import { errText } from '../admin/AdminUI.jsx';

/**
 * The teacher's home-tuition profile, as four steps rather than one wall.
 *
 * It is a long form — that is unavoidable, because every field here is one the
 * assignment app filters or ranks on — so it is broken where a teacher would
 * naturally pause, saves as a draft at any point, and only goes live when they
 * say so. The completeness meter is the honest version of a progress bar: it
 * reports what the matcher needs, not how many boxes are filled.
 */

const STEPS = [
  { key: 'where', label: 'Where you teach', Icon: MapPin },
  { key: 'what',  label: 'What you teach',  Icon: BookOpen },
  { key: 'when',  label: "When you're free", Icon: CalendarDays },
  { key: 'you',   label: 'About you',       Icon: UserCheck },
];

const EMPTY = {
  nationality: 'Indian', country: 'India', at_student_home: true,
  preferred_student_gender: 'any', service_radius_km: 0,
};

export default function PhysicalProfileCard() {
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ['physical-profile'], queryFn: fetchPhysicalProfile });
  const [form, setForm] = useState(null);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(null);

  const value = form ?? (profile ? { ...EMPTY, ...profile } : null);
  const set = (patch) => { setSaved(null); setForm({ ...value, ...patch }); };
  const setField = (k) => (e) => set({ [k]: e.target.value });
  const setNum = (k) => (e) => set({ [k]: e.target.value === '' ? null : Number(e.target.value) });

  const save = useMutation({
    mutationFn: (publish) => savePhysicalProfile({
      ...cleanAddress(value),
      // The server owns these; sending them back would be a no-op at best.
      id: undefined, status: undefined, completeness: undefined, weekly_hours: undefined, updated_at: undefined,
      publish,
    }),
    onSuccess: (data, publish) => {
      qc.setQueryData(['physical-profile'], data);
      setForm(null);
      setSaved(publish ? 'published' : 'saved');
    },
  });

  const toggleLive = useMutation({
    mutationFn: (status) => setPhysicalStatus(status),
    onSuccess: (data) => { qc.setQueryData(['physical-profile'], data); setForm(null); },
  });

  if (isLoading || !value) {
    return <section className="rounded-2xl bg-white p-6 text-sm text-slate-400 shadow-sm ring-1 ring-slate-100">Loading your home-tuition profile…</section>;
  }

  const isLive = profile?.status === 'active';
  const pct = profile?.completeness ?? 0;
  const StepPanel = [WhereStep, WhatStep, WhenStep, AboutStep][step];

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Home className="h-5 w-5 text-brand-600" /> Home &amp; physical tuition
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Where you'll travel, what you teach class-by-class, and when you're free.
            This is what we match students to — the more exact it is, the fewer wasted calls you get.
          </p>
        </div>
        <StatusPill status={profile?.status} />
      </header>

      <Meter pct={pct} profile={profile} />

      {/* Step rail. Numbers, not a progress bar: the teacher can jump straight
          to availability when that is the only thing that changed this term. */}
      <nav className="mb-5 mt-5 flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => (
          <button key={s.key} type="button" onClick={() => setStep(i)}
            aria-current={i === step ? 'step' : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              i === step ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <s.Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
        ))}
      </nav>

      <form onSubmit={e => { e.preventDefault(); save.mutate(false); }} className="space-y-4">
        <StepPanel value={value} set={set} setField={setField} setNum={setNum} />

        {save.isError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {errText(save.error)}
          </p>
        )}
        {saved && (
          <p className="flex items-center gap-1.5 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 ring-1 ring-green-100">
            <CheckCircle2 className="h-4 w-4" />
            {saved === 'published' ? "You're live — we'll start matching students near you." : 'Saved as a draft.'}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <button type="button" disabled={step === 0} onClick={() => setStep(s => s - 1)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep(s => s + 1)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : <span className="flex-1" />}

          <span className="flex-1" />

          <button type="submit" disabled={save.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-60">
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save draft
          </button>

          {isLive ? (
            <button type="button" onClick={() => toggleLive.mutate('paused')} disabled={toggleLive.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-200 disabled:opacity-60">
              <Power className="h-4 w-4" /> Pause matching
            </button>
          ) : (
            <button type="button" onClick={() => save.mutate(true)} disabled={save.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              <CheckCircle2 className="h-4 w-4" /> Save &amp; go live
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function StatusPill({ status }) {
  const map = {
    active:    ['bg-green-50 text-green-700', 'Live — being matched'],
    paused:    ['bg-amber-50 text-amber-700', 'Paused'],
    submitted: ['bg-blue-50 text-blue-700', 'Awaiting review'],
    draft:     ['bg-slate-100 text-slate-600', 'Draft — not visible'],
  };
  const [tone, label] = map[status] || map.draft;
  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{label}</span>;
}

/**
 * Completeness, plus the specific thing that is missing. "80% complete" alone
 * tells a teacher nothing they can act on; "add your availability" does.
 */
function Meter({ pct, profile }) {
  const gaps = [];
  if (!profile?.pincode) gaps.push('your pincode');
  if (!profile?.latitude) gaps.push('a location we can measure distance from');
  if (!profile?.offerings?.length) gaps.push('at least one subject');
  if (!profile?.availability?.length) gaps.push('your weekly availability');
  if (!profile?.service_radius_km && !profile?.at_own_place) gaps.push('how far you travel (or that students come to you)');

  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-600">Profile completeness</span>
        <span className="tabular-nums text-slate-800">{pct}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-slate-400'}`}
          style={{ width: `${pct}%` }} />
      </div>
      {gaps.length > 0 && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>Still needed to be matchable: {gaps.join(', ')}.</span>
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- steps

function WhereStep({ value, set, setNum }) {
  return (
    <>
      <AddressBlock value={value} onChange={set}
        title="Your base address"
        description="We measure travel distance from here. Your exact address is never shown publicly — students see your area only." />

      <Section icon={Home} title="Travel &amp; where classes happen"
        description="Two different questions: how far you'll go, and whether students can come to you instead.">
        <RadiusPicker value={value} onChange={set} />

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Check label="I go to the student's home" checked={value.at_student_home}
            onChange={v => set({ at_student_home: v })} />
          <Check label="Students come to me" hint="at your home or study room" checked={value.at_own_place}
            onChange={v => set({ at_own_place: v })} />
          <Check label="A library or study centre" checked={value.at_public_place}
            onChange={v => set({ at_public_place: v })} />
        </div>

        {value.at_own_place && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="How many students can you seat?">
              <input type="number" min={1} max={100} className={field} placeholder="4"
                value={value.own_place_capacity ?? ''} onChange={setNum('own_place_capacity')} />
            </Field>
            <Field label="Travel charge per visit" hint="₹, leave blank if included">
              <input type="number" min={0} className={field} placeholder="0"
                value={value.travel_fee_per_visit ?? ''} onChange={setNum('travel_fee_per_visit')} />
            </Field>
          </div>
        )}
      </Section>
    </>
  );
}

function WhatStep({ value, set }) {
  return (
    <Section icon={BookOpen} title="Subjects, classes and boards"
      description="Add each subject with the exact classes you take. This is the difference between getting the right leads and getting calls you have to turn down.">
      <OfferingsEditor offerings={value.offerings || []} onChange={offerings => set({ offerings })} />
    </Section>
  );
}

function WhenStep({ value, set, setNum }) {
  return (
    <>
      <Section icon={CalendarDays} title="Your weekly availability"
        description="Mark the hours you could take a class. We only show you to families whose preferred timings overlap yours.">
        <AvailabilityGrid slots={value.availability || []} onChange={availability => set({ availability })} />
      </Section>

      <Section icon={CalendarDays} title="Scheduling limits">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Max hours a week" hint="total">
            <input type="number" min={1} max={120} className={field} placeholder="15"
              value={value.max_hours_per_week ?? ''} onChange={setNum('max_hours_per_week')} />
          </Field>
          <Field label="Max students">
            <input type="number" min={1} max={200} className={field} placeholder="8"
              value={value.max_students ?? ''} onChange={setNum('max_students')} />
          </Field>
          <Field label="Usual session length" hint="minutes">
            <input type="number" min={15} max={480} step={15} className={field} placeholder="90"
              value={value.preferred_session_minutes ?? ''} onChange={setNum('preferred_session_minutes')} />
          </Field>
          <Field label="Notice you need" hint="hours">
            <input type="number" min={0} max={720} className={field} placeholder="24"
              value={value.notice_hours ?? ''} onChange={setNum('notice_hours')} />
          </Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Available from" hint="leave blank if you can start now">
            <input type="date" className={field} value={value.available_from ?? ''}
              onChange={e => set({ available_from: e.target.value || null })} />
          </Field>
          <Field label="On a break until" hint="we'll pause your matches">
            <input type="date" className={field} value={value.on_break_until ?? ''}
              onChange={e => set({ on_break_until: e.target.value || null })} />
          </Field>
        </div>
      </Section>
    </>
  );
}

function AboutStep({ value, set, setField, setNum }) {
  const langs = (value.languages || '').split(',').map(s => s.trim()).filter(Boolean);

  return (
    <>
      <Section icon={UserCheck} title="About you"
        description="Families choosing who comes into their home ask for these. Nothing here is shown publicly beyond your teaching languages.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Gender">
            <select className={field} value={value.gender ?? ''} onChange={setField('gender')}>
              <option value="">Prefer not to say</option>
              {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </Field>
          <Field label="Date of birth">
            <input type="date" className={field} value={value.date_of_birth ?? ''}
              onChange={e => set({ date_of_birth: e.target.value || null })} />
          </Field>
          <Field label="Nationality">
            <input className={field} value={value.nationality ?? 'Indian'} onChange={setField('nationality')} />
          </Field>
        </div>

        <Field className="mt-3" label="Languages you can teach in" hint="the medium, not just what you speak">
          <ChipGroup options={LANGUAGES} value={langs}
            onChange={next => set({ languages: next.join(', ') })} />
        </Field>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Years of teaching experience">
            <input type="number" min={0} max={70} className={field} placeholder="7"
              value={value.experience_years ?? ''} onChange={setNum('experience_years')} />
          </Field>
          <Field label="Lowest rate you'd accept" hint="₹ / hour">
            <input type="number" min={0} className={field} placeholder="500"
              value={value.min_fee_hourly ?? ''} onChange={setNum('min_fee_hourly')} />
          </Field>
        </div>
      </Section>

      <Section icon={UserCheck} title="Who you'd like to teach">
        <Field label="Students you're comfortable teaching">
          <RadioCards value={value.preferred_student_gender || 'any'}
            onChange={v => set({ preferred_student_gender: v })}
            options={[
              { value: 'any', label: 'Any student' },
              { value: 'female', label: 'Girls only' },
              { value: 'male', label: 'Boys only' },
            ]} />
        </Field>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Check label="I can take small groups" hint="two or more students together"
            checked={value.teaches_group} onChange={v => set({ teaches_group: v })} />
          <Check label="I've taught students who need extra support"
            hint="learning differences, special needs"
            checked={value.special_needs_experience} onChange={v => set({ special_needs_experience: v })} />
        </div>

        {value.teaches_group && (
          <Field className="mt-3 sm:max-w-xs" label="Largest batch you'd take">
            <input type="number" min={1} max={60} className={field} placeholder="6"
              value={value.max_batch_size ?? ''} onChange={setNum('max_batch_size')} />
          </Field>
        )}

        <Field className="mt-3" label="Anything else our team should know" hint="optional">
          <textarea rows={3} className={field} value={value.notes ?? ''} onChange={setField('notes')}
            placeholder="Preferred areas, days you'd rather avoid, exam boards you specialise in…" />
        </Field>
      </Section>
    </>
  );
}
