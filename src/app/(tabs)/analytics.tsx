import { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { Colors, getGPAColor, getGradeColor } from '../../constants/colors';
import { Spacing, BorderRadius, Layout } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { Text, Card, Badge } from '../../components/ui';
import { useSemesters, useCGPA } from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import { formatGPA, getClassStandingShort, GRADE_SCALE } from '../../lib/calculations';
import { sharePDF, printPDF } from '../../lib/pdfExport';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 200;

export default function AnalyticsScreen() {
  const { data: semesters = [] } = useSemesters();
  const cgpa = useCGPA();
  const { profile } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    Alert.alert(
      'Export Transcript',
      'Choose how you want to export your academic transcript',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Print',
          onPress: async () => {
            setIsExporting(true);
            try {
              await printPDF({ profile, semesters, cgpa });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Export Failed',
                text2: 'Could not print the transcript',
                position: 'top',
              });
            } finally {
              setIsExporting(false);
            }
          },
        },
        {
          text: 'Share PDF',
          onPress: async () => {
            setIsExporting(true);
            try {
              await sharePDF({ profile, semesters, cgpa });
              Toast.show({
                type: 'success',
                text1: 'Export Successful',
                text2: 'Your transcript has been exported',
                position: 'top',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Export Failed',
                text2: 'Could not share the transcript',
                position: 'top',
              });
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };

  const analytics = useMemo(() => {
    const allCourses = semesters.flatMap((sem) => sem.courses);
    const totalCredits = allCourses.reduce((sum, c) => sum + c.credit_hours, 0);
    const totalCourses = allCourses.length;

    const gradeDistribution: Record<string, number> = {};
    allCourses.forEach((course) => {
      if (course.grade) {
        const baseGrade = course.grade.replace('+', '');
        gradeDistribution[baseGrade] = (gradeDistribution[baseGrade] || 0) + 1;
      }
    });

    const gpaHistory = semesters
      .filter((sem) => sem.gpa !== null)
      .sort((a, b) => a.semester_number - b.semester_number)
      .map((sem) => ({
        semester: sem.semester_number,
        gpa: sem.gpa!,
      }));

    const creditsPerSemester = semesters
      .sort((a, b) => a.semester_number - b.semester_number)
      .map((sem) => ({
        semester: sem.semester_number,
        credits: sem.total_credits,
      }));

    const gpas = semesters.map((sem) => sem.gpa).filter((gpa): gpa is number => gpa !== null);
    const bestGpa = gpas.length > 0 ? Math.max(...gpas) : 0;
    const worstGpa = gpas.length > 0 ? Math.min(...gpas) : 0;
    const bestSemester = semesters.find((s) => s.gpa === bestGpa);
    const worstSemester = semesters.find((s) => s.gpa === worstGpa);

    return {
      cgpa: cgpa || 0,
      totalCredits,
      totalCourses,
      totalSemesters: semesters.length,
      bestGpa,
      worstGpa,
      bestSemester,
      worstSemester,
      gradeDistribution,
      gpaHistory,
      creditsPerSemester,
    };
  }, [semesters, cgpa]);

  const trend = useMemo(() => {
    if (analytics.gpaHistory.length < 2) return { value: 0, direction: 'none' as const };
    const last = analytics.gpaHistory[analytics.gpaHistory.length - 1].gpa;
    const prev = analytics.gpaHistory[analytics.gpaHistory.length - 2].gpa;
    const diff = last - prev;
    return {
      value: Math.abs(diff),
      direction: diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'none' as const,
    };
  }, [analytics.gpaHistory]);

  if (semesters.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="h2">Analytics</Text>
          <Text variant="bodySmall" color="secondary">
            Your academic performance insights
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="bar-chart-2" size={60} color={Colors.text.tertiary} />
          <Text variant="h3" center style={styles.emptyTitle}>
            No Data Yet
          </Text>
          <Text variant="body" color="secondary" center>
            Add semesters and courses to see your analytics
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="h2">Analytics</Text>
          <Text variant="bodySmall" color="secondary">
            Your academic performance insights
          </Text>
        </View>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExport}
          disabled={isExporting}
        >
          <Feather
            name="share"
            size={20}
            color={isExporting ? Colors.text.tertiary : Colors.primary.main}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card gradient shadow="level3" style={styles.cgpaCard}>
          <View style={styles.cgpaContent}>
            <Text
              variant="displayLarge"
              weight="extraBold"
              mono
              style={{ color: getGPAColor(analytics.cgpa) }}
            >
              {formatGPA(analytics.cgpa)}
            </Text>
            <View style={styles.trendContainer}>
              {trend.direction !== 'none' && (
                <>
                  <Feather
                    name={trend.direction === 'up' ? 'trending-up' : 'trending-down'}
                    size={20}
                    color={trend.direction === 'up' ? Colors.accent.success : Colors.accent.error}
                  />
                  <Text
                    variant="body"
                    style={{
                      color: trend.direction === 'up' ? Colors.accent.success : Colors.accent.error,
                    }}
                  >
                    {trend.direction === 'up' ? '+' : '-'}{trend.value.toFixed(2)}
                  </Text>
                </>
              )}
            </View>
            <Text variant="caption" color="secondary">
              Compared to last semester
            </Text>
          </View>
          <Badge
            label={getClassStandingShort(analytics.cgpa)}
            variant="success"
            style={styles.standingBadge}
          />
        </Card>

        <Card shadow="level1" style={styles.chartCard}>
          <Text variant="h3" style={styles.chartTitle}>
            GPA Progress
          </Text>
          <GPALineChart data={analytics.gpaHistory} />
        </Card>

        <Card shadow="level1" style={styles.chartCard}>
          <Text variant="h3" style={styles.chartTitle}>
            Credits per Semester
          </Text>
          <CreditsBarChart data={analytics.creditsPerSemester} />
        </Card>

        <Card shadow="level1" style={styles.chartCard}>
          <Text variant="h3" style={styles.chartTitle}>
            Grade Distribution
          </Text>
          <GradeDonutChart
            data={analytics.gradeDistribution}
            totalCourses={analytics.totalCourses}
          />
        </Card>

        <View style={styles.statsGrid}>
          <Card shadow="level1" style={styles.statCard}>
            <Feather name="award" size={24} color={Colors.accent.success} />
            <Text
              variant="h3"
              weight="bold"
              style={{ color: Colors.accent.success }}
            >
              {formatGPA(analytics.bestGpa)}
            </Text>
            <Text variant="caption" color="secondary">
              Best Semester GPA
            </Text>
            {analytics.bestSemester && (
              <Text variant="tiny" color="tertiary">
                Semester {analytics.bestSemester.semester_number}
              </Text>
            )}
          </Card>

          <Card shadow="level1" style={styles.statCard}>
            <Feather name="arrow-down" size={24} color={Colors.accent.warning} />
            <Text
              variant="h3"
              weight="bold"
              style={{ color: Colors.accent.warning }}
            >
              {formatGPA(analytics.worstGpa)}
            </Text>
            <Text variant="caption" color="secondary">
              Lowest Semester GPA
            </Text>
            {analytics.worstSemester && (
              <Text variant="tiny" color="tertiary">
                Semester {analytics.worstSemester.semester_number}
              </Text>
            )}
          </Card>

          <Card shadow="level1" style={styles.statCard}>
            <Feather name="award" size={24} color={Colors.primary.main} />
            <Text variant="h3" weight="bold">
              {analytics.totalCredits}
            </Text>
            <Text variant="caption" color="secondary">
              Total Credits
            </Text>
          </Card>

          <Card shadow="level1" style={styles.statCard}>
            <Feather name="star" size={24} color={Colors.accent.purple} />
            <Badge
              label={getClassStandingShort(analytics.cgpa)}
              variant="info"
              size="medium"
            />
            <Text variant="caption" color="secondary">
              Class Standing
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

function GPALineChart({ data }: { data: { semester: number; gpa: number }[] }) {
  if (data.length === 0) {
    return (
      <View style={styles.noDataChart}>
        <Text variant="body" color="tertiary">
          No GPA data yet
        </Text>
      </View>
    );
  }

  const padding = 40;
  const chartWidth = CHART_WIDTH - padding * 2;
  const chartHeight = CHART_HEIGHT - padding * 2;
  const maxGPA = 5;
  const minGPA = 0;

  const points = data.map((d, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding + chartHeight - ((d.gpa - minGPA) / (maxGPA - minGPA)) * chartHeight,
  }));

  const pathData = points.length > 0
    ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
    : '';

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {[0, 1, 2, 3, 4, 5].map((gpa) => {
        const y = padding + chartHeight - (gpa / 5) * chartHeight;
        return (
          <Line
            key={gpa}
            x1={padding}
            y1={y}
            x2={CHART_WIDTH - padding}
            y2={y}
            stroke={Colors.ui.border}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        );
      })}

      <Path
        d={pathData}
        fill="none"
        stroke={Colors.primary.main}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((point, i) => (
        <Circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={6}
          fill={Colors.primary.main}
          stroke={Colors.background.surface}
          strokeWidth={2}
        />
      ))}

      {data.map((d, i) => (
        <SvgText
          key={i}
          x={points[i].x}
          y={CHART_HEIGHT - 10}
          fontSize={10}
          fill={Colors.text.tertiary}
          textAnchor="middle"
        >
          S{d.semester}
        </SvgText>
      ))}
    </Svg>
  );
}

