// Static content for the course detail page's generic sections — scraped 1:1
// from the live indiatutorsonline.com /product/{slug} template (FAQ, workshops,
// testimonials, teachers, achievements, blog). These are identical across every
// product on the live site, so they live here rather than in the course API.

import { PRICING } from './pricing.js';

const UP = 'https://indiatutorsonline.com/wp-content/uploads/';

// Course slugs offered as Group classes on the live site. For these, the catalog
// "from" price is the Group-Beginner rate and One-to-One is 2× that (matches the
// live price matrix, e.g. Python: Group ₹300 / One-to-One ₹600). Everything else
// is One-to-One only.
export const GROUP_SLUGS = new Set([
  'chess', 'rubiks-cube', 'python', 'roblox-minecraft', 'robotics', 'scratch',
  'french', 'hindi', 'spanish', 'tamil', 'telugu', 'bollywood-dance',
  'hip-hop-dance', 'art-and-craft', 'arts-painting', 'creative-writing',
  'public-speaking', 'spelling-competition',
]);

// Buy-card feature bullets (generic, works for any course).
export const CARD_FEATURES = [
  'Live 1-on-1 & small-group classes',
  'Personalised curriculum after your free demo',
  'Project / practice-based learning',
  'Live mentor support · concept + hands-on',
  'Flexible scheduling · first demo free',
  'Certificate of completion / participation',
];

export const FAQS = [
  { q: 'How do I get started?', a: 'To get started simply book a demo, to book a free live demo session with the instructor, please click on the "Book a Demo" button and provide details to schedule the class. For details, please contact Seema at (+91) 74391 54909 or seema@indiatutorsonline.com' },
  { q: 'How does payment work?', a: 'We require monthly advance payments for the number of classes scheduled in a calendar month. We use PayPal, or other payment apps for the collection of fees. You will be asked to select your choice of payment method during the initial setup of the class.' },
  { q: 'What if I miss a class?', a: "For batch classes, we would be able to share a timed recording upon parent's request. For one to one sessions, the class would be rescheduled. We request the parents to inform prior in advance in such cases." },
  { q: 'Do I need to sign any contract?', a: 'All our engagements are based on the terms and conditions and other requirements mentioned in the website. We provide complete flexibility to our students to exit the course anytime if they do not find the classes beneficial to them.' },
  { q: "How do I take an update on my child's progress?", a: "For progress tracking we will be providing assessments and homework lessons which will give parents a clear picture of a child's progress. We encourage all Parents to discuss and share their views/feedback on a regular basis to the Teacher or our Institute representative for updates and for us to keep improving and meeting your expectations." },
  { q: 'If my kid does not enjoy classes, will Indiatutors Online refund the fees?', a: 'We provide complete flexibility to our students to exit the course anytime if they do not find the classes beneficial to them. We will refund fees for those future classes which are not taken by the Student.' },
  { q: 'Why should I take classes from Indiatutors Online, are they the best?', a: 'Indiatutors Online provides one to one interactive sessions with highly qualified teachers and best-in-class learning experience for your kids within your home environment. We endeavor to provide quality education at a reasonable cost, so that Kids can get individual attention and therefore are able to compete better.' },
  { q: 'Is previous experience required?', a: 'No, the course is designed to accommodate complete beginners.' },
  { q: 'Will I get a certificate after the course completion?', a: 'Yes, We provide certificates after completion of the course. We also encourage students to participate in various competitions which are Internationally recognised.' },
  { q: 'Where are the teachers from?', a: 'Most of our teachers are from India with Masters in their subject or relevant experience teaching International Curriculum.' },
  { q: 'How does the scheduling work with different time zones?', a: 'We are providing classes in the USA, Canada, UK, Europe, Australia, Dubai, Singapore etc. We schedule sessions accordingly to the time comfortable to kids in their respective time zones.' },
  { q: 'How are the classes conducted?', a: 'Classes are conducted online via Google Meet or Zoom on the scheduled time, whether the classes be 1:1 or in a group.' },
  { q: 'What are the requirements for this course?', a: 'A device (laptop/desktop) and a stable internet connection. Specific tools/accounts (e.g., a free Scratch / MIT App Inventor account, a Python interpreter and an IDE) are listed under the Requirements tab for each course.' },
  { q: 'What if my child is below minimum age?', a: "We'll recommend you to check out our other courses for your kid's age group." },
  { q: 'Is the schedule flexible?', a: 'Yes, the time slot of the classes will be scheduled to accommodate your child.' },
  { q: 'Will my kid learn at his/her own pace?', a: 'Yes, the pace of the classes will be adjusted according to the child.' },
  { q: 'Can an adult join the course?', a: 'Yes, an adult can join our course but, they have to go for 1:1 sessions.' },
  { q: 'What to do when my kid runs into a technical issue?', a: 'Our teachers and operations team will provide technical support in case of an issue.' },
];

