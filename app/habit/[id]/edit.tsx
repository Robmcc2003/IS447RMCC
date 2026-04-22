import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { habits as habitsTable } from '@/db/schema';
import { useThemedStyles } from '@/theme/theme-context';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, DataContext, Habit } from '../../_layout';

// Edit an existing habit. Pulls the row out of context, prefills the form,
// then writes back via Drizzle when the user hits save.
export default function EditHabit() {
  // `id` comes in via the URL — cast to number when we actually use it.
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
    spacer: {
      marginTop: 10,
    },
  }));

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Find the habit we're editing — might be undefined if someone deep-linked
  // to an invalid id.
  const habit = context?.habits.find((h: Habit) => h.id === Number(id));

  // Prefill the form once the habit's in memory.
  useEffect(() => {
    if (!habit) return;
    setName(habit.name);
    setDescription(habit.description ?? '');
    setUnit(habit.unit ?? '');
    setCategoryId(habit.categoryId);
  }, [habit]);

  if (!context || !habit) return null;

  const { categories, setHabits } = context;

  const save = async () => {
    if (!categoryId) return;

    setSaving(true);
    try {
      await db
        .update(habitsTable)
        .set({
          name: name.trim(),
          description: description.trim() || null,
          unit: unit.trim() || null,
          categoryId,
        })
        .where(eq(habitsTable.id, habit.id));

      setHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id
            ? {
                ...h,
                name: name.trim(),
                description: description.trim() || null,
                unit: unit.trim() || null,
                categoryId,
              }
            : h
        )
      );
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
        <ScreenHeader title="Edit habit" subtitle={`Update ${habit.name}`} />

        <View style={styles.form}>
          <FormField label="Name" value={name} onChangeText={setName} />
          <FormField
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <FormField label="Unit" value={unit} onChangeText={setUnit} />

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
        </View>

        <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} onPress={save} disabled={saving} />
        <View style={styles.spacer}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
