import { Globe, Route } from 'lucide-react';
import { Field, field } from './FormBits.jsx';
import { TRAVEL_MODES } from '../../data/physical.js';

const MAX_KM = 30;

// Straight-line km -> door-to-door minutes: a 1.4x detour factor over city
// speeds a teacher would actually manage. Presentation only — it exists to make
// the radius slider mean something, and nothing downstream reads it.
const SPEED_KMPH = { walk: 4.5, cycle: 11, two_wheeler: 20, car: 22, public: 14 };
const minutesFor = (km, mode) => Math.ceil((km * 1.4) / (SPEED_KMPH[mode] ?? 18) * 60);

/**
 * How far the teacher will travel, and what that actually costs them.
 *
 * The travel-time readout is the point of this control. "15 km" sounds fine in
 * the abstract; "about 63 minutes each way by bus" is the number that stops a
 * teacher from accepting a slot they will quietly drop in month two — which is
 * the single most expensive failure mode in home tuition.
 */
export default function RadiusPicker({ value, onChange }) {
  const km = Number(value.service_radius_km || 0);
  const set = (patch) => onChange({ ...value, ...patch });
  const mins = km ? minutesFor(km, value.travel_mode) : 0;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3.5">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-slate-700">How far will you travel to a student?</span>
          <span className="font-heading text-base font-extrabold text-brand-700">
            {km === 0 ? "I don't travel" : `${km} km`}
          </span>
        </div>
        <input type="range" min={0} max={MAX_KM} step={1} value={km}
          onChange={e => set({ service_radius_km: Number(e.target.value) })}
          className="w-full cursor-pointer accent-brand-600"
          aria-label="Service radius in kilometres" />
        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
          <span>Don't travel</span><span>{MAX_KM / 2} km</span><span>{MAX_KM} km</span>
        </div>

        {km > 0 && (
          <p className="mt-2.5 flex items-start gap-1.5 rounded-md bg-brand-50 px-2.5 py-2 text-xs text-brand-800">
            <Route className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              At the far edge that's roughly <strong>{mins} minutes each way</strong>
              {value.travel_mode ? ` by ${TRAVEL_MODES.find(m => m.value === value.travel_mode)?.label.toLowerCase()}` : ''}.
              {' '}Pick a radius you'd still be happy with in July.
            </span>
          </p>
        )}
        {km === 0 && (
          <p className="mt-2.5 flex items-start gap-1.5 rounded-md bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
            <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>You'll only be matched with students who come to you (or online classes, which are set up separately).</span>
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="How do you travel?">
          <select value={value.travel_mode || ''} onChange={e => set({ travel_mode: e.target.value || null })}
            className={field}>
            <option value="">Select…</option>
            {TRAVEL_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </Field>
        <Field label="Longest one-way trip you'd accept" hint="minutes">
          <input type="number" min={0} max={300} inputMode="numeric"
            value={value.max_travel_minutes ?? ''} placeholder="e.g. 40"
            onChange={e => set({ max_travel_minutes: e.target.value === '' ? null : Number(e.target.value) })}
            className={field} />
        </Field>
      </div>

      <Field label="Other pincodes you'd also travel to"
        hint="outside the circle — a route you already take, a relative's area">
        <input value={value.extra_pincodes || ''} onChange={e => set({ extra_pincodes: e.target.value })}
          placeholder="700091, 700064" className={field} />
      </Field>
    </div>
  );
}
