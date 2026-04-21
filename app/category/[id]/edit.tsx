import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { CategoryPalette } from '@/constants/theme';
import { db } from '@/db/client';
import { categories as categoriesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, DataContext } from '../../_layout';

export default function EditCategory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(DataContext);

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(CategoryPalette[0]);
  const [saving, setSaving] = useState(false);

  const category = context?.categories.find((c: Category) => c.id === Number(id));

  useEffect(() => {
    if (!category) return;
    setName(category.name);
    setColor(category.color);
  }, [category]);

  if (!context || !category) return null;

  const { setCategories } = context;

  const save = async () => {
    setSaving(true);
    try {
      await db
        .update(categoriesTable)
        .set({ name: name.trim(), color })
        .where(eq(categoriesTable.id, category.id));

      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, name: name.trim(), color } : c
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
        <ScreenHeader title="Edit category" subtitle={`Update ${category.name}`} />

        <View style={styles.form}>
          <FormField label="Name" value={name} onChangeText={setName} />

          <Text style={styles.label}>Color</Text>
          <View style={styles.swatches}>
            {CategoryPalette.map((value) => {
              const selected = value === color;
              return (
                <Pressable
                  key={value}
                  accessibilityLabel={`Choose color ${value}`}
                  accessibilityRole="button"
                  onPress={() => setColor(value)}
                  style={[
                    styles.swatch,
                    { backgroundColor: value },
                    selected ? styles.swatchSelected : null,
                  ]}
                />
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
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  swatch: {
    borderColor: 'transparent',
    borderRadius: 4,
    borderWidth: 2,
    height: 36,
    width: 36,
  },
  swatchSelected: {
    borderColor: '#111827',
  },
  spacer: {
    marginTop: 10,
  },
});
