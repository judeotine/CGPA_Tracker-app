import { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, getGradeColor } from '../../constants/colors';
import { Spacing, BorderRadius, Layout } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { Text, Button, Input, Card, GradeBadge } from '../../components/ui';
import { useSemester, useCreateCourse, usePreferences } from '../../hooks/queries';
import { calculateCourseGrade, formatGPA, validateCourseScores } from '../../lib/calculations';
import { validateCourse, sanitizeString, parseNumber } from '../../lib/validation';
import type { CourseFormData } from '../../types';

export default function AddCourseScreen() {
  const { semesterId } = useLocalSearchParams<{ semesterId: string }>();
  const router = useRouter();
  const { data: semester } = useSemester(semesterId || '');
  const { data: preferences } = usePreferences();
  const createCourseMutation = useCreateCourse();

  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    credit_hours: 4,
    ia_score: null,
    ia_max: preferences?.default_ia_max || 30,
    ue_score: null,
    ue_max: preferences?.default_ue_max || 70,
  });

  const preview = useMemo(() => {
    if (formData.ia_score === null || formData.ue_score === null) {
      return null;
    }
    return calculateCourseGrade(
      formData.ia_score,
      formData.ia_max,
      formData.ue_score,
      formData.ue_max
    );
  }, [formData]);

  const totalScore = formData.ia_score !== null && formData.ue_score !== null
    ? formData.ia_score + formData.ue_score
    : null;

  const totalMax = formData.ia_max + formData.ue_max;

  const handleSave = () => {
    const validationResult = validateCourse(formData);
    if (!validationResult.isValid) {
      const firstError = Object.values(validationResult.errors)[0];
      Alert.alert('Validation Error', firstError);
      return;
    }

    if (formData.ia_score !== null || formData.ue_score !== null) {
      const scoreValidation = validateCourseScores(
        formData.ia_score,
        formData.ia_max,
        formData.ue_score,
        formData.ue_max
      );
      if (!scoreValidation.valid) {
        Alert.alert('Validation Error', scoreValidation.errors[0]);
        return;
      }
    }

    const sanitizedData: CourseFormData = {
      ...formData,
      name: sanitizeString(formData.name),
    };

    createCourseMutation.mutate(
      { semesterId: semesterId || '', data: sanitizedData },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  };

  const handleClose = () => {
    router.back();
  };

  const updateScore = (field: 'ia_score' | 'ue_score', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setFormData({ ...formData, [field]: numValue });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text variant="h3">Add Course</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={createCourseMutation.isPending || !formData.name.trim()}
          style={styles.saveButton}
        >
          <Text
            variant="body"
            weight="semibold"
            color={formData.name.trim() ? 'teal' : 'tertiary'}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="tiny" color="tertiary" uppercase style={styles.sectionLabel}>
          Course Details
        </Text>

        <Input
          label="Course Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="e.g., Programming in C"
          icon="book"
        />

        <View style={styles.inputGroup}>
          <Text variant="caption" color="secondary" style={styles.label}>
            Credit Hours
          </Text>
          <View style={styles.numberPicker}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() =>
                setFormData({
                  ...formData,
                  credit_hours: Math.max(1, formData.credit_hours - 1),
                })
              }
            >
              <Feather name="minus" size={20} color={Colors.primary.main} />
            </TouchableOpacity>
            <Text variant="h2" style={styles.numberValue}>
              {formData.credit_hours}
            </Text>
            <TouchableOpacity
              style={[styles.numberButton, styles.numberButtonFilled]}
              onPress={() =>
                setFormData({
                  ...formData,
                  credit_hours: formData.credit_hours + 1,
                })
              }
            >
              <Feather name="plus" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionDivider} />
        <Text variant="tiny" color="tertiary" uppercase style={styles.sectionLabel}>
          Internal Assessment (IA)
        </Text>

        <View style={styles.marksRow}>
          <View style={styles.marksInput}>
            <Text variant="caption" color="secondary" style={styles.label}>
              Marks Scored
            </Text>
            <View style={styles.largeInput}>
              <Input
                value={formData.ia_score?.toString() || ''}
                onChangeText={(text) => updateScore('ia_score', text)}
                placeholder="0"
                keyboardType="decimal-pad"
                containerStyle={styles.inputContainer}
              />
            </View>
          </View>
          <View style={styles.marksInput}>
            <Text variant="caption" color="secondary" style={styles.label}>
              Out of
            </Text>
            <Input
              value={formData.ia_max.toString()}
              onChangeText={(text) =>
                setFormData({ ...formData, ia_max: parseFloat(text) || 30 })
              }
              placeholder="30"
              keyboardType="decimal-pad"
              containerStyle={styles.inputContainer}
            />
          </View>
        </View>

        {formData.ia_score !== null && (
          <View style={styles.percentageRow}>
            <Text variant="caption" color="secondary">
              {formData.ia_score} / {formData.ia_max}
            </Text>
            <Text variant="caption" color="teal">
              {((formData.ia_score / formData.ia_max) * 100).toFixed(1)}%
            </Text>
          </View>
        )}

        <View style={styles.sectionDivider} />
        <Text variant="tiny" color="tertiary" uppercase style={styles.sectionLabel}>
          University Examination (UE)
        </Text>

        <View style={styles.marksRow}>
          <View style={styles.marksInput}>
            <Text variant="caption" color="secondary" style={styles.label}>
              Marks Scored
            </Text>
            <View style={styles.largeInput}>
              <Input
                value={formData.ue_score?.toString() || ''}
                onChangeText={(text) => updateScore('ue_score', text)}
                placeholder="0"
                keyboardType="decimal-pad"
                containerStyle={styles.inputContainer}
              />
            </View>
          </View>
          <View style={styles.marksInput}>
            <Text variant="caption" color="secondary" style={styles.label}>
              Out of
            </Text>
            <Input
              value={formData.ue_max.toString()}
              onChangeText={(text) =>
                setFormData({ ...formData, ue_max: parseFloat(text) || 70 })
              }
              placeholder="70"
              keyboardType="decimal-pad"
              containerStyle={styles.inputContainer}
            />
          </View>
        </View>

        {formData.ue_score !== null && (
          <View style={styles.percentageRow}>
            <Text variant="caption" color="secondary">
              {formData.ue_score} / {formData.ue_max}
            </Text>
            <Text variant="caption" color="teal">
              {((formData.ue_score / formData.ue_max) * 100).toFixed(1)}%
            </Text>
          </View>
        )}

        <View style={{ height: 200 }} />
      </ScrollView>

      <View style={[styles.previewCard, Shadows.level3]}>
        <LinearGradient
          colors={[Colors.background.subtle, Colors.background.surface]}
          style={styles.previewGradient}
        >
          <Text variant="tiny" color="tertiary" uppercase>
            Preview
          </Text>

          <View style={styles.previewContent}>
            <View style={styles.previewLeft}>
              <Text variant="h3" weight="bold">
                {totalScore !== null ? `${totalScore} / ${totalMax}` : '-- / --'}
              </Text>
              <Text variant="caption" color="secondary">
                {preview ? `${preview.percentage.toFixed(1)}%` : '--%'}
              </Text>
            </View>

            <View style={styles.previewRight}>
              {preview ? (
                <GradeBadge grade={preview.grade} size="large" />
              ) : (
                <View style={styles.gradePlaceholder}>
                  <Text variant="h2" color="tertiary">
                    --
                  </Text>
                </View>
              )}
              <Text variant="caption" color="secondary" style={styles.gradePoints}>
                {preview ? `${preview.gradePoints.toFixed(1)} points` : '-- points'}
              </Text>
            </View>
          </View>

          {preview && (
            <Text variant="tiny" color="tertiary" style={styles.contribution}>
              Contributes {(preview.gradePoints * formData.credit_hours).toFixed(1)} grade points
            </Text>
          )}
        </LinearGradient>
      </View>

      <View style={styles.bottomButton}>
        <Button
          title="Save Course"
          onPress={handleSave}
          loading={createCourseMutation.isPending}
          disabled={!formData.name.trim()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  saveButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.ui.divider,
    marginVertical: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  numberPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
  },
  numberButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButtonFilled: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  numberValue: {
    marginHorizontal: Spacing.xl,
  },
  marksRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  marksInput: {
    flex: 1,
  },
  largeInput: {
  },
  inputContainer: {
    marginBottom: 0,
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  previewCard: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    borderTopWidth: 2,
    borderTopColor: Colors.primary.main,
  },
  previewGradient: {
    padding: Spacing.md,
  },
  previewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  previewLeft: {},
  previewRight: {
    alignItems: 'center',
  },
  gradePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradePoints: {
    marginTop: Spacing.xs,
  },
  contribution: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  bottomButton: {
    padding: Spacing.lg,
    paddingBottom: 40,
    backgroundColor: Colors.background.app,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.divider,
  },
});
