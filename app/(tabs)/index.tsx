import HabitCard, { HabitCardModel } from '@/components/HabitCard';
import EmptyState from '@/components/ui/empty-state';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { habitLogs as habitLogsTable } from '@/db/schema';
import {
  computeStreak,
  RangeKey,
  rangeLabel,
  rangeStart,
  todayISO,
} from '@/lib/date-utils';
import { useTheme, useThemedStyles } from '@/theme/theme-context';
import { useRouter } from 'expo-router';
import { useContext, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, DataContext, Habit, HabitLog } from '../_layout';

// Date windows the user can flick between on the habits list.
const RANGE_OPTIONS: RangeKey[] = ['7d', '30d', '90d', 'all'];

// The main landing screen — shows all habits with a search box, category
// filter chips, a date range picker and a quick-log button on each card.
export default function HabitsScreen() {
  const router = useRouter();
  const context = useContext(DataContext);
  const { colors } = useTheme();
  const styles = useThemedStyles((c) => ({
    safeArea: {
      backgroundColor: c.background,
      flex: 1,
      paddingHorizontal: 18,
      paddingTop: 10,
    },
    actionRow: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    actionItem: {
      flex: 1,
    },
    searchInput: {
      backgroundColor: c.inputBackground,
      borderColor: c.inputBorder,
      borderRadius: 4,
      borderWidth: 1,
      color: c.text,
      marginTop: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    filterLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
      marginTop: 10,
      textTransform: 'uppercase' as const,
    },
    filters: {
      marginTop: 6,
      maxHeight: 40,
    },
    filtersContent: {
      gap: 8,
      paddingVertical: 2,
    },
    chip: {
      backgroundColor: c.surface,
      borderColor: c.borderStrong,
      borderRadius: 4,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipSelected: {
      backgroundColor: c.primary,
      borderColor: c.primaryDark,
    },
    chipText: {
      color: c.text,
      fontSize: 13,
      fontWeight: '600' as const,
    },
    chipTextSelected: {
      color: c.onPrimary,
      fontWeight: '800' as const,
    },
    listContent: {
      paddingBottom: 24,
      paddingTop: 12,
    },
  }));
  // Local filter state — search text, which category chip is on, and the range.
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [range, setRange] = useState<RangeKey>('7d');

  // Work out where the date window starts (null for "all").
  const rangeStartDate = useMemo(() => rangeStart(range), [range]);

  // Trim the logs to the range the user's picked, or keep the whole lot.
  const scopedLogs = useMemo(
    () =>
      rangeStartDate
        ? (context?.habitLogs ?? []).filter((l: HabitLog) => new Date(l.date) >= rangeStartDate)
        : (context?.habitLogs ?? []),
    [context?.habitLogs, rangeStartDate]
  );

  // Tot up the value per habit — gives us the "X min this week" bit on cards.
  const totalsByHabit = useMemo(() => {
    const map = new Map<number, number>();
    for (const log of scopedLogs) {
      map.set(log.habitId, (map.get(log.habitId) ?? 0) + log.value);
    }
    return map;
  }, [scopedLogs]);

  // Streaks always use the full log history — a streak shouldn't shrink just
  // because you flipped the range dropdown.
  const streaksByHabit = useMemo(() => {
    const map = new Map<number, number>();
    if (!context) return map;
    for (const habit of context.habits) {
      const dates = context.habitLogs
        .filter((l: HabitLog) => l.habitId === habit.id)
        .map((l) => l.date);
      map.set(habit.id, computeStreak(dates));
    }
    return map;
  }, [context]);

  if (!context) return null;

  const { habits, categories, setHabitLogs } = context;

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
      rangeTotal: totalsByHabit.get(habit.id) ?? 0,
      rangeLabel: rangeLabel(range).toLowerCase(),
      streak: streaksByHabit.get(habit.id) ?? 0,
    };
  });

  // Fired when the user taps the little "+ Log" button on a card. Bungs in a
  // sensible default value (15 mins for durations, 1 for count habits) and
  // pushes the new log into state so the UI updates straight away.
  const quickLog = async (habitId: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const value = habit.metricType === 'duration' ? 15 : 1;

    const [row] = await db
      .insert(habitLogsTable)
      .values({ habitId, userId: habit.userId, date: todayISO(), value })
      .returning();

    setHabitLogs((prev: HabitLog[]) => [...prev, row]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Habits" subtitle={`${habits.length} active`} />

      <View style={styles.actionRow}>
        <View style={styles.actionItem}>
          <PrimaryButton label="Add habit" onPress={() => router.push('/habit/new')} />
        </View>
        <View style={styles.actionItem}>
          <PrimaryButton
            label="New log"
            variant="secondary"
            onPress={() => router.push('/log/new')}
          />
        </View>
      </View>

      <TextInput
        accessibilityLabel="Search habits"
        onChangeText={setSearchQuery}
        placeholder="Search by name or description"
        placeholderTextColor={colors.textPlaceholder}
        style={styles.searchInput}
        value={searchQuery}
      />

      <Text style={styles.filterLabel}>Date range</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
      >
        {RANGE_OPTIONS.map((key) => {
          const selected = range === key;
          return (
            <Pressable
              key={key}
              accessibilityLabel={`Range ${rangeLabel(key)}`}
              accessibilityRole="button"
              onPress={() => setRange(key)}
              style={[styles.chip, selected ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                {rangeLabel(key)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.filterLabel}>Category</Text>
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
