import { Text, View } from 'react-native';
import { useThemedStyles } from '@/theme/theme-context';

// Shown when a list has no items — keeps the screen from looking broken.
type Props = {
  title: string;
  message?: string;
};

// Small card with a friendly prompt so empty screens still look intentional.
export default function EmptyState({ title, message }: Props) {
  const styles = useThemedStyles((c) => ({
    wrapper: {
      alignItems: 'center' as const,
      backgroundColor: c.surfaceMuted,
      borderColor: c.border,
      borderRadius: 4,
      borderWidth: 1,
      padding: 24,
    },
    title: {
      color: c.text,
      fontSize: 16,
      fontWeight: '700' as const,
    },
    message: {
      color: c.textMuted,
      fontSize: 14,
      marginTop: 6,
      textAlign: 'center' as const,
    },
  }));

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}
