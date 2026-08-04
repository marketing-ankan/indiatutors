// Small shared form atoms for the physical-tuition forms. They exist so the
// teacher wizard, the public apply page and the family requirement form read as
// one product instead of three — and so a spacing tweak lands in all three.

export const field =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 ' +
  'placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ' +
  'disabled:bg-slate-50 disabled:text-slate-400';

export function Label({ children, hint, required }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-slate-800">
      {children}
      {required && <span className="text-red-500"> *</span>}
      {hint && <span className="ml-1 font-normal text-slate-400">· {hint}</span>}
    </label>
  );
}

export function Field({ label, hint, required, error, children, className = '' }) {
  return (
    <div className={className}>
      {label && <Label hint={hint} required={required}>{label}</Label>}
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

/** A block of related questions, so a long form reads as a handful of decisions. */
export function Section({ icon: Icon, title, description, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 ${className}`}>
      <div className="mb-1 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-brand-600" />}
        <h4 className="font-bold text-slate-800">{title}</h4>
      </div>
      {description && <p className="mb-4 text-xs leading-relaxed text-slate-500">{description}</p>}
      <div className={description ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

/** Multi-select pills. Wraps rather than scrolls so it survives a 360px screen. */
export function ChipGroup({ options, value = [], onChange, single = false }) {
  const toggle = (v) => {
    if (single) return onChange(value?.[0] === v ? [] : [v]);
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const v = o.value ?? o;
        const label = o.label ?? o;
        const on = value?.includes(v);
        return (
          <button key={v} type="button" onClick={() => toggle(v)} aria-pressed={on}
            className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1 transition ${
              on ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-700 ring-slate-200 hover:ring-brand-400'}`}>
            {on ? '✓ ' : ''}{label}
          </button>
        );
      })}
    </div>
  );
}

export function Check({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:border-brand-300">
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

/** Radio cards — used where the choice changes what the rest of the form means. */
export function RadioCards({ options, value, onChange, columns = 'sm:grid-cols-3' }) {
  return (
    <div className={`grid gap-2 ${columns}`}>
      {options.map(o => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={on}
            className={`rounded-lg border px-3 py-2.5 text-left transition ${
              on ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 bg-white hover:border-brand-300'}`}>
            <span className={`block text-sm font-bold ${on ? 'text-brand-700' : 'text-slate-800'}`}>{o.label}</span>
            {o.hint && <span className="mt-0.5 block text-xs text-slate-500">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
