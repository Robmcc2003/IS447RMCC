import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useAuth } from '@/auth/auth-context';
import { db } from '@/db/client';
import { habits as habitsTable } from '@/db/schema';
import { useThemedStyles } from '@/theme/theme-context';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, DataContext } from '../_layout';

// Either counting occurrences (press-ups, glasses of water) or timing a
// duration (minutes reading, minutes meditating). Changes the unit placeholder.
type MetricType = 'count' | 'duration';

// Form for creating a new habit. Name + category are required; everything
// else is optional and can be tweaked later via edit.
export default function NewHabit() {
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
    dot: {
      borderRadius: 4,
      height: 10,
      marginRight: 6,
      width: 10,
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
    error: {
      color: c.danger,
      fontSize: 13,
      marginBottom: 10,
    },
    spacer: {
      marginTop: 10,
    },
  }));

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [metricType, setMetricType] = useState<MetricType>('count');
  const [unit, setUnit] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!context || !user) return null;

  const { categories, setHabits } = context;

  // Validate, save to SQLite, update the in-memory list, then navigate back.
  const save = async () => {
    setError(null);

    // Basic sanity checks — no point asking the DB to save "a" as a habit name.
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    setSaving(true);
    try {
      // `.returning()` gives us back the full row including the new id.
      const [row] = await db
        .insert(habitsTable)
        .values({
          userId: user.id,
          categoryId,
          name: name.trim(),
          description: description.trim() || null,
          metricType,
          unit: unit.trim() || null,
        })
        .returning();

      setHabits((prev) => [...prev, row]);
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
        <ScreenHeader title="New habit" subtitle="Define what you want to track." />

        <View style={styles.form}>
          <FormField label="Name" value={name} onChangeText={setName} placeholder="e.g. Read" />
          <FormField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Optional notes"
            multiline
          />

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

          <Text style={styles.label}>Metric</Text>
          <View style={styles.chipRow}>
            {(['count', 'duration'] as MetricType[]).map((value) => {
              const selected = metricType === value;
              return (
                <Pressable
                  key={value}
                  accessibilityLabel={`Metric ${value}`}
                  accessibilityRole="button"
                  onPress={() => setMetricType(value)}
                  style={[styles.chip, selected ? styles.chipSelected : null]}
                >
                  <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                    {value === 'count' ? 'Count' : 'Duration'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <FormField
            label="Unit"
            value={unit}
            onChangeText={setUnit}
            placeholder={metricType === 'duration' ? 'minutes' : 'times'}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <PrimaryButton label={saving ? 'Saving…' : 'Save habit'} onPress={save} disabled={saving} />
        <View style={styles.spacer}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
