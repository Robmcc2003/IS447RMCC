import { Pressable, Text } from 'react-native';
import { useThemedStyles } from '@/theme/theme-context';

// Three variants of button: the main yellow one, a muted secondary, and a
// red danger button for destructive actions.
type Props = {
  label: string;
  onPress: () => void;
  compact?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

// The primary button used throughout the app. Kept square-ish to match the brand.
export default function PrimaryButton({
  label,
  onPress,
  compact = false,
  variant = 'primary',
  disabled = false,
}: Props) {
  const styles = useThemedStyles((c) => ({
    button: {
      alignItems: 'center' as const,
      backgroundColor: c.primary,
      borderColor: c.primaryDark,
      borderRadius: 4,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    secondary: {
      backgroundColor: c.surface,
      borderColor: c.borderStrong,
    },
    danger: {
      backgroundColor: c.surface,
      borderColor: c.danger,
    },
    compact: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    pressed: {
      opacity: 0.85,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      color: c.onPrimary,
      fontSize: 15,
      fontWeight: '700' as const,
      letterSpacing: 0.3,
    },
    secondaryLabel: {
      color: c.text,
    },
    dangerLabel: {
      color: c.danger,
    },
    compactLabel: {
      fontSize: 13,
    },
  }));

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      // Stack style overrides in order of specificity — variant first, then
      // compact tweaks, then the pressed/disabled feedback layers.
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondary : null,
        variant === 'danger' ? styles.danger : null,
        compact ? styles.compact : null,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'secondary' ? styles.secondaryLabel : null,
          variant === 'danger' ? styles.dangerLabel : null,
          compact ? styles.compactLabel : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
