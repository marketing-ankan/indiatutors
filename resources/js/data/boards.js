// Education boards (India-first). Each board is a landing page (/board/{slug})
// that funnels the existing academic courses framed for that board, plus a
// book-a-demo CTA. Academic courses aren't board-tagged in the data yet, so the
// pages show the two Academics categories and route enquiries with ?board=.

export const BOARDS = [
  {
    slug: 'cbse', name: 'CBSE', icon: '🏫', scope: 'indian',
    full: 'Central Board of Secondary Education',
    blurb: 'India\'s most widely-followed national board. Our tutors align every session to the latest CBSE/NCERT syllabus, exam pattern and marking scheme — from primary right up to Class 12 boards.',
    highlights: ['NCERT-aligned lessons', 'Board exam & sample-paper practice', 'Class 1–12 coverage'],
  },
  {
    slug: 'icse', name: 'ICSE / ISC', icon: '📚', scope: 'indian',
    full: 'Indian Certificate of Secondary Education',
    blurb: 'The detail-rich CISCE curriculum rewards depth and strong English. Our tutors match ICSE (Class 10) and ISC (Class 12) requirements, with the extra rigour in language, science and maths the board expects.',
    highlights: ['CISCE-aligned depth', 'Strong English & analytical focus', 'ICSE (X) & ISC (XII)'],
  },
  {
    slug: 'igcse', name: 'IGCSE / Cambridge', icon: '🌍', scope: 'international',
    full: 'International General Certificate of Secondary Education',
    blurb: 'The Cambridge / Edexcel international curriculum used by IB-track and international schools. Our tutors teach to IGCSE and A-Level standards with an application-first, concept-led approach.',
    highlights: ['Cambridge & Edexcel', 'Application-led learning', 'IGCSE & A-Levels'],
  },
  {
    slug: 'state-boards', name: 'State Boards', icon: '📍', scope: 'indian',
    full: 'State-level secondary boards',
    blurb: 'Every state board has its own syllabus, language and exam pattern. Tell us your state and medium and we\'ll match a tutor who teaches to your exact board — Maharashtra, Tamil Nadu, Karnataka, West Bengal and more.',
    highlights: ['State-specific syllabus', 'Regional-medium tutors', 'All major state boards'],
  },
  {
    slug: 'ncert', name: 'NCERT', icon: '📖', scope: 'indian',
    full: 'NCERT — the national curriculum',
    blurb: 'The NCERT framework underpins CBSE and most competitive exams. Our foundational academic courses build straight from NCERT textbooks — the strongest base for boards and for JEE/NEET later.',
    highlights: ['NCERT textbook-first', 'Concept foundations', 'Bridge to JEE/NEET'],
  },
];

export const BOARD_BY_SLUG = Object.fromEntries(BOARDS.map(b => [b.slug, b]));

// The academic PARENT category slugs whose courses a board page surfaces.
export const ACADEMIC_CATEGORIES = ['academics-elementary-middle-school', 'academics-high-school'];

// Grouping parents (not subjects) — excluded when we build the subject chips.
export const ACADEMIC_PARENTS = new Set([
  'academics', 'academics-elementary-middle-school', 'academics-high-school',
]);

// US-curriculum subject subcategories. Indian boards (CBSE/ICSE/State/NCERT) hide
// these; IGCSE (international scope) keeps them. Kept as slugs so it survives any
// catalog edit that re-slugs a course.
export const US_SUBCATS = new Set(['algebra', 'geometry', 'calculus', 'honors', 'essay-writing']);

// US-curriculum courses that wear an Indian subject category (e.g. Integrated Math
// sits under "mathematics") — excluded from Indian boards by explicit slug.
export const US_SLUGS = new Set(['integrated-math-i-ii-iii', 'algebra-i-foundation']);

// Preferred display order for the subject chips (unlisted subjects sort after).
export const SUBJECT_ORDER = [
  'english', 'mathematics', 'science', 'physics', 'chemistry', 'biology',
  'social-studies', 'economics', 'vedic-maths', 'abacus', 'phonics',
  // international / advanced (IGCSE)
  'algebra', 'geometry', 'calculus', 'honors', 'essay-writing',
];
