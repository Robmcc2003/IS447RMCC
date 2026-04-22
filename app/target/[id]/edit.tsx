import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { targets as targetsTable } from '@/db/schema';
import { useThemedStyles } from '@/theme/theme-context';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DataContext, Target } from '../../_layout';

// Same period options as when creating — keeps the UI consistent.
type Period = 'weekly' | 'monthly';

// Edit an existing target. Scope (habit vs category) can't be changed —
// delete and create a new one if you want to switch it.
export default function EditTarget() {
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
    label: {
      color: c.textStrong,
      fontSize: 13,
      fontWeight: '600' as const,
      marginBottom: 6,
    },
    chipRow: {
      flexDirection: 'row' as const,
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
    spacer: {
      marginTop: 10,
    },
  }));

  const [period, setPeriod] = useState<Period>('weekly');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Find the target we're editing in state.
  const target = context?.targets.find((t: Target) => t.id === Number(id));

  // Prefill the form once the target's loaded.
  useEffect(() => {
    if (!target) return;
    setPeriod(target.period === 'monthly' ? 'monthly' : 'weekly');
    setValue(String(target.targetValue));
  }, [target]);

  if (!context || !target) return null;

  const { habits, categories, setTargets } = context;

  // Friendly label for the header — either the habit name or the category name.
  const labelText = target.habitId
    ? habits.find((h) => h.id === target.habitId)?.name ?? 'Habit'
    : target.categoryId
      ? categories.find((c) => c.id === target.categoryId)?.name ?? 'Category'
      : 'Target';

  const save = async () => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return;

    setSaving(true);
    try {
      await db
        .update(targetsTable)
        .set({ period, targetValue: numeric })
        .where(eq(targetsTable.id, target.id));

      setTargets((prev) =>
        prev.map((t) => (t.id === target.id ? { ...t, period, targetValue: numeric } : t))
      );
      router.back();
    } finally {
      setSaving(false);
    }
  };

  // Delete the target with a confirmation step — there's no undo.
  const remove = () => {
    Alert.alert('Delete target', `Remove the target for "${labelText}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.delete(targetsTable).where(eq(targetsTable.id, target.id));
          setTargets((prev) => prev.filter((t) => t.id !== target.id));
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Edit target" subtitle={labelText} />

        <View style={styles.form}>
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
            keyboardType="numeric"
          />
        </View>

        <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} onPress={save} disabled={saving} />
        <View style={styles.spacer}>
          <PrimaryButton label="Delete target" variant="danger" onPress={remove} />
        </View>
        <View style={styles.spacer}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
