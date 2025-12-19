import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  signInWithEmail as authSignInWithEmail,
  signUpWithEmail as authSignUpWithEmail,
} from '../lib/auth';
import type { AuthStatus, Profile } from '../types';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isProfileComplete: boolean;
  isInitialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error?: string }>;
  setSession: (session: Session | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  session: null,
  user: null,
  profile: null,
  isProfileComplete: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (session) {
        set({
          session,
          user: session.user,
          status: 'authenticated',
        });
        await get().fetchProfile();
      } else {
        set({ status: 'unauthenticated' });
      }

      supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (event === 'SIGNED_IN' && session) {
            set({
              session,
              user: session.user,
              status: 'authenticated',
              error: null,
            });
            await get().fetchProfile();
          } else if (event === 'SIGNED_OUT') {
            set({
              session: null,
              user: null,
              profile: null,
              status: 'unauthenticated',
              isProfileComplete: false,
              error: null,
            });
          } else if (event === 'TOKEN_REFRESHED' && session) {
            set({ session, user: session.user });
          } else if (event === 'USER_UPDATED' && session) {
            set({ session, user: session.user });
            await get().fetchProfile();
          }
        }
      );

      set({ isInitialized: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      set({ status: 'unauthenticated', error: message, isInitialized: true });
    }
  },

  signInWithGoogle: async () => {
    set({ error: null });
    const result = await authSignInWithGoogle();
    if (result.error) {
      set({ error: result.error });
    }
    return result;
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ error: null });
    const result = await authSignInWithEmail(email, password);
    if (result.error) {
      set({ error: result.error });
    }
    return result;
  },

  signUpWithEmail: async (email: string, password: string, username: string) => {
    set({ error: null });
    const result = await authSignUpWithEmail(email, password, username);
    if (result.error) {
      set({ error: result.error });
    }
    return result;
  },

  signOut: async () => {
    try {
      set({ error: null });
      await authSignOut();
      set({
        session: null,
        user: null,
        profile: null,
        status: 'unauthenticated',
        isProfileComplete: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out';
      set({ error: message });
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const isComplete = !!(
          data.full_name &&
          data.full_name.trim().length > 0 &&
          data.university &&
          data.program
        );
        set({ profile: data, isProfileComplete: isComplete });
      } else {
        const newProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          university: 'ISBAT University',
          country: 'Uganda',
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .upsert(newProfile, { onConflict: 'id' })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        if (createdProfile) {
          const isComplete = !!(
            createdProfile.full_name &&
            createdProfile.full_name.trim().length > 0 &&
            createdProfile.university &&
            createdProfile.program
          );
          set({ profile: createdProfile, isProfileComplete: isComplete });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profile';
      set({ error: message });
    }
  },

  updateProfile: async (data: Partial<Profile>) => {
    const { user, profile } = get();
    if (!user) return { error: 'Not authenticated' };

    const previousProfile = profile;

    try {
      const optimisticProfile = { ...profile, ...data } as Profile;
      const isComplete = !!(
        optimisticProfile.full_name &&
        optimisticProfile.full_name.trim().length > 0 &&
        optimisticProfile.university &&
        optimisticProfile.program
      );
      set({ profile: optimisticProfile, isProfileComplete: isComplete });

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const serverIsComplete = !!(
        updatedProfile.full_name &&
        updatedProfile.full_name.trim().length > 0 &&
        updatedProfile.university &&
        updatedProfile.program
      );

      set({ profile: updatedProfile, isProfileComplete: serverIsComplete });
      return {};
    } catch (error) {
      set({ profile: previousProfile });
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      return { error: message };
    }
  },

  setSession: (session: Session | null) => {
    if (session) {
      set({
        session,
        user: session.user,
        status: 'authenticated',
      });
    } else {
      set({
        session: null,
        user: null,
        status: 'unauthenticated',
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
