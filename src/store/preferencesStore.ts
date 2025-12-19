import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Preferences } from '../types';

interface PreferencesState {
  preferences: Preferences | null;
  isLoading: boolean;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (data: Partial<Preferences>) => Promise<{ error?: string }>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: null,
  isLoading: false,

  fetchPreferences: async () => {
    set({ isLoading: true });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        set({ preferences: data, isLoading: false });
      } else {
        const defaultPrefs: Partial<Preferences> = {
          user_id: user.id,
          default_ia_max: 30,
          default_ue_max: 70,
          notifications_enabled: true,
          haptic_enabled: true,
        };

        const { data: newPrefs, error: createError } = await supabase
          .from('preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (createError) throw createError;

        set({ preferences: newPrefs, isLoading: false });
      }
    } catch (error) {
      console.error('Fetch preferences error:', error);
      set({ isLoading: false });
    }
  },

  updatePreferences: async (data: Partial<Preferences>) => {
    const { preferences } = get();
    if (!preferences) return { error: 'Preferences not loaded' };

    try {
      const { data: updated, error } = await supabase
        .from('preferences')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('user_id', preferences.user_id)
        .select()
        .single();

      if (error) throw error;

      set({ preferences: updated });
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  },
}));
