import type { Course, GradeInfo, SemesterWithCourses } from '../types';

export const GRADE_SCALE: GradeInfo[] = [
  { grade: 'A', points: 5.0, min: 80, max: 100, description: 'Excellent' },
  { grade: 'B+', points: 4.5, min: 75, max: 79, description: 'Very Good' },
  { grade: 'B', points: 4.0, min: 70, max: 74, description: 'Good' },
  { grade: 'C+', points: 3.5, min: 65, max: 69, description: 'Fairly Good' },
  { grade: 'C', points: 3.0, min: 60, max: 64, description: 'Fair' },
  { grade: 'D+', points: 2.5, min: 55, max: 59, description: 'Pass' },
  { grade: 'D', points: 2.0, min: 50, max: 54, description: 'Marginal Pass' },
  { grade: 'E', points: 1.0, min: 40, max: 49, description: 'Conditional' },
  { grade: 'F', points: 0.0, min: 0, max: 39, description: 'Fail' },
];

export const MAX_GPA = 5.0;
export const MIN_GPA = 0.0;
export const PASSING_GPA = 2.0;
export const DEFAULT_IA_MAX = 30;
export const DEFAULT_UE_MAX = 70;

export function getGradeFromPercentage(percentage: number): GradeInfo {
  const rounded = Math.round(percentage);
  const gradeInfo = GRADE_SCALE.find(
    (g) => rounded >= g.min && rounded <= g.max
  );
  return gradeInfo || GRADE_SCALE[GRADE_SCALE.length - 1];
}

export function getGradeInfo(grade: string): GradeInfo | undefined {
  return GRADE_SCALE.find((g) => g.grade === grade);
}

export function calculateTotalScore(
  iaScore: number | null,
  iaMax: number,
  ueScore: number | null,
  ueMax: number
): { totalScore: number; percentage: number } | null {
  if (iaScore === null || ueScore === null) {
    return null;
  }

  const totalScore = iaScore + ueScore;
  const totalMax = iaMax + ueMax;
  const percentage = (totalScore / totalMax) * 100;

  return { totalScore, percentage };
}

export function calculateCourseGrade(
  iaScore: number | null,
  iaMax: number,
  ueScore: number | null,
  ueMax: number
): { grade: string; gradePoints: number; percentage: number } | null {
  const result = calculateTotalScore(iaScore, iaMax, ueScore, ueMax);
  if (!result) return null;

  const gradeInfo = getGradeFromPercentage(result.percentage);
  return {
    grade: gradeInfo.grade,
    gradePoints: gradeInfo.points,
    percentage: result.percentage,
  };
}

export function calculateGPA(courses: Course[]): number | null {
  const validCourses = courses.filter(
    (course) => course.grade_points !== null && course.credit_hours > 0
  );

  if (validCourses.length === 0) return null;

  const totalGradePoints = validCourses.reduce(
    (sum, course) => sum + (course.grade_points || 0) * course.credit_hours,
    0
  );

  const totalCredits = validCourses.reduce(
    (sum, course) => sum + course.credit_hours,
    0
  );

  if (totalCredits === 0) return null;

  return totalGradePoints / totalCredits;
}

export function calculateCGPA(
  semesters: { gpa: number | null; totalCredits: number }[]
): number | null {
  const validSemesters = semesters.filter(
    (sem) => sem.gpa !== null && sem.totalCredits > 0
  );

  if (validSemesters.length === 0) return null;

  const totalWeightedGPA = validSemesters.reduce(
    (sum, sem) => sum + (sem.gpa || 0) * sem.totalCredits,
    0
  );

  const totalCredits = validSemesters.reduce(
    (sum, sem) => sum + sem.totalCredits,
    0
  );

  if (totalCredits === 0) return null;

  return totalWeightedGPA / totalCredits;
}

export function getClassStanding(cgpa: number): string {
  if (cgpa >= 4.5) return 'First Class Honours';
  if (cgpa >= 4.0) return 'Second Class Honours (Upper)';
  if (cgpa >= 3.0) return 'Second Class Honours (Lower)';
  if (cgpa >= 2.0) return 'Pass';
  return 'Fail';
}

export function getClassStandingShort(cgpa: number): string {
  if (cgpa >= 4.5) return 'First Class';
  if (cgpa >= 4.0) return 'Second Upper';
  if (cgpa >= 3.0) return 'Second Lower';
  if (cgpa >= 2.0) return 'Pass';
  return 'Fail';
}

export function getGPAProgress(gpa: number): number {
  return (gpa / MAX_GPA) * 100;
}

