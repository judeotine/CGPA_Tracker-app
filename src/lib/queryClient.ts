import { QueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

function handleError(error: unknown): void {
  const message = error instanceof Error ? error.message : 'An error occurred';
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    position: 'top',
    visibilityTime: 4000,
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
      onError: handleError,
    },
  },
});

export const queryKeys = {
  semesters: (userId: string) => ['semesters', userId] as const,
  semester: (semesterId: string) => ['semester', semesterId] as const,
  courses: (semesterId: string) => ['courses', semesterId] as const,
  course: (courseId: string) => ['course', courseId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  cgpa: (userId: string) => ['cgpa', userId] as const,
  preferences: (userId: string) => ['preferences', userId] as const,
  analytics: (userId: string) => ['analytics', userId] as const,
} as const;
