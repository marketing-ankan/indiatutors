import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import {
  fetchAdminSettings, fetchAdminSettingsFull, saveAdminSettings, fetchAdminLegal, updateAdminLegal,
} from '../../lib/api.js';
import { errText, inp, inpSm, btnPrimary, btnGhost } from './AdminUI.jsx';

// Site-wide details and the four policy pages.
//
// Both used to be code: the phone number, address and social links were
// hardcoded in Header.jsx, Footer.jsx and SocialProofSections.jsx, and the
// policies were 158KB of JavaScript compiled into the bundle. Changing a refund
// window or a phone number meant a developer, a build and a deploy.

const CONTACT_FIELDS = [
  ['contact_phone', 'Phone number', 'Shown in the top bar and the footer. The tel: link is derived from it.'],
  ['contact_email', 'Email address', 'Shown in the top bar and the footer.'],
  ['contact_locality', 'Short address', 'The header bar only — kept short so it fits.'],
  ['contact_address', 'Full address', 'The footer.'],
  ['entity_name', 'Registered entity name', 'Substituted into the policy pages wherever the legal name appears.'],
];

const SOCIAL_FIELDS = [
  ['whatsapp_url', 'WhatsApp'], ['facebook_url', 'Facebook'], ['instagram_url', 'Instagram'],
  ['youtube_url', 'YouTube'], ['linkedin_url', 'LinkedIn'], ['twitter_url', 'X (Twitter)'],
  ['google_review_url', 'Google review link'],
];

