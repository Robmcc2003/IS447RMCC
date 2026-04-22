import { Text, TextInput, View } from 'react-native';
import { useTheme, useThemedStyles } from '@/theme/theme-context';

// Everything a FormField needs to know. Most values are optional so you can
// pass just a label and value for a basic single-line input.
type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  error?: string;
};

// Reusable input with a label on top. Flips colours automatically when the
// theme changes — no extra effort from the caller.
export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  multiline,
  error,
}: Props) {
  // Need the raw colours too so we can set the placeholder tint directly.
  const { colors } = useTheme();
  const styles = useThemedStyles((c) => ({
    wrapper: {
      marginBottom: 12,
    },
    label: {
      color: c.textStrong,
      fontSize: 13,
      fontWeight: '600' as const,
      marginBottom: 6,
    },
    input: {
      backgroundColor: c.inputBackground,
      borderColor: c.inputBorder,
      borderRadius: 4,
      borderWidth: 1,
      color: c.text,
      fontSize: 15,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    inputMultiline: {
      minHeight: 80,
      textAlignVertical: 'top' as const,
    },
    error: {
      color: c.danger,
      fontSize: 12,
      marginTop: 4,
    },
  }));

  return (
    <View style={styles.wrapper}>
      {/* Label sits on top so screen readers announce it as the field name. */}
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textPlaceholder}
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline ? styles.inputMultiline : null]}
        value={value}
      />
      {/* Only show the error bit if we've actually got one to flag up. */}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