export function formatGPA(gpa: number | null): string {
  if (gpa === null) return '--.--';
  return gpa.toFixed(2);
}

export function formatPercentage(percentage: number | null): string {
  if (percentage === null) return '--%';
  return `${percentage.toFixed(1)}%`;
}

export function getGradeDistribution(courses: Course[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  courses.forEach((course) => {
    if (course.grade) {
      distribution[course.grade] = (distribution[course.grade] || 0) + 1;
    }
  });

  return distribution;
}

export function calculateTotalCredits(courses: Course[]): number {
  return courses.reduce((sum, course) => sum + course.credit_hours, 0);
}

export function getPerformanceMessage(gpa: number): string {
  if (gpa >= 4.5) return 'Outstanding Performance!';
  if (gpa >= 4.0) return 'Excellent Performance!';
  if (gpa >= 3.5) return 'Very Good Performance!';
  if (gpa >= 3.0) return 'Good Performance';
  if (gpa >= 2.5) return 'Fair Performance';
  if (gpa >= 2.0) return 'Needs Improvement';
  return 'Critical - Seek Academic Support';
}

export function calculateCGPAFromSemesters(semesters: SemesterWithCourses[]): number | null {
  const allCourses: Course[] = [];

  for (const semester of semesters) {
    allCourses.push(...semester.courses);
  }

  return calculateGPA(allCourses);
}

export function roundToDecimalPlaces(value: number, places: number): number {
  const multiplier = Math.pow(10, places);
  return Math.round(value * multiplier) / multiplier;
}

export function isPassingGrade(gradePoints: number): boolean {
  return gradePoints >= PASSING_GPA;
}

export function isPassingPercentage(percentage: number): boolean {
  return percentage >= 50;
}

export function getRequiredGPAForTarget(
  currentCGPA: number,
  currentCredits: number,
  targetCGPA: number,
  futureCredits: number
): number | null {
  if (futureCredits <= 0) return null;

  const totalCreditsAfter = currentCredits + futureCredits;
  const requiredTotalPoints = targetCGPA * totalCreditsAfter;
  const currentTotalPoints = currentCGPA * currentCredits;
  const requiredFuturePoints = requiredTotalPoints - currentTotalPoints;
  const requiredGPA = requiredFuturePoints / futureCredits;

  if (requiredGPA > MAX_GPA) return null;
  if (requiredGPA < MIN_GPA) return MIN_GPA;

  return roundToDecimalPlaces(requiredGPA, 2);
}

export function calculateGPATrend(
  semesters: { semester_number: number; gpa: number | null }[]
): { improving: boolean; stable: boolean; declining: boolean } {
  const validGPAs = semesters
    .filter((s) => s.gpa !== null)
    .sort((a, b) => a.semester_number - b.semester_number)
    .map((s) => s.gpa as number);

  if (validGPAs.length < 2) {
    return { improving: false, stable: true, declining: false };
  }

  let increases = 0;
  let decreases = 0;

  for (let i = 1; i < validGPAs.length; i++) {
    const diff = validGPAs[i] - validGPAs[i - 1];
    if (diff > 0.1) increases++;
    else if (diff < -0.1) decreases++;
  }

  const threshold = (validGPAs.length - 1) / 2;

  return {
    improving: increases > threshold,
    stable: increases <= threshold && decreases <= threshold,
    declining: decreases > threshold,
  };
}

export function getCompletedCredits(courses: Course[]): number {
  return courses
    .filter((c) => c.grade_points !== null && c.grade_points >= PASSING_GPA)
    .reduce((sum, c) => sum + c.credit_hours, 0);
}

export function getFailedCredits(courses: Course[]): number {
  return courses
    .filter((c) => c.grade_points !== null && c.grade_points < PASSING_GPA)
    .reduce((sum, c) => sum + c.credit_hours, 0);
}

export function validateCourseScores(
  iaScore: number | null,
  iaMax: number,
  ueScore: number | null,
  ueMax: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (iaMax <= 0) {
    errors.push('IA maximum marks must be greater than 0');
  }
  if (ueMax <= 0) {
    errors.push('UE maximum marks must be greater than 0');
  }
  if (iaScore !== null && iaScore < 0) {
    errors.push('IA score cannot be negative');
  }
  if (ueScore !== null && ueScore < 0) {
    errors.push('UE score cannot be negative');
  }
  if (iaScore !== null && iaScore > iaMax) {
    errors.push(`IA score cannot exceed ${iaMax}`);
  }
  if (ueScore !== null && ueScore > ueMax) {
    errors.push(`UE score cannot exceed ${ueMax}`);
  }

  return { valid: errors.length === 0, errors };
}
