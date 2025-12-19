import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { calculateGPA, calculateCGPA, calculateCourseGrade, calculateTotalCredits } from '../lib/calculations';
import { saveSemestersLocally, loadSemestersLocally, isOnline } from '../lib/offline';
import type { Semester, Course, SemesterWithCourses, CourseFormData, SemesterFormData, AnalyticsData } from '../types';

interface SemesterState {
  semesters: SemesterWithCourses[];
  isLoading: boolean;
  error: string | null;
  cgpa: number | null;
  fetchSemesters: () => Promise<void>;
  addSemester: (data: SemesterFormData) => Promise<{ id?: string; error?: string }>;
  updateSemester: (id: string, data: Partial<SemesterFormData>) => Promise<{ error?: string }>;
  deleteSemester: (id: string) => Promise<{ error?: string }>;
  addCourse: (semesterId: string, data: CourseFormData) => Promise<{ id?: string; error?: string }>;
  updateCourse: (courseId: string, data: CourseFormData) => Promise<{ error?: string }>;
  deleteCourse: (courseId: string) => Promise<{ error?: string }>;
  getSemester: (id: string) => SemesterWithCourses | undefined;
  getCourse: (id: string) => Course | undefined;
  getAnalytics: () => AnalyticsData;
  recalculateSemesterGPA: (semesterId: string) => Promise<void>;
}

