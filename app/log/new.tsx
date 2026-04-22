import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useAuth } from '@/auth/auth-context';
import { db } from '@/db/client';
import { habitLogs as habitLogsTable } from '@/db/schema';
import { addDays, isValidISODate, todayISO, toISO } from '@/lib/date-utils';
import { useThemedStyles } from '@/theme/theme-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DataContext, Habit } from '../_layout';

// Full log form — pick the habit, set a date (or use one of the quick chips),
// enter the value and optional notes. Used from both the habits list and
// the habit details screen.
export default function NewLog() {
  const router = useRouter();
  const { user } = useAuth();
  const context = useContext(DataContext);
  // `habitId` may come in from the detail screen — saves the user re-picking it.
  const params = useLocalSearchParams<{ habitId?: string }>();
  const styles = useThemedStyles((c) => ({
    safeArea: {
      backgroundColor: c.background,
      flex: 1,
      padding: 20,
    },
    content: {
      paddingBottom: 24,
    },
    form: {
      marginBottom: 6,
    },
    label: {
      color: c.textStrong,
      fontSize: 13,
      fontWeight: '600' as const,
      marginBottom: 6,
    },
    chipRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
      marginBottom: 12,
    },
    chip: {
      backgroundColor: c.surface,
      borderColor: c.borderStrong,
      borderRadius: 4,
      borderWidth: 1,
      paddingHorizontal: 10,
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
    quickDates: {
      flexDirection: 'row' as const,
      gap: 8,
      marginBottom: 12,
      marginTop: -4,
    },
    quickChip: {
      backgroundColor: c.surfaceMuted,
      borderColor: c.border,
      borderRadius: 4,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    quickChipText: {
      color: c.text,
      fontSize: 12,
      fontWeight: '600' as const,
    },
    error: {
      color: c.danger,
      fontSize: 13,
      marginBottom: 10,
    },
    spacer: {
      marginTop: 10,
    },
  }));

  const [habitId, setHabitId] = useState<number | null>(
    params.habitId ? Number(params.habitId) : null
  );
  const [date, setDate] = useState(todayISO());
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!context || !user) return null;

  const { habits, setHabitLogs } = context;
  const selectedHabit = habits.find((h: Habit) => h.id === habitId);

  // Run the usual checks, then push the log into the DB and state.
  const save = async () => {
    setError(null);

    // A log needs a habit to attach to, otherwise it has nothing to reference.
    if (!habitId || !selectedHabit) {
      setError('Please select a habit.');
      return;
    }

    // YYYY-MM-DD is the only shape we store, so make sure it's valid.
    if (!isValidISODate(date)) {
      setError('Date must be in YYYY-MM-DD format.');
      return;
    }

    // Reject zero or negative values — they'd just distort the charts.
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Value must be a positive number.');
      return;
    }

    setSaving(true);
    try {
      const [row] = await db
        .insert(habitLogsTable)
        .values({
          habitId,
          userId: user.id,
          date,
          value: numeric,
          notes: notes.trim() || null,
        })
        .returning();

      setHabitLogs((prev) => [...prev, row]);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  // Helper for the "Today / Yesterday / 2 days ago" chips below the date field.
  const setRelativeDate = (offset: number) => {
    setDate(toISO(addDays(new Date(), offset)));
  };

  const unitHint = selectedHabit?.unit
    ? selectedHabit.unit
    : selectedHabit?.metricType === 'duration'
      ? 'minutes'
      : 'times';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="New log" subtitle="Record activity for a habit." />

        <View style={styles.form}>
          <Text style={styles.label}>Habit</Text>
          <View style={styles.chipRow}>
            {habits.map((habit: Habit) => {
              const selected = habit.id === habitId;
              return (
                <Pressable
                  key={habit.id}
                  accessibilityLabel={`Select habit ${habit.name}`}
                  accessibilityRole="button"
                  onPress={() => setHabitId(habit.id)}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                >
                  <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                    {habit.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <FormField
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />
          <View style={styles.quickDates}>
            <Pressable
              accessibilityLabel="Set date to today"
              accessibilityRole="button"
              onPress={() => setRelativeDate(0)}
              style={styles.quickChip}
            >
              <Text style={styles.quickChipText}>Today</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Set date to yesterday"
              accessibilityRole="button"
              onPress={() => setRelativeDate(-1)}
              style={styles.quickChip}
            >
              <Text style={styles.quickChipText}>Yesterday</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Set date two days ago"
              accessibilityRole="button"
              onPress={() => setRelativeDate(-2)}
              style={styles.quickChip}
            >
              <Text style={styles.quickChipText}>2 days ago</Text>
            </Pressable>
          </View>

          <FormField
            label={`Value (${unitHint})`}
            value={value}
            onChangeText={setValue}
            placeholder={selectedHabit?.metricType === 'duration' ? '30' : '1'}
            keyboardType="numeric"
          />

          <FormField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            multiline
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <PrimaryButton label={saving ? 'Saving…' : 'Save log'} onPress={save} disabled={saving} />
        <View style={styles.spacer}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
