import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useAuth } from '@/auth/auth-context';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/db/seed';
import { useThemedStyles } from '@/theme/theme-context';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// The front door of the app. Handles the basic sign-in flow and offers a
// demo account button so the examiner doesn't have to register manually.
export default function LoginScreen() {
  const { login } = useAuth();
  // Form state plus a flag so we can disable the button while submitting.
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
    brand: {
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      marginBottom: 24,
    },
    logo: {
      alignItems: 'center' as const,
      backgroundColor: c.primary,
      borderColor: c.primaryDark,
      borderRadius: 4,
      borderWidth: 1,
      height: 40,
      justifyContent: 'center' as const,
      marginRight: 10,
      width: 40,
    },
    logoText: {
      color: c.onPrimary,
      fontSize: 14,
      fontWeight: '800' as const,
      letterSpacing: 0.5,
    },
    brandText: {
      color: c.text,
      fontSize: 20,
      fontWeight: '800' as const,
      letterSpacing: 0.3,
    },
    form: {
      marginBottom: 20,
    },
    spacer: {
      marginTop: 10,
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

  // Attempt a login with the given credentials. If it fails, surface the
  // error under the form. Accepts overrides so the demo button can pass the
  // demo credentials directly and bypass the form state (which on iOS can be
  // tampered with by AutoFill / Strong Password when secureTextEntry is on).
  const submit = async (emailOverride?: string, passwordOverride?: string) => {
    setError(null);
    setSubmitting(true);
    try {
      await login(emailOverride ?? email, passwordOverride ?? password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  // One-tap demo login. We also reflect the credentials in the form fields
  // so the examiner can see what's being used, but the sign-in call uses the
  // constants directly to avoid any autofill interference on the password.
  const useDemo = async () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    await submit(DEMO_EMAIL, DEMO_PASSWORD);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand block at the top — square yellow logo plus wordmark. */}
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>HL</Text>
          </View>
          <Text style={styles.brandText}>HabitLab</Text>
        </View>

        <ScreenHeader title="Sign in" subtitle="Welcome back. Keep the streak going." />

        <View style={styles.form}>
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
            label={submitting ? 'Signing in…' : 'Sign in'}
            onPress={() => submit()}
            disabled={submitting}
          />
          <View style={styles.spacer}>
            <PrimaryButton
              label="Use demo account"
              variant="secondary"
              onPress={useDemo}
              disabled={submitting}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>No account yet?</Text>
          <Link href="/(auth)/register" style={styles.link}>
            Create one
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
