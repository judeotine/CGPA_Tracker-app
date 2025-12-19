import { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Colors, getGPAColor } from '../../constants/colors';
import { Spacing, BorderRadius, Layout } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import {
  Text,
  Card,
  Badge,
  ProgressRing,
  NoSemestersEmpty,
  SkeletonCard,
  SkeletonCGPA,
} from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useSemesters, useCGPA } from '../../hooks/queries';
import { formatGPA, getGPAProgress, getClassStandingShort, MAX_GPA } from '../../lib/calculations';
import type { SemesterWithCourses } from '../../types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, user } = useAuthStore();
  const { data: semesters = [], isLoading, isRefetching, refetch } = useSemesters();
  const cgpa = useCGPA();

  const firstName = profile?.full_name?.split(' ')[0] || 'Student';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const stats = useMemo(() => {
    const totalCredits = semesters.reduce((sum, sem) => sum + sem.total_credits, 0);
    const totalCourses = semesters.reduce((sum, sem) => sum + sem.courses.length, 0);
    const bestGpa = Math.max(...semesters.map((s) => s.gpa || 0), 0);
    return { totalCredits, totalCourses, bestGpa };
  }, [semesters]);

  const handleSemesterPress = (id: string) => {
    router.push(`/semester/${id}`);
  };

  const handleViewAllSemesters = () => {
    router.push('/(tabs)/semesters');
  };

  const handleAddSemester = () => {
    router.push('/(tabs)/add');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text variant="h3">
              {getGreeting()}, {firstName}!
            </Text>
            <Text variant="caption" color="secondary">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.avatarButton}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={20} color={Colors.text.tertiary} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

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
        {isLoading && semesters.length === 0 ? (
          <Card variant="hero" gradient shadow="level3" style={styles.heroCard}>
            <SkeletonCGPA />
          </Card>
        ) : (
          <Card variant="hero" gradient shadow="level3" style={styles.heroCard}>
            <Text variant="caption" color="secondary" uppercase>
              Your CGPA
            </Text>
            <View style={styles.cgpaContainer}>
              <ProgressRing
                progress={cgpa ? getGPAProgress(cgpa) : 0}
                size={140}
                strokeWidth={10}
              >
                <Text
                  variant="gpa"
                  style={{ color: cgpa ? getGPAColor(cgpa) : Colors.text.primary }}
                >
                  {formatGPA(cgpa)}
                </Text>
                <Text variant="caption" color="secondary">
                  out of {MAX_GPA.toFixed(1)}
                </Text>
              </ProgressRing>
            </View>
            <View style={styles.creditsRow}>
              <Feather
                name="award"
                size={16}
                color={Colors.primary.main}
                style={styles.creditsIcon}
              />
              <Text variant="bodySmall" color="secondary">
                {stats.totalCredits} Credits Completed
              </Text>
            </View>
            {cgpa && cgpa > 0 && (
              <Badge
                label={getClassStandingShort(cgpa)}
                variant="success"
                style={styles.standingBadge}
              />
            )}
          </Card>
        )}

        <View style={styles.statsRow}>
          <Card style={styles.statCard} shadow="level1">
            <Feather name="folder" size={24} color={Colors.primary.main} />
            <Text variant="h3" style={styles.statNumber}>
              {semesters.length}
            </Text>
            <Text variant="caption" color="secondary">
              Semesters
            </Text>
          </Card>

          <Card style={styles.statCard} shadow="level1">
            <Feather name="award" size={24} color={Colors.accent.warning} />
            <Text
              variant="h3"
              style={[styles.statNumber, { color: Colors.accent.success }]}
            >
              {formatGPA(stats.bestGpa > 0 ? stats.bestGpa : null)}
            </Text>
            <Text variant="caption" color="secondary">
              Best GPA
            </Text>
          </Card>

          <Card style={styles.statCard} shadow="level1">
            <Feather name="book-open" size={24} color={Colors.primary.main} />
            <Text variant="h3" style={styles.statNumber}>
              {stats.totalCourses}
            </Text>
            <Text variant="caption" color="secondary">
              Courses
            </Text>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <Text variant="h3">Your Semesters</Text>
          {semesters.length > 0 && (
            <TouchableOpacity onPress={handleViewAllSemesters}>
              <Text variant="bodySmall" color="teal">
                View All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading && semesters.length === 0 ? (
          <>
            <SkeletonCard style={styles.semesterCard} />
            <SkeletonCard style={styles.semesterCard} />
          </>
        ) : semesters.length === 0 ? (
          <NoSemestersEmpty onAdd={handleAddSemester} />
        ) : (
          semesters.slice(0, 3).map((semester) => (
            <SemesterCard
              key={semester.id}
              semester={semester}
              onPress={() => handleSemesterPress(semester.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function SemesterCard({
  semester,
  onPress,
}: {
  semester: SemesterWithCourses;
  onPress: () => void;
}) {
  const gpaColor = semester.gpa ? getGPAColor(semester.gpa) : Colors.text.tertiary;
  const gpaProgress = semester.gpa ? getGPAProgress(semester.gpa) : 0;

  return (
    <Card
      onPress={onPress}
      shadow="level1"
      style={styles.semesterCard}
    >
      <View style={styles.semesterContent}>
        <View style={styles.semesterLeft}>
          <Text variant="bodyLarge" weight="semibold">
            Semester {semester.semester_number}
          </Text>
          <View style={styles.semesterStats}>
            <Text variant="bodySmall" color="secondary">
              {semester.courses.length} courses
            </Text>
            <Text variant="bodySmall" color="tertiary">
              {' '}{' '}
            </Text>
            <Text variant="bodySmall" color="secondary">
              {semester.total_credits} credits
            </Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[Colors.primary.dark, Colors.primary.light]}
              style={[styles.progressFill, { width: `${gpaProgress}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
        <View style={styles.semesterRight}>
          <Text
            variant="h2"
            weight="extraBold"
            mono
            style={{ color: gpaColor }}
          >
            {formatGPA(semester.gpa)}
          </Text>
          <Text variant="caption" color="secondary">
            GPA
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
    backgroundColor: Colors.background.surface,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: Layout.avatarSize.medium,
    height: Layout.avatarSize.medium,
    borderRadius: Layout.avatarSize.medium / 2,
  },
  avatarPlaceholder: {
    width: Layout.avatarSize.medium,
    height: Layout.avatarSize.medium,
    borderRadius: Layout.avatarSize.medium / 2,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
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
  cgpaContainer: {
    marginVertical: Spacing.md,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditsIcon: {
    marginRight: Spacing.xs,
  },
  standingBadge: {
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statNumber: {
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  semesterCard: {
    marginBottom: Spacing.sm,
  },
  semesterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  semesterLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  semesterStats: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
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
  semesterRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
