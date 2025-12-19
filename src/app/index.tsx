import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing, Layout } from '../constants/spacing';
import { Text } from '../components/ui';
import { useAuthStore } from '../store/authStore';

export default function SplashScreen() {
  const router = useRouter();
  const { status, isProfileComplete } = useAuthStore();

  useEffect(() => {
    if (status === 'loading') return;

    const timer = setTimeout(() => {
      if (status === 'unauthenticated') {
        router.replace('/(auth)/onboarding');
      } else if (status === 'authenticated') {
        if (isProfileComplete) {
          router.replace('/(tabs)');
        } else {
          router.replace('/profile-setup');
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [status, isProfileComplete]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background.app, Colors.background.subtle]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[Colors.primary.main, Colors.primary.dark]}
            style={styles.logoBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="bar-chart-2" size={60} color={Colors.white} />
          </LinearGradient>
        </View>

        <Text variant="h1" style={styles.title}>
          CGPA Tracker
        </Text>
        <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
          Your Academic Journey, Simplified
        </Text>
      </View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary.main} />
        <Text variant="caption" color="tertiary" style={styles.version}>
          Version 1.0.0
        </Text>
      </View>
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
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoBackground: {
    width: Layout.avatarSize.xlarge,
    height: Layout.avatarSize.xlarge,
    borderRadius: Layout.avatarSize.xlarge / 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    marginTop: Spacing.sm,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  version: {
    marginTop: Spacing.md,
  },
});
