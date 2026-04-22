import { Text, View } from 'react-native';
import { useThemedStyles } from '@/theme/theme-context';

// Bog-standard header block: big title up top, optional subtitle underneath.
type Props = {
  title: string;
  subtitle?: string;
};

// Stuck at the top of most screens so the whole app has a consistent feel.
export default function ScreenHeader({ title, subtitle }: Props) {
  const styles = useThemedStyles((c) => ({
    container: {
      marginBottom: 16,
    },
    title: {
      color: c.text,
      fontSize: 28,
      fontWeight: '800' as const,
      letterSpacing: 0.3,
    },
    subtitle: {
      color: c.textSubtle,
      fontSize: 14,
      marginTop: 4,
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {/* Subtitle is optional — skip rendering when one isn't provided. */}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
