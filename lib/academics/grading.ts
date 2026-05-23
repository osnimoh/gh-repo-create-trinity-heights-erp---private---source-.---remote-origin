// WASSCE grading. Single source of truth on the app side; the wassce_grade()
// DB function mirrors these bands. Percentages are 0–100.

export type WassceGrade = {
  grade: string; // A1..F9
  label: string;
  pass: boolean;
};

const BANDS: { min: number; grade: string; label: string; pass: boolean }[] = [
  { min: 75, grade: "A1", label: "Excellent", pass: true },
  { min: 70, grade: "B2", label: "Very good", pass: true },
  { min: 65, grade: "B3", label: "Good", pass: true },
  { min: 60, grade: "C4", label: "Credit", pass: true },
  { min: 55, grade: "C5", label: "Credit", pass: true },
  { min: 50, grade: "C6", label: "Credit", pass: true },
  { min: 45, grade: "D7", label: "Pass", pass: true },
  { min: 40, grade: "E8", label: "Pass", pass: true },
  { min: 0, grade: "F9", label: "Fail", pass: false },
];

export function wassceGrade(percent: number): WassceGrade {
  const p = Math.max(0, Math.min(100, percent));
  const band = BANDS.find((b) => p >= b.min) ?? BANDS[BANDS.length - 1];
  return { grade: band.grade, label: band.label, pass: band.pass };
}
