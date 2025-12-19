import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URL = Linking.createURL('auth/callback');

export async function signInWithGoogle(): Promise<{ error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: REDIRECT_URL,
        skipBrowserRedirect: Platform.OS !== 'web',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (Platform.OS !== 'web' && data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        REDIRECT_URL,
        {
          showInRecents: true,
          preferEphemeralSession: true,
        }
      );

      if (result.type === 'success') {
        const url = result.url;
        const params = extractParamsFromUrl(url);

        if (params.access_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token || '',
          });

          if (sessionError) {
            return { error: sessionError.message };
          }
        } else if (params.error_description) {
          return { error: decodeURIComponent(params.error_description) };
        }
      } else if (result.type === 'cancel') {
        return { error: 'Sign in was cancelled' };
      } else {
        return { error: 'Sign in failed' };
      }
    }

    return {};
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign in with Google';
    return { error: message };
  }
}

function extractParamsFromUrl(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    const hash = url.substring(hashIndex + 1);
    const pairs = hash.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    }
  }

  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) {
    const query = url.substring(queryIndex + 1).split('#')[0];
    const pairs = query.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    }
  }

  return params;
}

export async function signOut(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return {};
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign out';
    return { error: message };
  }
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    return { session: null, error: error.message };
  }
  return { session, error: null };
}

export async function refreshSession() {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  if (error) {
    return { session: null, error: error.message };
  }
  return { session, error: null };
}

export async function signInWithEmail(email: string, password: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (error.message === 'Invalid login credentials') {
        return { error: 'Invalid email or password' };
      }
      return { error: error.message };
    }

    return {};
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign in';
    return { error: message };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  username: string
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: username.trim(),
          username: username.trim(),
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'An account with this email already exists' };
      }
      return { error: error.message };
    }

    return {};
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create account';
    return { error: message };
  }
}
