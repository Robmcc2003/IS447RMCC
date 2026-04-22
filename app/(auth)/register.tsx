import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useAuth } from '@/auth/auth-context';
import { useThemedStyles } from '@/theme/theme-context';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sign-up screen. Keeps validation local — no point querying the DB if the
// input is obviously invalid.
export default function RegisterScreen() {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
      marginBottom: 20,
    },
    error: {
      color: c.danger,
      fontSize: 13,
      marginBottom: 10,
    },
    footer: {
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      gap: 6,
      justifyContent: 'center' as const,
    },
    footerText: {
      color: c.textMuted,
      fontSize: 14,
    },
    link: {
      color: c.text,
      fontSize: 14,
      fontWeight: '700' as const,
      textDecorationLine: 'underline' as const,
    },
  }));

  // Run the basic validation checks first, then hand off to the auth context.
  const submit = async () => {
    setError(null);

    // Name has to be at least a couple of characters — nothing as short as "A".
    if (displayName.trim().length < 2) {
      setError('Please enter a display name.');
      return;
    }

    // Basic email shape check — not bulletproof but catches obvious typos.
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }

    // Six characters isn't especially strong, but it's enough for a local-only app.
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password, displayName);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Create account" subtitle="Track habits privately on your device." />

        <View style={styles.form}>
          <FormField
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            autoCapitalize="words"
          />
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label={submitting ? 'Creating account…' : 'Create account'}
            onPress={submit}
            disabled={submitting}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/(auth)/login" style={styles.link}>
            Sign in
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