function CreditsBarChart({ data }: { data: { semester: number; credits: number }[] }) {
  if (data.length === 0) {
    return (
      <View style={styles.noDataChart}>
        <Text variant="body" color="tertiary">
          No credits data yet
        </Text>
      </View>
    );
  }

  const maxCredits = Math.max(...data.map((d) => d.credits), 20);
  const barWidth = (CHART_WIDTH - 60) / data.length - 10;

  return (
    <View style={styles.barChartContainer}>
      {data.map((d, i) => {
        const height = (d.credits / maxCredits) * (CHART_HEIGHT - 40);
        return (
          <View key={i} style={styles.barContainer}>
            <Text variant="tiny" color="secondary" style={styles.barValue}>
              {d.credits}
            </Text>
            <LinearGradient
              colors={[Colors.primary.light, Colors.primary.dark]}
              style={[styles.bar, { height, width: barWidth }]}
            />
            <Text variant="tiny" color="tertiary" style={styles.barLabel}>
              S{d.semester}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function GradeDonutChart({
  data,
  totalCourses,
}: {
  data: Record<string, number>;
  totalCourses: number;
}) {
  const grades = Object.entries(data).sort((a, b) => {
    const order = ['A', 'B', 'C', 'D', 'E', 'F'];
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });

  if (grades.length === 0) {
    return (
      <View style={styles.noDataChart}>
        <Text variant="body" color="tertiary">
          No grades yet
        </Text>
      </View>
    );
  }

  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercentage = 0;

  return (
    <View style={styles.donutContainer}>
      <Svg width={size} height={size}>
        {grades.map(([grade, count], index) => {
          const percentage = count / totalCourses;
          const strokeDashoffset = circumference * (1 - percentage);
          const rotation = accumulatedPercentage * 360 - 90;
          accumulatedPercentage += percentage;

          return (
            <Circle
              key={grade}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={getGradeColor(grade)}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            />
          );
        })}
      </Svg>
      <View style={styles.donutCenter}>
        <Text variant="h2" weight="bold">
          {totalCourses}
        </Text>
        <Text variant="tiny" color="secondary">
          courses
        </Text>
      </View>

      <View style={styles.legend}>
        {grades.map(([grade, count]) => (
          <View key={grade} style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: getGradeColor(grade) }]}
            />
            <Text variant="caption" color="secondary">
              {grade}: {count} ({((count / totalCourses) * 100).toFixed(0)}%)
            </Text>
          </View>
        ))}
      </View>
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
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
  },
  exportButton: {
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cgpaCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  cgpaContent: {
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  standingBadge: {
    marginTop: Spacing.sm,
  },
  chartCard: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
  },
  chartTitle: {
    marginBottom: Spacing.md,
  },
  noDataChart: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    paddingHorizontal: Spacing.md,
  },
  barContainer: {
    alignItems: 'center',
  },
  bar: {
    borderRadius: BorderRadius.small,
    minHeight: 4,
  },
  barValue: {
    marginBottom: Spacing.xs,
  },
  barLabel: {
    marginTop: Spacing.xs,
  },
  donutContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  donutCenter: {
    position: 'absolute',
    top: Spacing.md + 60,
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: (SCREEN_WIDTH - 48 - 8) / 2,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
});
