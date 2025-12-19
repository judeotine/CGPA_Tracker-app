import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import { calculateCourseGrade, calculateGPA, calculateTotalCredits } from '../../lib/calculations';
import { useAuthStore } from '../../store/authStore';
import type { Course, CourseFormData, SemesterWithCourses } from '../../types';

export function useCourses(semesterId: string) {
  const { user } = useAuthStore();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.courses(semesterId),
    queryFn: async (): Promise<Course[]> => {
      if (!userId || !semesterId) return [];

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('semester_id', semesterId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && !!semesterId,
  });
}

export function useCourse(courseId: string) {
  const { user } = useAuthStore();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.course(courseId),
    queryFn: async (): Promise<Course | null> => {
      if (!userId || !courseId) return null;

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!courseId,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;

  return useMutation({
    mutationFn: async ({ semesterId, data }: { semesterId: string; data: CourseFormData }): Promise<Course> => {
      if (!userId) throw new Error('Not authenticated');

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
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return course;
    },
    onMutate: async ({ semesterId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.semesters(userId || '') });
      await queryClient.cancelQueries({ queryKey: queryKeys.semester(semesterId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.courses(semesterId) });

      const previousSemesters = queryClient.getQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || '')
      );

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

      const optimisticCourse: Course = {
        id: `temp-${Date.now()}`,
        semester_id: semesterId,
        user_id: userId || '',
        name: data.name,
        credit_hours: data.credit_hours,
        ia_score: data.ia_score,
        ia_max: data.ia_max,
        ue_score: data.ue_score,
        ue_max: data.ue_max,
        total_score: calculatedFields.total_score || null,
        percentage: calculatedFields.percentage || null,
        grade: calculatedFields.grade || null,
        grade_points: calculatedFields.grade_points || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || ''),
        (old) =>
          old?.map((sem) =>
            sem.id === semesterId
              ? { ...sem, courses: [...sem.courses, optimisticCourse] }
              : sem
          )
      );

      return { previousSemesters };
    },
    onError: (error, _, context) => {
      if (context?.previousSemesters) {
        queryClient.setQueryData(queryKeys.semesters(userId || ''), context.previousSemesters);
      }
    },
    onSuccess: async (course) => {
      const semesterId = course.semester_id;

      const semesters = queryClient.getQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || '')
      );
      const semester = semesters?.find((s) => s.id === semesterId);

      if (semester) {
        const updatedCourses = [...semester.courses.filter(c => !c.id.startsWith('temp-')), course];
        const gpa = calculateGPA(updatedCourses);
        const totalCredits = calculateTotalCredits(updatedCourses);

        await supabase
          .from('semesters')
          .update({ gpa, total_credits: totalCredits, updated_at: new Date().toISOString() })
          .eq('id', semesterId);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.semesters(userId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.semester(semesterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses(semesterId) });

      Toast.show({
        type: 'success',
        text1: 'Course Added',
        text2: `${course.name} has been added successfully`,
        position: 'top',
      });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;

  return useMutation({
    mutationFn: async ({ courseId, data }: { courseId: string; data: CourseFormData }): Promise<Course> => {
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
        .update({
          ...data,
          ...calculatedFields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return course;
    },
    onSuccess: async (course) => {
      const semesterId = course.semester_id;

      const semesters = queryClient.getQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || '')
      );
      const semester = semesters?.find((s) => s.id === semesterId);

      if (semester) {
        const updatedCourses = semester.courses.map(c => c.id === course.id ? course : c);
        const gpa = calculateGPA(updatedCourses);
        const totalCredits = calculateTotalCredits(updatedCourses);

        await supabase
          .from('semesters')
          .update({ gpa, total_credits: totalCredits, updated_at: new Date().toISOString() })
          .eq('id', semesterId);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.semesters(userId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.semester(semesterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses(semesterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.course(course.id) });

      Toast.show({
        type: 'success',
        text1: 'Course Updated',
        text2: `${course.name} has been updated`,
        position: 'top',
      });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;

  return useMutation({
    mutationFn: async ({ courseId, semesterId }: { courseId: string; semesterId: string }) => {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      return { courseId, semesterId };
    },
    onMutate: async ({ courseId, semesterId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.semesters(userId || '') });

      const previousSemesters = queryClient.getQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || '')
      );

      queryClient.setQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || ''),
        (old) =>
          old?.map((sem) =>
            sem.id === semesterId
              ? { ...sem, courses: sem.courses.filter((c) => c.id !== courseId) }
              : sem
          )
      );

      return { previousSemesters };
    },
    onError: (error, _, context) => {
      if (context?.previousSemesters) {
        queryClient.setQueryData(queryKeys.semesters(userId || ''), context.previousSemesters);
      }
    },
    onSuccess: async ({ semesterId }) => {
      const semesters = queryClient.getQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || '')
      );
      const semester = semesters?.find((s) => s.id === semesterId);

      if (semester) {
        const gpa = calculateGPA(semester.courses);
        const totalCredits = calculateTotalCredits(semester.courses);

        await supabase
          .from('semesters')
          .update({ gpa, total_credits: totalCredits, updated_at: new Date().toISOString() })
          .eq('id', semesterId);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.semesters(userId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.semester(semesterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses(semesterId) });

      Toast.show({
        type: 'success',
        text1: 'Course Deleted',
        text2: 'The course has been removed',
        position: 'top',
      });
    },
  });
}
