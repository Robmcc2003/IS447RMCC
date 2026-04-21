import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { habits as habitsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, DataContext, Habit } from '../../_layout';

export default function EditHabit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(DataContext);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const habit = context?.habits.find((h: Habit) => h.id === Number(id));

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

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
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
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#9CA3AF',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipSelected: {
    backgroundColor: '#FACC15',
    borderColor: '#EAB308',
  },
  dot: {
    borderRadius: 4,
    height: 10,
    marginRight: 6,
    width: 10,
  },
  chipText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    fontWeight: '800',
  },
  spacer: {
    marginTop: 10,
  },
});
