import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchCourses, submitContact, inr } from '../lib/api.js';

// Mirrors the live /refer-and-earn page: hero + reward card, 3 steps,
// 4 why-cards, "Refer a family" form, popular courses, T&C, FAQ, CTA band.

const STEPS = [
  { n:'1', icon:'📣', t:'Refer a friend or relative', d:'As an existing student or parent, introduce your friends, relatives or acquaintances to our live online classes.' },
  { n:'2', icon:'✅', t:'They enrol successfully', d:'Once your referred family joins a programme and completes the first payment, you become eligible for rewards.' },
  { n:'3', icon:'🎉', t:'Earn free classes!', d:'Get 2 free 1-on-1 classes and 2 free group classes for every successful referral.' },
];

const WHY = [
  { icon:'♾️', t:'Unlimited referrals', d:'No cap on how many friends or relatives you can refer. The more you refer, the more free classes you earn.' },
  { icon:'💝', t:'Rewarding & beneficial', d:'Help your loved ones experience top-notch online education while earning exciting rewards for yourself.' },
  { icon:'⚡', t:'Easy process', d:'Just refer — once they enrol, your free class credits are added for you automatically.' },
  { icon:'🎨', t:'Flexible learning', d:'Use your free classes for any subject or skill enhancement you like.' },
];

const TERMS = [
  ['Who can participate?', 'Any existing student or parent at Indiatutors Online is eligible to refer and earn rewards.'],
  ['How do I refer someone?', "Submit the family's details using the form above, or share our website link and ask them to mention your name during enrolment."],
  ['Eligibility for rewards.', "The referred person must successfully enrol and complete the first payment to qualify. If they register but don't pay, no free classes are credited."],
  ['When will I receive my free classes?', "Your free classes are credited within 7 days of your referral's successful enrolment."],
  ['Can I transfer my free classes?', 'No — free classes are non-transferable and can only be used by the referrer.'],
  ['Expiry of free classes.', 'Free classes must be used within 30 days from the date they are credited.'],
  ['Combining rewards.', 'Yes! Refer multiple friends and accumulate your free classes to use them as you like.'],
  ['How will I know my referral was successful?', "You'll receive a confirmation email or message once your referred friend completes the enrolment."],
  ['Fraud or misuse.', 'Any misuse (such as self-referrals or duplicate enrolments) leads to disqualification. Indiatutors Online may modify or end this programme at any time if fraudulent activity is detected.'],
];

const FAQ = [
  ['Who can participate in the Refer & Earn programme?', 'Any existing student or parent at Indiatutors Online can refer friends and family members.'],
  ['How do I refer someone?', 'Use the referral form above, or share our website link and course details and ask your friend to mention your name during enrolment.'],
  ['What happens if my friend registers but does not pay?', 'To qualify for free classes, your referred friend must complete the enrolment and make the necessary payment.'],
  ['Can I transfer my free classes to someone else?', 'No, free classes are non-transferable and must be used by the referrer.'],
  ['Do free classes expire?', 'Yes, free classes must be used within 30 days from the date they are credited.'],
  ['Is there a limit to how many people I can refer?', 'No! The more people you refer, the more free classes you earn.'],
  ['How will I know if my referral was successful?', "You'll receive a confirmation email or message once your referral completes the enrolment process."],
  ['Can I combine multiple free class rewards?', 'Yes! If you refer multiple friends, you can accumulate your free classes and use them accordingly.'],
  ['What if I have more questions?', 'For any queries, contact us at connect@indiatutorsonline.com.'],
];

const inp = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

function ReferralForm() {
  const empty = { registered_email:'', parent_name:'', email:'', whatsapp:'', student_name:'', subjects:'', timezone:'', consent:false };
  const [f, setF] = useState(empty);
  const set = k => e => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const send = useMutation({
    mutationFn: () => submitContact({
      name: f.parent_name || 'Referral (name not given)',
      email: f.registered_email,
      phone: f.whatsapp || null,
      subject: 'Referral — Refer & Earn',
      message: [
        `Referrer registered email: ${f.registered_email}`,
        f.parent_name && `Referred parent: ${f.parent_name}`,
        f.email && `Referred email: ${f.email}`,
        f.whatsapp && `WhatsApp: ${f.whatsapp}`,
        f.student_name && `Student: ${f.student_name}`,
        f.subjects && `Subjects of interest: ${f.subjects}`,
        f.timezone && `Time zone: ${f.timezone}`,
      ].filter(Boolean).join('\n'),
    }),
  });

  if (send.isSuccess) return (
    <div className="rounded-2xl bg-green-50 ring-1 ring-green-200 p-8 text-center">
      <div className="text-3xl mb-2">🎉</div>
      <h3 className="font-extrabold text-green-800 text-lg">Referral received!</h3>
      <p className="text-sm text-green-700 mt-1">Thanks for sharing the gift of learning — we'll reach out to your friend and credit your free classes once they enrol.</p>
    </div>
  );

  return (
    <form onSubmit={e=>{e.preventDefault(); if(f.consent) send.mutate();}} className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6 sm:p-8 space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Your Registered Email *</label>
        <input required type="email" value={f.registered_email} onChange={set('registered_email')} className={inp}/>
        <p className="text-xs text-slate-400 mt-1">We use this only to confirm you're an existing parent.</p>
      </div>
      <p className="text-sm font-bold text-slate-700 pt-1">Who are you referring?</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <input placeholder="Parent Name" value={f.parent_name} onChange={set('parent_name')} className={inp}/>
        <input type="email" placeholder="Email" value={f.email} onChange={set('email')} className={inp}/>
        <input placeholder="WhatsApp Number (with country code)" value={f.whatsapp} onChange={set('whatsapp')} className={inp}/>
        <input placeholder="Student Name" value={f.student_name} onChange={set('student_name')} className={inp}/>
        <input placeholder="Subject(s) of Interest" value={f.subjects} onChange={set('subjects')} className={inp}/>
        <input placeholder="Time Zone" value={f.timezone} onChange={set('timezone')} className={inp}/>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" required checked={f.consent} onChange={set('consent')} className="mt-1"/>
        I confirm I have this family's permission to share these details with Indiatutors Online.
      </label>
      {send.isError && <p className="text-sm text-red-600">Could not submit — please check your email and try again.</p>}
      <button disabled={send.isPending} className="rounded-lg bg-brand-600 text-white px-6 py-3 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
        {send.isPending ? 'Submitting…' : '🎁 Submit Referral'}
      </button>
      <p className="text-xs text-slate-400">None of these fields are mandatory — but the more you share, the faster we can welcome your friend.</p>
    </form>
  );
}

