import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuthStore } from '../store/authStore';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName = 'semesters' | 'courses' | 'profiles' | 'preferences';

interface UseRealtimeOptions {
  tables?: TableName[];
}

export function useRealtimeSubscription(options: UseRealtimeOptions = {}) {
  const { tables = ['semesters', 'courses', 'profiles', 'preferences'] } = options;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('db-changes')
      .on<Record<string, unknown>>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'semesters',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (tables.includes('semesters')) {
            queryClient.invalidateQueries({ queryKey: queryKeys.semesters(userId) });
          }
        }
      )
      .on<Record<string, unknown>>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (tables.includes('courses')) {
            queryClient.invalidateQueries({ queryKey: queryKeys.semesters(userId) });
            const semesterId = payload.new && 'semester_id' in payload.new
              ? payload.new.semester_id as string
              : payload.old && 'semester_id' in payload.old
                ? payload.old.semester_id as string
                : null;
            if (semesterId) {
              queryClient.invalidateQueries({ queryKey: queryKeys.semester(semesterId) });
              queryClient.invalidateQueries({ queryKey: queryKeys.courses(semesterId) });
            }
          }
        }
      )
      .on<Record<string, unknown>>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        () => {
          if (tables.includes('profiles')) {
            queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
          }
        }
      )
      .on<Record<string, unknown>>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'preferences',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          if (tables.includes('preferences')) {
            queryClient.invalidateQueries({ queryKey: queryKeys.preferences(userId) });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, tables]);
}

export function useSemestersRealtime() {
  useRealtimeSubscription({ tables: ['semesters', 'courses'] });
}

export function useProfileRealtime() {
  useRealtimeSubscription({ tables: ['profiles', 'preferences'] });
}
