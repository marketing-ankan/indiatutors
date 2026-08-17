import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Loader2 } from 'lucide-react';
import { updateMe } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

/**
 * How we are allowed to contact this person.
 *
 * WhatsApp and marketing consent used to be collected once, on the demo-booking
 * form, and kept against that booking — so a family could tell us at 9pm on a
 * Tuesday that they were happy to hear from us on WhatsApp, and then had no way
 * ever again to change their mind, ask for a reminder before class, or stop the
 * marketing. There was also no single place staff could check what a given
 * person had actually agreed to before messaging them.
 *
 * Service and marketing are shown as two separate groups on purpose, and the
 * copy says which is which. Someone who has booked a class expects to be told
 * about that class; that is not the same permission as being sold to, and
 * rolling the two together is how consent stops meaning anything.
 *
 * Saved on toggle rather than behind a Save button: a preferences pane where
 * you flip a switch, leave, and find nothing changed is worse than no pane. The
 * request sends only the switches, so it can never disturb the name and phone
 * the details card above owns.
 */
const GROUPS = [
  {
    title: 'About your classes',
    blurb: 'Booking updates, proposed demo times, a substitute teacher, timetable changes. Turning everything off here means we can only reach you by phone.',
    items: [
      { key: 'notify_whatsapp', label: 'WhatsApp', hint: 'Usually the fastest way to reach you.' },
      { key: 'notify_email',    label: 'Email',    hint: 'A written record you can search later.' },
      { key: 'class_reminders', label: 'Class reminders', hint: 'A nudge before a scheduled class.' },
    ],
  },
  {
    title: 'Offers and updates',
    blurb: 'New courses, workshops and seasonal offers. Nothing to do with classes you have already booked.',
    items: [
      { key: 'marketing_opt_in', label: 'Send me offers and news', hint: 'Off unless you switch it on.' },
    ],
  },
];

export default function ContactPreferencesCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState('');

  const save = useMutation({
    // Only the switch that moved. Sending the whole user object here would let
    // a stale copy of the name overwrite an edit made in the card above.
    mutationFn: patch => updateMe(patch),
    onSuccess: () => {
      setErr(''); setSaved('Saved');
      qc.invalidateQueries({ queryKey: ['me'] });
      setTimeout(() => setSaved(''), 2000);
    },
    onError: e => { setSaved(''); setErr(e?.response?.data?.message || 'Could not save that — please try again.'); },
  });

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h2 className="font-heading flex items-center gap-2 text-lg font-bold text-[#0B1220]">
        <MessageCircle className="h-5 w-5 text-brand-600" />How we contact you
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Change these whenever you like. We will always honour the latest setting.
      </p>

      <div className="mt-4 space-y-5">
        {GROUPS.map(g => (
          <div key={g.title}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{g.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{g.blurb}</p>
            <ul className="mt-2 space-y-1">
              {g.items.map(it => {
                const on = !!user?.[it.key];
                return (
                  <li key={it.key}>
                    {/* A real checkbox, so it is reachable and announced by a
                        screen reader without any custom keyboard handling. */}
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={save.isPending}
                        onChange={e => save.mutate({ [it.key]: e.target.checked })}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-brand-600"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">{it.label}</span>
                        <span className="block text-xs text-slate-500">{it.hint}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-3 flex min-h-[1.25rem] items-center gap-2 text-xs" role="status" aria-live="polite">
        {save.isPending && <><Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /><span className="text-slate-500">Saving…</span></>}
        {saved && <span className="font-semibold text-green-700">{saved}</span>}
        {err && <span className="font-semibold text-red-600">{err}</span>}
      </div>
    </section>
  );
}
