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
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Layout } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { Text, Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle } = useAuthStore();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (username.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsEmailLoading(true);
    try {
      const result = await signUpWithEmail(email, password, username);
      if (result.error) {
        Alert.alert('Sign Up Error', result.error);
      } else {
        Alert.alert(
          'Account Created',
          'Your account has been created successfully. You can now sign in.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setIsEmailLoading(false);
    }
  };

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

  const navigateToLogin = () => {
    router.back();
  };

  const isLoading = isEmailLoading || isGoogleLoading;

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={navigateToLogin}
          disabled={isLoading}
        >
          <Feather name="arrow-left" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.formSection}>
          <Text variant="h1" style={styles.title}>
            Create Account
          </Text>
          <Text variant="body" color="secondary" center style={styles.subtitle}>
            Join us and start tracking your grades
          </Text>
          <View style={styles.inputContainer}>
            <Input
              placeholder="Full Name"
              value={username}
              onChangeText={setUsername}
              icon="user"
              autoCapitalize="words"
              autoComplete="name"
              editable={!isLoading}
            />

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
                autoComplete="new-password"
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

            <View style={styles.passwordContainer}>
              <Input
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                icon="lock"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <Feather
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={Colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={isEmailLoading}
            disabled={isLoading}
            fullWidth
            icon="user-plus"
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
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <Text variant="body" color="secondary">
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
              <Text variant="body" style={styles.signInLink}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.termsContainer}>
          <Text variant="caption" color="tertiary" center>
            By creating an account, you agree to our{' '}
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  formSection: {
    flex: 1,
  },
  title: {
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
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  signInLink: {
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