export default function SettingsTab() {
  return (
    <div className="mt-5 space-y-8">
      <div>
        <h3 className="font-heading text-lg font-extrabold text-[#0B1220]">Site details</h3>
        <p className="text-sm text-slate-500">
          The contact details and social links shown in the header and footer of every page.
        </p>
        <SiteDetailsPanel />
      </div>
      <div className="border-t border-slate-100 pt-6">
        <h3 className="font-heading text-lg font-extrabold text-[#0B1220]">Database backup</h3>
        <p className="text-sm text-slate-500">
          Taken automatically before each deploy applies database changes.
        </p>
        <BackupStatus />
      </div>
      <div className="border-t border-slate-100 pt-6">
        <h3 className="font-heading text-lg font-extrabold text-[#0B1220]">Policy pages</h3>
        <p className="text-sm text-slate-500">
          Terms, Payment &amp; Refund, Refer &amp; Earn and Privacy. Changes go live immediately —
          have someone read them before you save.
        </p>
        <LegalPanel />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- site details */

function SiteDetailsPanel() {
  const qc = useQueryClient();
  const { data: payload, isLoading } = useQuery({ queryKey: ['admin-settings-full'], queryFn: fetchAdminSettingsFull });
  const data = payload?.data;
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');

  // `data` is the saved value merged over the shipped defaults, so the form
  // shows what the site is actually rendering right now.
  const current = form ?? data ?? {};
  const set = k => e => setForm({ ...current, [k]: e.target.value });

  const save = useMutation({
    mutationFn: () => saveAdminSettings(current),
    onSuccess: () => {
      setForm(null); setErr('');
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['admin-settings-full'] });
      qc.invalidateQueries({ queryKey: ['site-settings'] });   // header + footer
    },
    onError: e => setErr(errText(e)),
  });

  if (isLoading) return <p className="py-8 text-center text-slate-500">Loading settings…</p>;

  return (
    <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="mt-4 space-y-5">
      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
        <h4 className="mb-3 text-sm font-bold">Contact</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {CONTACT_FIELDS.map(([key, label, hint]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
              <input value={current[key] ?? ''} onChange={set(key)} className={inp} />
              <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>
            </label>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Footer description</span>
          <textarea rows={3} value={current.footer_blurb ?? ''} onChange={set('footer_blurb')} className={inp} />
        </label>
      </div>

      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
        <h4 className="mb-1 text-sm font-bold">Social links</h4>
        <p className="mb-3 text-xs text-slate-500">Clear one to hide its icon in the footer.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_FIELDS.map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
              <input value={current[key] ?? ''} onChange={set(key)} placeholder="https://…" className={inp} />
            </label>
          ))}
        </div>
      </div>

      {err && <p className="text-sm font-semibold text-red-600">{err}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={save.isPending || !form} className={btnPrimary}>
          {save.isPending ? 'Saving…' : 'Save site details'}
        </button>
        {form && (
          <button type="button" onClick={() => { setForm(null); setErr(''); }}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800">Discard changes</button>
        )}
        {save.isSuccess && !form && <span className="text-sm font-semibold text-green-600">Saved — live on the site.</span>}
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------- legal pages */

const BLOCK_LABEL = {
  p: 'Paragraph', list: 'Bulleted list', olist: 'Numbered list',
  note: 'Callout', defs: 'Definitions', table: 'Table', steps: 'Steps',
};

/** A new block of each type, pre-shaped so the API's structural check passes. */
const blankBlock = type => ({
  p:     { type: 'p', text: '' },
  note:  { type: 'note', text: '', tone: 'info' },
  list:  { type: 'list', items: [''] },
  olist: { type: 'olist', items: [''] },
  defs:  { type: 'defs', items: [['', '']] },
  steps: { type: 'steps', items: [{ t: '', d: '' }] },
  table: { type: 'table', head: ['Column 1', 'Column 2'], rows: [['', '']] },
}[type]);

function LegalPanel() {
  const qc = useQueryClient();
  const { data: docs = [], isLoading } = useQuery({ queryKey: ['admin-legal'], queryFn: fetchAdminLegal });
  const [openId, setOpenId] = useState(null);

  if (isLoading) return <p className="py-8 text-center text-slate-500">Loading policies…</p>;

  return (
    <div className="mt-4 space-y-3">
      {docs.map(d => (
        <div key={d.id} className="rounded-xl bg-white ring-1 ring-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="font-semibold text-slate-800">{d.title}</div>
              <div className="text-xs text-slate-500">
                /{d.slug} · {d.sections?.length ?? 0} sections · updated {d.updated_label || '—'}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a href={`/${d.slug}`} target="_blank" rel="noreferrer" className={btnGhost}>
                <ExternalLink className="h-3.5 w-3.5" />View
              </a>
              <button onClick={() => setOpenId(openId === d.id ? null : d.id)} className={btnGhost}>
                {openId === d.id ? 'Close' : 'Edit'}
              </button>
            </div>
          </div>
          {openId === d.id && <LegalEditor doc={d} onSaved={() => qc.invalidateQueries({ queryKey: ['admin-legal'] })} />}
        </div>
      ))}
    </div>
  );
}

function LegalEditor({ doc, onSaved }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: doc.title ?? '', eyebrow: doc.eyebrow ?? '',
    updated_label: doc.updated_label ?? '', effective_label: doc.effective_label ?? '',
    intro: doc.intro ?? '',
    sections: JSON.parse(JSON.stringify(doc.sections ?? [])),
  });
  const [err, setErr] = useState('');

  const save = useMutation({
    mutationFn: () => updateAdminLegal({ id: doc.id, ...form }),
    onSuccess: () => {
      setErr('');
      onSaved?.();
      // The public page and the footer's policy list both read these.
      qc.invalidateQueries({ queryKey: ['legal', doc.key] });
      qc.invalidateQueries({ queryKey: ['legal-nav'] });
    },
    onError: e => setErr(errText(e)),
  });

  const setSections = fn => setForm(f => {
    const next = JSON.parse(JSON.stringify(f.sections));
    fn(next);
    return { ...f, sections: next };
  });

  const move = (arr, i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };

  return (
    <div className="border-t border-slate-100 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Title</span>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inp} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Eyebrow</span>
          <input value={form.eyebrow} onChange={e => setForm({ ...form, eyebrow: e.target.value })} className={inp} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Last updated</span>
          <input value={form.updated_label} onChange={e => setForm({ ...form, updated_label: e.target.value })}
            placeholder="3 August 2026" className={inp} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Effective from</span>
          <input value={form.effective_label} onChange={e => setForm({ ...form, effective_label: e.target.value })}
            placeholder="3 August 2026" className={inp} />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-semibold text-slate-600">Introduction</span>
        <textarea rows={3} value={form.intro} onChange={e => setForm({ ...form, intro: e.target.value })} className={inp} />
      </label>

      <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
        Section numbers are added automatically — don't type them into headings. Inside any text you can use
        <code className="mx-1 rounded bg-white px-1">**bold**</code> and
        <code className="mx-1 rounded bg-white px-1">[link](/page)</code>. Write
        <code className="mx-1 rounded bg-white px-1">__ENTITY__</code> where the registered company name should appear.
      </p>

      <div className="mt-4 space-y-3">
        {form.sections.map((s, i) => (
          <SectionEditor
            key={i} index={i} section={s}
            onChange={fn => setSections(next => fn(next[i]))}
            onMove={dir => setSections(next => move(next, i, dir))}
            onRemove={() => setSections(next => next.splice(i, 1))}
          />
        ))}
      </div>

      <button type="button"
        onClick={() => setSections(next => next.push({ id: `section-${next.length + 1}`, h: '', blocks: [blankBlock('p')], subs: [] }))}
        className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
        <Plus className="h-3.5 w-3.5" />Add section
      </button>

      {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{err}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button type="button" disabled={save.isPending} onClick={() => save.mutate()} className={btnPrimary}>
          {save.isPending ? 'Saving…' : 'Save policy'}
        </button>
        {save.isSuccess && <span className="text-sm font-semibold text-green-600">Saved — live on the site.</span>}
      </div>
    </div>
  );
}

function SectionEditor({ index, section, onChange, onMove, onRemove }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg bg-slate-50 ring-1 ring-slate-200">
      <div className="flex items-center gap-2 p-2.5">
        <span className="shrink-0 text-xs font-bold tabular-nums text-slate-400">{index + 1}.</span>
        <input value={section.h ?? ''} onChange={e => onChange(s => { s.h = e.target.value; })}
          placeholder="Section heading" className={inpSm + ' flex-1 bg-white'} />
        <button type="button" onClick={() => onMove(-1)} className="p-1 text-slate-400 hover:text-slate-700" title="Move up"><ChevronUp className="h-4 w-4" /></button>
        <button type="button" onClick={() => onMove(1)} className="p-1 text-slate-400 hover:text-slate-700" title="Move down"><ChevronDown className="h-4 w-4" /></button>
        <button type="button" onClick={() => setOpen(o => !o)} className="rounded px-2 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-white">
          {open ? 'Hide' : `${(section.blocks?.length ?? 0) + (section.subs?.length ?? 0)} items`}
        </button>
        <button type="button" onClick={() => { if (confirm(`Delete section “${section.h || 'untitled'}”?`)) onRemove(); }}
          className="p-1 text-slate-400 hover:text-red-600" title="Delete section"><Trash2 className="h-4 w-4" /></button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-slate-200 p-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-slate-500">
              Anchor id — the #link the Contents list points at. Changing it breaks existing links to this section.
            </span>
            <input value={section.id ?? ''} onChange={e => onChange(s => { s.id = e.target.value; })} className={inpSm + ' bg-white'} />
          </label>

          <BlockList
            blocks={section.blocks ?? []}
            onChange={fn => onChange(s => { s.blocks ??= []; fn(s.blocks); })}
          />

          <div className="space-y-3 border-l-2 border-slate-200 pl-3">
            {(section.subs ?? []).map((sub, j) => (
              <div key={j} className="rounded-lg bg-white p-2.5 ring-1 ring-slate-200">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-xs font-bold tabular-nums text-slate-400">{index + 1}.{j + 1}</span>
                  <input value={sub.h ?? ''} onChange={e => onChange(s => { s.subs[j].h = e.target.value; })}
                    placeholder="Subsection heading" className={inpSm + ' flex-1'} />
                  <button type="button" onClick={() => onChange(s => { const a = s.subs; const k = j - 1; if (k >= 0) [a[j], a[k]] = [a[k], a[j]]; })}
                    className="p-1 text-slate-400 hover:text-slate-700" title="Move up"><ChevronUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => onChange(s => { const a = s.subs; const k = j + 1; if (k < a.length) [a[j], a[k]] = [a[k], a[j]]; })}
                    className="p-1 text-slate-400 hover:text-slate-700" title="Move down"><ChevronDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => { if (confirm('Delete this subsection?')) onChange(s => s.subs.splice(j, 1)); }}
                    className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-2">
                  <BlockList blocks={sub.blocks ?? []} onChange={fn => onChange(s => { s.subs[j].blocks ??= []; fn(s.subs[j].blocks); })} />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => onChange(s => { s.subs ??= []; s.subs.push({ h: '', blocks: [blankBlock('p')] }); })}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-white">
              <Plus className="h-3.5 w-3.5" />Add subsection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BlockList({ blocks, onChange }) {
  return (
    <div className="space-y-2">
      {blocks.map((b, k) => (
        <div key={k} className="rounded-lg bg-white p-2.5 ring-1 ring-slate-200">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{BLOCK_LABEL[b.type] ?? b.type}</span>
            <span className="flex-1" />
            <button type="button" onClick={() => onChange(a => { const j = k - 1; if (j >= 0) [a[k], a[j]] = [a[j], a[k]]; })}
              className="p-0.5 text-slate-400 hover:text-slate-700"><ChevronUp className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => onChange(a => { const j = k + 1; if (j < a.length) [a[k], a[j]] = [a[j], a[k]]; })}
              className="p-0.5 text-slate-400 hover:text-slate-700"><ChevronDown className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => onChange(a => a.splice(k, 1))}
              className="p-0.5 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <BlockEditor block={b} onChange={fn => onChange(a => fn(a[k]))} />
        </div>
      ))}

      <div className="flex flex-wrap gap-1.5">
        {Object.keys(BLOCK_LABEL).map(t => (
          <button key={t} type="button" onClick={() => onChange(a => a.push(blankBlock(t)))}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200">
            + {BLOCK_LABEL[t]}
          </button>
        ))}
      </div>
    </div>
  );
}

function BlockEditor({ block, onChange }) {
  const ta = 'w-full rounded-lg px-2.5 py-1.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500';

  switch (block.type) {
    case 'p':
      return <textarea rows={3} value={block.text ?? ''} onChange={e => onChange(b => { b.text = e.target.value; })} className={ta} />;

    case 'note':
      return (
        <>
          <textarea rows={2} value={block.text ?? ''} onChange={e => onChange(b => { b.text = e.target.value; })} className={ta} />
          <label className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={block.tone === 'warn'}
              onChange={e => onChange(b => { b.tone = e.target.checked ? 'warn' : 'info'; })} />
            Show as a warning (amber)
          </label>
        </>
      );

    case 'list':
    case 'olist':
      // One item per line: far quicker to edit a 12-point list than a row of
      // inputs, and it maps exactly onto the array the renderer wants.
      return (
        <>
          <textarea rows={Math.max(3, (block.items ?? []).length)} className={ta}
            value={(block.items ?? []).join('\n')}
            onChange={e => onChange(b => { b.items = e.target.value.split('\n'); })} />
          <p className="mt-1 text-[11px] text-slate-400">One item per line.</p>
        </>
      );

    case 'defs':
      return (
        <>
          {(block.items ?? []).map(([term, meaning], i) => (
            <div key={i} className="mb-1.5 grid gap-1.5 sm:grid-cols-[minmax(0,12rem)_1fr]">
              <input value={term} placeholder="Term" className={ta}
                onChange={e => onChange(b => { b.items[i][0] = e.target.value; })} />
              <div className="flex gap-1.5">
                <input value={meaning} placeholder="Meaning" className={ta}
                  onChange={e => onChange(b => { b.items[i][1] = e.target.value; })} />
                <button type="button" onClick={() => onChange(b => b.items.splice(i, 1))}
                  className="shrink-0 p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => onChange(b => { b.items ??= []; b.items.push(['', '']); })}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200">+ Term</button>
        </>
      );

    case 'steps':
      return (
        <>
          {(block.items ?? []).map((s, i) => (
            <div key={i} className="mb-1.5 flex gap-1.5">
              <div className="flex-1 space-y-1.5">
                <input value={s.t ?? ''} placeholder="Step title" className={ta}
                  onChange={e => onChange(b => { b.items[i].t = e.target.value; })} />
                <input value={s.d ?? ''} placeholder="Step detail (optional)" className={ta}
                  onChange={e => onChange(b => { b.items[i].d = e.target.value; })} />
              </div>
              <button type="button" onClick={() => onChange(b => b.items.splice(i, 1))}
                className="shrink-0 p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <button type="button" onClick={() => onChange(b => { b.items ??= []; b.items.push({ t: '', d: '' }); })}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200">+ Step</button>
        </>
      );

    case 'table':
      // Pipe-separated, header first. The API rejects a row whose cell count
      // does not match the header, so a ragged table cannot reach the page.
      return (
        <>
          <textarea rows={Math.max(3, (block.rows ?? []).length + 1)} className={ta + ' font-mono text-xs'}
            value={[(block.head ?? []).join(' | '), ...(block.rows ?? []).map(r => r.join(' | '))].join('\n')}
            onChange={e => onChange(b => {
              const lines = e.target.value.split('\n');
              b.head = (lines[0] ?? '').split('|').map(c => c.trim());
              b.rows = lines.slice(1).filter(l => l.trim()).map(l => l.split('|').map(c => c.trim()));
            })} />
          <p className="mt-1 text-[11px] text-slate-400">
            One row per line, columns separated by <code>|</code>. The first line is the header.
          </p>
        </>
      );

    default:
      return <p className="text-xs text-slate-400">This block type has no editor yet.</p>;
  }
}

/* -------------------------------------------------------------- backups */

/**
 * Whether the deploy's database backup is actually working.
 *
 * The deploy reports this only into storage/logs/deploy.log, which is not
 * web-readable — correctly, but it meant that on a host with no practical shell
 * access nobody could tell a working backup from one failing silently on a
 * missing mysqldump. A backup nobody can verify is barely a backup.
 *
 * Metadata only, and no download: a SQL dump is every customer's name, email and
 * phone number, and putting that behind a URL is how it ends up somewhere it
 * should not be.
 */
function BackupStatus() {
  const { data: payload, isLoading } = useQuery({
    queryKey: ['admin-settings-full'], queryFn: fetchAdminSettingsFull,
  });
  if (isLoading) return <p className="py-6 text-center text-slate-500">Checking…</p>;

  const b = payload?.backups;
  // Always shown, never rounded away: a suspiciously small dump is how a
  // truncated one looks, and hiding sizes under 1KB would hide exactly that.
  const size = b?.newest_size == null ? null
    : b.newest_size >= 1048576 ? (b.newest_size / 1048576).toFixed(1) + ' MB'
    : b.newest_size >= 1024 ? Math.round(b.newest_size / 1024) + ' KB'
    : b.newest_size + ' bytes';
  const when = b?.newest_at ? new Date(b.newest_at) : null;
  const ageDays = when ? Math.floor((Date.now() - when.getTime()) / 86400000) : null;

  if (!b || !b.count) {
    return (
      <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
        <p className="font-bold">No backup has been taken yet.</p>
        <p className="mt-1">
          If a deploy has run since this was set up, the dump is failing — most likely
          <code className="mx-1 rounded bg-white px-1">mysqldump</code> is not available on the server.
          The reason is logged in <code className="rounded bg-white px-1">storage/logs/deploy.log</code>.
        </p>
      </div>
    );
  }

  // Stale is worth flagging: deploys are frequent, so a backup older than a week
  // usually means the dump started failing rather than that nothing shipped.
  const stale = ageDays !== null && ageDays > 7;

  return (
    <div className={`mt-4 rounded-xl p-4 text-sm ring-1 ${stale ? 'bg-amber-50 text-amber-900 ring-amber-200' : 'bg-green-50 text-green-900 ring-green-200'}`}>
      <p className="font-bold">
        {stale ? 'Last backup is over a week old' : 'Backups are working'}
      </p>
      <p className="mt-1">
        Most recent: <strong>{when ? when.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'unknown'}</strong>
        {size ? ` · ${size}` : ''}
        {' · '}{b.count} kept
      </p>
      <p className="mt-1 text-xs opacity-80">
        Stored outside the web root and never downloadable — ask your host for a copy if you need to restore.
      </p>
    </div>
  );
}
