import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, Eye, KeyRound, Trash2 } from 'lucide-react';
import {
  fetchAdminUsers, createAdminUser, createStudentAccount, updateAdminUser,
  deleteAdminUser, updateUserRole, resetUserPassword, fetchUserDashboard,
} from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import {
  AdminTable, Chips, SearchBox, Pager, Modal, ConfirmDialog,
  btnGhost, btnPrimary, inp, inpSm, errText, day,
} from './AdminUI.jsx';
import UserDashDrawer from './UserDashDrawer.jsx';

const ROLES = ['parent', 'student', 'teacher', 'admin'];
const ROLE_CHIPS = [
  { key: '', label: 'All' },
  { key: 'admin', label: 'Admins' },
  { key: 'teacher', label: 'Teachers' },
  { key: 'parent', label: 'Parents' },
  { key: 'student', label: 'Students' },
  // Not a role on this platform — it means "has placed an order". Guest buyers
  // have no account at all and are correctly absent.
  { key: 'customer', label: 'Customers' },
];
const ROLE_TONE = {
  admin: 'bg-brand-50 text-brand-700', teacher: 'bg-blue-50 text-blue-700',
  parent: 'bg-slate-100 text-slate-600', student: 'bg-green-50 text-green-700',
};

export default function UsersTab() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', role, q, page],
    queryFn: () => fetchAdminUsers({ role, q, page }),
    placeholderData: prev => prev,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-users'] });
    qc.invalidateQueries({ queryKey: ['admin-overview'] });
    qc.invalidateQueries({ queryKey: ['admin-students'] });
  };
  const setRoleMut = useMutation({ mutationFn: updateUserRole, onSuccess: refresh, onError: e => setError(errText(e)) });
  const remove = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => { setDeleting(null); refresh(); },
  });

  const users = data?.data ?? [];

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setAdding(true)} className={btnPrimary}><Plus className="h-4 w-4" />Add user</button>
        <button onClick={() => setAddingStudent(true)} className={btnGhost + ' px-3 py-2 text-sm'}>
          <UserPlus className="h-4 w-4" />Create student account
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Chips options={ROLE_CHIPS} value={role} onChange={k => { setRole(k); setPage(1); }} />
        <SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Search name or email…" className="sm:max-w-xs" />
      </div>
      {role === 'customer' && (
        <p className="mt-2 text-xs text-slate-500">Accounts that have placed an order. Guest checkouts have no account and are not listed.</p>
      )}

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <AdminTable
        cols={['User', 'Role', 'Joined', 'Actions']}
        rows={users}
        loading={isLoading}
        empty="No accounts match."
        minWidth={860}
        renderRow={u => {
          const isMe = u.id === me?.id;
          return (
            <tr key={u.id} className="align-top">
              <td className="px-3 py-3">
                <div className="font-semibold text-slate-800">
                  {u.name}
                  {isMe && <span className="ml-1.5 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">you</span>}
                </div>
                <div className="text-xs text-slate-500">{u.email}{u.phone ? ` · ${u.phone}` : ''}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {[
                    u.students_count ? `${u.students_count} student${u.students_count === 1 ? '' : 's'}` : null,
                    u.orders_count ? `${u.orders_count} order${u.orders_count === 1 ? '' : 's'}` : null,
                    u.entitlements ? `${u.entitlements} video course${u.entitlements === 1 ? '' : 's'}` : null,
                  ].filter(Boolean).join(' · ')}
                </div>
              </td>
              <td className="px-3 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${ROLE_TONE[u.role] || 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-slate-500">{day(u.created_at)}</td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button onClick={() => setViewing(u.id)} className={btnGhost}><Eye className="h-3.5 w-3.5" />View dash</button>
                  <button onClick={() => setEditing(u)} className={btnGhost}>Edit</button>
                  {/* Self-demotion is blocked here and again server-side: the UI
                      can be bypassed, the API check cannot. */}
                  <select value={u.role} disabled={isMe || setRoleMut.isPending}
                    title={isMe ? 'You cannot change your own role' : undefined}
                    onChange={e => { setError(''); setRoleMut.mutate({ id: u.id, role: e.target.value }); }}
                    className={inpSm + ' disabled:bg-slate-50 disabled:text-slate-400'}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={() => setResetting(u)} className={btnGhost}><KeyRound className="h-3.5 w-3.5" />Password</button>
                  <button onClick={() => setDeleting(u)} disabled={isMe}
                    title={isMe ? 'You cannot delete your own account' : 'Delete'}
                    className={btnGhost + ' hover:text-red-600 hover:ring-red-200'}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          );
        }}
      />
      <Pager meta={data?.meta} page={page} setPage={setPage} />

      {adding && <AddUserModal onClose={() => setAdding(false)} onSaved={refresh} />}
      {addingStudent && <AddStudentAccountModal onClose={() => setAddingStudent(false)} onSaved={refresh} />}
      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={refresh} />}
      {resetting && <PasswordResetModal user={resetting} onClose={() => setResetting(null)} />}
      {viewing && <UserDashDrawer userId={viewing} onClose={() => setViewing(null)} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          message={deleting.students_count
            ? `This also deletes ${deleting.students_count} student profile(s) and everything attached to them — portfolios, enrolments and class history.`
            : 'The account is removed permanently.'}
          confirmLabel="Delete account"
          busy={remove.isPending}
          error={remove.isError ? errText(remove.error) : ''}
          // The server asks again (409) when children would cascade; the second
          // press sends the confirmation it wants.
          onConfirm={() => remove.mutate({ id: deleting.id, confirm: remove.isError || !!deleting.students_count })}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function AddUserModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'parent', phone: '', confirm_admin: false });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const save = useMutation({ mutationFn: () => createAdminUser(form), onSuccess: () => { onSaved(); onClose(); } });

  return (
    <Modal title="Add a user" subtitle="You choose the password and pass it on — the console never generates one." onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="space-y-3">
        <input required value={form.name} onChange={set('name')} placeholder="Full name" className={inp} />
        <input required type="email" value={form.email} onChange={set('email')} placeholder="Email" className={inp} />
        <input value={form.phone} onChange={set('phone')} placeholder="Phone (optional)" className={inp} />
        <input required type="password" value={form.password} onChange={set('password')} placeholder="Password (at least 10 characters)" className={inp} />
        <select value={form.role} onChange={set('role')} className={inp}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {form.role === 'admin' && (
          <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            <input type="checkbox" checked={form.confirm_admin} onChange={set('confirm_admin')} className="mt-0.5 accent-amber-600" />
            I understand this account will have full access to every part of the console, including other people's data.
          </label>
        )}
        {save.isError && <p className="text-xs text-red-600">{errText(save.error)}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={save.isPending || form.password.length < 10} className={btnPrimary + ' flex-1'}>
            {save.isPending ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** A student's own login, attached to a child their guardian already added. */
function AddStudentAccountModal({ onClose, onSaved }) {
  const [parentQuery, setParentQuery] = useState('');
  const [form, setForm] = useState({ parent_user_id: '', student_id: '', name: '', email: '', password: '', grade: '', board: '', subjects: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: parents } = useQuery({
    queryKey: ['admin-users', 'parents', parentQuery],
    queryFn: () => fetchAdminUsers({ role: 'parent', q: parentQuery }),
  });
  // The parent's own snapshot is the cheapest way to list their children.
  const { data: dash } = useQuery({
    queryKey: ['admin-user-dash', form.parent_user_id],
    queryFn: () => fetchUserDashboard(form.parent_user_id),
    enabled: !!form.parent_user_id,
  });
  const linkable = dash?.students ?? [];

  const save = useMutation({
    mutationFn: () => createStudentAccount({
      ...form,
      parent_user_id: Number(form.parent_user_id),
      student_id: form.student_id ? Number(form.student_id) : null,
    }),
    onSuccess: () => { onSaved(); onClose(); },
  });

  return (
    <Modal title="Create a student account" subtitle="Linked to a parent. The parent keeps ownership of the profile." onClose={onClose} wide>
      <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Parent *</span>
          <input value={parentQuery} onChange={e => setParentQuery(e.target.value)} placeholder="Search parents…" className={inp + ' mb-2'} />
          <select required value={form.parent_user_id} onChange={set('parent_user_id')} className={inp}>
            <option value="">— Select parent —</option>
            {(parents?.data ?? []).map(p => <option key={p.id} value={p.id}>{p.name} · {p.email}</option>)}
          </select>
        </label>

        {form.parent_user_id && (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Existing child profile</span>
            <select value={form.student_id} onChange={e => {
              const s = linkable.find(x => String(x.id) === e.target.value);
              setForm(f => ({ ...f, student_id: e.target.value, name: s?.name ?? f.name, grade: s?.grade ?? f.grade }));
            }} className={inp}>
              <option value="">— Create a new profile —</option>
              {linkable.map(s => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
            </select>
          </label>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <input required value={form.name} onChange={set('name')} placeholder="Student name" className={inp} />
          <input required type="email" value={form.email} onChange={set('email')} placeholder="Student's email (their login)" className={inp} />
        </div>
        <input required type="password" value={form.password} onChange={set('password')} placeholder="Password (at least 10 characters)" className={inp} />
        {!form.student_id && (
          <div className="grid gap-3 sm:grid-cols-3">
            <input value={form.grade} onChange={set('grade')} placeholder="Grade" className={inp} />
            <input value={form.board} onChange={set('board')} placeholder="Board" className={inp} />
            <input value={form.subjects} onChange={set('subjects')} placeholder="Subjects" className={inp} />
          </div>
        )}

        {save.isError && <p className="text-xs text-red-600">{errText(save.error)}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={save.isPending || form.password.length < 10} className={btnPrimary + ' flex-1'}>
            {save.isPending ? 'Creating…' : 'Create student account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone ?? '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const save = useMutation({
    mutationFn: () => updateAdminUser({ id: user.id, ...form, phone: form.phone || null }),
    onSuccess: () => { onSaved(); onClose(); },
  });

  return (
    <Modal title="Edit account" subtitle={user.email} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="space-y-3">
        <input required value={form.name} onChange={set('name')} placeholder="Full name" className={inp} />
        <input required type="email" value={form.email} onChange={set('email')} placeholder="Email" className={inp} />
        <input value={form.phone} onChange={set('phone')} placeholder="Phone" className={inp} />
        {save.isError && <p className="text-xs text-red-600">{errText(save.error)}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={save.isPending} className={btnPrimary + ' flex-1'}>{save.isPending ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

// Deliberately never shows or stores the password after submit: the admin types
// it, we send it, and it is gone. Setting one signs the user out everywhere.
function PasswordResetModal({ user, onClose }) {
  const [pw, setPw] = useState('');
  const mut = useMutation({ mutationFn: () => resetUserPassword({ id: user.id, password: pw }) });

  return (
    <Modal title="Set a new password" subtitle={`For ${user.email}. They will be signed out on every device.`} onClose={onClose}>
      {mut.isSuccess ? (
        <>
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{mut.data}</p>
          <button onClick={onClose} className={btnPrimary + ' mt-4 w-full'}>Done</button>
        </>
      ) : (
        <form onSubmit={e => { e.preventDefault(); if (pw.length >= 10) mut.mutate(); }}>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} autoFocus
            placeholder="At least 10 characters" className={inp} />
          {mut.isError && <p className="mt-2 text-xs text-red-600">{errText(mut.error, 'Could not set that password.')}</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={pw.length < 10 || mut.isPending} className={btnPrimary + ' flex-1'}>
              {mut.isPending ? 'Saving…' : 'Set password'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
