import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius, Layout } from '../constants/spacing';
import { Text, Button, Input, Card } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { validateProfile, sanitizeString } from '../lib/validation';
import type { ProfileFormData } from '../types';

const COUNTRIES = ['Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'Other'];
const PROGRAMS = [
  'Diploma in Software Engineering',
  'Bachelor in Software Engineering',
  'Diploma in Information Technology',
  'Bachelor in Information Technology',
  'Other',
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { profile, user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: profile?.full_name || user?.user_metadata?.full_name || '',
    university: profile?.university || 'ISBAT University',
    program: profile?.program || '',
    country: profile?.country || 'Uganda',
    student_id: profile?.student_id || '',
    start_year: profile?.start_year || new Date().getFullYear(),
  });

  const handleSave = async () => {
    const validationResult = validateProfile(formData);
    if (!validationResult.isValid) {
      const firstError = Object.values(validationResult.errors)[0];
      Alert.alert('Validation Error', firstError);
      return;
    }

    setIsLoading(true);
    try {
      const sanitizedData = {
        ...formData,
        full_name: sanitizeString(formData.full_name),
        university: sanitizeString(formData.university),
        student_id: formData.student_id ? sanitizeString(formData.student_id) : '',
      };
      const result = await updateProfile(sanitizedData);
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={[Colors.primary.main, Colors.primary.light]}
            style={[styles.progressFill, { width: '100%' }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>

      <View style={styles.header}>
        <Text variant="h2">Profile Setup</Text>
        <Text variant="bodySmall" color="secondary">
          Complete your profile to get started
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={40} color={Colors.text.tertiary} />
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text variant="bodySmall" color="teal">
              Change Photo
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={formData.full_name}
            onChangeText={(text) =>
              setFormData({ ...formData, full_name: text })
            }
            placeholder="Enter your full name"
            icon="user"
          />

          <Input
            label="University"
            value={formData.university}
            onChangeText={(text) =>
              setFormData({ ...formData, university: text })
            }
            placeholder="ISBAT University"
            icon="home"
          />

          <View style={styles.inputContainer}>
            <Text variant="caption" color="secondary" style={styles.label}>
              Program
            </Text>
            <View style={styles.selectContainer}>
              {PROGRAMS.map((program) => (
                <TouchableOpacity
                  key={program}
                  style={[
                    styles.selectOption,
                    formData.program === program && styles.selectOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, program })}
                >
                  <Text
                    variant="bodySmall"
                    color={formData.program === program ? 'teal' : 'secondary'}
                  >
                    {program}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text variant="caption" color="secondary" style={styles.label}>
              Country
            </Text>
            <View style={styles.countryRow}>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country}
                  style={[
                    styles.countryChip,
                    formData.country === country && styles.countryChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, country })}
                >
                  <Text
                    variant="bodySmall"
                    color={formData.country === country ? 'primary' : 'secondary'}
                  >
                    {country}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Student ID (Optional)"
            value={formData.student_id}
            onChangeText={(text) =>
              setFormData({ ...formData, student_id: text })
            }
            placeholder="e.g., ISB/2023/001"
            icon="credit-card"
          />

          <Input
            label="Start Year"
            value={formData.start_year.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, start_year: parseInt(text) || 2024 })
            }
            placeholder="2024"
            icon="calendar"
            keyboardType="number-pad"
          />
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <Button
          title="Complete Setup"
          onPress={handleSave}
          loading={isLoading}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.app,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.background.elevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: Layout.avatarSize.large,
    height: Layout.avatarSize.large,
    borderRadius: Layout.avatarSize.large / 2,
    borderWidth: 3,
    borderColor: Colors.primary.main,
  },
  avatarPlaceholder: {
    width: Layout.avatarSize.large,
    height: Layout.avatarSize.large,
    borderRadius: Layout.avatarSize.large / 2,
    backgroundColor: Colors.background.surface,
    borderWidth: 2,
    borderColor: Colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    padding: Spacing.xs,
  },
  form: {
    gap: Spacing.xs,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  selectContainer: {
    gap: Spacing.sm,
  },
  selectOption: {
    padding: Spacing.md,
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  selectOptionActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.veryDark,
  },
  countryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  countryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  countryChipActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.veryDark,
  },
  bottomSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background.app,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.divider,
  },
});
