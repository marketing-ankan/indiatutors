// Shared vocabulary for the physical / home-tuition forms.
//
// The grade scale MIRRORS app/Support/GradeScale.php — 0 = pre-primary,
// 1-12 = Class 1-12, 13 = above Class 12. Keep the two in step: the matcher
// range-checks these ordinals, so a drift here silently mismatches everyone.

export const GRADE_OPTIONS = [
  { value: 0, label: 'Pre-primary' },
  ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Class ${i + 1}` })),
  { value: 13, label: 'Above Class 12' },
];

export const gradeLabel = (n) =>
  n == null ? '' : (GRADE_OPTIONS.find(g => g.value === Number(n))?.label ?? `Class ${n}`);

// ISO-8601 weekdays, so 1 = Monday everywhere — in the grid, in the API and in
// the matcher.
export const WEEKDAYS = [
  { n: 1, short: 'Mon', long: 'Monday' },
  { n: 2, short: 'Tue', long: 'Tuesday' },
  { n: 3, short: 'Wed', long: 'Wednesday' },
  { n: 4, short: 'Thu', long: 'Thursday' },
  { n: 5, short: 'Fri', long: 'Friday' },
  { n: 6, short: 'Sat', long: 'Saturday' },
  { n: 7, short: 'Sun', long: 'Sunday' },
];

// 6 AM - 10 PM. Home tuition happens after school and before dinner; a full
// 24-row grid is mostly dead space the teacher has to scroll past.
export const GRID_HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

export const fmtHour = (h) => {
  const ap = h < 12 ? 'am' : 'pm';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${ap}`;
};

export const BOARDS = ['CBSE', 'ICSE', 'ISC', 'IGCSE', 'IB', 'NIOS', 'State Board', 'Other'];

export const LEVELS = [
  { value: 'school', label: 'School support' },
  { value: 'board', label: 'Board exam' },
  { value: 'competitive', label: 'Competitive exam' },
  { value: 'skill', label: 'Skill / hobby' },
];

export const TRAVEL_MODES = [
  { value: 'walk', label: 'On foot' },
  { value: 'cycle', label: 'Bicycle' },
  { value: 'two_wheeler', label: 'Scooter / bike' },
  { value: 'car', label: 'Car' },
  { value: 'public', label: 'Bus / metro / auto' },
];

export const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'undisclosed', label: 'Prefer not to say' },
];

export const VENUES = [
  { value: 'student_home', label: "At our home", hint: 'The teacher travels to you' },
  { value: 'teacher_place', label: "At the teacher's place", hint: 'You travel to them' },
  { value: 'either', label: 'Either works', hint: 'Widest choice of teachers' },
];

export const GOALS = [
  { value: 'board_exam', label: 'Board exam preparation' },
  { value: 'competitive', label: 'Competitive exam (JEE / NEET / …)' },
  { value: 'remedial', label: 'Catch up on weak areas' },
  { value: 'homework', label: 'Daily homework & school support' },
  { value: 'skill', label: 'A skill or hobby' },
  { value: 'other', label: 'Something else' },
];

export const URGENCY = [
  { value: 'immediate', label: 'Right away' },
  { value: 'within_week', label: 'Within a week' },
  { value: 'within_month', label: 'Within a month' },
  { value: 'flexible', label: "I'm flexible" },
];

// The languages that actually come up as a medium of instruction in Indian
// home tuition. Free text is still allowed on top of these.
export const LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Tamil', 'Gujarati',
  'Kannada', 'Malayalam', 'Odia', 'Punjabi', 'Assamese', 'Urdu',
];

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

// How much to trust a coordinate — shown to the teacher so they understand why
// pressing "use my location" gets them better leads than typing a pincode.
export const GEO_QUALITY = {
  device:  { label: 'Exact location', tone: 'text-green-700 bg-green-50', hint: 'Matched to the metre — you will get the closest students first.' },
  pincode: { label: 'Pincode centre', tone: 'text-amber-700 bg-amber-50', hint: 'Accurate to about a kilometre. Share your location for a sharper match.' },
  approx:  { label: 'Approximate area', tone: 'text-amber-700 bg-amber-50', hint: "We only know roughly where this pincode is. Share your location so we don't send you the wrong side of town." },
  manual:  { label: 'Set by our team', tone: 'text-slate-600 bg-slate-100', hint: '' },
};
