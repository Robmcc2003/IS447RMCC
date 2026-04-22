import EmptyState from '@/components/ui/empty-state';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import {
  RangeKey,
  rangeLabel,
  rangeStart,
  startOfMonth,
  startOfWeek,
} from '@/lib/date-utils';
import { useTheme, useThemedStyles } from '@/theme/theme-context';
import { useRouter } from 'expo-router';
import { useContext, useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { Category, DataContext, Habit, HabitLog, Target } from '../_layout';

// Ranges on offer — "week" and "month" match the target periods, the rest
// are rolling windows for the chart.
const RANGE_OPTIONS: RangeKey[] = ['week', 'month', '7d', '30d', '90d'];

// The dashboard-y screen: big total, a chart by category, and a list of
// targets with progress bars. Everything keys off the selected range.
export default function InsightsScreen() {
  const router = useRouter();
  const context = useContext(DataContext);
  // Need the raw palette for the chart — the library wants plain hex strings.
  const { colors } = useTheme();
  const styles = useThemedStyles((c) => ({
    safeArea: {
      backgroundColor: c.background,
      flex: 1,
      paddingHorizontal: 18,
      paddingTop: 10,
    },
    content: {
      paddingBottom: 24,
    },
    filterLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
      marginBottom: 6,
      textTransform: 'uppercase' as const,
    },
    pills: {
      marginBottom: 16,
      maxHeight: 42,
    },
    pillsContent: {
      gap: 8,
    },
    pill: {
      backgroundColor: c.surface,
      borderColor: c.borderStrong,
      borderRadius: 4,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    pillSelected: {
      backgroundColor: c.primary,
      borderColor: c.primaryDark,
    },
    pillText: {
      color: c.text,
      fontSize: 13,
      fontWeight: '600' as const,
    },
    pillTextSelected: {
      color: c.onPrimary,
      fontWeight: '800' as const,
    },
    summary: {
      backgroundColor: c.surfaceMuted,
      borderColor: c.border,
      borderRadius: 4,
      borderWidth: 1,
      marginBottom: 16,
      padding: 16,
    },
    summaryLabel: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    summaryValue: {
      color: c.text,
      fontSize: 32,
      fontWeight: '800' as const,
      marginTop: 4,
    },
    summarySub: {
      color: c.textSubtle,
      fontSize: 12,
      marginTop: 2,
    },
    chartCard: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderRadius: 4,
      borderWidth: 1,
      marginBottom: 16,
      padding: 8,
    },
    chart: {
      borderRadius: 4,
    },
    targetsHeader: {
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 10,
      marginTop: 8,
    },
    sectionTitle: {
      color: c.text,
      fontSize: 16,
      fontWeight: '800' as const,
    },
  }));
  const [range, setRange] = useState<RangeKey>('week');

  if (!context) return null;

  const { habits, categories, habitLogs, targets } = context;

  // "all" has no real start, so just use the epoch and let everything through.
  const periodStart = useMemo(() => rangeStart(range) ?? new Date(0), [range]);

  // Only keep logs that fall inside the chosen window.
  const scopedLogs = useMemo(
    () => habitLogs.filter((log: HabitLog) => new Date(log.date) >= periodStart),
    [habitLogs, periodStart]
  );

  // Roll the logs up by category id — that's what the chart bars represent.
  const totalsByCategory = useMemo(() => {
    const map = new Map<number, number>();

    for (const log of scopedLogs) {
      const habit = habits.find((h: Habit) => h.id === log.habitId);
      if (!habit) continue;
      map.set(habit.categoryId, (map.get(habit.categoryId) ?? 0) + log.value);
    }

    return map;
  }, [scopedLogs, habits]);

  // Grand total across the whole range — shown as the big headline number.
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

  const screenWidth = Dimensions.get('window').width - 36;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Insights" subtitle="Aggregated view of your logs" />

        <Text style={styles.filterLabel}>Range</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pills}
          contentContainerStyle={styles.pillsContent}
        >
          {RANGE_OPTIONS.map((value) => {
            const selected = range === value;
            return (
              <Pressable
                key={value}
                accessibilityLabel={`Show ${rangeLabel(value)}`}
                accessibilityRole="button"
                onPress={() => setRange(value)}
                style={[styles.pill, selected ? styles.pillSelected : null]}
              >
                <Text style={[styles.pillText, selected ? styles.pillTextSelected : null]}>
                  {rangeLabel(value)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total tracked</Text>
          <Text style={styles.summaryValue}>{Math.round(totalTracked)}</Text>
          <Text style={styles.summarySub}>
            across {scopedLogs.length} log{scopedLogs.length === 1 ? '' : 's'}
          </Text>
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
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: () => colors.primaryDark,
                labelColor: () => colors.chartLabel,
                propsForBackgroundLines: { stroke: colors.chartGrid },
              }}
              style={styles.chart}
            />
          </View>
        )}

        <View style={styles.targetsHeader}>
          <Text style={styles.sectionTitle}>Targets</Text>
          <PrimaryButton
            label="Add target"
            compact
            onPress={() => router.push('/target/new')}
          />
        </View>

        {targets.length === 0 ? (
          <EmptyState
            title="No targets yet"
            message="Create weekly or monthly targets for habits or whole categories."
          />
        ) : (
          targets.map((target: Target) => (
            <TargetRow
              key={target.id}
              target={target}
              habits={habits}
              categories={categories}
              habitLogs={habitLogs}
              onEdit={() =>
                router.push({
                  pathname: '/target/[id]/edit',
                  params: { id: String(target.id) },
                })
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type TargetRowProps = {
  target: Target;
  habits: Habit[];
  categories: Category[];
  habitLogs: HabitLog[];
  onEdit: () => void;
};

// One row per target. Works out progress, draws a little bar, and shows
// either "X to go" or "Exceeded by Y" depending on how things are going.
function TargetRow({ target, habits, categories, habitLogs, onEdit }: TargetRowProps) {
  const styles = useThemedStyles((c) => ({
    targetRow: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderRadius: 4,
      borderWidth: 1,
      marginBottom: 10,
      padding: 12,
    },
    targetRowPressed: {
      opacity: 0.88,
    },
    targetHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 6,
    },
    targetTitleGroup: {
      alignItems: 'baseline' as const,
      flexDirection: 'row' as const,
      gap: 8,
    },
    targetLabel: {
      color: c.text,
      fontSize: 14,
      fontWeight: '700' as const,
    },
    targetPeriod: {
      color: c.textSubtle,
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    targetValue: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '600' as const,
    },
    progressTrack: {
      backgroundColor: c.border,
      borderRadius: 4,
      height: 8,
      overflow: 'hidden' as const,
    },
    progressFill: {
      backgroundColor: c.primaryDark,
      height: '100%' as const,
    },
    progressFillDone: {
      backgroundColor: c.success,
    },
    status: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '700' as const,
      marginTop: 6,
    },
    statusDone: {
      color: c.success,
    },
  }));

  // Targets tick over weekly or monthly — work out when "this period" started.
  const windowStart =
    target.period === 'monthly' ? startOfMonth() : startOfWeek();

  // Only count logs from this period onwards.
  const logsInWindow = habitLogs.filter(
    (l) => new Date(l.date) >= windowStart
  );

  // Progress depends on whether it's per-habit or per-category.
  const progress = target.habitId
    ? logsInWindow.filter((l) => l.habitId === target.habitId).reduce((acc, l) => acc + l.value, 0)
    : target.categoryId
      ? logsInWindow.reduce((acc, l) => {
          const habit = habits.find((h) => h.id === l.habitId);
          return habit?.categoryId === target.categoryId ? acc + l.value : acc;
        }, 0)
      : 0;

  // Label we show is either the habit name or the category name.
  const label = target.habitId
    ? habits.find((h) => h.id === target.habitId)?.name ?? 'Habit'
    : target.categoryId
      ? categories.find((c) => c.id === target.categoryId)?.name ?? 'Category'
      : 'Target';

  // Cap the bar at 100% width even if the target has been exceeded.
  const pct = Math.min(1, progress / target.targetValue);
  const exceeded = progress >= target.targetValue;
  const remaining = Math.max(0, target.targetValue - progress);
  const over = Math.max(0, progress - target.targetValue);

  // Friendly status line — celebratory if over the target, encouraging if not.
  const statusText = exceeded
    ? `Exceeded by ${Math.round(over)}`
    : `${Math.round(remaining)} to go`;

  return (
    <Pressable
      accessibilityLabel={`Edit target for ${label}`}
      accessibilityRole="button"
      onPress={onEdit}
      style={({ pressed }) => [styles.targetRow, pressed ? styles.targetRowPressed : null]}
    >
      <View style={styles.targetHeader}>
        <View style={styles.targetTitleGroup}>
          <Text style={styles.targetLabel}>{label}</Text>
          <Text style={styles.targetPeriod}>{target.period}</Text>
        </View>
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
      <Text style={[styles.status, exceeded ? styles.statusDone : null]}>{statusText}</Text>
    </Pressable>
  );
}
