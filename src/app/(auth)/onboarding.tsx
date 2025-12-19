import { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Layout } from '../../constants/spacing';
import { Text, Button } from '../../components/ui';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  features?: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'bar-chart-2',
    title: 'Track Your Academic Progress',
    description:
      'Calculate and monitor your CGPA effortlessly across all semesters',
  },
  {
    id: '2',
    icon: 'pie-chart',
    title: 'Beautiful Analytics',
    description: 'Visualize your performance with stunning charts and insights',
    features: [
      'Real-time CGPA calculation',
      'Grade trend analysis',
      'Semester comparison',
    ],
  },
  {
    id: '3',
    icon: 'shield',
    title: 'Secure & Synced',
    description: 'Your data is safely stored and synced across all your devices',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) {
        setCurrentIndex(Number(viewableItems[0].index) || 0);
      }
    }
  ).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.push('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/login');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.illustrationContainer}>
        <LinearGradient
          colors={[Colors.primary.veryDark, Colors.background.subtle]}
          style={styles.illustrationGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconContainer}>
            <Feather name={item.icon} size={80} color={Colors.primary.light} />
          </View>
        </LinearGradient>
      </View>

      <View style={styles.contentContainer}>
        <Text variant="h1" center style={styles.title}>
          {item.title}
        </Text>
        <Text variant="body" color="secondary" center style={styles.description}>
          {item.description}
        </Text>

        {item.features && (
          <View style={styles.featuresContainer}>
            {item.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Feather
                  name="check-circle"
                  size={16}
                  color={Colors.primary.main}
                  style={styles.featureIcon}
                />
                <Text variant="bodySmall" color="secondary">
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text variant="bodySmall" color="secondary">
          Skip
        </Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
      />

      <View style={styles.bottomSection}>
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Button
          title={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          icon={currentIndex === slides.length - 1 ? undefined : 'arrow-right'}
          iconPosition="right"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.app,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  illustrationContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  illustrationGradient: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 0.5,
    justifyContent: 'flex-start',
    paddingTop: Spacing['2xl'],
  },
  title: {
    marginBottom: Spacing.md,
  },
  description: {
    lineHeight: 24,
    maxWidth: 300,
    alignSelf: 'center',
  },
  featuresContainer: {
    marginTop: Spacing.lg,
    alignItems: 'flex-start',
    alignSelf: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureIcon: {
    marginRight: Spacing.sm,
  },
  bottomSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    paddingTop: Spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.background.elevated,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: Colors.primary.main,
    width: 24,
  },
});
