import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Home, Plus, CheckCircle2, X, MapPin, Clock } from 'lucide-react';
import {
  fetchTuitionRequirements, createTuitionRequirement, closeTuitionRequirement, fetchStudents,
} from '../../lib/api.js';
import RequirementForm, { EMPTY_REQUIREMENT, cleanRequirement } from './RequirementForm.jsx';
import { gradeLabel, WEEKDAYS } from '../../data/physical.js';
import { errText, StatusBadge } from '../admin/AdminUI.jsx';

/**
 * A family's open home-tuition requests, on the parent/student dashboard.
 *
 * Requests rather than a single profile: two children, or one child needing
 * Maths urgently and Science from June, are two different matches with
 * different budgets and timings — and each one opens, gets matched and closes
 * on its own.
 */
export default function TuitionRequirementsCard() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);          // null = list view
  const [done, setDone] = useState(null);

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['tuition-requirements'], queryFn: fetchTuitionRequirements,
  });
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: fetchStudents });

  const create = useMutation({
    mutationFn: () => createTuitionRequirement(cleanRequirement(form)),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tuition-requirements'] });
      setForm(null);
      setDone(res?.message || 'Requirement received — our team will call you back.');
    },
  });

  const close = useMutation({
    mutationFn: closeTuitionRequirement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tuition-requirements'] }),
  });

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Home className="h-5 w-5 text-brand-600" /> Home tuition requests
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tell us what you need and where, and we'll match a verified tutor who can actually reach you.
          </p>
        </div>
        {!form && (
          <button onClick={() => { setDone(null); setForm({ ...EMPTY_REQUIREMENT }); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" /> New request
          </button>
        )}
      </header>

      {done && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 ring-1 ring-green-100">
          <CheckCircle2 className="h-4 w-4" /> {done}
        </p>
      )}

      {form ? (
        <>
          <div className="mb-3 flex justify-end">
            <button onClick={() => setForm(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
          <RequirementForm value={form} onChange={setForm} students={students}
            showContact={false}
            submitting={create.isPending}
            error={create.isError ? errText(create.error) : null}
            onSubmit={() => create.mutate()}
            submitLabel="Submit request" />
        </>
      ) : isLoading ? (
        <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
      ) : requirements.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
          No home-tuition requests yet. Start one and we'll find a tutor near you.
        </p>
      ) : (
        <ul className="space-y-2">
          {requirements.map(r => (
            <li key={r.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
                    {(r.subjects || []).join(', ') || 'Tuition'}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">{r.code}</span>
                    <StatusBadge status={r.status} />
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[r.learner_name, gradeLabel(r.grade), r.board].filter(Boolean).join(' · ')}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{[r.locality, r.city, r.pincode].filter(Boolean).join(', ')}
                    </span>
                    {r.preferred_days?.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {r.preferred_days.map(d => WEEKDAYS.find(w => w.n === d)?.short).filter(Boolean).join(', ')}
                      </span>
                    )}
                  </p>
                </div>
                {r.status === 'open' && (
                  <button onClick={() => close.mutate(r.id)} disabled={close.isPending}
                    className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50">
                    Close
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