export const useSemesterStore = create<SemesterState>((set, get) => ({
  semesters: [],
  isLoading: false,
  error: null,
  cgpa: null,

  fetchSemesters: async () => {
    set({ isLoading: true, error: null });

    try {
      const online = await isOnline();

      if (!online) {
        const cachedSemesters = await loadSemestersLocally();
        if (cachedSemesters) {
          const cgpa = calculateCGPA(
            cachedSemesters.map((sem) => ({
              gpa: sem.gpa,
              totalCredits: sem.total_credits,
            }))
          );
          set({ semesters: cachedSemesters, cgpa, isLoading: false });
          return;
        }
      }

      const { data: semesters, error: semesterError } = await supabase
        .from('semesters')
        .select('*')
        .order('semester_number', { ascending: true });

      if (semesterError) throw semesterError;

      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true });

      if (courseError) throw courseError;

      const semestersWithCourses: SemesterWithCourses[] = (semesters || []).map((semester) => ({
        ...semester,
        courses: (courses || []).filter((course) => course.semester_id === semester.id),
      }));

      const cgpa = calculateCGPA(
        semestersWithCourses.map((sem) => ({
          gpa: sem.gpa,
          totalCredits: sem.total_credits,
        }))
      );

      await saveSemestersLocally(semestersWithCourses);
      set({ semesters: semestersWithCourses, cgpa, isLoading: false });
    } catch (error: unknown) {
      const cachedSemesters = await loadSemestersLocally();
      if (cachedSemesters) {
        const cgpa = calculateCGPA(
          cachedSemesters.map((sem) => ({
            gpa: sem.gpa,
            totalCredits: sem.total_credits,
          }))
        );
        set({ semesters: cachedSemesters, cgpa, isLoading: false, error: 'Using cached data (offline)' });
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to fetch semesters';
      set({ error: message, isLoading: false });
    }
  },

  addSemester: async (data: SemesterFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { data: semester, error } = await supabase
        .from('semesters')
        .insert({
          ...data,
          user_id: user.id,
          gpa: null,
          total_credits: 0,
        })
        .select()
        .single();

      if (error) throw error;

      const newSemester: SemesterWithCourses = { ...semester, courses: [] };
      set((state) => ({
        semesters: [...state.semesters, newSemester].sort(
          (a, b) => a.semester_number - b.semester_number
        ),
      }));

      return { id: semester.id };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  updateSemester: async (id: string, data: Partial<SemesterFormData>) => {
    try {
      const { error } = await supabase
        .from('semesters')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        semesters: state.semesters.map((sem) =>
          sem.id === id ? { ...sem, ...data } : sem
        ),
      }));

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  deleteSemester: async (id: string) => {
    try {
      const { error } = await supabase.from('semesters').delete().eq('id', id);

      if (error) throw error;

      set((state) => {
        const newSemesters = state.semesters.filter((sem) => sem.id !== id);
        const cgpa = calculateCGPA(
          newSemesters.map((sem) => ({
            gpa: sem.gpa,
            totalCredits: sem.total_credits,
          }))
        );
        return { semesters: newSemesters, cgpa };
      });

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  addCourse: async (semesterId: string, data: CourseFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      let calculatedFields: Partial<Course> = {};
      if (data.ia_score !== null && data.ue_score !== null) {
        const result = calculateCourseGrade(
          data.ia_score,
          data.ia_max,
          data.ue_score,
          data.ue_max
        );
        if (result) {
          calculatedFields = {
            total_score: data.ia_score + data.ue_score,
            percentage: result.percentage,
            grade: result.grade,
            grade_points: result.gradePoints,
          };
        }
      }

      const { data: course, error } = await supabase
        .from('courses')
        .insert({
          ...data,
          ...calculatedFields,
          semester_id: semesterId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        semesters: state.semesters.map((sem) =>
          sem.id === semesterId
            ? { ...sem, courses: [...sem.courses, course] }
            : sem
        ),
      }));

      await get().recalculateSemesterGPA(semesterId);

      return { id: course.id };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  updateCourse: async (courseId: string, data: CourseFormData) => {
    try {
      let calculatedFields: Partial<Course> = {};
      if (data.ia_score !== null && data.ue_score !== null) {
        const result = calculateCourseGrade(
          data.ia_score,
          data.ia_max,
          data.ue_score,
          data.ue_max
        );
        if (result) {
          calculatedFields = {
            total_score: data.ia_score + data.ue_score,
            percentage: result.percentage,
            grade: result.grade,
            grade_points: result.gradePoints,
          };
        }
      }

      const { data: updatedCourse, error } = await supabase
        .from('courses')
        .update({
          ...data,
          ...calculatedFields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;

      const semesterId = updatedCourse.semester_id;
      set((state) => ({
        semesters: state.semesters.map((sem) =>
          sem.id === semesterId
            ? {
                ...sem,
                courses: sem.courses.map((c) =>
                  c.id === courseId ? updatedCourse : c
                ),
              }
            : sem
        ),
      }));

      await get().recalculateSemesterGPA(semesterId);

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  deleteCourse: async (courseId: string) => {
    try {
      const course = get().getCourse(courseId);
      if (!course) return { error: 'Course not found' };

      const semesterId = course.semester_id;

      const { error } = await supabase.from('courses').delete().eq('id', courseId);

      if (error) throw error;

      set((state) => ({
        semesters: state.semesters.map((sem) =>
          sem.id === semesterId
            ? { ...sem, courses: sem.courses.filter((c) => c.id !== courseId) }
            : sem
        ),
      }));

      await get().recalculateSemesterGPA(semesterId);

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },

  getSemester: (id: string) => {
    return get().semesters.find((sem) => sem.id === id);
  },

  getCourse: (id: string) => {
    for (const semester of get().semesters) {
      const course = semester.courses.find((c) => c.id === id);
      if (course) return course;
    }
    return undefined;
  },

  getAnalytics: () => {
    const { semesters, cgpa } = get();

    const allCourses = semesters.flatMap((sem) => sem.courses);
    const totalCredits = allCourses.reduce((sum, c) => sum + c.credit_hours, 0);
    const totalCourses = allCourses.length;

    const gradeDistribution: Record<string, number> = {};
    allCourses.forEach((course) => {
      if (course.grade) {
        gradeDistribution[course.grade] = (gradeDistribution[course.grade] || 0) + 1;
      }
    });

    const gpaHistory = semesters
      .filter((sem) => sem.gpa !== null)
      .map((sem) => ({
        semester: sem.semester_number,
        gpa: sem.gpa!,
      }));

    const creditsPerSemester = semesters.map((sem) => ({
      semester: sem.semester_number,
      credits: sem.total_credits,
    }));

    const gpas = semesters.map((sem) => sem.gpa).filter((gpa): gpa is number => gpa !== null);
    const bestGpa = gpas.length > 0 ? Math.max(...gpas) : 0;
    const worstGpa = gpas.length > 0 ? Math.min(...gpas) : 0;

    return {
      cgpa: cgpa || 0,
      totalCredits,
      totalCourses,
      totalSemesters: semesters.length,
      bestGpa,
      worstGpa,
      gradeDistribution,
      gpaHistory,
      creditsPerSemester,
    };
  },

  recalculateSemesterGPA: async (semesterId: string) => {
    const semester = get().getSemester(semesterId);
    if (!semester) return;

    const gpa = calculateGPA(semester.courses);
    const totalCredits = calculateTotalCredits(semester.courses);

    await supabase
      .from('semesters')
      .update({
        gpa,
        total_credits: totalCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', semesterId);

    set((state) => {
      const newSemesters = state.semesters.map((sem) =>
        sem.id === semesterId ? { ...sem, gpa, total_credits: totalCredits } : sem
      );
      const newCgpa = calculateCGPA(
        newSemesters.map((sem) => ({
          gpa: sem.gpa,
          totalCredits: sem.total_credits,
        }))
      );

      saveSemestersLocally(newSemesters);
      return { semesters: newSemesters, cgpa: newCgpa };
    });
  },
}));
