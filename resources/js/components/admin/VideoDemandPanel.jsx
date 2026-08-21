import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Mail, Loader2 } from 'lucide-react';
import { fetchVideoDemandInsights, fetchVideoDemand, setVideoDemandStatus } from '../../lib/api.js';

/**
 * What people are asking us to record, strongest first.
 *
 * The ranking is the product here, not the list. A hundred rows tell nobody
 * what to film next; "Class 10 Physics — 34 people, 9 of them left an email"
 * is a decision. The individual requests sit underneath it, because the
 * normalised key is good for counting and useless for understanding what
 * somebody actually meant.
 */
const STATUS_LABEL = { new: 'New', reviewed: 'Reviewed', planned: 'Planned', declined: 'Not planned' };

export default function VideoDemandPanel() {
  const qc = useQueryClient();
  const [openList, setOpenList] = useState(false);
  const [subjectKey, setSubjectKey] = useState(null);

  const { data: insights, isLoading } = useQuery({
    queryKey: ['video-demand-insights'],
    queryFn: fetchVideoDemandInsights,
    staleTime: 60_000,
  });

  const { data: list } = useQuery({
    queryKey: ['video-demand', subjectKey],
    queryFn: () => fetchVideoDemand(subjectKey ? { subject_key: subjectKey } : {}),
    enabled: openList || !!subjectKey,
  });

  const move = useMutation({
    mutationFn: setVideoDemandStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['video-demand'] });
      qc.invalidateQueries({ queryKey: ['video-demand-insights'] });
    },
  });

  if (isLoading) return <p className="py-6 text-center text-sm text-slate-400">Counting requests…</p>;

  const ranking = insights?.ranking ?? [];
  const top = ranking[0]?.requests ?? 0;

  return (
    <section className="mt-6 rounded-xl bg-white p-4 ring-1 ring-slate-100">
      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <TrendingUp className="h-4 w-4 text-brand-600" /> What people are asking for
      </h4>

      {ranking.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          Nobody has asked yet. Requests appear here as visitors fill in the form on the
          video course pages — which only shows while Settings → Recorded courses is set
          to “Coming soon”.
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-slate-500">
            {insights.total} request{insights.total === 1 ? '' : 's'}
            {insights.notify > 0 && <> · {insights.notify} asked to be told when it launches</>}
          </p>

          <ul className="mt-4 space-y-2">
            {ranking.map(r => (
              <li key={r.subject_key}>
                <button type="button"
                  onClick={() => { setSubjectKey(r.subject_key); setOpenList(true); }}
                  className="w-full rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">{r.example}</span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {r.requests} {r.requests === 1 ? 'person' : 'people'}
                      {r.waiting_to_hear > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-brand-700">
                          <Mail className="h-3 w-3" />{r.waiting_to_hear}
                        </span>
                      )}
                    </span>
                  </div>
                  {/* Bar widths are relative to the strongest request, so the
                      shape of demand is readable at a glance rather than
                      needing the numbers to be compared one by one. */}
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500"
                      style={{ width: `${top ? Math.max(4, (r.requests / top) * 100) : 0}%` }} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {(openList || subjectKey) && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {subjectKey ? `Requests for “${ranking.find(r => r.subject_key === subjectKey)?.example ?? subjectKey}”` : 'All requests'}
            </h5>
            <button type="button" onClick={() => { setSubjectKey(null); setOpenList(false); }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800">Close</button>
          </div>

          {!list ? (
            <p className="py-4 text-center text-slate-400"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></p>
          ) : (list.data ?? []).length === 0 ? (
            <p className="text-xs text-slate-500">Nothing here.</p>
          ) : (
            <ul className="space-y-2">
              {list.data.map(r => (
                <li key={r.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <strong className="text-slate-800">{r.subject}</strong>
                    {r.level && <span className="text-slate-500">· {r.level}</span>}
                    <span className="ml-auto text-slate-400">
                      {r.created_at ? r.created_at.slice(0, 10).split('-').reverse().join('-') : ''}
                    </span>
                  </div>
                  <p className="mt-0.5 text-slate-500">
                    {r.name || 'Anonymous'}
                    {r.email && <> · {r.email}</>}
                    {r.phone && <> · {r.phone}</>}
                    {r.notify_me && <span className="ml-1 font-semibold text-brand-700">· wants telling</span>}
                  </p>
                  {r.message && <p className="mt-1 whitespace-pre-wrap text-slate-600">{r.message}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <button key={value} type="button" disabled={move.isPending || r.status === value}
                        onClick={() => move.mutate({ id: r.id, status: value })}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
                          r.status === value
                            ? 'bg-brand-600 text-white'
                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
