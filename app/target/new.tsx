import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useAuth } from '@/auth/auth-context';
import { db } from '@/db/client';
import { targets as targetsTable } from '@/db/schema';
import { useThemedStyles } from '@/theme/theme-context';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, DataContext, Habit } from '../_layout';

// Targets can be set against a specific habit or a whole category.
type Scope = 'habit' | 'category';
// Targets reset either every Monday or on the first of the month.
type Period = 'weekly' | 'monthly';

// Form for creating a new target. Scope switches the picker between
// habits and categories; the rest of the form stays the same.
export default function NewTarget() {
  const router = useRouter();
  const { user } = useAuth();
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
    label: {
      color: c.textStrong,
      fontSize: 13,
      fontWeight: '600' as const,
      marginBottom: 6,
      marginTop: 4,
    },
    chipRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
      marginBottom: 12,
    },
    chip: {
      alignItems: 'center' as const,
      backgroundColor: c.surface,
      borderColor: c.borderStrong,
      borderRadius: 4,
      borderWidth: 1,
      flexDirection: 'row' as const,
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
    dot: {
      borderRadius: 4,
      height: 10,
      marginRight: 6,
      width: 10,
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

  const [scope, setScope] = useState<Scope>('habit');
  const [period, setPeriod] = useState<Period>('weekly');
  const [habitId, setHabitId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!context || !user) return null;

  const { habits, categories, setTargets } = context;

  // Validate the scope choice plus the numeric value, then insert the target.
  const save = async () => {
    setError(null);

    // Make sure the chosen scope actually has a selection behind it.
    if (scope === 'habit' && !habitId) {
      setError('Please select a habit.');
      return;
    }

    if (scope === 'category' && !categoryId) {
      setError('Please select a category.');
      return;
    }

    // Zero or negative targets would make the progress bar meaningless.
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Target value must be a positive number.');
      return;
    }

    setSaving(true);
    try {
      // Only one of habitId/categoryId is populated — the other stays null.
      const [row] = await db
        .insert(targetsTable)
        .values({
          userId: user.id,
          habitId: scope === 'habit' ? habitId : null,
          categoryId: scope === 'category' ? categoryId : null,
          period,
          targetValue: numeric,
        })
        .returning();

      setTargets((prev) => [...prev, row]);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="New target" subtitle="Set a weekly or monthly goal." />

        <View style={styles.form}>
          <Text style={styles.label}>Scope</Text>
          <View style={styles.chipRow}>
            {(['habit', 'category'] as Scope[]).map((value) => {
              const selected = scope === value;
              return (
                <Pressable
                  key={value}
                  accessibilityLabel={`Scope ${value}`}
                  accessibilityRole="button"
                  onPress={() => setScope(value)}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                >
                  <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                    {value === 'habit' ? 'Per habit' : 'Per category'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {scope === 'habit' ? (
            <>
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
            </>
          ) : (
            <>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipRow}>
                {categories.map((category: Category) => {
                  const selected = category.id === categoryId;
                  return (
                    <Pressable
                      key={category.id}
                      accessibilityLabel={`Select category ${category.name}`}
                      accessibilityRole="button"
                      onPress={() => setCategoryId(category.id)}
                      style={[styles.chip, selected ? styles.chipSelected : null]}
                    >
                      <View style={[styles.dot, { backgroundColor: category.color }]} />
                      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.label}>Period</Text>
          <View style={styles.chipRow}>
            {(['weekly', 'monthly'] as Period[]).map((value) => {
              const selected = period === value;
              return (
                <Pressable
                  key={value}
                  accessibilityLabel={`Period ${value}`}
                  accessibilityRole="button"
                  onPress={() => setPeriod(value)}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                >
                  <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                    {value === 'weekly' ? 'Weekly' : 'Monthly'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <FormField
            label="Target value"
            value={value}
            onChangeText={setValue}
            placeholder="e.g. 40"
            keyboardType="numeric"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <PrimaryButton label={saving ? 'Saving…' : 'Save target'} onPress={save} disabled={saving} />
        <View style={styles.spacer}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
