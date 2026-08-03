import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import {
  fetchAdminCourses, createAdminCourse, updateAdminCourse, deleteAdminCourse, fetchCategories,
} from '../../lib/api.js';
import {
  AdminTable, Chips, SearchBox, Pager, StatusBadge, Modal, ConfirmDialog,
  btnGhost, btnPrimary, inp, inpSm, errText,
} from './AdminUI.jsx';

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
    is_published: course ? course.is_published : true,
    is_featured: course?.is_featured ?? false,
    category_ids: course?.categories?.map(c => c.id) ?? [],
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        regular_price: Number(form.regular_price) || 0,
        sale_price: form.sale_price === '' ? null : Number(form.sale_price),
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
        </div>

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
