import { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Layout } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { Text, Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail } = useAuthStore();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        Alert.alert('Sign In Error', result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsEmailLoading(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.error) {
        Alert.alert('Sign In Error', result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const navigateToSignUp = () => {
    router.push('/(auth)/signup');
  };

  const isLoading = isGoogleLoading || isEmailLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[Colors.background.subtle, Colors.background.app]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formSection}>
          <Text variant="h1" style={styles.welcomeTitle}>
            Sign In
          </Text>
          <Text variant="body" color="secondary" center style={styles.subtitle}>
            Welcome back! Sign in to continue
          </Text>

          <View style={styles.inputContainer}>
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />

            <View style={styles.passwordContainer}>
              <Input
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                icon="lock"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={Colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Sign In"
            onPress={handleEmailSignIn}
            loading={isEmailLoading}
            disabled={isLoading}
            fullWidth
            icon="log-in"
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text variant="caption" color="tertiary" style={styles.dividerText}>
              or continue with
            </Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, Shadows.level2]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isGoogleLoading ? (
              <View style={styles.loadingContainer}>
                <Text variant="body" color="secondary">
                  Signing in...
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Feather name="user" size={20} color={Colors.text.primary} />
                </View>
                <Text variant="body" style={styles.googleButtonText}>
                  Sign in with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text variant="body" color="secondary">
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={navigateToSignUp} disabled={isLoading}>
              <Text variant="body" style={styles.signUpLink}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.termsContainer}>
          <Text variant="caption" color="tertiary" center>
            By continuing, you agree to our{' '}
          </Text>
          <View style={styles.termsLinks}>
            <TouchableOpacity>
              <Text variant="caption" color="secondary" style={styles.link}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <Text variant="caption" color="tertiary">
              {' '}and{' '}
            </Text>
            <TouchableOpacity>
              <Text variant="caption" color="secondary" style={styles.link}>
                Terms of Service
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.app,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 120,
    paddingBottom: Spacing.xl,
  },
  formSection: {
    flex: 1,
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.ui.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.surface,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    borderRadius: BorderRadius.medium,
    height: Layout.buttonHeightLarge,
    paddingHorizontal: Spacing.md,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: Colors.text.primary,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  signUpLink: {
    color: Colors.primary.main,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  termsLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  link: {
    textDecorationLine: 'underline',
  },
});
