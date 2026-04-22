import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '@/theme/theme-context';

// Minimal data for each tab's small icon badge.
type IconProps = {
  letter: string;
  focused: boolean;
};

// Skipping an icon library — just a single letter inside a square block.
// Simple, and keeps the app feeling consistent across both themes.
function TabIcon({ letter, focused }: IconProps) {
  const styles = useThemedStyles((c) => ({
    icon: {
      alignItems: 'center' as const,
      borderColor: c.borderStrong,
      borderRadius: 4,
      borderWidth: 1,
      height: 24,
      justifyContent: 'center' as const,
      width: 24,
    },
    iconFocused: {
      backgroundColor: c.tabActiveBackground,
      borderColor: c.primaryDark,
    },
    iconLabel: {
      color: c.tabInactiveText,
      fontSize: 12,
      fontWeight: '800' as const,
    },
    iconLabelFocused: {
      color: c.tabActiveText,
    },
  }));

  return (
    <View style={[styles.icon, focused ? styles.iconFocused : null]}>
      <Text style={[styles.iconLabel, focused ? styles.iconLabelFocused : null]}>{letter}</Text>
    </View>
  );
}

// Bottom tab bar for the signed-in experience. Pulls all its colours from
// the current theme so dark mode applies cleanly across the whole bar.
export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        // Paint the bar itself with the theme's tab colours.
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.tabInactiveText,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.5,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Habits',
          tabBarIcon: ({ focused }) => <TabIcon letter="H" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ focused }) => <TabIcon letter="C" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused }) => <TabIcon letter="I" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon letter="P" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
