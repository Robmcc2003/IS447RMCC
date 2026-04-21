import EmptyState from '@/components/ui/empty-state';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { categories as categoriesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, DataContext, Habit } from '../_layout';

export default function CategoriesScreen() {
  const router = useRouter();
  const context = useContext(DataContext);

  if (!context) return null;

  const { categories, habits, setCategories } = context;

  const deleteCategory = async (category: Category) => {
    const inUse = habits.some((h: Habit) => h.categoryId === category.id);

    if (inUse) {
      Alert.alert(
        'Category in use',
        'Move or delete the habits in this category before deleting it.'
      );
      return;
    }

    Alert.alert('Delete category', `Delete "${category.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.delete(categoriesTable).where(eq(categoriesTable.id, category.id));
          setCategories((prev) => prev.filter((c) => c.id !== category.id));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Categories" subtitle={`${categories.length} total`} />

      <PrimaryButton label="Add category" onPress={() => router.push('/category/new')} />

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            message="Add a category to group your habits."
          />
        ) : (
          categories.map((category: Category) => {
            const count = habits.filter((h: Habit) => h.categoryId === category.id).length;
            return (
              <Pressable
                key={category.id}
                accessibilityLabel={`${category.name}, ${count} habits, edit`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/category/[id]/edit',
                    params: { id: String(category.id) },
                  })
                }
                onLongPress={() => deleteCategory(category)}
                style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              >
                <View style={[styles.swatch, { backgroundColor: category.color }]} />
                <View style={styles.rowBody}>
                  <Text style={styles.name}>{category.name}</Text>
                  <Text style={styles.meta}>
                    {count} {count === 1 ? 'habit' : 'habits'}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 14,
  },
  row: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 12,
  },
  rowPressed: {
    opacity: 0.85,
  },
  swatch: {
    borderRadius: 4,
    height: 28,
    marginRight: 12,
    width: 28,
  },
  rowBody: {
    flex: 1,
  },
  name: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    color: '#9CA3AF',
    fontSize: 22,
  },
});
