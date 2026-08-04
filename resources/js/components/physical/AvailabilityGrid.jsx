import { useMemo, useRef } from 'react';
import { WEEKDAYS, GRID_HOURS, fmtHour } from '../../data/physical.js';

/**
 * Weekly availability as a paintable grid.
 *
 * It stores hour cells and converts to/from the server's (weekday, start, end)
 * ranges, because those are the only shape a matcher can intersect with a
 * family's "weekday evenings after 5". The free-text box this replaces
 * ("5-8pm weekdays") could not be intersected with anything.
 *
 * Drag to paint: a teacher marking twelve evenings should not be twelve
 * separate clicks. Whether the drag adds or removes is decided by the first
 * cell, which is how every calendar behaves.
 */
export default function AvailabilityGrid({ slots = [], onChange, compact = false }) {
  const painting = useRef(null);   // 'on' | 'off' | null

  // Ranges -> a Set of "weekday-hour" keys the grid can render.
  const selected = useMemo(() => {
    const s = new Set();
    for (const slot of slots) {
      const from = parseInt(String(slot.start_time).slice(0, 2), 10);
      const to = parseInt(String(slot.end_time).slice(0, 2), 10);
      const endMin = parseInt(String(slot.end_time).slice(3, 5), 10) || 0;
      // An end of 20:00 means the 19:00 cell is the last one lit; 20:30 lights 20:00 too.
      const last = endMin > 0 ? to : to - 1;
      for (let h = from; h <= last; h++) s.add(`${slot.weekday}-${h}`);
    }
    return s;
  }, [slots]);

  const emit = (set) => {
    const out = [];
    for (const { n } of WEEKDAYS) {
      const hours = GRID_HOURS.filter(h => set.has(`${n}-${h}`)).sort((a, b) => a - b);
      let run = null;
      for (const h of hours) {
        if (run && h === run.end) { run.end = h + 1; continue; }
        if (run) out.push(run);
        run = { weekday: n, start: h, end: h + 1 };
      }
      if (run) out.push(run);
    }
    onChange(out.map(r => ({
      weekday: r.weekday,
      start_time: `${String(r.start).padStart(2, '0')}:00`,
      end_time: `${String(Math.min(r.end, 23)).padStart(2, '0')}:${r.end > 23 ? '59' : '00'}`,
    })));
  };

  const apply = (day, hour, mode) => {
    const key = `${day}-${hour}`;
    const next = new Set(selected);
    mode === 'on' ? next.add(key) : next.delete(key);
    if (next.size !== selected.size) emit(next);
  };

  const start = (day, hour) => {
    const mode = selected.has(`${day}-${hour}`) ? 'off' : 'on';
    painting.current = mode;
    apply(day, hour, mode);
  };

  const total = selected.size;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"
        onPointerUp={() => { painting.current = null; }}
        onPointerLeave={() => { painting.current = null; }}>
        <div className={compact ? 'min-w-[460px]' : 'min-w-[520px]'}>
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(${WEEKDAYS.length}, 1fr)` }}>
            <div className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50" />
            {WEEKDAYS.map(d => (
              <div key={d.n} className="border-b border-l border-slate-200 bg-slate-50 py-1.5 text-center text-[11px] font-bold text-slate-500">
                {d.short}
              </div>
            ))}
            {GRID_HOURS.map(h => (
              <div key={h} className="contents">
                <div className="sticky left-0 z-10 border-b border-slate-100 bg-white py-1 pr-2 text-right text-[10px] font-semibold text-slate-400">
                  {fmtHour(h)}
                </div>
                {WEEKDAYS.map(d => {
                  const on = selected.has(`${d.n}-${h}`);
                  return (
                    <button key={`${d.n}-${h}`} type="button"
                      onPointerDown={(e) => { e.preventDefault(); start(d.n, h); }}
                      onPointerEnter={() => painting.current && apply(d.n, h, painting.current)}
                      aria-pressed={on} aria-label={`${d.long} ${fmtHour(h)}`}
                      className={`h-7 touch-none border-b border-l border-slate-100 transition-colors ${
                        on ? 'bg-brand-500 hover:bg-brand-600' : 'bg-white hover:bg-brand-50'}`} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className="text-slate-500">
          Tap or drag to mark the hours you're free.{' '}
          <span className="font-semibold text-slate-700">{total} hour{total === 1 ? '' : 's'} a week</span>
          {total > 0 && total < 4 && <span className="text-amber-700"> — most families want at least 2 sessions a week, so a little more will get you many more matches.</span>}
        </p>
        {total > 0 && (
          <button type="button" onClick={() => onChange([])}
            className="rounded-md px-2 py-1 font-semibold text-slate-500 hover:bg-slate-100">Clear all</button>
        )}
      </div>
    </div>
  );
}
