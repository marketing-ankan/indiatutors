// Grade taxonomy (India). Stored per-tutor as a CSV of these tokens; the student
// picker groups them into bands for easy selection while matching stays per-class.

export const GRADE_BANDS = [
  { key: 'pre-primary', label: 'Pre-primary', grades: ['Pre-primary'] },
  { key: 'primary', label: 'Primary (1–5)', grades: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'] },
  { key: 'middle', label: 'Middle (6–8)', grades: ['Class 6', 'Class 7', 'Class 8'] },
  { key: 'secondary', label: 'Secondary (9–10)', grades: ['Class 9', 'Class 10'] },
  { key: 'sr-secondary', label: 'Sr. Secondary (11–12)', grades: ['Class 11', 'Class 12'] },
];

// Flat, ordered list of every grade (for a student's single-grade dropdown).
export const ALL_GRADES = GRADE_BANDS.flatMap(b => b.grades);
