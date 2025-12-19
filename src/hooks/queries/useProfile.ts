import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryClient';
import { saveProfileLocally, loadProfileLocally, isOnline } from '../../lib/offline';
import { useAuthStore } from '../../store/authStore';
import type { Profile, ProfileFormData, Preferences } from '../../types';

export function useProfile() {
  const { user } = useAuthStore();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.profile(userId || ''),
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;

      const online = await isOnline();

      if (!online) {
        const cached = await loadProfileLocally();
        if (cached) return cached;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        await saveProfileLocally(data);
      }

      return data;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user, fetchProfile } = useAuthStore();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (data: Partial<ProfileFormData>): Promise<Profile> => {
      if (!userId) throw new Error('Not authenticated');

      const { data: profile, error } = await supabase
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return profile;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.profile(userId || '') });

      const previousProfile = queryClient.getQueryData<Profile>(
        queryKeys.profile(userId || '')
      );

      queryClient.setQueryData<Profile | null>(
        queryKeys.profile(userId || ''),
        (old) => (old ? { ...old, ...newData } : null)
      );

      return { previousProfile };
    },
    onError: (error, _, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKeys.profile(userId || ''), context.previousProfile);
      }
    },
    onSuccess: async (profile) => {
      await saveProfileLocally(profile);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId || '') });
      await fetchProfile();

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been saved',
        position: 'top',
      });
    },
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  const { user, fetchProfile } = useAuthStore();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (data: Partial<Profile>): Promise<Profile> => {
      if (!userId) throw new Error('Not authenticated');

      const newProfile: Partial<Profile> = {
        id: userId,
        full_name: data.full_name || user?.user_metadata?.full_name || null,
        avatar_url: data.avatar_url || user?.user_metadata?.avatar_url || null,
        university: data.university || 'ISBAT University',
        country: data.country || 'Uganda',
        ...data,
      };

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) throw error;
      return profile;
    },
    onSuccess: async (profile) => {
      await saveProfileLocally(profile);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId || '') });
      await fetchProfile();
    },
  });
}

export function usePreferences() {
  const { user } = useAuthStore();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.preferences(userId || ''),
    queryFn: async (): Promise<Preferences | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (data: Partial<Preferences>): Promise<Preferences> => {
      if (!userId) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) {
        const { data: preferences, error } = await supabase
          .from('preferences')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return preferences;
      } else {
        const { data: preferences, error } = await supabase
          .from('preferences')
          .insert({ ...data, user_id: userId })
          .select()
          .single();

        if (error) throw error;
        return preferences;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences(userId || '') });
    },
  });
}
