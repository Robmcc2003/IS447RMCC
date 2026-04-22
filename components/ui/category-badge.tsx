import { Text, View } from 'react-native';
import { useThemedStyles } from '@/theme/theme-context';

// Small pill that shows a category name with its colour dot next to it.
type Props = {
  name: string;
  color: string;
};

// The colour is passed in directly because it's per-category data, not theme.
// Everything else (background, text) follows the light/dark palette.
export default function CategoryBadge({ name, color }: Props) {
  const styles = useThemedStyles((c) => ({
    badge: {
      alignItems: 'center' as const,
      backgroundColor: c.surface,
      borderRadius: 4,
      borderWidth: 1,
      flexDirection: 'row' as const,
      marginRight: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    dot: {
      borderRadius: 6,
      height: 8,
      marginRight: 6,
      width: 8,
    },
    label: {
      color: c.text,
      fontSize: 12,
      fontWeight: '600' as const,
    },
  }));

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{name}</Text>
    </View>
  );
}
