import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import CategoryBadge from '@/components/ui/category-badge';
import { db } from '@/db/client';
import { habits as habitsTable, habitLogs as habitLogsTable } from '@/db/schema';
import { computeStreak, todayISO } from '@/lib/date-utils';
import { useThemedStyles } from '@/theme/theme-context';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DataContext, Habit, HabitLog } from '../../_layout';

// Detail screen for a single habit. Shows lifetime totals, current streak,
// a few quick-log shortcuts and the recent logs list.
export default function HabitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(DataContext);
  const styles = useThemedStyles((c) => ({
    safeArea: {
      backgroundColor: c.background,
      flex: 1,
      padding: 20,
    },
    content: {
      paddingBottom: 24,
    },
    tags: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 6,
      marginBottom: 16,
    },
    metricTag: {
      backgroundColor: c.surfaceMuted,
      borderColor: c.border,
      borderRadius: 4,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    metricLabel: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '600' as const,
      textTransform: 'capitalize' as const,
    },
    statsRow: {
      flexDirection: 'row' as const,
      gap: 8,
      marginBottom: 20,
    },
    statCard: {
      backgroundColor: c.surfaceMuted,
      borderColor: c.border,
      borderRadius: 4,
      borderWidth: 1,
      flex: 1,
      padding: 14,
    },
    statLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    statValue: {
      color: c.text,
      fontSize: 24,
      fontWeight: '800' as const,
      marginTop: 4,
    },
    statUnit: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '600' as const,
    },
    sectionTitle: {
      color: c.text,
      fontSize: 16,
      fontWeight: '800' as const,
      marginBottom: 8,
      marginTop: 8,
    },
    quickRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
      marginBottom: 16,
    },
    logRow: {
      alignItems: 'center' as const,
      borderBottomColor: c.border,
      borderBottomWidth: 1,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 10,
    },
    logRowPressed: {
      backgroundColor: c.surfaceMuted,
    },
    logBody: {
      flex: 1,
      marginRight: 10,
    },
    logDate: {
      color: c.text,
      fontSize: 14,
      fontWeight: '700' as const,
    },
    logNotes: {
      color: c.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    logValue: {
      color: c.text,
      fontSize: 13,
      fontWeight: '700' as const,
    },
    empty: {
      color: c.textSubtle,
      fontSize: 13,
    },
    actions: {
      marginTop: 20,
    },
    spacer: {
      marginTop: 10,
    },
  }));

  if (!context) return null;

  const { habits, categories, habitLogs, setHabits, setHabitLogs } = context;
  const habit = habits.find((h: Habit) => h.id === Number(id));

  if (!habit) return null;

  // Latest logs at the top — localeCompare works nicely on ISO date strings.
  const category = categories.find((c) => c.id === habit.categoryId);
  const logs = habitLogs
    .filter((l: HabitLog) => l.habitId === habit.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Everything-ever total and the current streak.
  const total = logs.reduce((acc, l) => acc + l.value, 0);
  const streak = computeStreak(logs.map((l) => l.date));
  const unit = habit.unit ?? (habit.metricType === 'duration' ? 'min' : 'times');

  // Small helper for the +X buttons — logs today's date with the given amount.
  const quickLog = async (amount: number) => {
    const [row] = await db
      .insert(habitLogsTable)
      .values({ habitId: habit.id, userId: habit.userId, date: todayISO(), value: amount })
      .returning();
    setHabitLogs((prev) => [...prev, row]);
  };

  // Delete the habit and all its logs — show a confirmation first.
  const deleteHabit = () => {
    Alert.alert('Delete habit', `Delete "${habit.name}" and all its logs?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.delete(habitsTable).where(eq(habitsTable.id, habit.id));
          setHabits((prev) => prev.filter((h) => h.id !== habit.id));
          setHabitLogs((prev) => prev.filter((l) => l.habitId !== habit.id));
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={habit.name} subtitle={habit.description ?? 'No description'} />

        <View style={styles.tags}>
          {category ? <CategoryBadge name={category.name} color={category.color} /> : null}
          <View style={styles.metricTag}>
            <Text style={styles.metricLabel}>{habit.metricType}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Lifetime total</Text>
            <Text style={styles.statValue}>
              {Math.round(total)} <Text style={styles.statUnit}>{unit}</Text>
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Current streak</Text>
            <Text style={styles.statValue}>
              {streak} <Text style={styles.statUnit}>day{streak === 1 ? '' : 's'}</Text>
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick log</Text>
        <View style={styles.quickRow}>
          <PrimaryButton
            label={habit.metricType === 'duration' ? '+15 min' : '+1'}
            compact
            onPress={() => quickLog(habit.metricType === 'duration' ? 15 : 1)}
          />
          <PrimaryButton
            label={habit.metricType === 'duration' ? '+30 min' : '+5'}
            compact
            variant="secondary"
            onPress={() => quickLog(habit.metricType === 'duration' ? 30 : 5)}
          />
          <PrimaryButton
            label="New log…"
            compact
            variant="secondary"
            onPress={() =>
              router.push({ pathname: '/log/new', params: { habitId: String(habit.id) } })
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Recent logs</Text>
        {logs.length === 0 ? (
          <Text style={styles.empty}>No logs yet. Tap “New log…” above to record one.</Text>
        ) : (
          logs.slice(0, 15).map((log) => (
            <Pressable
              key={log.id}
              accessibilityLabel={`Edit log from ${log.date}, ${log.value} ${unit}`}
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/log/[id]/edit', params: { id: String(log.id) } })
              }
              style={({ pressed }) => [styles.logRow, pressed ? styles.logRowPressed : null]}
            >
              <View style={styles.logBody}>
                <Text style={styles.logDate}>{log.date}</Text>
                {log.notes ? <Text style={styles.logNotes}>{log.notes}</Text> : null}
              </View>
              <Text style={styles.logValue}>
                {log.value} {unit}
              </Text>
            </Pressable>
          ))
        )}

        <View style={styles.actions}>
          <PrimaryButton
            label="Edit habit"
            onPress={() =>
              router.push({ pathname: '/habit/[id]/edit', params: { id: String(habit.id) } })
            }
          />
          <View style={styles.spacer}>
            <PrimaryButton label="Delete habit" variant="danger" onPress={deleteHabit} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
