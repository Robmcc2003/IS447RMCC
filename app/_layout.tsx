import { Stack, useRouter, useSegments } from 'expo-router';
import { and, eq } from 'drizzle-orm';
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AuthProvider, { useAuth } from '@/auth/auth-context';
import { db } from '@/db/client';
import {
  categories as categoriesTable,
  habits as habitsTable,
  habitLogs as habitLogsTable,
  targets as targetsTable,
} from '@/db/schema';
import { seedDemoDataIfEmpty } from '@/db/seed';

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

function DataProvider({ userId, children }: { userId: number; children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);

  const reload = useCallback(async () => {
    const [cats, habs, logs, tars] = await Promise.all([
      db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId)),
      db
        .select()
        .from(habitsTable)
        .where(and(eq(habitsTable.userId, userId), eq(habitsTable.archived, 0))),
      db.select().from(habitLogsTable).where(eq(habitLogsTable.userId, userId)),
      db.select().from(targetsTable).where(eq(targetsTable.userId, userId)),
    ]);
    setCategories(cats);
    setHabits(habs);
    setHabitLogs(logs);
    setTargets(tars);
  }, [userId]);

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

function AuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      await seedDemoDataIfEmpty();
      setBootstrapping(false);
    };
    void bootstrap();
  }, []);

  useEffect(() => {
    if (loading || bootstrapping) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, bootstrapping, segments, router]);

  if (loading || bootstrapping) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#111827" />
      </View>
    );
  }

  const content = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="habit/new" options={{ headerShown: true, title: 'New Habit' }} />
      <Stack.Screen name="habit/[id]/index" options={{ headerShown: true, title: 'Habit' }} />
      <Stack.Screen name="habit/[id]/edit" options={{ headerShown: true, title: 'Edit Habit' }} />
      <Stack.Screen name="category/new" options={{ headerShown: true, title: 'New Category' }} />
      <Stack.Screen name="category/[id]/edit" options={{ headerShown: true, title: 'Edit Category' }} />
    </Stack>
  );

  if (user) {
    return <DataProvider userId={user.id}>{content}</DataProvider>;
  }

  return content;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
  },
});
