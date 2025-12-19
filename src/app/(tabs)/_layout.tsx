import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Layout, Spacing, BorderRadius } from '../../constants/spacing';
import { Text } from '../../components/ui';

type TabIconProps = {
  name: keyof typeof Feather.glyphMap;
  focused: boolean;
  label: string;
};

function TabIcon({ name, focused, label }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      {focused && <View style={styles.activeIndicator} />}
      <Feather
        name={name}
        size={24}
        color={focused ? Colors.primary.main : Colors.text.tertiary}
      />
      <Text
        variant="tiny"
        uppercase
        color={focused ? 'teal' : 'tertiary'}
        style={styles.tabLabel}
      >
        {label}
      </Text>
    </View>
  );
}

function AddTabButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.addButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.addButtonInner}>
        <Feather name="plus" size={28} color={Colors.white} />
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary.main,
        tabBarInactiveTintColor: Colors.text.tertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="semesters"
        options={{
          title: 'Semesters',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="folder" focused={focused} label="Semesters" />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarButton: (props) => (
            <AddTabButton onPress={props.onPress as () => void} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="bar-chart-2" focused={focused} label="Analytics" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="user" focused={focused} label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background.surface,
    borderTopColor: Colors.ui.border,
    borderTopWidth: 1,
    height: Layout.bottomTabHeight + 20,
    paddingTop: Spacing.sm,
    paddingBottom: 20,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary.main,
  },
  tabLabel: {
    marginTop: 4,
  },
  addButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonInner: {
    width: Layout.fabSize,
    height: Layout.fabSize,
    borderRadius: Layout.fabSize / 2,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
