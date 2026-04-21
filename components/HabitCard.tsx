import CategoryBadge from '@/components/ui/category-badge';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type HabitCardModel = {
  id: number;
  name: string;
  description: string | null;
  metricType: string;
  unit: string | null;
  categoryName: string;
  categoryColor: string;
  weeklyTotal: number;
};

type Props = {
  habit: HabitCardModel;
  onQuickLog: (habitId: number) => void;
};

export default function HabitCard({ habit, onQuickLog }: Props) {
  const router = useRouter();
  const openDetails = () =>
    router.push({ pathname: '/habit/[id]', params: { id: String(habit.id) } });

  const unit = habit.unit ?? (habit.metricType === 'duration' ? 'min' : 'times');
  const summary = `${habit.name}, category ${habit.categoryName}, ${habit.weeklyTotal} ${unit} this week`;

  return (
    <Pressable
      accessibilityLabel={`${summary}, view details`}
      accessibilityRole="button"
      onPress={openDetails}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      <View style={styles.top}>
        <Text style={styles.name}>{habit.name}</Text>
        <Pressable
          accessibilityLabel={`Quick log ${habit.name}`}
          accessibilityRole="button"
          onPress={() => onQuickLog(habit.id)}
          style={({ pressed }) => [styles.logBtn, pressed ? styles.logBtnPressed : null]}
        >
          <Text style={styles.logBtnLabel}>+ Log</Text>
        </Pressable>
      </View>

      {habit.description ? (
        <Text style={styles.description}>{habit.description}</Text>
      ) : null}

      <View style={styles.row}>
        <CategoryBadge name={habit.categoryName} color={habit.categoryColor} />
        <Text style={styles.meta}>
          {habit.weeklyTotal} {unit} / week
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  cardPressed: {
    opacity: 0.88,
  },
  top: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    color: '#111827',
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    marginRight: 12,
  },
  description: {
    color: '#4B5563',
    fontSize: 13,
    marginTop: 6,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  meta: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
  logBtn: {
    backgroundColor: '#FACC15',
    borderColor: '#EAB308',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logBtnPressed: {
    opacity: 0.85,
  },
  logBtnLabel: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
});
