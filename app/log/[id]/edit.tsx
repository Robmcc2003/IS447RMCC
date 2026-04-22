import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { habitLogs as habitLogsTable } from '@/db/schema';
import { isValidISODate } from '@/lib/date-utils';
import { useThemedStyles } from '@/theme/theme-context';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DataContext, HabitLog } from '../../_layout';

// Edit or delete a log entry. Linked to from the recent-logs list on
// the habit details screen.
export default function EditLog() {
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
    form: {
      marginBottom: 6,
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

  const [date, setDate] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Find the log and its parent habit so we can show the unit label.
  const log = context?.habitLogs.find((l: HabitLog) => l.id === Number(id));
  const habit = context?.habits.find((h) => h.id === log?.habitId);

  // Prefill the form once the log's loaded.
  useEffect(() => {
    if (!log) return;
    setDate(log.date);
    setValue(String(log.value));
    setNotes(log.notes ?? '');
  }, [log]);

  if (!context || !log || !habit) return null;

  const { setHabitLogs } = context;

  const save = async () => {
    setError(null);

    if (!isValidISODate(date)) {
      setError('Date must be in YYYY-MM-DD format.');
      return;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Value must be a positive number.');
      return;
    }

    setSaving(true);
    try {
      await db
        .update(habitLogsTable)
        .set({ date, value: numeric, notes: notes.trim() || null })
        .where(eq(habitLogsTable.id, log.id));

      setHabitLogs((prev) =>
        prev.map((l) =>
          l.id === log.id ? { ...l, date, value: numeric, notes: notes.trim() || null } : l
        )
      );
      router.back();
    } finally {
      setSaving(false);
    }
  };

  // Delete the log entry. Confirms first so the user can't delete by accident.
  const remove = () => {
    Alert.alert('Delete log', 'This entry will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.delete(habitLogsTable).where(eq(habitLogsTable.id, log.id));
          setHabitLogs((prev) => prev.filter((l) => l.id !== log.id));
          router.back();
        },
      },
    ]);
  };

  const unitHint = habit.unit ?? (habit.metricType === 'duration' ? 'minutes' : 'times');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Edit log" subtitle={habit.name} />

        <View style={styles.form}>
          <FormField
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />
          <FormField
            label={`Value (${unitHint})`}
            value={value}
            onChangeText={setValue}
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

        <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} onPress={save} disabled={saving} />
        <View style={styles.spacer}>
          <PrimaryButton label="Delete log" variant="danger" onPress={remove} />
        </View>
        <View style={styles.spacer}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
