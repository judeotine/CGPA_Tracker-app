import { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, getGPAColor } from '../../constants/colors';
import { Spacing, BorderRadius, Layout } from '../../constants/spacing';
import {
  Text,
  Card,
  Badge,
  IconButton,
  NoSemestersEmpty,
  SkeletonCard,
} from '../../components/ui';
import { useSemesters, useDeleteSemester } from '../../hooks/queries';
import { formatGPA, getGPAProgress } from '../../lib/calculations';
import type { SemesterWithCourses } from '../../types';

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export default function SemestersScreen() {
  const router = useRouter();
  const { data: semesters = [], isLoading, isRefetching, refetch } = useSemesters();
  const deleteSemesterMutation = useDeleteSemester();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filteredSemesters = useMemo(() => {
    let result = [...semesters];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (sem) =>
          sem.name?.toLowerCase().includes(query) ||
          `semester ${sem.semester_number}`.toLowerCase().includes(query)
      );
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => b.semester_number - a.semester_number);
        break;
      case 'oldest':
        result.sort((a, b) => a.semester_number - b.semester_number);
        break;
      case 'highest':
        result.sort((a, b) => (b.gpa || 0) - (a.gpa || 0));
        break;
      case 'lowest':
        result.sort((a, b) => (a.gpa || 0) - (b.gpa || 0));
        break;
    }

    return result;
  }, [semesters, searchQuery, sortBy]);

  const handleSemesterPress = (id: string) => {
    router.push(`/semester/${id}`);
  };

  const handleDeleteSemester = (semester: SemesterWithCourses) => {
    Alert.alert(
      'Delete Semester?',
      `This will permanently delete Semester ${semester.semester_number} and all its courses. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSemesterMutation.mutate(semester.id);
          },
        },
      ]
    );
  };

  const handleAddSemester = () => {
    router.push('/(tabs)/add');
  };

  const renderSemesterCard = ({ item }: { item: SemesterWithCourses }) => {
    const gpaColor = item.gpa ? getGPAColor(item.gpa) : Colors.text.tertiary;
    const gpaProgress = item.gpa ? getGPAProgress(item.gpa) : 0;

    const grades = item.courses
      .map((c) => c.grade)
      .filter((g): g is string => !!g);
    const highestGrade = grades.length > 0 ? grades.sort()[0] : '-';
    const lowestGrade = grades.length > 0 ? grades.sort().reverse()[0] : '-';

    return (
      <Card
        onPress={() => handleSemesterPress(item.id)}
        shadow="level2"
        style={styles.semesterCard}
        padding="large"
      >
        <View style={styles.cardHeader}>
          <Badge
            label={`SEM ${item.semester_number}`}
            variant="default"
            size="small"
          />
          <TouchableOpacity
            onPress={() => handleDeleteSemester(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="more-vertical" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <Text variant="h3" style={styles.semesterTitle}>
          Semester {item.semester_number}
        </Text>
        {item.name && (
          <Text variant="caption" color="secondary">
            {item.name}
          </Text>
        )}

        <View style={styles.gpaSection}>
          <Text
            variant="h1"
            weight="extraBold"
            mono
            style={{ color: gpaColor }}
          >
            {formatGPA(item.gpa)}
          </Text>
          <Text variant="caption" color="secondary">
            GPA
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Feather name="book-open" size={16} color={Colors.primary.main} />
            <Text variant="bodySmall" weight="bold">
              {item.courses.length}
            </Text>
            <Text variant="caption" color="secondary">
              courses
            </Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="award" size={16} color={Colors.primary.main} />
            <Text variant="bodySmall" weight="bold">
              {item.total_credits}
            </Text>
            <Text variant="caption" color="secondary">
              credits
            </Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="star" size={16} color={Colors.accent.success} />
            <Text variant="bodySmall" weight="bold">
              {highestGrade}
            </Text>
            <Text variant="caption" color="secondary">
              top
            </Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="circle" size={16} color={Colors.accent.warning} />
            <Text variant="bodySmall" weight="bold">
              {lowestGrade}
            </Text>
            <Text variant="caption" color="secondary">
              low
            </Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <LinearGradient
            colors={[Colors.primary.dark, Colors.primary.light]}
            style={[styles.progressFill, { width: `${gpaProgress}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h2">All Semesters</Text>
        <IconButton
          icon="plus"
          variant="primary"
          size="medium"
          onPress={handleAddSemester}
        />
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={20}
            color={Colors.primary.main}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search semesters..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Feather name="sliders" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {showSortMenu && (
        <View style={styles.sortMenu}>
          {(['newest', 'oldest', 'highest', 'lowest'] as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortOption,
                sortBy === option && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSortBy(option);
                setShowSortMenu(false);
              }}
            >
              <Text
                variant="body"
                color={sortBy === option ? 'teal' : 'primary'}
              >
                {option === 'newest' && 'Newest First'}
                {option === 'oldest' && 'Oldest First'}
                {option === 'highest' && 'Highest GPA'}
                {option === 'lowest' && 'Lowest GPA'}
              </Text>
              {sortBy === option && (
                <Feather name="check" size={18} color={Colors.primary.main} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading && semesters.length === 0 ? (
        <View style={styles.loadingContainer}>
          <SkeletonCard style={styles.skeletonCard} />
          <SkeletonCard style={styles.skeletonCard} />
        </View>
      ) : filteredSemesters.length === 0 ? (
        searchQuery ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" color="secondary" center>
              No semesters match "{searchQuery}"
            </Text>
          </View>
        ) : (
          <NoSemestersEmpty onAdd={handleAddSemester} />
        )
      ) : (
        <FlatList
          data={filteredSemesters}
          renderItem={renderSemesterCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={Colors.primary.main}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.app,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.app,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 16,
  },
  sortButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.background.app,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortMenu: {
    backgroundColor: Colors.background.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
  },
  sortOptionActive: {
    backgroundColor: Colors.primary.veryDark,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  semesterCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  semesterTitle: {
    marginBottom: Spacing.xs,
  },
  gpaSection: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
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
  loadingContainer: {
    padding: Spacing.lg,
  },
  skeletonCard: {
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
});
