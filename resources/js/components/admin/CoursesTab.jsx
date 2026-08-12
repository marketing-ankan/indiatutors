import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import {
  fetchAdminCourses, createAdminCourse, updateAdminCourse, deleteAdminCourse, fetchCategories,
  createAdminBatch, updateAdminBatch, deleteAdminBatch,
} from '../../lib/api.js';
import {
  AdminTable, Chips, SearchBox, Pager, StatusBadge, Modal, ConfirmDialog,
  btnGhost, btnPrimary, inp, inpSm, errText,
} from './AdminUI.jsx';
import { ImagePicker } from './FormPickers.jsx';

// The catalogue, drafts included — the public listing hides unpublished
// courses, so this is the only place one can be found and published.

const PUBLISHED = [
  { key: '', label: 'All' },
  { key: '1', label: 'Published' },
  { key: '0', label: 'Draft' },
];

export default function CoursesTab() {
  const qc = useQueryClient();
  const [published, setPublished] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', published, q, page],
    queryFn: () => fetchAdminCourses({ published, q, page }),
    placeholderData: prev => prev,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-courses'] });
    qc.invalidateQueries({ queryKey: ['admin-overview'] });
    qc.invalidateQueries({ queryKey: ['courses'] });   // the public catalogue
  };
  const remove = useMutation({ mutationFn: deleteAdminCourse, onSuccess: () => { setDeleting(null); refresh(); } });

  const rows = data?.data ?? [];

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setEditing({})} className={btnPrimary}><Plus className="h-4 w-4" />Add a course</button>
        <Chips options={PUBLISHED} value={published} onChange={k => { setPublished(k); setPage(1); }} />
        <SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Search courses…" className="sm:max-w-xs" />
      </div>

      <AdminTable
        cols={['Course', 'Category', 'Price (₹)', 'Status', 'Reviews', 'Actions']}
        rows={rows}
        loading={isLoading}
        empty="No courses match."
        minWidth={920}
        renderRow={c => <CourseRow key={c.id} course={c} onSaved={refresh} onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} />}
      />
      <Pager meta={data?.meta} page={page} setPage={setPage} />

      {editing && <CourseForm course={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={refresh} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete “${deleting.name}”?`}
          message="The course and its category links are removed permanently. Orders that already contain it keep their item names."
          busy={remove.isPending}
          error={remove.isError ? errText(remove.error) : ''}
          onConfirm={() => remove.mutate(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

/** Inline price + publish edit — the two fields that get changed most often. */
function CourseRow({ course, onSaved, onEdit, onDelete }) {
  const [price, setPrice] = useState(String(course.regular_price ?? 0));
  const [published, setPublished] = useState(course.is_published ? '1' : '0');
  const dirty = Number(price) !== Number(course.regular_price) || (published === '1') !== course.is_published;

  const save = useMutation({
    mutationFn: () => updateAdminCourse({ id: course.id, regular_price: Number(price), is_published: published === '1' }),
    onSuccess: onSaved,
  });

  return (
    <tr className="align-top">
      <td className="px-3 py-3">
        <div className="font-semibold text-slate-800">{course.name}</div>
        <div className="text-xs text-slate-400">/{course.slug}</div>
      </td>
      <td className="px-3 py-3 text-slate-600">
        {course.categories?.length ? course.categories.map(c => c.name).join(', ') : <span className="text-slate-400">Uncategorised</span>}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className={inpSm + ' w-24'} />
          <select value={published} onChange={e => setPublished(e.target.value)} className={inpSm}>
            <option value="1">Published</option>
            <option value="0">Draft</option>
          </select>
          <button disabled={!dirty || save.isPending} onClick={() => save.mutate()}
            className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-40">
            {save.isPending ? '…' : 'Save'}
          </button>
        </div>
        {course.sale_price != null && <div className="mt-1 text-[11px] text-slate-400">Sale price ₹{course.sale_price}</div>}
        {save.isError && <p className="mt-1 text-[11px] text-red-600">{errText(save.error)}</p>}
      </td>
      <td className="px-3 py-3"><StatusBadge status={course.is_published ? 'published' : 'draft'} /></td>
      <td className="px-3 py-3 tabular-nums text-slate-600">{course.reviews_count ?? 0}</td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1.5">
          <a href={`/courses/${course.slug}`} target="_blank" rel="noreferrer" className={btnGhost}>
            <ExternalLink className="h-3.5 w-3.5" />View
          </a>
          <button onClick={onEdit} className={btnGhost}>Edit</button>
          <button onClick={onDelete} className={btnGhost + ' hover:text-red-600 hover:ring-red-200'}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CourseForm({ course, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: course?.name ?? '', sku: course?.sku ?? '',
    regular_price: course?.regular_price ?? 0, sale_price: course?.sale_price ?? '',
    short_description: course?.short_description ?? '',
    image_url: course?.image_url ?? '',
    is_published: course ? course.is_published : true,
    is_featured: course?.is_featured ?? false,
    category_ids: course?.categories?.map(c => c.id) ?? [],

    is_group: course?.is_group ?? false,
    group_about: course?.group_about ?? '',
    // One per line in the textarea; an array on the wire.
    group_highlights: (course?.group_highlights ?? []).join('\n'),
    group_age_range: course?.group_age_range ?? '',
    group_duration_weeks: course?.group_duration_weeks ?? '',
    group_batches_done: course?.group_batches_done ?? '',
    group_ongoing_batches: course?.group_ongoing_batches ?? '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  // '' means "leave it blank", which is not the same as 0 — a typed 0 is a real
  // claim ("no batches run yet") and must survive the round trip.
  const num = v => (v === '' || v === null ? null : Number(v));

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        regular_price: Number(form.regular_price) || 0,
        sale_price: form.sale_price === '' ? null : Number(form.sale_price),
        image_url: form.image_url || null,
        group_about: form.group_about || null,
        group_highlights: form.group_highlights.split('\n').map(s => s.trim()).filter(Boolean),
        group_age_range: form.group_age_range || null,
        group_duration_weeks: num(form.group_duration_weeks),
        group_batches_done: num(form.group_batches_done),
        group_ongoing_batches: num(form.group_ongoing_batches),
      };
      return course ? updateAdminCourse({ id: course.id, ...payload }) : createAdminCourse(payload);
    },
    onSuccess: () => { onSaved(); onClose(); },
  });

  const toggleCategory = id => setForm(f => ({
    ...f,
    category_ids: f.category_ids.includes(id) ? f.category_ids.filter(x => x !== id) : [...f.category_ids, id],
  }));

  return (
    <Modal title={course ? 'Edit course' : 'Add a course'} subtitle={course ? `/${course.slug}` : 'The URL slug is generated from the name.'} onClose={onClose} wide>
      <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Name *</span>
          <input required value={form.name} onChange={set('name')} className={inp} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Price (₹)</span>
            <input type="number" min="0" value={form.regular_price} onChange={set('regular_price')} className={inp} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Sale price (₹)</span>
            <input type="number" min="0" value={form.sale_price} onChange={set('sale_price')} placeholder="none" className={inp} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">SKU</span>
            <input value={form.sku} onChange={set('sku')} className={inp} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Short description</span>
          <textarea rows={2} value={form.short_description} onChange={set('short_description')} className={inp} />
        </label>

        {/* Picked from the images the site actually ships. Typing a path by hand
            was how broken images got saved. */}
        <ImagePicker label="Course image" value={form.image_url} onChange={v => setForm(f => ({ ...f, image_url: v }))} />

        {categories.length > 0 && (
          <div>
            <span className="mb-1 block text-xs font-semibold text-slate-600">Categories</span>
            <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
              {categories.map(c => (
                <button key={c.id} type="button" onClick={() => toggleCategory(c.id)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${form.category_ids.includes(c.id) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_published} onChange={set('is_published')} className="accent-brand-600" />Published
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="accent-brand-600" />Featured
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_group} onChange={set('is_group')} className="accent-brand-600" />
            Also sold as a group class
          </label>
        </div>

        {form.is_group && (
          <div className="space-y-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Group class — shown on /group-classes</p>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">About this course</span>
              <textarea rows={3} value={form.group_about} onChange={set('group_about')} className={inp}
                placeholder="Falls back to the short description if left blank." />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Key highlights — one per line</span>
              <textarea rows={4} value={form.group_highlights} onChange={set('group_highlights')} className={inp}
                placeholder={'Small batch, personalised attention\nExpert certified trainers'} />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Age range</span>
                <input value={form.group_age_range} onChange={set('group_age_range')} placeholder="6–14 years" className={inp} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Duration (weeks)</span>
                <input type="number" min="1" value={form.group_duration_weeks} onChange={set('group_duration_weeks')} className={inp} />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Batches completed</span>
                <input type="number" min="0" value={form.group_batches_done} onChange={set('group_batches_done')} placeholder="leave blank to hide" className={inp} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Batches running now</span>
                <input type="number" min="0" value={form.group_ongoing_batches} onChange={set('group_ongoing_batches')} placeholder="leave blank to hide" className={inp} />
              </label>
            </div>
            <p className="text-xs text-slate-500">
              These two counters are blank on purpose. The numbers the old page showed were never real, so nothing
              is claimed until you type a figure — a blank field simply hides the chip.
            </p>

            {course
              ? <BatchEditor course={course} onSaved={onSaved} />
              : <p className="text-xs text-slate-500">Create the course first, then add its batches here.</p>}
          </div>
        )}

        {save.isError && <p className="text-xs text-red-600">{errText(save.error)}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={save.isPending} className={btnPrimary + ' flex-1'}>
            {save.isPending ? 'Saving…' : course ? 'Save changes' : 'Create course'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Batches — the "Beginner / Intermediate / Advanced" tiles on a group card.
//
// Days, time and timezone are separate fields because the old data fused them
// into one string ("Sat-Sun · 10:00–11:00 AM IST"), which nothing could sort,
// filter or translate. Seats are optional: the per-level student counts on the
// old page were invented, and nothing links a batch to real enrolments yet.
const BATCH_BLANK = { name: '', schedule_days: '', schedule_time: '', timezone: 'IST', seats_total: '' };

function BatchEditor({ course, onSaved }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(BATCH_BLANK);
  const [editingId, setEditingId] = useState(null);
  const batches = course.batches ?? [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-courses'] });
    qc.invalidateQueries({ queryKey: ['group-classes'] });
    onSaved?.();
  };
  const payload = () => ({
    ...draft,
    seats_total: draft.seats_total === '' ? null : Number(draft.seats_total),
    timezone: draft.timezone || null,
  });

  const create = useMutation({ mutationFn: () => createAdminBatch({ courseId: course.id, ...payload() }),
    onSuccess: () => { setDraft(BATCH_BLANK); refresh(); } });
  const update = useMutation({ mutationFn: () => updateAdminBatch({ courseId: course.id, id: editingId, ...payload() }),
    onSuccess: () => { setDraft(BATCH_BLANK); setEditingId(null); refresh(); } });
  const remove = useMutation({ mutationFn: id => deleteAdminBatch({ courseId: course.id, id }), onSuccess: refresh });

  const busy = create.isPending || update.isPending || remove.isPending;
  const err = errText(create.error || update.error || remove.error);
  const set = k => e => setDraft(d => ({ ...d, [k]: e.target.value }));

  return (
    <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Batches</p>

      {batches.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {batches.map(b => (
            <li key={b.id} className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs">
              <span className="min-w-0 truncate">
                <span className="font-bold text-slate-800">{b.name}</span>
                <span className="text-slate-500">
                  {' — '}{[b.schedule_days, b.schedule_time, b.timezone].filter(Boolean).join(' · ') || 'no schedule set'}
                  {b.seats_total != null && ` · ${b.seats_total} seats`}
                </span>
              </span>
              <span className="flex shrink-0 gap-1">
                <button type="button" disabled={busy}
                  onClick={() => { setEditingId(b.id); setDraft({
                    name: b.name ?? '', schedule_days: b.schedule_days ?? '', schedule_time: b.schedule_time ?? '',
                    timezone: b.timezone ?? '', seats_total: b.seats_total ?? '',
                  }); }}
                  className="rounded px-2 py-0.5 font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-white">Edit</button>
                <button type="button" disabled={busy} onClick={() => remove.mutate(b.id)}
                  className="rounded px-2 py-0.5 font-semibold text-slate-400 hover:text-red-600" title="Delete batch">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <input value={draft.name} onChange={set('name')} placeholder="Level name — e.g. Beginner" className={inpSm} />
        <input value={draft.schedule_days} onChange={set('schedule_days')} placeholder="Days — e.g. Sat-Sun" className={inpSm} />
        <input value={draft.schedule_time} onChange={set('schedule_time')} placeholder="Time — e.g. 10:00–11:00 AM" className={inpSm} />
        <div className="grid grid-cols-2 gap-2">
          <input value={draft.timezone} onChange={set('timezone')} placeholder="IST" className={inpSm} />
          <input type="number" min="0" value={draft.seats_total} onChange={set('seats_total')} placeholder="seats (optional)" className={inpSm} />
        </div>
      </div>

      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}

      {/* type=button throughout: this sits inside the course <form>, and a
          submit here would save the course instead of the batch. */}
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={busy || !draft.name.trim()}
          onClick={() => (editingId ? update : create).mutate()}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900 disabled:opacity-50">
          {busy ? 'Saving…' : editingId ? 'Save batch' : 'Add batch'}
        </button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setDraft(BATCH_BLANK); }}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
        )}
      </div>
    </div>
  );
}
