import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { and, eq } from 'drizzle-orm';
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import AuthProvider, { useAuth } from '@/auth/auth-context';
import { db } from '@/db/client';
import {
  categories as categoriesTable,
  habits as habitsTable,
  habitLogs as habitLogsTable,
  targets as targetsTable,
} from '@/db/schema';
import { seedDemoDataIfEmpty } from '@/db/seed';
import ThemeProvider, { useTheme, useThemedStyles } from '@/theme/theme-context';

// The shape of each row coming out of SQLite. Keeping these in one place
// avoids typing them slightly differently in half a dozen files.
export type Category = {
  id: number;
  userId: number;
  name: string;
  color: string;
  icon: string;
};

export type Habit = {
  id: number;
  userId: number;
  categoryId: number;
  name: string;
  description: string | null;
  metricType: string;
  unit: string | null;
  archived: number;
};

export type HabitLog = {
  id: number;
  habitId: number;
  userId: number;
  date: string;
  value: number;
  notes: string | null;
};

export type Target = {
  id: number;
  userId: number;
  habitId: number | null;
  categoryId: number | null;
  period: string;
  targetValue: number;
};

// Everything the app state looks like once a user's signed in. Setters are
// exposed too so individual screens can push new data in after a save.
type DataContextType = {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  habitLogs: HabitLog[];
  setHabitLogs: React.Dispatch<React.SetStateAction<HabitLog[]>>;
  targets: Target[];
  setTargets: React.Dispatch<React.SetStateAction<Target[]>>;
  reload: () => Promise<void>;
};

export const DataContext = createContext<DataContextType | null>(null);

// Holds all the signed-in user's data in memory. When the user changes we
// pull everything afresh from SQLite.
function DataProvider({ userId, children }: { userId: number; children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);

  // Run all four queries in parallel rather than sequentially.
  const reload = useCallback(async () => {
    const [cats, habs, logs, tars] = await Promise.all([
      db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId)),
      db
        .select()
        .from(habitsTable)
        // Skip archived habits — we don't want them cluttering the list.
        .where(and(eq(habitsTable.userId, userId), eq(habitsTable.archived, 0))),
      db.select().from(habitLogsTable).where(eq(habitLogsTable.userId, userId)),
      db.select().from(targetsTable).where(eq(targetsTable.userId, userId)),
    ]);
    setCategories(cats);
    setHabits(habs);
    setHabitLogs(logs);
    setTargets(tars);
  }, [userId]);

  // Do the initial fetch as soon as we've got a user.
  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <DataContext.Provider
      value={{
        categories,
        setCategories,
        habits,
        setHabits,
        habitLogs,
        setHabitLogs,
        targets,
        setTargets,
        reload,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

// Decides what the user sees: loading spinner, login, or the main app.
// Also runs the seed so a fresh install has something to look at.
function AuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [bootstrapping, setBootstrapping] = useState(true);
  // Read the current palette so even the loading splash respects dark mode.
  const { colors, resolvedScheme } = useTheme();
  const styles = useThemedStyles((c) => ({
    loading: {
      alignItems: 'center' as const,
      backgroundColor: c.background,
      flex: 1,
      justifyContent: 'center' as const,
    },
  }));

  // Seed the DB on first boot if it's empty, so there's always sample data
  // available to demonstrate the insights and charts.
  useEffect(() => {
    const bootstrap = async () => {
      await seedDemoDataIfEmpty();
      setBootstrapping(false);
    };
    void bootstrap();
  }, []);

  // Bounce the user to login if they're not signed in, or to the tabs if they are.
  useEffect(() => {
    if (loading || bootstrapping) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, bootstrapping, segments, router]);

  // While we're still waking up, show a little spinner on the themed background.
  if (loading || bootstrapping) {
    return (
      <View style={styles.loading}>
        <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  // Configure every stacked screen with matching header colours for the theme.
  const stackHeaderOptions = {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { color: colors.text, fontWeight: '700' as const },
    contentStyle: { backgroundColor: colors.background },
  };

  // Now wire up all the routes. Tabs and (auth) handle their own headers;
  // the rest are modal-style screens pushed on top of the current tab.
  const content = (
    <>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, ...stackHeaderOptions }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="habit/new" options={{ headerShown: true, title: 'New Habit' }} />
        <Stack.Screen name="habit/[id]/index" options={{ headerShown: true, title: 'Habit' }} />
        <Stack.Screen name="habit/[id]/edit" options={{ headerShown: true, title: 'Edit Habit' }} />
        <Stack.Screen name="category/new" options={{ headerShown: true, title: 'New Category' }} />
        <Stack.Screen name="category/[id]/edit" options={{ headerShown: true, title: 'Edit Category' }} />
        <Stack.Screen name="log/new" options={{ headerShown: true, title: 'New Log' }} />
        <Stack.Screen name="log/[id]/edit" options={{ headerShown: true, title: 'Edit Log' }} />
        <Stack.Screen name="target/new" options={{ headerShown: true, title: 'New Target' }} />
        <Stack.Screen name="target/[id]/edit" options={{ headerShown: true, title: 'Edit Target' }} />
      </Stack>
    </>
  );

  // If the user's signed in, wrap everything in the DataProvider so every
  // screen below can read the data it needs without extra queries.
  if (user) {
    return <DataProvider userId={user.id}>{content}</DataProvider>;
  }

  return content;
}

// Top of the tree. Theme first (so everything below can read colours), then
// auth (so we know who's signed in), then the gate that sorts out routing.
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}
