import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchCategoriesTree } from '../../lib/api.js';
import { Field, field, ChipGroup } from './FormBits.jsx';
import { GRADE_OPTIONS, BOARDS, LEVELS, gradeLabel } from '../../data/physical.js';

/**
 * Subjects, one row per (subject × grade range × boards × fee).
 *
 * This replaces a comma-separated subject list, and the reason is the whole
 * point of the module: "Maths, Physics" cannot say "Physics for 11-12 CBSE but
 * Maths only up to Class 8". A CSV match sends that teacher a Class 12 Maths
 * lead, they decline, and both the lead and the relationship are spent. The fee
 * belongs here too — Class 12 Physics is never priced like Class 3 Maths.
 */
export default function OfferingsEditor({ offerings = [], onChange }) {
  const { data: cats = [] } = useQuery({ queryKey: ['categories', 'tree'], queryFn: fetchCategoriesTree });
  const [adding, setAdding] = useState(false);

  // De-duplicated: the same subject appears under more than one category, and a
  // datalist that offers "Mathematics" three times reads as a bug.
  const subjects = [...new Set(cats.flatMap(c => (c.children?.length ? c.children : [c])).map(s => s.name))];
  const update = (i, patch) => onChange(offerings.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  const remove = (i) => onChange(offerings.filter((_, idx) => idx !== i));

  const add = (subject) => {
    if (offerings.some(o => o.subject === subject)) return setAdding(false);
    onChange([...offerings, {
      subject, grade_from: null, grade_to: null, boards: [], fee_hourly: null,
      is_primary: offerings.length === 0,
    }]);
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      {offerings.length === 0 && !adding && (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
          No subjects added yet. Add each subject with the classes and boards you actually take —
          that's what decides which students you're shown.
        </p>
      )}

      {offerings.map((o, i) => (
        <OfferingRow key={`${o.subject}-${i}`} offering={o}
          onChange={patch => update(i, patch)} onRemove={() => remove(i)}
          onMakePrimary={() => onChange(offerings.map((x, idx) => ({ ...x, is_primary: idx === i })))} />
      ))}

      {adding ? (
        <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-3">
          <Field label="Which subject?">
            <input autoFocus list="it-subjects" className={field} placeholder="Start typing — e.g. Mathematics"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (e.target.value.trim()) add(e.target.value.trim()); } }}
              onChange={e => { if (subjects.includes(e.target.value)) add(e.target.value); }} />
            <datalist id="it-subjects">
              {subjects.map(s => <option key={s} value={s} />)}
            </datalist>
          </Field>
          <p className="mt-1.5 text-xs text-slate-500">Pick from the list or type your own, then press Enter.</p>
          <button type="button" onClick={() => setAdding(false)}
            className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-3 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50">
          <Plus className="h-4 w-4" /> Add a subject
        </button>
      )}
    </div>
  );
}

function OfferingRow({ offering: o, onChange, onRemove, onMakePrimary }) {
  const [open, setOpen] = useState(!o.grade_from && !o.grade_to);

  const gradeText = o.grade_from == null && o.grade_to == null
    ? 'All levels'
    : `${gradeLabel(o.grade_from ?? 0)} – ${gradeLabel(o.grade_to ?? 13)}`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <button type="button" onClick={onMakePrimary} title="Mark as your main subject"
          className={`shrink-0 rounded-full p-1 ${o.is_primary ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}>
          <Star className="h-4 w-4" fill={o.is_primary ? 'currentColor' : 'none'} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-800">{o.subject}</p>
          <p className="truncate text-xs text-slate-500">
            {gradeText}
            {o.boards?.length ? ` · ${o.boards.join(', ')}` : ''}
            {o.fee_hourly ? ` · ₹${o.fee_hourly}/hr` : ''}
          </p>
        </div>
        <button type="button" onClick={() => setOpen(v => !v)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={open ? 'Collapse' : 'Edit'}>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onRemove}
          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove subject">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-slate-100 px-3 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="From class">
              <select className={field} value={o.grade_from ?? ''}
                onChange={e => onChange({ grade_from: e.target.value === '' ? null : Number(e.target.value) })}>
                <option value="">Any</option>
                {GRADE_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
            <Field label="Up to class">
              <select className={field} value={o.grade_to ?? ''}
                onChange={e => onChange({ grade_to: e.target.value === '' ? null : Number(e.target.value) })}>
                <option value="">Any</option>
                {GRADE_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Boards you teach this for" hint="leave empty if it doesn't depend on the board">
            <ChipGroup options={BOARDS} value={o.boards || []} onChange={boards => onChange({ boards })} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Your rate" hint="₹ / hour">
              <input type="number" min={0} inputMode="numeric" className={field} placeholder="600"
                value={o.fee_hourly ?? ''}
                onChange={e => onChange({ fee_hourly: e.target.value === '' ? null : Number(e.target.value) })} />
            </Field>
            <Field label="Monthly package" hint="₹, optional">
              <input type="number" min={0} inputMode="numeric" className={field} placeholder="6000"
                value={o.fee_monthly ?? ''}
                onChange={e => onChange({ fee_monthly: e.target.value === '' ? null : Number(e.target.value) })} />
            </Field>
            <Field label="Type">
              <select className={field} value={o.level ?? ''}
                onChange={e => onChange({ level: e.target.value || null })}>
                <option value="">Any</option>
                {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
          </div>

          {o.level === 'competitive' && (
            <Field label="Which exam?">
              <input className={field} placeholder="JEE Main, NEET, NTSE…" value={o.exam_target ?? ''}
                onChange={e => onChange({ exam_target: e.target.value })} />
            </Field>
          )}
        </div>
      )}
    </div>
  );
}