export const WORKSHOPS = [
  { t: 'JEE / NEET Foundation Bootcamp', d: 'A head-start for Classes 9–10 on the concepts that matter most for JEE and NEET, taught the exam way.' },
  { t: 'Maths & Science Olympiad Prep', d: 'Problem-solving sessions for IMO / NSO / NTSE aspirants — pattern-based practice with expert mentors.' },
  { t: 'CBSE Board Exam Crash Course', d: 'Last-mile revision for Classes 10 & 12 — sample papers, marking schemes and time-management drills.' },
];

// Recent student wins (India-centric, WinQuest-parity section). PLACEHOLDER
// results — replace with real, verified student outcomes when available.
export const STUDENT_WINS = [
  { tag: 'Top 1%', name: 'Aarav S. · Class 10', detail: 'NTSE Stage 1 · qualified for Stage 2' },
  { tag: 'State Rank 12', name: 'Ishita M. · Class 12', detail: 'ICSE Board Exams · 97.2%' },
  { tag: 'Gold', name: 'Rohan K. · Class 8', detail: 'SOF International Maths Olympiad (IMO)' },
  { tag: '99.1 %ile', name: 'Vivaan P. · Class 12', detail: 'JEE Main · qualified for Advanced' },
  { tag: 'District Topper', name: 'Ananya R. · Class 10', detail: 'State Board · 96.8%' },
  { tag: 'Qualified', name: 'Sneha T. · Class 12', detail: 'NEET UG · govt. college admission' },
  { tag: 'Rank 3', name: 'Kabir J. · Class 6', detail: 'National Science Olympiad (NSO)' },
  { tag: '+2 grades', name: 'Diya N. · Class 8', detail: 'Advanced two grade levels in Maths in a year' },
];

// "Why Choose" card grid (WinQuest-parity tab content, India-centric — Indian
// boards only, no US/international curricula, available across India).
export const WHY_CHOOSE = [
  { t: 'Board-aligned tutors', d: "We match the tutor to your child's curriculum — CBSE, ICSE, IGCSE / Cambridge, State Boards or NCERT." },
  { t: 'Live, interactive 1:1 or small-group classes', d: "The tutor sees your child's work in real time and corrects it on the spot." },
  { t: 'Customised practice worksheets', d: 'Graded, reviewed and explained class by class.' },
  { t: 'Weekly homework support', d: 'Assignments and concept revision before the next class.' },
  { t: 'Periodic class tests', d: "Aligned to the board's exam pattern and marking scheme." },
  { t: 'Detailed progress reports', d: 'For parents, every month — see exactly how your child is improving.' },
  { t: 'Flexible scheduling', d: 'Pick time slots that fit school, tuition and after-school activities.' },
  { t: 'Free demo class', d: 'Meet the tutor and see how a session works before you commit.' },
  { t: 'Available across India', d: 'From metros to small towns — all your child needs is an internet connection.' },
  { t: 'Recorded sessions for missed classes', d: 'Group format — no concept is left behind.' },
];

// Extra requirements for academic (board-syllabus) courses.
export const ACADEMIC_REQUIREMENTS = [
  'Notebook and stationery for working out problems',
  'School textbook (any board — CBSE / ICSE / State) — your tutor adapts to it',
];

