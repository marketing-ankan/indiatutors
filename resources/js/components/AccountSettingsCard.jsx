import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, KeyRound, Loader2, Mail } from 'lucide-react';
import {
  updateMe, changeMyPassword,
  fetchMyEmails, addMyEmail, makeMyEmailPrimary, removeMyEmail,
} from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

// Account self-service: edit name/phone and change your own password. Until
// this card, the only way to rotate a password was asking an admin — a student
// whose password leaked had to contact the site to fix it.
//
// Email is never edited in place. You ADD an address, make it the main one, and
// only then remove the old — the LinkedIn order. That matters because there is
// still no SMTP to verify a new address with: every address on the account can
// sign in, so a typo in a new one cannot strand anybody, and the old address
// keeps working until it is deliberately removed.

const inp = 'w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
const err422 = e => e?.response?.data?.message || 'Something went wrong — please try again.';

export default function AccountSettingsCard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const dirty = name.trim() !== (user.name || '') || phone.trim() !== (user.phone || '');

  const profile = useMutation({
    mutationFn: () => updateMe({ name: name.trim(), phone: phone.trim() || null }),
    // The auth context reads from the ['me'] query, so invalidating it updates
    // the header greeting and everything else that shows the user's name.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  // Sign-in addresses. Every mutation returns the whole set, so the cache is
  // replaced outright rather than patched — no chance of the list and the
  // primary disagreeing after a swap.
  const { data: emails } = useQuery({ queryKey: ['my-emails'], queryFn: fetchMyEmails });
  const [newMail, setNewMail] = useState('');
  const [mailPwd, setMailPwd] = useState('');
  const onMailDone = (data) => {
    qc.setQueryData(['my-emails'], data);
    qc.invalidateQueries({ queryKey: ['me'] });   // primary may have moved
    setNewMail('');
  };
  const add        = useMutation({ mutationFn: () => addMyEmail({ email: newMail.trim(), current_password: mailPwd }), onSuccess: onMailDone });
  const setPrimary = useMutation({ mutationFn: (id) => makeMyEmailPrimary(id, { current_password: mailPwd }), onSuccess: onMailDone });
  const remove     = useMutation({ mutationFn: (id) => removeMyEmail(id, { current_password: mailPwd }), onSuccess: onMailDone });
  const busy = add.isPending || setPrimary.isPending || remove.isPending;
  const mailError = [add, setPrimary, remove].find(m => m.isError) ? err422([add, setPrimary, remove].find(m => m.isError).error) : '';

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const password = useMutation({
    mutationFn: () => changeMyPassword({ current_password: current, password: next }),
    onSuccess: () => { setCurrent(''); setNext(''); },
  });

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-100 p-5">
      <h2 className="flex items-center gap-2 font-bold text-slate-800">
        <Settings className="h-4 w-4 text-brand-600" /> Account settings
      </h2>

      <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); if (dirty && name.trim()) profile.mutate(); }}>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={120} className={inp} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} placeholder="Optional" className={inp} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Email</label>
          <input value={user.email} disabled className={inp + ' bg-slate-50 text-slate-400'} />
          <p className="mt-1 text-[11px] text-slate-400">Manage your sign-in addresses below.</p>
        </div>
        {profile.isError && <p className="text-xs text-red-600">{err422(profile.error)}</p>}
        {profile.isSuccess && !dirty && <p className="text-xs text-green-700">Saved.</p>}
        <button type="submit" disabled={!dirty || !name.trim() || profile.isPending}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">
          {profile.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Mail className="h-4 w-4 text-brand-600" /> Sign-in addresses
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Add a new address first, make it your main one, then remove the old — all of
          them sign you in, so you are never locked out part-way through.
        </p>

        <ul className="mt-3 space-y-1.5">
          <li className="flex flex-wrap items-center gap-2 rounded-md bg-slate-50 px-3 py-2">
            <span className="text-sm text-slate-800">{emails?.primary || user.email}</span>
            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">MAIN</span>
          </li>
          {(emails?.additional || []).map(e => (
            <li key={e.id} className="flex flex-wrap items-center gap-2 rounded-md px-3 py-2 ring-1 ring-slate-100">
              <span className="text-sm text-slate-700">{e.email}</span>
              <button type="button" disabled={!mailPwd || busy}
                onClick={() => setPrimary.mutate(e.id)}
                className="text-[11px] font-semibold text-brand-600 hover:underline disabled:text-slate-300 disabled:no-underline">
                make main
              </button>
              <button type="button" disabled={!mailPwd || busy}
                onClick={() => { if (confirm(`Remove ${e.email}? You will no longer be able to sign in with it.`)) remove.mutate(e.id); }}
                className="ml-auto text-[11px] font-semibold text-slate-500 hover:text-red-600 disabled:text-slate-300">
                remove
              </button>
            </li>
          ))}
        </ul>

        <form className="mt-3 space-y-2" onSubmit={e => { e.preventDefault(); if (newMail.trim() && mailPwd) add.mutate(); }}>
          <div className="grid gap-2 sm:grid-cols-2">
            <input type="email" value={newMail} onChange={e => setNewMail(e.target.value)}
              placeholder="New email address" autoComplete="email" className={inp} />
            {/* Required for every one of these. Without it, anyone who got hold of
                a live session could attach their own address and keep signing in
                after the real owner changed their password. */}
            <input type="password" value={mailPwd} onChange={e => setMailPwd(e.target.value)}
              placeholder="Your current password" autoComplete="current-password" className={inp} />
          </div>
          {mailError && <p className="text-xs text-red-600">{mailError}</p>}
          <button type="submit" disabled={!newMail.trim() || !mailPwd || busy}
            className="inline-flex items-center gap-2 rounded-md ring-1 ring-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {add.isPending ? 'Adding…' : 'Add email'}
          </button>
        </form>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <KeyRound className="h-4 w-4 text-brand-600" /> Change password
        </h3>
        <form className="mt-3 space-y-3" onSubmit={e => { e.preventDefault(); if (current && next.length >= 8) password.mutate(); }}>
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)}
            placeholder="Current password" autoComplete="current-password" className={inp} />
          <input type="password" value={next} onChange={e => setNext(e.target.value)}
            placeholder="New password (at least 8 characters)" autoComplete="new-password" className={inp} />
          {password.isError && <p className="text-xs text-red-600">{err422(password.error)}</p>}
          {password.isSuccess && <p className="text-xs text-green-700">Password changed. Your other devices were signed out.</p>}
          <button type="submit" disabled={!current || next.length < 8 || password.isPending}
            className="inline-flex items-center gap-2 rounded-md ring-1 ring-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {password.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {password.isPending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
