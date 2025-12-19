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
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Layout } from '../../constants/spacing';
import { Text, Button, Input, Card } from '../../components/ui';
import { useSemesters, useCreateSemester } from '../../hooks/queries';
import { validateSemester, sanitizeString } from '../../lib/validation';
import type { SemesterFormData } from '../../types';

type AddMode = 'semester' | 'course';

export default function AddScreen() {
  const router = useRouter();
  const { data: semesters = [] } = useSemesters();
  const createSemesterMutation = useCreateSemester();
  const [mode, setMode] = useState<AddMode>('semester');

  const nextSemesterNumber = semesters.length > 0
    ? Math.max(...semesters.map((s) => s.semester_number)) + 1
    : 1;

  const [semesterForm, setSemesterForm] = useState<SemesterFormData>({
    semester_number: nextSemesterNumber,
    name: '',
    start_date: null,
    end_date: null,
  });

  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(
    semesters.length > 0 ? semesters[semesters.length - 1].id : null
  );

  const handleAddSemester = () => {
    const existingSemesterNumbers = semesters.map((s) => s.semester_number);
    const validationResult = validateSemester(semesterForm, existingSemesterNumbers);
    if (!validationResult.isValid) {
      const firstError = Object.values(validationResult.errors)[0];
      Alert.alert('Validation Error', firstError);
      return;
    }

    const sanitizedData: SemesterFormData = {
      ...semesterForm,
      name: semesterForm.name ? sanitizeString(semesterForm.name) : '',
    };

    createSemesterMutation.mutate(sanitizedData, {
      onSuccess: (data) => {
        router.push(`/semester/${data.id}`);
      },
    });
  };

  const handleAddCourse = () => {
    if (!selectedSemesterId) {
      Alert.alert('Select Semester', 'Please select a semester to add a course to');
      return;
    }
    router.push(`/course/add?semesterId=${selectedSemesterId}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text variant="h2">Add New</Text>
        <Text variant="bodySmall" color="secondary">
          Add a semester or course to track
        </Text>
      </View>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'semester' && styles.modeButtonActive]}
          onPress={() => setMode('semester')}
        >
          <Feather
            name="folder-plus"
            size={20}
            color={mode === 'semester' ? Colors.primary.main : Colors.text.tertiary}
          />
          <Text
            variant="bodySmall"
            weight="semibold"
            color={mode === 'semester' ? 'teal' : 'tertiary'}
          >
            Semester
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'course' && styles.modeButtonActive]}
          onPress={() => setMode('course')}
        >
          <Feather
            name="book"
            size={20}
            color={mode === 'course' ? Colors.primary.main : Colors.text.tertiary}
          />
          <Text
            variant="bodySmall"
            weight="semibold"
            color={mode === 'course' ? 'teal' : 'tertiary'}
          >
            Course
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {mode === 'semester' ? (
          <View style={styles.form}>
            <Card style={styles.formCard}>
              <Text variant="h3" style={styles.formTitle}>
                New Semester
              </Text>

              <View style={styles.inputGroup}>
                <Text variant="caption" color="secondary" style={styles.label}>
                  Semester Number
                </Text>
                <View style={styles.numberPicker}>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() =>
                      setSemesterForm({
                        ...semesterForm,
                        semester_number: Math.max(1, semesterForm.semester_number - 1),
                      })
                    }
                  >
                    <Feather name="minus" size={20} color={Colors.primary.main} />
                  </TouchableOpacity>
                  <Text variant="h2" style={styles.numberValue}>
                    {semesterForm.semester_number}
                  </Text>
                  <TouchableOpacity
                    style={[styles.numberButton, styles.numberButtonFilled]}
                    onPress={() =>
                      setSemesterForm({
                        ...semesterForm,
                        semester_number: semesterForm.semester_number + 1,
                      })
                    }
                  >
                    <Feather name="plus" size={20} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </View>

              <Input
                label="Semester Name (Optional)"
                value={semesterForm.name}
                onChangeText={(text) =>
                  setSemesterForm({ ...semesterForm, name: text })
                }
                placeholder="e.g., Fall 2024"
                icon="tag"
              />
            </Card>

            <Button
              title="Create Semester"
              onPress={handleAddSemester}
              loading={createSemesterMutation.isPending}
              fullWidth
              icon="plus"
            />
          </View>
        ) : (
          <View style={styles.form}>
            {semesters.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Feather
                  name="alert-circle"
                  size={40}
                  color={Colors.text.tertiary}
                  style={styles.emptyIcon}
                />
                <Text variant="bodyLarge" center>
                  No Semesters Yet
                </Text>
                <Text variant="body" color="secondary" center style={styles.emptyText}>
                  Create a semester first before adding courses
                </Text>
                <Button
                  title="Create Semester"
                  onPress={() => setMode('semester')}
                  variant="outline"
                  icon="folder-plus"
                />
              </Card>
            ) : (
              <>
                <Text variant="h3" style={styles.sectionTitle}>
                  Select Semester
                </Text>
                <Text variant="bodySmall" color="secondary" style={styles.sectionSubtitle}>
                  Choose which semester to add the course to
                </Text>

                {semesters.map((semester) => (
                  <TouchableOpacity
                    key={semester.id}
                    style={[
                      styles.semesterOption,
                      selectedSemesterId === semester.id && styles.semesterOptionActive,
                    ]}
                    onPress={() => setSelectedSemesterId(semester.id)}
                  >
                    <View style={styles.semesterOptionContent}>
                      <Text
                        variant="body"
                        weight="semibold"
                        color={selectedSemesterId === semester.id ? 'teal' : 'primary'}
                      >
                        Semester {semester.semester_number}
                      </Text>
                      <Text variant="caption" color="secondary">
                        {semester.courses.length} courses
                      </Text>
                    </View>
                    {selectedSemesterId === semester.id && (
                      <Feather
                        name="check-circle"
                        size={24}
                        color={Colors.primary.main}
                      />
                    )}
                  </TouchableOpacity>
                ))}

                <Button
                  title="Add Course"
                  onPress={handleAddCourse}
                  fullWidth
                  icon="plus"
                  disabled={!selectedSemesterId}
                  style={styles.addButton}
                />
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.app,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
  },
  modeSelector: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  modeButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.veryDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 0,
    paddingBottom: 100,
  },
  form: {
    gap: Spacing.md,
  },
  formCard: {
    marginBottom: Spacing.md,
  },
  formTitle: {
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  numberPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.app,
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
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: Spacing.md,
  },
  semesterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    marginBottom: Spacing.sm,
  },
  semesterOptionActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.veryDark,
  },
  semesterOptionContent: {
    gap: 2,
  },
  addButton: {
    marginTop: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyText: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
});
