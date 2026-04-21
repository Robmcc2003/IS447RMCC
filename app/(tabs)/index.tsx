import HabitCard, { HabitCardModel } from '@/components/HabitCard';
import EmptyState from '@/components/ui/empty-state';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { habitLogs as habitLogsTable } from '@/db/schema';
import { useRouter } from 'expo-router';
import { useContext, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, DataContext, Habit, HabitLog } from '../_layout';

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = (day + 6) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function HabitsScreen() {
  const router = useRouter();
  const context = useContext(DataContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');

  if (!context) return null;

  const { habits, categories, habitLogs, setHabitLogs } = context;

  const weekStart = useMemo(() => startOfWeek(), []);

  const weeklyTotals = useMemo(() => {
    const totals = new Map<number, number>();
    for (const log of habitLogs) {
      if (new Date(log.date) >= weekStart) {
        totals.set(log.habitId, (totals.get(log.habitId) ?? 0) + log.value);
      }
    }
    return totals;
  }, [habitLogs, weekStart]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = habits.filter((habit: Habit) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      habit.name.toLowerCase().includes(normalizedQuery) ||
      (habit.description ?? '').toLowerCase().includes(normalizedQuery);

    const matchesCategory =
      selectedCategoryId === 'all' || habit.categoryId === selectedCategoryId;

    return matchesSearch && matchesCategory;
  });

  const cards: HabitCardModel[] = filtered.map((habit) => {
    const category = categories.find((c: Category) => c.id === habit.categoryId);
    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      metricType: habit.metricType,
      unit: habit.unit,
      categoryName: category?.name ?? 'Uncategorized',
      categoryColor: category?.color ?? '#9CA3AF',
      weeklyTotal: weeklyTotals.get(habit.id) ?? 0,
    };
  });

  const quickLog = async (habitId: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const today = new Date().toISOString().slice(0, 10);
    const value = habit.metricType === 'duration' ? 15 : 1;

    const [row] = await db
      .insert(habitLogsTable)
      .values({ habitId, userId: habit.userId, date: today, value })
      .returning();

    setHabitLogs((prev: HabitLog[]) => [...prev, row]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Habits" subtitle={`${habits.length} active`} />

      <PrimaryButton label="Add habit" onPress={() => router.push('/habit/new')} />

      <TextInput
        accessibilityLabel="Search habits"
        onChangeText={setSearchQuery}
        placeholder="Search by name or description"
        placeholderTextColor="#9CA3AF"
        style={styles.searchInput}
        value={searchQuery}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
      >
        {['all', ...categories.map((c) => c.id)].map((key) => {
          const isAll = key === 'all';
          const category = isAll ? null : categories.find((c) => c.id === key);
          const selected = selectedCategoryId === key;
          const label = isAll ? 'All' : category?.name ?? '';

          return (
            <Pressable
              key={String(key)}
              accessibilityLabel={`Filter by ${label}`}
              accessibilityRole="button"
              onPress={() => setSelectedCategoryId(key as number | 'all')}
              style={[styles.chip, selected ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {cards.length === 0 ? (
          <EmptyState
            title="No habits yet"
            message="Create a habit to start tracking your progress."
          />
        ) : (
          cards.map((card) => (
            <HabitCard key={card.id} habit={card} onQuickLog={quickLog} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 4,
    borderWidth: 1,
    color: '#111827',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filters: {
    marginTop: 10,
    maxHeight: 42,
  },
  filtersContent: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#9CA3AF',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipSelected: {
    backgroundColor: '#FACC15',
    borderColor: '#EAB308',
  },
  chipText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#111827',
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 12,
  },
});