// Generated Overview paragraph when a course has no description (India-centric).
export const overviewFor = (name) =>
  `${name} classes on Indiatutors Online are live, one-on-one sessions built around your child's own school syllabus — CBSE, ICSE, IGCSE or State board. The tutor follows the exact chapter sequence and exam pattern your child faces, with focused instruction, regular practice and doubt-clearing in every class. Families across India benefit from flexible scheduling and a consistent tutor who tracks progress session to session — and the first demo class is always free.`;

// Course-page FAQ tab (WinQuest-parity, India-centric). Accordion in the tab row;
// the fuller site-wide FAQ section lower on the page stays as-is.
export const COURSE_FAQS = [
  { q: 'How do I get started?', a: "Click the Book a Free Demo button on this page and fill in your child's grade and school board (CBSE / ICSE / IGCSE / State board). We'll schedule a free trial session with a matching tutor. For help, WhatsApp our coordinator on +91 93308 11581 or email connect@indiatutorsonline.com." },
  { q: "Will the tutor follow my child's school board?", a: "Yes — we match the tutor to your child's exact board and class. Classes follow the same chapter sequence, textbook and exam pattern your child faces at school, whether that's CBSE (NCERT), ICSE (CISCE), IGCSE / Cambridge or a State board." },
  { q: 'How does payment work?', a: 'We collect a monthly advance for the classes scheduled that month, via UPI, cards, net banking or other payment apps. There is no long-term commitment — you can pause or stop any time, and fees for untaken classes are refunded.' },
  { q: 'What if my child misses a class?', a: 'For 1-on-1 sessions we simply reschedule the class at no cost — just inform us in advance. For group classes we share a timed recording on request, so no concept is left behind.' },
  { q: 'How long is each class?', a: 'A typical session is 55–60 minutes. For younger children (below Class 3) we recommend 40–45 minute sessions to match their attention span — the schedule is agreed with you at the start.' },
  { q: 'How is progress measured?', a: "Your tutor shares an update after every class, sets periodic tests aligned to the board's exam pattern, and sends parents a detailed progress report every month. You can also discuss progress directly with the tutor or our coordinator at any time." },
];

// "Start your child's journey today" — WinQuest-parity closing CTA (India-centric).
export const JOURNEY = [
  { icon: '👩‍🏫', t: '1-on-1 Online Tutors', d: 'Experienced tutors so your child learns from the best.' },
  { icon: '🎯', t: 'Free Demo Session', d: 'Try a demo to make sure your child enjoys it before you commit.' },
  { icon: '💸', t: 'Affordable Pricing', d: 'Premium teaching at prices that fit every family.' },
  { icon: '💬', t: 'Need Help?', d: 'WhatsApp us anytime — our team helps you pick the right class.' },
];

// "Trusted by 10,000+ families" strip (WinQuest-parity, India-centric).
export const TRUST_POINTS = [
  '👩‍🏫 Verified expert tutors',
  '🎯 1-on-1 personalised attention',
  '🎁 First class is 100% free',
  '⭐ 4.9 / 5 from 1,200+ reviews',
];

export const PARENTS = [
  { init: 'P', quote: 'My daughter went from shy to confident in three months. The 1:1 attention made all the difference.', name: 'Priya S.', place: 'Parent · Bengaluru' },
  { init: 'R', quote: 'Flexible timings actually worked around our schedule, and the mentor genuinely cared about progress.', name: 'Rahul M.', place: 'Parent · Delhi' },
  { init: 'A', quote: 'The free demo convinced us. Six months in, my son looks forward to every single class.', name: 'Anita K.', place: 'Parent · Kolkata' },
  { init: 'D', quote: 'Across time zones it still felt personal. Clear updates and real improvement we could see.', name: 'David T.', place: 'Parent · Dubai' },
];

