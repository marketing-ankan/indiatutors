import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMediaImages, fetchCategories } from '../../lib/api.js';

/**
 * Shared admin form controls.
 *
 * Both of these replace a bare text input that expected the operator to know a
 * value by heart — an image path, or a category name spelled exactly as it
 * appears elsewhere. Typos in either fail silently: a wrong path renders a
 * broken image, a wrong category name creates a second category that looks like
 * the first. Kept in their own file because the group-classes work and the LMS
 * will want the same two controls.
 */

const inp = 'w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

/**
 * Pick an image that already ships with the site.
 *
 * Not an uploader on purpose: the deploy rm -rf's the docroot images directory
 * and vite empties public/build, so a runtime upload is destroyed by the next
 * cron pull. New artwork is committed to public/images/ and appears here.
 */
export function ImagePicker({ value, onChange, label = 'Image' }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const { data: images = [], isLoading, isError } = useQuery({
    queryKey: ['admin-media-images'],
    queryFn: fetchMediaImages,
    enabled: open,               // don't fetch ~150 filenames until it's wanted
    staleTime: 10 * 60_000,
  });

  const shown = images.filter(i =>
    !q.trim() || (i.name + ' ' + i.group).toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>

      <div className="flex flex-wrap items-center gap-2">
        {value ? (
          <img src={value} alt="" className="h-12 w-16 rounded-md object-cover ring-1 ring-slate-200"
            onError={e => { e.currentTarget.style.opacity = '.25'; }} />
        ) : (
          <div className="grid h-12 w-16 place-items-center rounded-md bg-slate-100 text-[10px] text-slate-400">none</div>
        )}
        <button type="button" onClick={() => setOpen(o => !o)}
          className="rounded-lg ring-1 ring-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
          {open ? 'Close' : value ? 'Change image' : 'Choose image'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')}
            className="text-xs font-semibold text-slate-500 hover:text-red-600">Remove</button>
        )}
      </div>

      {value && <p className="mt-1 break-all font-mono text-[10px] text-slate-400">{value}</p>}

      {open && (
        <div className="mt-2 rounded-lg ring-1 ring-slate-200 p-2">
          <input value={q} onChange={e => setQ(e.target.value)} aria-label="Search images"
            placeholder="Search images…" className={inp + ' mb-2'} />
          {isLoading ? (
            <p className="py-6 text-center text-xs text-slate-500">Loading images…</p>
          ) : isError ? (
            <p className="py-6 text-center text-xs text-red-600">Could not load the image list.</p>
          ) : !shown.length ? (
            <p className="py-6 text-center text-xs text-slate-500">No images match “{q}”.</p>
          ) : (
            <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
              {shown.map(img => (
                <button key={img.path} type="button"
                  onClick={() => { onChange(img.path); setOpen(false); }}
                  title={img.path}
                  className={`overflow-hidden rounded-md ring-1 transition hover:ring-brand-500 ${value === img.path ? 'ring-2 ring-brand-600' : 'ring-slate-200'}`}>
                  <img src={img.path} alt={img.name} loading="lazy" className="h-14 w-full object-cover" />
                  <span className="block truncate px-1 py-0.5 text-[9px] text-slate-500">{img.name}</span>
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10px] text-slate-400">
            To add new artwork, commit it to <span className="font-mono">public/images/</span> — uploads
            would not survive the next deploy.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Choose from the categories that already exist.
 *
 * Free text here quietly created near-duplicates ("IT Technologies" vs "IT
 * technologies") that then filter as two different things. An existing value
 * that is not in the list is preserved and shown, so opening an old record and
 * saving it cannot silently retag it.
 */
export function CategorySelect({ value, onChange, label = 'Category' }) {
  const { data: categories = [], isError } = useQuery({
    queryKey: ['categories', 'flat'],
    queryFn: fetchCategories,
    staleTime: 10 * 60_000,
  });

  const names = [...new Set(categories.map(c => c.name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const orphan = value && !names.includes(value);

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      <select value={value || ''} onChange={e => onChange(e.target.value)} className={inp}>
        <option value="">— none —</option>
        {orphan && <option value={value}>{value} (not in the category list)</option>}
        {names.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      {isError && <p className="mt-1 text-[10px] text-red-600">Could not load categories — the current value is kept.</p>}
      {orphan && !isError && (
        <p className="mt-1 text-[10px] text-amber-700">
          This value is not one of the site's categories. Leaving it will keep it as-is.
        </p>
      )}
    </div>
  );
}
