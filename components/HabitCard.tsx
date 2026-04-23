import CategoryBadge from '@/components/ui/category-badge';
import { useThemedStyles } from '@/theme/theme-context';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

// Shape of what the card actually draws. Pre-computed by the parent screen so
// the card doesn't have to do any calculations itself.
export type HabitCardModel = {
  id: number;
  name: string;
  description: string | null;
  metricType: string;
  unit: string | null;
  categoryName: string;
  categoryColor: string;
  rangeTotal: number;
  rangeLabel: string;
  // Streaks are measured against the habit's target. `streakUnit` is null
  // when the habit has no per-habit target — nothing to be consecutive about.
  streak: number;
  streakUnit: 'week' | 'month' | null;
};

type Props = {
  habit: HabitCardModel;
  onQuickLog: (habitId: number) => void;
};

export default function HabitCard({ habit, onQuickLog }: Props) {
  const router = useRouter();
  const styles = useThemedStyles((c) => ({
    card: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderRadius: 4,
      borderWidth: 1,
      marginBottom: 10,
      padding: 14,
    },
    cardPressed: {
      opacity: 0.88,
    },
    top: {
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    name: {
      color: c.text,
      flex: 1,
      fontSize: 17,
      fontWeight: '700' as const,
      marginRight: 12,
    },
    description: {
      color: c.textMuted,
      fontSize: 13,
      marginTop: 6,
    },
    row: {
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
      justifyContent: 'space-between' as const,
      marginTop: 10,
    },
    metaGroup: {
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      gap: 6,
    },
    meta: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '600' as const,
    },
    metaDivider: {
      color: c.textPlaceholder,
      fontSize: 12,
    },
    streak: {
      color: c.primaryDark,
      fontSize: 12,
      fontWeight: '800' as const,
    },
    logBtn: {
      backgroundColor: c.primary,
      borderColor: c.primaryDark,
      borderRadius: 4,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    logBtnPressed: {
      opacity: 0.85,
    },
    logBtnLabel: {
      color: c.onPrimary,
      fontSize: 13,
      fontWeight: '700' as const,
    },
  }));

  // Navigate to the details screen when the card is tapped.
  const openDetails = () =>
    router.push({ pathname: '/habit/[id]', params: { id: String(habit.id) } });

  // Pick a sensible unit label — "min" for durations, "times" otherwise.
  const unit = habit.unit ?? (habit.metricType === 'duration' ? 'min' : 'times');
  // Phrase the streak depending on the target period, or mention that there
  // isn't a target yet so the user knows why the number is missing.
  const streakText = habit.streakUnit
    ? `${habit.streak} ${habit.streakUnit}${habit.streak === 1 ? '' : 's'} streak`
    : 'No target set';
  // Full accessibility summary so screen readers get the whole context at once.
  const summary = `${habit.name}, category ${habit.categoryName}, ${habit.rangeTotal} ${unit} in ${habit.rangeLabel}, ${streakText}`;

  return (
    <Pressable
      accessibilityLabel={`${summary}, view details`}
      accessibilityRole="button"
      onPress={openDetails}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      {/* Top row: habit name plus the small quick-log button on the right. */}
      <View style={styles.top}>
        <Text style={styles.name}>{habit.name}</Text>
        <Pressable
          accessibilityLabel={`Quick log ${habit.name}`}
          accessibilityRole="button"
          // Quick log fires without opening the full form — saves a couple of taps.
          onPress={() => onQuickLog(habit.id)}
          style={({ pressed }) => [styles.logBtn, pressed ? styles.logBtnPressed : null]}
        >
          <Text style={styles.logBtnLabel}>+ Log</Text>
        </Pressable>
      </View>

      {/* Description is optional — don't bother rendering an empty line. */}
      {habit.description ? (
        <Text style={styles.description}>{habit.description}</Text>
      ) : null}

      {/* Bottom row shows category badge plus the running total and streak. */}
      <View style={styles.row}>
        <CategoryBadge name={habit.categoryName} color={habit.categoryColor} />
        <View style={styles.metaGroup}>
          <Text style={styles.meta}>
            {Math.round(habit.rangeTotal)} {unit}
          </Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={habit.streakUnit ? styles.streak : styles.meta}>
            {streakText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
