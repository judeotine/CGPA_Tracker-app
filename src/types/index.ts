export interface Profile {
  id: string;
  full_name: string | null;
  university: string;
  program: string | null;
  country: string;
  student_id: string | null;
  start_year: number | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: string;
  user_id: string;
  semester_number: number;
  name: string | null;
  start_date: string | null;
  end_date: string | null;
  gpa: number | null;
  total_credits: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  semester_id: string;
  user_id: string;
  name: string;
  credit_hours: number;
  ia_score: number | null;
  ia_max: number;
  ue_score: number | null;
  ue_max: number;
  total_score: number | null;
  percentage: number | null;
  grade: string | null;
  grade_points: number | null;
  created_at: string;
  updated_at: string;
}

export interface Preferences {
  user_id: string;
  default_ia_max: number;
  default_ue_max: number;
  notifications_enabled: boolean;
  haptic_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SemesterWithCourses extends Semester {
  courses: Course[];
}

export interface GradeInfo {
  grade: string;
  points: number;
  min: number;
  max: number;
  description: string;
}

export interface AnalyticsData {
  cgpa: number;
  totalCredits: number;
  totalCourses: number;
  totalSemesters: number;
  bestGpa: number;
  worstGpa: number;
  gradeDistribution: Record<string, number>;
  gpaHistory: { semester: number; gpa: number }[];
  creditsPerSemester: { semester: number; credits: number }[];
}

export interface CourseFormData {
  name: string;
  credit_hours: number;
  ia_score: number | null;
  ia_max: number;
  ue_score: number | null;
  ue_max: number;
}

export interface SemesterFormData {
  semester_number: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
}

export interface ProfileFormData {
  full_name: string;
  university: string;
  program: string;
  country: string;
  student_id: string;
  start_year: number;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  'semester/[id]': { id: string };
  'course/add': { semesterId: string };
  'course/edit': { courseId: string };
};
