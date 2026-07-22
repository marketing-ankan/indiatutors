// Static content for the course detail page's generic sections — scraped 1:1
// from the live indiatutorsonline.com /product/{slug} template (FAQ, workshops,
// testimonials, teachers, achievements, blog). These are identical across every
// product on the live site, so they live here rather than in the course API.

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

export const PARENTS = [
  { init: 'P', quote: 'My daughter went from shy to confident in three months. The 1:1 attention made all the difference.', name: 'Priya S.', place: 'Parent · Bengaluru' },
  { init: 'R', quote: 'Flexible timings actually worked around our schedule, and the mentor genuinely cared about progress.', name: 'Rahul M.', place: 'Parent · Delhi' },
  { init: 'A', quote: 'The free demo convinced us. Six months in, my son looks forward to every single class.', name: 'Anita K.', place: 'Parent · Kolkata' },
  { init: 'D', quote: 'Across time zones it still felt personal. Clear updates and real improvement we could see.', name: 'David T.', place: 'Parent · Dubai' },
];

export const TEACHERS = [
  { name: 'Vipul', slug: 'vipul', img: UP + '2026/05/Untitled-design-71-760x1024-2-223x300.png' },
  { name: 'Vijayalakshmi', slug: 'vijayalakshmi', img: UP + '2026/05/Untitled-design-70-760x1024-2-223x300.png' },
  { name: 'Surajit', slug: 'surajit', img: UP + '2026/05/Untitled-design-69-760x1024-2-223x300.png' },
  { name: 'Shamim', slug: 'shamim', img: UP + '2026/05/Untitled-design-62-760x1024-2-223x300.png' },
  { name: 'Rahul', slug: 'rahul', img: UP + '2026/05/Untitled-design-68-760x1024-1-223x300.png' },
  { name: 'Prashasti', slug: 'prashasti', img: UP + '2026/05/Untitled-design-67-760x1024-1-223x300.png' },
  { name: 'Pinki', slug: 'pinki', img: UP + '2026/05/Untitled-design-61-760x1024-1-223x300.png' },
  { name: 'Nisitha', slug: 'nisitha', img: UP + '2026/05/Untitled-design-66-760x1024-1-223x300.png' },
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

// Builds the live-style One-to-One / Group × Beginner/Intermediate/Advanced price
// matrix from a single catalog base price (the lowest / "from" rate).
export function buildPriceMatrix(base, slug) {
  const isGroup = GROUP_SLUGS.has(slug);
  const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
  const mult = [1, 1.5, 2];
  const grossOf = net => Math.round((net / 0.6) / 10) * 10; // ~40% off, rounded
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
