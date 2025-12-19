import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Layout } from '../../constants/spacing';
import { Text, Card, Button } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { usePreferences, useUpdatePreferences } from '../../hooks/queries';

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  renderRight?: () => React.ReactNode;
  danger?: boolean;
}

function SettingsItem({
  icon,
  iconColor = Colors.primary.main,
  label,
  value,
  onPress,
  showChevron = true,
  renderRight,
  danger = false,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, danger && styles.settingsItemDanger]}
      onPress={onPress}
      disabled={!onPress && !renderRight}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingsItemLeft}>
        <Feather
          name={icon}
          size={20}
          color={danger ? Colors.accent.error : iconColor}
        />
        <View style={styles.settingsItemContent}>
          <Text
            variant="body"
            color={danger ? 'error' : 'primary'}
          >
            {label}
          </Text>
          {value && (
            <Text variant="caption" color="secondary">
              {value}
            </Text>
          )}
        </View>
      </View>
      {renderRight ? (
        renderRight()
      ) : showChevron && onPress ? (
        <Feather name="chevron-right" size={20} color={Colors.text.tertiary} />
      ) : null}
    </TouchableOpacity>
  );
}

function SettingsSection({
  title,
  children,
  danger = false,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text
        variant="tiny"
        uppercase
        color={danger ? 'error' : 'tertiary'}
        style={styles.sectionTitle}
      >
        {title}
      </Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuthStore();
  const { data: preferences } = usePreferences();
  const updatePreferencesMutation = useUpdatePreferences();

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const handleLogout = () => {
    Alert.alert(
      'Logout?',
      'Your data is synced and will be available when you login again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data?',
      'This will permanently delete all your semesters, courses, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Coming Soon', 'This feature is coming soon');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/profile-setup');
  };

  const toggleNotifications = () => {
    if (preferences) {
      updatePreferencesMutation.mutate({
        notifications_enabled: !preferences.notifications_enabled,
      });
    }
  };

  const toggleHaptics = () => {
    if (preferences) {
      updatePreferencesMutation.mutate({
        haptic_enabled: !preferences.haptic_enabled,
      });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background.subtle, Colors.background.app]}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Feather name="user" size={40} color={Colors.text.tertiary} />
            </View>
          )}
          <Text variant="h2" style={styles.name}>
            {profile?.full_name || 'Student'}
          </Text>
          <Text variant="bodySmall" color="secondary">
            {user?.email}
          </Text>
          <Text variant="caption" color="tertiary" style={styles.university}>
            {profile?.university} {profile?.program && `- ${profile.program}`}
          </Text>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Feather name="edit-2" size={14} color={Colors.primary.main} />
            <Text variant="bodySmall" color="teal">
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection title="Account">
          <SettingsItem
            icon="home"
            label="University"
            value={profile?.university || 'Not set'}
          />
          <SettingsItem
            icon="book"
            label="Program"
            value={profile?.program || 'Not set'}
          />
          <SettingsItem
            icon="credit-card"
            label="Student ID"
            value={profile?.student_id || 'Not set'}
          />
          <SettingsItem
            icon="calendar"
            label="Start Year"
            value={profile?.start_year?.toString() || 'Not set'}
          />
          <SettingsItem
            icon="flag"
            label="Country"
            value={profile?.country || 'Not set'}
          />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <SettingsItem
            icon="moon"
            label="Theme"
            value="Dark Mode"
            showChevron={false}
          />
          <SettingsItem
            icon="sliders"
            label="Default IA Max Marks"
            value={preferences?.default_ia_max?.toString() || '30'}
          />
          <SettingsItem
            icon="sliders"
            label="Default UE Max Marks"
            value={preferences?.default_ue_max?.toString() || '70'}
          />
          <SettingsItem
            icon="bell"
            label="Push Notifications"
            value={preferences?.notifications_enabled ? 'Enabled' : 'Disabled'}
            showChevron={false}
            renderRight={() => (
              <Switch
                value={preferences?.notifications_enabled || false}
                onValueChange={toggleNotifications}
                trackColor={{
                  false: Colors.background.elevated,
                  true: Colors.primary.veryDark,
                }}
                thumbColor={
                  preferences?.notifications_enabled
                    ? Colors.primary.main
                    : Colors.text.tertiary
                }
              />
            )}
          />
          <SettingsItem
            icon="smartphone"
            label="Haptic Feedback"
            value={preferences?.haptic_enabled ? 'Enabled' : 'Disabled'}
            showChevron={false}
            renderRight={() => (
              <Switch
                value={preferences?.haptic_enabled || false}
                onValueChange={toggleHaptics}
                trackColor={{
                  false: Colors.background.elevated,
                  true: Colors.primary.veryDark,
                }}
                thumbColor={
                  preferences?.haptic_enabled
                    ? Colors.primary.main
                    : Colors.text.tertiary
                }
              />
            )}
          />
        </SettingsSection>

        <SettingsSection title="Data">
          <SettingsItem
            icon="download"
            label="Export All Data"
            value="Download JSON backup"
            onPress={() => Alert.alert('Coming Soon', 'Export feature coming soon')}
          />
          <SettingsItem
            icon="upload"
            label="Import Data"
            value="Restore from backup"
            onPress={() => Alert.alert('Coming Soon', 'Import feature coming soon')}
          />
          <SettingsItem
            icon="trash-2"
            iconColor={Colors.accent.warning}
            label="Clear Local Cache"
            value="Free up space"
            onPress={() => Alert.alert('Coming Soon', 'Clear cache feature coming soon')}
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsItem
            icon="info"
            label="App Version"
            value="1.0.0"
            showChevron={false}
          />
          <SettingsItem
            icon="shield"
            label="Privacy Policy"
            onPress={() => {}}
          />
          <SettingsItem
            icon="file-text"
            label="Terms of Service"
            onPress={() => {}}
          />
          <SettingsItem
            icon="help-circle"
            label="Help & Support"
            onPress={() => {}}
          />
          <SettingsItem
            icon="star"
            label="Rate App"
            onPress={() => {}}
          />
        </SettingsSection>

        <SettingsSection title="Danger Zone" danger>
          <SettingsItem
            icon="trash"
            label="Delete All Data"
            danger
            onPress={handleDeleteData}
          />
        </SettingsSection>

        <Button
          title="Logout"
          variant="outline"
          icon="log-out"
          onPress={handleLogout}
          fullWidth
          style={styles.logoutButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.app,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.lg,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
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
  name: {
    marginTop: Spacing.md,
  },
  university: {
    marginTop: Spacing.xs,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: Colors.background.surface,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
  },
  settingsItemDanger: {
    backgroundColor: `${Colors.accent.error}10`,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  logoutButton: {
    marginTop: Spacing.md,
    borderColor: Colors.accent.error,
  },
});