// "Meet our Teachers" carousel — the full mentor roster shown on every product
// page (WinQuest-parity). Portraits are self-hosted under /public/images/teachers
// (copied from the sister brand's uploads) so they survive the domain cutover
// instead of hotlinking. Cards are not linked to profiles — this is a showcase
// strip, matching the live layout.
export const TEACHERS = [
  { name: 'Anney', img: '/build/images/teachers/anney.png' },
  { name: 'Kainaaz', img: '/build/images/teachers/kainaaz.png' },
  { name: 'Pinki', img: '/build/images/teachers/pinki.png' },
  { name: 'Shamim', img: '/build/images/teachers/shamim.png' },
  { name: 'Angeline', img: '/build/images/teachers/angeline.png' },
  { name: 'Anubrato', img: '/build/images/teachers/anubrato.png' },
  { name: 'Deana', img: '/build/images/teachers/deana.png' },
  { name: 'Nisitha', img: '/build/images/teachers/nisitha.png' },
  { name: 'Visha Singh', img: '/build/images/teachers/visha-singh.webp' },
  { name: 'Subin Dey', img: '/build/images/teachers/subin-dey.webp' },
  { name: 'Rohan Singh Rathore', img: '/build/images/teachers/rohan-singh-rathore.webp' },
  { name: 'Divya Kamra', img: '/build/images/teachers/divya-kamra.webp' },
  { name: 'Prakesh Kumar Pandey', img: '/build/images/teachers/prakesh-kumar-pandey.webp' },
  { name: 'Rajlaxmi Kesharwani', img: '/build/images/teachers/rajlaxmi-kesharwani.webp' },
  { name: 'Vivek Kumar Sharma', img: '/build/images/teachers/vivek-kumar-sharma.webp' },
  { name: 'Ruchi Ghosh', img: '/build/images/teachers/ruchi-ghosh.webp' },
  { name: 'Ranjana Sarkar', img: '/build/images/teachers/ranjana-sarkar.webp' },
  { name: 'Charumathi Jaikumar', img: '/build/images/teachers/charumathi-jaikumar.webp' },
  { name: 'Anukriti Gahlout', img: '/build/images/teachers/anukriti-gahlout.webp' },
  { name: 'Neetu Malhotra', img: '/build/images/teachers/neetu-malhotra.webp' },
  { name: 'Navya Kesharwani', img: '/build/images/teachers/navya-kesharwani.webp' },
  { name: 'Aravind Mathews', img: '/build/images/teachers/aravind-mathews.webp' },
  { name: 'Arpan Sen', img: '/build/images/teachers/arpan-sen.webp' },
];

export const ACHIEVEMENTS = [
  { tag: 'Distinction', name: 'Aisha R.', detail: 'Grade 1 · Music Theory' },
  { tag: 'Runner-up', name: 'Zaid A.', detail: 'Chess State Tournament' },
  { tag: 'Gold', name: 'Ethan P.', detail: 'Science Olympiad' },
  { tag: 'Top 1%', name: 'Meera N.', detail: 'Spoken English' },
];

export const BLOG_POSTS = [
  { slug: 'hello-world', date: 'April 16, 2026', title: 'Hello world!', excerpt: 'Welcome to WordPress. This is your first post. Edit or delete it, then start writing!' },
];

// WhatsApp-style testimonials (WinQuest product-page parity). PLACEHOLDER copy —
// replace with real screenshots/messages from the WhatsApp community.
export const WHATSAPP_TESTIMONIALS = [
  { init: 'S', name: 'Sangeeta', time: '9:14 AM', text: 'My daughter actually looks forward to her class now 😊 Thank you for the personal attention!' },
  { init: 'R', name: 'Rakesh', time: '7:42 PM', text: 'Booked a free demo on Sunday, enrolled the same week. Best decision — visible improvement in a month. 👍' },
  { init: 'M', name: 'Meenakshi', time: '11:05 AM', text: 'The teacher is so patient with my son. He finished his first project today and was thrilled! 🎉' },
  { init: 'A', name: 'Arun', time: '6:20 PM', text: 'Flexible timings really helped us with the time-zone difference. Highly recommend. 🙏' },
  { init: 'P', name: 'Pooja', time: '3:30 PM', text: 'Loved the progress updates after every class. We always know how she is doing. ⭐⭐⭐⭐⭐' },
  { init: 'V', name: 'Vikram', time: '8:55 PM', text: 'From shy to confident in three months. Worth every rupee. Thank you team! 💙' },
];

