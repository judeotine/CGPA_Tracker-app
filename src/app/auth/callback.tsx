import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Text } from '../../components/ui';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  }>();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      if (params.error) {
        throw new Error(params.error_description || params.error);
      }

      if (params.access_token && params.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });

        if (error) throw error;
      }

      router.replace('/');
    } catch (error) {
      console.error('Auth callback error:', error);
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary.main} />
      <Text variant="body" color="secondary" style={styles.text}>
        Completing sign in...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.app,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: Spacing.lg,
  },
});
