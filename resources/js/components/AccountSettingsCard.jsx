import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, KeyRound, Loader2 } from 'lucide-react';
import { updateMe, changeMyPassword } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

// Account self-service: edit name/phone and change your own password. Until
// this card, the only way to rotate a password was asking an admin — a student
// whose password leaked had to contact the site to fix it.
//
// Email is deliberately read-only: with email verification deferred (no SMTP
// creds yet), letting people edit their login identifier unverified is one
// typo away from locking themselves out.

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
          <p className="mt-1 text-[11px] text-slate-400">Contact us to change the email on your account.</p>
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
