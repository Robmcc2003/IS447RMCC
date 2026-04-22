import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useAuth } from '@/auth/auth-context';
import { CategoryPalette } from '@/constants/theme';
import { db } from '@/db/client';
import { categories as categoriesTable } from '@/db/schema';
import { useThemedStyles } from '@/theme/theme-context';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DataContext } from '../_layout';

// Creates a new category. The user gets a name field plus a colour picker
// from the preset palette so the app keeps a consistent look.
export default function NewCategory() {
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
    },
    swatches: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
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
      borderColor: c.text,
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
  const [color, setColor] = useState<string>(CategoryPalette[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!context || !user) return null;

  const { setCategories } = context;

  // Save the category, add it to state, then navigate back to the list.
  const save = async () => {
    setError(null);

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    setSaving(true);
    try {
      // Icon is hardcoded for now — we're keeping things simple with colour only.
      const [row] = await db
        .insert(categoriesTable)
        .values({ userId: user.id, name: name.trim(), color, icon: 'star' })
        .returning();

      setCategories((prev) => [...prev, row]);
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
        <ScreenHeader title="New category" subtitle="Group related habits together." />

        <View style={styles.form}>
          <FormField label="Name" value={name} onChangeText={setName} placeholder="e.g. Health" />

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

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <PrimaryButton label={saving ? 'Saving…' : 'Save category'} onPress={save} disabled={saving} />
        <View style={styles.spacer}>
          <PrimaryButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