// Instagram feed (WinQuest product-page parity). PLACEHOLDER tiles — swap the
// handle + real post thumbnails/links when the Instagram integration is ready.
export const INSTAGRAM = {
  handle: 'indiatutorsonline',
  url: 'https://www.instagram.com/indiatutorsonline',
  posts: [
    { emoji: '🎨', tint: 'from-[#F58529] to-[#DD2A7B]' },
    { emoji: '🎹', tint: 'from-[#DD2A7B] to-[#8134AF]' },
    { emoji: '🧮', tint: 'from-[#8134AF] to-[#515BD4]' },
    { emoji: '♟️', tint: 'from-[#515BD4] to-[#F58529]' },
    { emoji: '🐍', tint: 'from-[#F58529] to-[#8134AF]' },
    { emoji: '🎻', tint: 'from-[#DD2A7B] to-[#515BD4]' },
    { emoji: '💃', tint: 'from-[#8134AF] to-[#F58529]' },
    { emoji: '🗣️', tint: 'from-[#515BD4] to-[#DD2A7B]' },
  ],
};

// Course-name → PRICING.rates row lookup, so the product-page buy card shows
// the OFFICIAL per-level rates from the "IN Plan and Pricing" PDF rather than
// a synthetic ×1.5/×2 ladder (which only coincides with the PDF for the
// standard 600/900/1200 subjects — music, Java, cello etc. differ).
// Long-title variant courses map onto their base subject via RATE_ALIASES.
const normName = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '');
const RATE_ALIASES = {
  'customizedonlineguitarlessonsforkidsbasicstomastery': 'Guitar',
  'onlinepianokeyboardclassesforkidsandbeginners': 'Piano',
  'pythonprogrammingforkidscodeyourfirstprojects': 'Python',
  'pythonprogrammingforbeginners': 'Python',
  'artificialintelligencemachinelearning': 'AI & ML',
  'roboticscomputationalthinking': 'Robotics',
  'algebraifoundation': 'Algebra I',
  'chessstrategymindsports': 'Chess',
  'violinviolalessonsforbeginners': 'Violin',
  'satpsatmathmastery': 'Math SAT/PSAT',
};
function rateRowFor(name) {
  if (!name) return null;
  const key = normName(RATE_ALIASES[normName(name)] || name);
  return PRICING.rates.find(r => normName(r.name) === key) || null;
}

// Builds the One-to-One / Group × Beginner/Intermediate/Advanced price matrix.
// Preferred source: the official INR rates (per the IN pricing PDF) matched by
// course name — Group appears exactly when the PDF lists a group rate.
// Fallback (unmatched names, e.g. Spoken English): the previous synthetic
// ladder from the catalog base price (base ×1 / ×1.5 / ×2; Group = half).
export function buildPriceMatrix(base, slug, name) {
  const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
  const grossOf = net => Math.round((net / 0.6) / 10) * 10; // ~40% off, rounded
  const row = rateRowFor(name);
  if (row && Array.isArray(row.inr) && row.inr.length) {
    const pick = (arr, i) => arr[Math.min(i, arr.length - 1)];
    const matrix = { 'One-to-One': {} };
    LEVELS.forEach((lv, i) => { const net = pick(row.inr, i); matrix['One-to-One'][lv] = { net, gross: grossOf(net) }; });
    if (Array.isArray(row.inrG) && row.inrG.length) {
      matrix['Group'] = {};
      LEVELS.forEach((lv, i) => { const net = pick(row.inrG, i); matrix['Group'][lv] = { net, gross: grossOf(net) }; });
    }
    return { matrix, plans: Object.keys(matrix), levels: LEVELS };
  }
  const isGroup = GROUP_SLUGS.has(slug);
  const mult = [1, 1.5, 2];
  const tier = (unit, m) => { const net = Math.round(unit * m); return { net, gross: grossOf(net) }; };
  // For group-enabled courses base = Group-Beginner and One-to-One is 2×.
  const groupUnit = isGroup ? base : base / 2;
  const oneUnit = isGroup ? base * 2 : base;
  const matrix = { 'One-to-One': {} };
  LEVELS.forEach((lv, i) => { matrix['One-to-One'][lv] = tier(oneUnit, mult[i]); });
  if (isGroup) {
    matrix['Group'] = {};
    LEVELS.forEach((lv, i) => { matrix['Group'][lv] = tier(groupUnit, mult[i]); });
  }
  return { matrix, plans: Object.keys(matrix), levels: LEVELS };
}