export default function ReferEarnPage() {
  const { data: coursesRes } = useQuery({ queryKey:['courses',{per_page:6}], queryFn:()=>fetchCourses({per_page:6}) });
  const courses = coursesRes?.data ?? [];

  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">Share the gift of learning — earn free classes 🎉</h1>
            <p className="mt-4 text-slate-200 max-w-xl leading-relaxed">At Indiatutors Online, we believe learning is more rewarding when shared. Refer a friend or relative, and when they join, you earn FREE classes — our way of saying thank you for your trust.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#refer-form" className="rounded-xl bg-white text-brand-800 px-6 py-3 text-sm font-bold hover:bg-slate-100">🚀 Refer a Friend</a>
              <Link to="/courses" className="rounded-xl border border-white/50 px-6 py-3 text-sm font-bold hover:bg-white/10">🎓 Learn together</Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-8 backdrop-blur">
            <div className="text-center mb-5">
              <div className="text-5xl font-extrabold">2</div>
              <div className="font-bold">FREE classes</div>
              <div className="text-sm text-slate-300">for every successful referral</div>
            </div>
            <ul className="space-y-2.5 text-sm">
              <li>🧑‍🏫 <strong>2 free 1-on-1 classes</strong> per referral</li>
              <li>👥 <strong>2 free group classes</strong> per referral</li>
              <li>♾️ <strong>Unlimited referrals</strong> — the more you refer, the more you earn</li>
            </ul>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-center">How It Works</h2>
          <p className="text-slate-500 text-center mt-1 mb-9">Three simple steps from sharing to earning.</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {STEPS.map(s => (
              <div key={s.n} className="rounded-2xl ring-1 ring-slate-100 p-6 text-center">
                <div className="mx-auto w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold mb-3">{s.n}</div>
                <div className="text-3xl mb-2">{s.icon}</div>
                <h3 className="font-bold text-lg">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY PARTICIPATE */}
      <section className="py-14 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-center mb-9">Why Participate?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY.map(w => (
              <div key={w.t} className="rounded-2xl bg-white ring-1 ring-slate-100 p-6">
                <div className="text-3xl mb-3">{w.icon}</div>
                <h3 className="font-bold">{w.t}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REFER A FAMILY FORM */}
      <section id="refer-form" className="py-14 bg-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-center">📝 Refer a family</h2>
          <p className="text-slate-500 text-center mt-2 mb-8">Only existing Indiatutors Online parents can refer. Tell us who to welcome — no field is mandatory, just share what you can. Already a parent with us? <Link to="/login" className="text-brand-600 font-semibold">Log in</Link> for faster referrals, or just enter your registered email below.</p>
          <ReferralForm />
        </div>
      </section>

      {/* POPULAR COURSES TO SHARE */}
      <section className="py-14 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-center">Popular courses to share</h2>
          <p className="text-slate-500 text-center mt-1 mb-8">Loving one of these? Tell a friend — and earn while they learn.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {courses.map(c => (
              <Link key={c.id} to={`/courses/${c.slug}`} className="group rounded-xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="h-24 bg-slate-100 overflow-hidden">
                  {c.image_url && <img src={c.image_url} alt={c.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"/>}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-slate-800 line-clamp-2 min-h-[2rem]">{c.name}</p>
                  <p className="text-xs font-bold text-brand-700 mt-1">{inr(c.sale_price||c.regular_price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TERMS & CONDITIONS */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-center mb-8">Terms & Conditions</h2>
          <ul className="space-y-4">
            {TERMS.map(([t,d]) => (
              <li key={t} className="text-sm leading-relaxed"><strong className="text-slate-900">{t}</strong> <span className="text-slate-600">{d}</span></li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-center mb-8">❓ Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ.map(([q,a]) => (
              <details key={q} className="rounded-xl bg-white ring-1 ring-slate-100 p-4 group">
                <summary className="font-semibold text-sm cursor-pointer text-slate-800 list-none flex justify-between items-center">{q}<span className="text-slate-400 group-open:rotate-180 transition-transform">⌄</span></summary>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-900 text-white py-14 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-extrabold">Start referring & start earning! 🚀</h2>
          <p className="mt-3 text-slate-300">Share the gift of learning with your friends and family today.</p>
          <a href="#refer-form" className="mt-7 inline-flex rounded-xl bg-white text-brand-800 px-8 py-3 text-sm font-bold hover:bg-slate-100">🎁 Refer a Family Now</a>
        </div>
      </section>
    </>
  );
}
