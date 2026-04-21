import EmptyState from '@/components/ui/empty-state';
import ScreenHeader from '@/components/ui/screen-header';
import { useContext, useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { Category, DataContext, Habit, HabitLog, Target } from '../_layout';

type Range = 'week' | 'month';

function rangeStart(range: Range): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (range === 'week') {
    const diff = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - diff);
  } else {
    start.setDate(1);
  }

  return start;
}

export default function InsightsScreen() {
  const context = useContext(DataContext);
  const [range, setRange] = useState<Range>('week');

  if (!context) return null;

  const { habits, categories, habitLogs, targets } = context;

  const periodStart = useMemo(() => rangeStart(range), [range]);

  const scopedLogs = useMemo(
    () => habitLogs.filter((log: HabitLog) => new Date(log.date) >= periodStart),
    [habitLogs, periodStart]
  );

  const totalsByCategory = useMemo(() => {
    const map = new Map<number, number>();

    for (const log of scopedLogs) {
      const habit = habits.find((h: Habit) => h.id === log.habitId);
      if (!habit) continue;
      map.set(habit.categoryId, (map.get(habit.categoryId) ?? 0) + log.value);
    }

    return map;
  }, [scopedLogs, habits]);

  const totalTracked = useMemo(
    () => scopedLogs.reduce((acc: number, log: HabitLog) => acc + log.value, 0),
    [scopedLogs]
  );

  const chartCategories = categories.filter((c) => (totalsByCategory.get(c.id) ?? 0) > 0);

  const chartData = {
    labels: chartCategories.map((c: Category) =>
      c.name.length > 6 ? c.name.slice(0, 6) : c.name
    ),
    datasets: [
      {
        data: chartCategories.map((c: Category) => totalsByCategory.get(c.id) ?? 0),
      },
    ],
  };

  const relevantTargets = targets.filter((t: Target) => {
    if (range === 'week') return t.period === 'weekly';
    return t.period === 'monthly';
  });

  const screenWidth = Dimensions.get('window').width - 36;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Insights" subtitle="Aggregated view of your logs" />

        <View style={styles.pills}>
          {(['week', 'month'] as Range[]).map((value) => {
            const selected = range === value;
            return (
              <Pressable
                key={value}
                accessibilityLabel={`Show ${value}`}
                accessibilityRole="button"
                onPress={() => setRange(value)}
                style={[styles.pill, selected ? styles.pillSelected : null]}
              >
                <Text style={[styles.pillText, selected ? styles.pillTextSelected : null]}>
                  {value === 'week' ? 'This week' : 'This month'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total tracked</Text>
          <Text style={styles.summaryValue}>{Math.round(totalTracked)}</Text>
        </View>

        {chartCategories.length === 0 ? (
          <EmptyState
            title="No data yet"
            message="Log a habit to see your insights come to life."
          />
        ) : (
          <View style={styles.chartCard}>
            <BarChart
              data={chartData}
              width={screenWidth}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: () => '#EAB308',
                labelColor: () => '#4B5563',
                propsForBackgroundLines: { stroke: '#E5E7EB' },
              }}
              style={styles.chart}
            />
          </View>
        )}

        {relevantTargets.length > 0 ? (
          <View style={styles.targets}>
            <Text style={styles.sectionTitle}>Targets</Text>
            {relevantTargets.map((target: Target) => {
              const progress = target.habitId
                ? scopedLogs
                    .filter((l: HabitLog) => l.habitId === target.habitId)
                    .reduce((acc: number, l: HabitLog) => acc + l.value, 0)
                : target.categoryId
                  ? Array.from(scopedLogs).reduce((acc: number, l: HabitLog) => {
                      const habit = habits.find((h: Habit) => h.id === l.habitId);
                      return habit?.categoryId === target.categoryId ? acc + l.value : acc;
                    }, 0)
                  : 0;

              const label = target.habitId
                ? habits.find((h) => h.id === target.habitId)?.name ?? 'Habit'
                : target.categoryId
                  ? categories.find((c) => c.id === target.categoryId)?.name ?? 'Category'
                  : 'Target';

              const pct = Math.min(1, progress / target.targetValue);
              const exceeded = progress >= target.targetValue;

              return (
                <View key={target.id} style={styles.targetRow}>
                  <View style={styles.targetHeader}>
                    <Text style={styles.targetLabel}>{label}</Text>
                    <Text style={styles.targetValue}>
                      {Math.round(progress)} / {target.targetValue}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${pct * 100}%` },
                        exceeded ? styles.progressFillDone : null,
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
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
  content: {
    paddingBottom: 24,
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    backgroundColor: '#FFFFFF',
    borderColor: '#9CA3AF',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillSelected: {
    backgroundColor: '#FACC15',
    borderColor: '#EAB308',
  },
  pillText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextSelected: {
    fontWeight: '800',
  },
  summary: {
    backgroundColor: '#FAFAF7',
    borderColor: '#E5E7EB',
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 16,
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
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
  },
  chart: {
    borderRadius: 4,
  },
  targets: {
    marginTop: 8,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  targetRow: {
    marginBottom: 12,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  targetLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  targetValue: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#EAB308',
    height: '100%',
  },
  progressFillDone: {
    backgroundColor: '#10B981',
  },
});
