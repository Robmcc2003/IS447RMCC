import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useAuth } from '@/auth/auth-context';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/db/seed';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const useDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>HT</Text>
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
            onPress={submit}
            disabled={submitting}
          />
          <View style={styles.spacer}>
            <PrimaryButton label="Use demo account" variant="secondary" onPress={useDemo} />
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

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    padding: 20,
  },
  content: {
    paddingBottom: 24,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 24,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: '#FACC15',
    borderColor: '#EAB308',
    borderRadius: 4,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginRight: 10,
    width: 40,
  },
  logoText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandText: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  form: {
    marginBottom: 20,
  },
  spacer: {
    marginTop: 10,
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 10,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  footerText: {
    color: '#4B5563',
    fontSize: 14,
  },
  link: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
