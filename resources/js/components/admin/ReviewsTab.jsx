import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Star, Trash2, Check, EyeOff } from 'lucide-react';
import {
  fetchAdminReviews, createAdminReview, updateAdminReview, deleteAdminReview, fetchCourses, fetchTutors,
  fetchAdminSettings,
} from '../../lib/api.js';
import {
  AdminTable, Chips, SearchBox, Pager, StatusBadge, Modal, ConfirmDialog,
  btnGhost, btnPrimary, inp, errText, day,
} from './AdminUI.jsx';

// Moderation queue for course reviews. Nothing a visitor submits is public
// until it is approved here; "unpublish" puts an approved one back in the
// queue rather than destroying it.

const STATUSES = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const Stars = ({ n }) => (
  <span className="whitespace-nowrap text-amber-500" aria-label={`${n} out of 5`}>
    {'★'.repeat(n)}<span className="text-slate-300">{'★'.repeat(5 - n)}</span>
  </span>
);

export default function ReviewsTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', status, q, page],
    queryFn: () => fetchAdminReviews({ status, q, page }),
    placeholderData: prev => prev,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-reviews'] });
    qc.invalidateQueries({ queryKey: ['admin-overview'] });
  };
  const setStatusMut = useMutation({ mutationFn: updateAdminReview, onSuccess: refresh });
  const remove = useMutation({ mutationFn: deleteAdminReview, onSuccess: () => { setDeleting(null); refresh(); } });

  const rows = data?.data ?? [];

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setAdding(true)} className={btnPrimary}><Plus className="h-4 w-4" />Add a review</button>
        <Chips options={STATUSES} value={status} onChange={k => { setStatus(k); setPage(1); }} />
        <SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Search author or text…" className="sm:max-w-xs" />
        <AskForReviewLink />
      </div>

      <AdminTable
        cols={['Author', 'Course', 'Rating', 'Review', 'Status', 'Date', 'Actions']}
        rows={rows}
        loading={isLoading}
        empty="No reviews yet. Approved reviews appear on the course page."
        minWidth={980}
        renderRow={r => (
          <tr key={r.id} className="align-top">
            <td className="px-3 py-3">
              <div className="font-semibold text-slate-800">{r.author_name}</div>
              {r.author_email && <div className="text-xs text-slate-500">{r.author_email}</div>}
            </td>
            <td className="px-3 py-3 text-slate-600">{r.subject?.name ?? <span className="text-slate-400">—</span>}</td>
            <td className="px-3 py-3"><Stars n={r.rating} /></td>
            <td className="max-w-xs px-3 py-3 text-slate-600">
              <p className="line-clamp-2">{r.body}</p>
            </td>
            <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
            <td className="px-3 py-3 whitespace-nowrap text-slate-500">{day(r.created_at)}</td>
            <td className="px-3 py-3">
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setEditing(r)} className={btnGhost}>Edit</button>
                {r.status === 'approved' ? (
                  <button onClick={() => setStatusMut.mutate({ id: r.id, status: 'pending' })} className={btnGhost}>
                    <EyeOff className="h-3.5 w-3.5" />Unpublish
                  </button>
                ) : (
                  <button onClick={() => setStatusMut.mutate({ id: r.id, status: 'approved' })}
                    className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-green-700">
                    <Check className="h-3.5 w-3.5" />Approve
                  </button>
                )}
                <button onClick={() => setDeleting(r)} className={btnGhost + ' hover:text-red-600 hover:ring-red-200'}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        )}
      />
      <Pager meta={data?.meta} page={page} setPage={setPage} />

      {adding && <ReviewForm onClose={() => setAdding(false)} onSaved={refresh} />}
      {editing && <ReviewForm review={editing} onClose={() => setEditing(null)} onSaved={refresh} />}
      {deleting && (
        <ConfirmDialog
          title="Delete this review?"
          message={`${deleting.author_name}'s review will be removed permanently. To hide it without losing it, use Unpublish instead.`}
          busy={remove.isPending}
          error={remove.isError ? errText(remove.error) : ''}
          onConfirm={() => remove.mutate(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function ReviewForm({ review, onClose, onSaved }) {
  const editingExisting = !!review;
  // "course" | "teacher" — a review has to be about one of them. The picker
  // used to default to "— No specific course —", so the console's default action
  // created a review that was approvable, counted in the Reviews badge, and
  // appeared on no page at all.
  const [subjectKind, setSubjectKind] = useState('course');
  const [form, setForm] = useState({
    course_id: '', tutor_id: '', author_name: review?.author_name ?? '', author_email: review?.author_email ?? '',
    rating: review?.rating ?? 5, body: review?.body ?? '', status: review?.status ?? 'approved',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Only needed for a new review — an existing one keeps the subject it was left on.
  const { data: courses } = useQuery({
    queryKey: ['courses', 'review-picker'],
    queryFn: () => fetchCourses({ per_page: 200 }),
    enabled: !editingExisting && subjectKind === 'course',
  });
  // The reviews table has always had tutor_id and the public site accepts tutor
  // reviews; only this form could not record one.
  const { data: tutors } = useQuery({
    queryKey: ['tutors', 'review-picker'],
    queryFn: () => fetchTutors({ per_page: 200 }),
    enabled: !editingExisting && subjectKind === 'teacher',
  });

  const save = useMutation({
    mutationFn: () => editingExisting
      ? updateAdminReview({ id: review.id, rating: Number(form.rating), body: form.body, status: form.status })
      : createAdminReview({
        ...form,
        course_id: subjectKind === 'course' && form.course_id ? Number(form.course_id) : null,
        tutor_id:  subjectKind === 'teacher' && form.tutor_id  ? Number(form.tutor_id)  : null,
        rating: Number(form.rating),
        author_email: form.author_email || null,
      }),
    onSuccess: () => { onSaved(); onClose(); },
  });

  const subjectChosen = editingExisting
    || (subjectKind === 'course' ? !!form.course_id : !!form.tutor_id);

  return (
    <Modal title={editingExisting ? 'Edit review' : 'Add a review'}
      subtitle={editingExisting ? review.subject?.name : 'Use this to record a review that reached us by email or phone.'}
      onClose={onClose} wide>
      <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="space-y-3">
        {!editingExisting && (
          <>
            <div>
              <span className="mb-1 block text-xs font-semibold text-slate-600">What is this review about? *</span>
              <div className="mb-2 flex gap-1.5">
                {[['course', 'A course'], ['teacher', 'A teacher']].map(([k, label]) => (
                  <button key={k} type="button" onClick={() => setSubjectKind(k)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${subjectKind === k ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {subjectKind === 'course' ? (
                <select required value={form.course_id} onChange={set('course_id')} className={inp}>
                  <option value="">Choose a course…</option>
                  {(courses?.data ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <select required value={form.tutor_id} onChange={set('tutor_id')} className={inp}>
                  <option value="">Choose a teacher…</option>
                  {(tutors ?? []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
              <span className="mt-1 block text-[11px] text-slate-400">
                A review with no subject appears on no page.
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Author *</span>
                <input required value={form.author_name} onChange={set('author_name')} className={inp} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Email (never published)</span>
                <input type="email" value={form.author_email} onChange={set('author_email')} className={inp} />
              </label>
            </div>
          </>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Rating</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))} aria-label={`${n} stars`}>
                  <Star className={`h-6 w-6 ${n <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Status</span>
            <select value={form.status} onChange={set('status')} className={inp}>
              {['approved', 'pending', 'rejected'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Review *</span>
          <textarea required rows={4} value={form.body} onChange={set('body')} className={inp} />
        </label>

        {save.isError && <p className="text-xs text-red-600">{errText(save.error)}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={save.isPending || !subjectChosen} className={btnPrimary + ' flex-1'}>
            {save.isPending ? 'Saving…' : editingExisting ? 'Save changes' : 'Add review'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * The Google "write a review" link, where staff actually ask for one.
 *
 * The setting existed with two editors and no reader anywhere in the app, under
 * help text promising it was "shown to parents when we ask for a review" — a
 * field describing behaviour that did not exist. It is edited in Settings now,
 * and read here.
 */
function AskForReviewLink() {
  const [copied, setCopied] = useState(false);
  const { data: settings } = useQuery({
    queryKey: ['admin-settings'], queryFn: fetchAdminSettings, staleTime: 5 * 60_000,
  });
  const url = settings?.google_review_url;
  if (!url) return null;

  return (
    <button type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard is blocked outside a secure context; open it instead so
          // the button never just does nothing.
          window.open(url, '_blank', 'noopener');
        }
      }}
      className={btnGhost + (copied ? ' text-green-700 ring-green-200' : '')}
      title={url}>
      <Star className="h-3.5 w-3.5" />{copied ? 'Link copied' : 'Copy “write a review” link'}
    </button>
  );
}
