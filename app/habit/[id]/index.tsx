import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import CategoryBadge from '@/components/ui/category-badge';
import { db } from '@/db/client';
import { habits as habitsTable, habitLogs as habitLogsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DataContext, Habit, HabitLog } from '../../_layout';

export default function HabitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(DataContext);

  if (!context) return null;

  const { habits, categories, habitLogs, setHabits, setHabitLogs } = context;
  const habit = habits.find((h: Habit) => h.id === Number(id));

  if (!habit) return null;

  const category = categories.find((c) => c.id === habit.categoryId);
  const logs = habitLogs
    .filter((l: HabitLog) => l.habitId === habit.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const total = logs.reduce((acc, l) => acc + l.value, 0);
  const unit = habit.unit ?? (habit.metricType === 'duration' ? 'min' : 'times');

  const logValue = async (amount: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const [row] = await db
      .insert(habitLogsTable)
      .values({ habitId: habit.id, userId: habit.userId, date: today, value: amount })
      .returning();
    setHabitLogs((prev) => [...prev, row]);
  };

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

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Lifetime total</Text>
          <Text style={styles.summaryValue}>
            {Math.round(total)} {unit}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Quick log</Text>
        <View style={styles.quickRow}>
          <PrimaryButton
            label={habit.metricType === 'duration' ? '+15 min' : '+1'}
            compact
            onPress={() => logValue(habit.metricType === 'duration' ? 15 : 1)}
          />
          <PrimaryButton
            label={habit.metricType === 'duration' ? '+30 min' : '+5'}
            compact
            variant="secondary"
            onPress={() => logValue(habit.metricType === 'duration' ? 30 : 5)}
          />
        </View>

        <Text style={styles.sectionTitle}>Recent logs</Text>
        {logs.length === 0 ? (
          <Text style={styles.empty}>No logs yet.</Text>
        ) : (
          logs.slice(0, 10).map((log) => (
            <View key={log.id} style={styles.logRow}>
              <Text style={styles.logDate}>{log.date}</Text>
              <Text style={styles.logValue}>
                {log.value} {unit}
              </Text>
            </View>
          ))
        )}

        <View style={styles.actions}>
          <PrimaryButton
            label="Edit"
            onPress={() =>
              router.push({ pathname: '/habit/[id]/edit', params: { id: String(habit.id) } })
            }
          />
          <View style={styles.spacer}>
            <PrimaryButton label="Delete" variant="danger" onPress={deleteHabit} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    padding: 20,
  },
  content: {
    paddingBottom: 24,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  metricTag: {
    backgroundColor: '#FAFAF7',
    borderColor: '#E5E7EB',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metricLabel: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  summary: {
    backgroundColor: '#FAFAF7',
    borderColor: '#E5E7EB',
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 20,
    padding: 16,
  },
  summaryLabel: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  logRow: {
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  logDate: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  logValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    color: '#6B7280',
    fontSize: 13,
  },
  actions: {
    marginTop: 20,
  },
  spacer: {
    marginTop: 10,
  },
});
