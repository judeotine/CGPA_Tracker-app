import { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, getGPAColor, getGradeColor } from '../../constants/colors';
import { Spacing, BorderRadius, Layout } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import {
  Text,
  Card,
  Badge,
  GradeBadge,
  StatusBadge,
  IconButton,
  NoCoursesEmpty,
  SkeletonCourseCard,
} from '../../components/ui';
import { useSemester, useDeleteCourse } from '../../hooks/queries';
import { formatGPA, getGPAProgress, getPerformanceMessage, getGradeDistribution } from '../../lib/calculations';
import type { Course } from '../../types';

export default function SemesterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: semester, isLoading, isRefetching, refetch } = useSemester(id || '');
  const deleteCourseMutation = useDeleteCourse();

  const gradeDistribution = useMemo(() => {
    if (!semester) return {};
    return getGradeDistribution(semester.courses);
  }, [semester]);

  const handleBack = () => {
    router.back();
  };

  const handleAddCourse = () => {
    router.push(`/course/add?semesterId=${id}`);
  };

  const handleEditCourse = (courseId: string) => {
    router.push(`/course/edit?courseId=${courseId}`);
  };

  const handleDeleteCourse = (course: Course) => {
    Alert.alert(
      'Delete Course?',
      `This will permanently delete "${course.name}". This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCourseMutation.mutate({
              courseId: course.id,
              semesterId: course.semester_id,
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" variant="ghost" onPress={handleBack} />
          <Text variant="h3">Loading...</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.scrollContent}>
          <SkeletonCourseCard />
          <SkeletonCourseCard />
        </View>
      </View>
    );
  }

  if (!semester) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" variant="ghost" onPress={handleBack} />
          <Text variant="h3">Semester Not Found</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text variant="body" color="secondary">
            This semester could not be found.
          </Text>
        </View>
      </View>
    );
  }

  const gpaColor = semester.gpa ? getGPAColor(semester.gpa) : Colors.text.tertiary;
  const gpaProgress = semester.gpa ? getGPAProgress(semester.gpa) : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background.subtle, Colors.background.app]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <IconButton icon="arrow-left" variant="ghost" onPress={handleBack} />
          <Text variant="h3">Semester {semester.semester_number}</Text>
          <IconButton
            icon="more-vertical"
            variant="ghost"
            onPress={() => {}}
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={Colors.primary.main}
          />
        }
      >
        <Card gradient shadow="level2" style={styles.heroCard}>
          <View style={styles.gpaContainer}>
            <Text
              variant="displayLarge"
              weight="extraBold"
              mono
              style={{ color: gpaColor }}
            >
              {formatGPA(semester.gpa)}
            </Text>
            <Text variant="caption" color="secondary">
              Semester GPA
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="bodyLarge" weight="bold">
                {semester.total_credits}
              </Text>
              <Text variant="caption" color="secondary">
                Credits
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="bodyLarge" weight="bold">
                {semester.courses.length}
              </Text>
              <Text variant="caption" color="secondary">
                Courses
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <StatusBadge status="completed" />
            </View>
          </View>

          {semester.gpa && (
            <View style={styles.performanceRow}>
              <Feather
                name={semester.gpa >= 3.5 ? 'award' : 'trending-up'}
                size={16}
                color={gpaColor}
              />
              <Text variant="bodySmall" style={{ color: gpaColor }}>
                {getPerformanceMessage(semester.gpa)}
              </Text>
            </View>
          )}

          {Object.keys(gradeDistribution).length > 0 && (
            <View style={styles.distributionBar}>
              {Object.entries(gradeDistribution).map(([grade, count]) => {
                const percentage = (count / semester.courses.length) * 100;
                return (
                  <View
                    key={grade}
                    style={[
                      styles.distributionSegment,
                      {
                        width: `${percentage}%`,
                        backgroundColor: getGradeColor(grade),
                      },
                    ]}
                  />
                );
              })}
            </View>
          )}
        </Card>

        <View style={styles.sectionHeader}>
          <Text variant="h3">Courses ({semester.courses.length})</Text>
          <IconButton
            icon="plus"
            variant="primary"
            size="medium"
            onPress={handleAddCourse}
          />
        </View>

        {semester.courses.length === 0 ? (
          <NoCoursesEmpty onAdd={handleAddCourse} />
        ) : (
          semester.courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => handleEditCourse(course.id)}
              onDelete={() => handleDeleteCourse(course)}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, Shadows.level3]}
        onPress={handleAddCourse}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[Colors.primary.light, Colors.primary.dark]}
          style={styles.fabGradient}
        >
          <Feather name="plus" size={28} color={Colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function CourseCard({
  course,
  onPress,
  onDelete,
}: {
  course: Course;
  onPress: () => void;
  onDelete: () => void;
}) {
  const gradeColor = course.grade ? getGradeColor(course.grade) : Colors.text.tertiary;

  return (
    <Card
      onPress={onPress}
      shadow="level1"
      style={styles.courseCard}
      leftBorderColor={gradeColor}
    >
      <View style={styles.courseContent}>
        <View style={styles.courseLeft}>
          <View style={styles.courseHeader}>
            <Text variant="body" weight="semibold" numberOfLines={1}>
              {course.name}
            </Text>
            <Badge
              label={`${course.credit_hours} CR`}
              variant="credit"
              size="small"
            />
          </View>

          <View style={styles.marksRow}>
            <Text variant="bodyLarge" weight="bold">
              {course.total_score !== null ? course.total_score : '--'}
            </Text>
            <Text variant="body" color="secondary">
              /{(course.ia_max || 30) + (course.ue_max || 70)}
            </Text>
            <Text variant="bodySmall" color="secondary" style={styles.percentage}>
              {course.percentage !== null ? `${course.percentage.toFixed(1)}%` : '--%'}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text variant="caption" color="secondary">
              IA: {course.ia_score ?? '--'}/{course.ia_max || 30}
            </Text>
            <Text variant="caption" color="tertiary" style={styles.separator}>
              |
            </Text>
            <Text variant="caption" color="secondary">
              UE: {course.ue_score ?? '--'}/{course.ue_max || 70}
            </Text>
            {course.grade && (
              <>
                <Text variant="caption" color="tertiary" style={styles.separator}>
                  |
                </Text>
                <GradeBadge grade={course.grade} size="small" />
              </>
            )}
          </View>
        </View>

        <View style={styles.courseRight}>
          <Text
            variant="h3"
            weight="extraBold"
            mono
            style={{ color: gradeColor }}
          >
            {course.grade_points?.toFixed(1) ?? '--'}
          </Text>
          <Text variant="tiny" color="secondary">
            points
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.app,
  },
  header: {
    paddingTop: 50,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  gpaContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.ui.border,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  distributionBar: {
    flexDirection: 'row',
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Colors.background.elevated,
  },
  distributionSegment: {
    height: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  courseCard: {
    marginBottom: Spacing.sm,
  },
  courseContent: {
    flexDirection: 'row',
  },
  courseLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  marksRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  percentage: {
    marginLeft: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  separator: {
    marginHorizontal: 2,
  },
  courseRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.lg,
  },
  fabGradient: {
    width: Layout.fabSize,
    height: Layout.fabSize,
    borderRadius: Layout.fabSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
