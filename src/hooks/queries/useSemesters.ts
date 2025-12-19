import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import { calculateGPA, calculateCGPA, calculateTotalCredits } from '../../lib/calculations';
import { saveSemestersLocally, loadSemestersLocally, isOnline } from '../../lib/offline';
import { useAuthStore } from '../../store/authStore';
import type { SemesterWithCourses, SemesterFormData, Course } from '../../types';

export function useSemesters() {
  const { user } = useAuthStore();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.semesters(userId || ''),
    queryFn: async (): Promise<SemesterWithCourses[]> => {
      if (!userId) return [];

      const online = await isOnline();

      if (!online) {
        const cached = await loadSemestersLocally();
        if (cached) return cached;
      }

      const { data: semesters, error: semesterError } = await supabase
        .from('semesters')
        .select('*')
        .eq('user_id', userId)
        .order('semester_number', { ascending: true });

      if (semesterError) throw semesterError;

      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (courseError) throw courseError;

      const semestersWithCourses: SemesterWithCourses[] = (semesters || []).map((semester) => ({
        ...semester,
        courses: (courses || []).filter((course) => course.semester_id === semester.id),
      }));

      await saveSemestersLocally(semestersWithCourses);
      return semestersWithCourses;
    },
    enabled: !!userId,
  });
}

export function useSemester(semesterId: string) {
  const { user } = useAuthStore();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.semester(semesterId),
    queryFn: async (): Promise<SemesterWithCourses | null> => {
      if (!userId || !semesterId) return null;

      const { data: semester, error: semesterError } = await supabase
        .from('semesters')
        .select('*')
        .eq('id', semesterId)
        .single();

      if (semesterError) throw semesterError;

      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('semester_id', semesterId)
        .order('created_at', { ascending: true });

      if (courseError) throw courseError;

      return { ...semester, courses: courses || [] };
    },
    enabled: !!userId && !!semesterId,
  });
}

export function useCreateSemester() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (data: SemesterFormData): Promise<SemesterWithCourses> => {
      if (!userId) throw new Error('Not authenticated');

      const { data: semester, error } = await supabase
        .from('semesters')
        .insert({
          ...data,
          user_id: userId,
          gpa: null,
          total_credits: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...semester, courses: [] };
    },
    onMutate: async (newSemester) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.semesters(userId || '') });

      const previousSemesters = queryClient.getQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || '')
      );

      const optimisticSemester: SemesterWithCourses = {
        id: `temp-${Date.now()}`,
        user_id: userId || '',
        semester_number: newSemester.semester_number,
        name: newSemester.name || null,
        start_date: newSemester.start_date,
        end_date: newSemester.end_date,
        gpa: null,
        total_credits: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        courses: [],
      };

      queryClient.setQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || ''),
        (old) => [...(old || []), optimisticSemester].sort((a, b) => a.semester_number - b.semester_number)
      );

      return { previousSemesters };
    },
    onError: (error, _, context) => {
      if (context?.previousSemesters) {
        queryClient.setQueryData(queryKeys.semesters(userId || ''), context.previousSemesters);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters(userId || '') });
      Toast.show({
        type: 'success',
        text1: 'Semester Created',
        text2: 'Your semester has been added successfully',
        position: 'top',
      });
    },
  });
}

export function useUpdateSemester() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SemesterFormData> }) => {
      const { error } = await supabase
        .from('semesters')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.semesters(userId || '') });
      await queryClient.cancelQueries({ queryKey: queryKeys.semester(id) });

      const previousSemesters = queryClient.getQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || '')
      );

      queryClient.setQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || ''),
        (old) => old?.map((sem) => (sem.id === id ? { ...sem, ...data } : sem))
      );

      return { previousSemesters };
    },
    onError: (error, _, context) => {
      if (context?.previousSemesters) {
        queryClient.setQueryData(queryKeys.semesters(userId || ''), context.previousSemesters);
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters(userId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.semester(id) });
    },
  });
}

export function useDeleteSemester() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('semesters').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.semesters(userId || '') });

      const previousSemesters = queryClient.getQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || '')
      );

      queryClient.setQueryData<SemesterWithCourses[]>(
        queryKeys.semesters(userId || ''),
        (old) => old?.filter((sem) => sem.id !== id)
      );

      return { previousSemesters };
    },
    onError: (error, _, context) => {
      if (context?.previousSemesters) {
        queryClient.setQueryData(queryKeys.semesters(userId || ''), context.previousSemesters);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters(userId || '') });
      Toast.show({
        type: 'success',
        text1: 'Semester Deleted',
        text2: 'The semester has been removed',
        position: 'top',
      });
    },
  });
}

export function useCGPA() {
  const { data: semesters } = useSemesters();

  const cgpa = semesters
    ? calculateCGPA(
        semesters.map((sem) => ({
          gpa: sem.gpa,
          totalCredits: sem.total_credits,
        }))
      )
    : null;

  return cgpa;
}

export function useRecalculateSemesterGPA() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (semesterId: string) => {
      const semester = queryClient.getQueryData<SemesterWithCourses>(
        queryKeys.semester(semesterId)
      );

      if (!semester) {
        const semesters = queryClient.getQueryData<SemesterWithCourses[]>(
          queryKeys.semesters(userId || '')
        );
        const found = semesters?.find((s) => s.id === semesterId);
        if (!found) return;

        const gpa = calculateGPA(found.courses);
        const totalCredits = calculateTotalCredits(found.courses);

        await supabase
          .from('semesters')
          .update({ gpa, total_credits: totalCredits, updated_at: new Date().toISOString() })
          .eq('id', semesterId);

        return { gpa, totalCredits };
      }

      const gpa = calculateGPA(semester.courses);
      const totalCredits = calculateTotalCredits(semester.courses);

      await supabase
        .from('semesters')
        .update({ gpa, total_credits: totalCredits, updated_at: new Date().toISOString() })
        .eq('id', semesterId);

      return { gpa, totalCredits };
    },
    onSuccess: (_, semesterId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.semesters(userId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.semester(semesterId) });
    },
  });
}
