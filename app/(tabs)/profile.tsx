import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useAuth } from '@/auth/auth-context';
import { exportHabitLogsCsv } from '@/lib/export-csv';
import { ThemeMode, useTheme, useThemedStyles } from '@/theme/theme-context';
import { useContext, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DataContext } from '../_layout';

// The three theme choices we offer in the UI. "system" simply follows
// whatever the phone itself is doing.
const THEME_OPTIONS: { id: ThemeMode; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

export default function ProfileScreen() {
  // Read the user, auth actions, and the theme values we need for the toggle.
  const { user, logout, deleteAccount } = useAuth();
  const { mode, resolvedScheme, setMode } = useTheme();
  const context = useContext(DataContext);
  // Disable the export button while a share sheet is in flight so we don't
  // kick off multiple exports at once if the user taps twice.
  const [exporting, setExporting] = useState(false);
  // Styles are built from the current palette so they flip with the theme.
  const styles = useThemedStyles((c) => ({
    safeArea: {
      backgroundColor: c.background,
      flex: 1,
      padding: 20,
    },
    content: {
      paddingBottom: 24,
    },
    card: {
      alignItems: 'center' as const,
      backgroundColor: c.surfaceMuted,
      borderColor: c.border,
      borderRadius: 4,
      borderWidth: 1,
      marginBottom: 16,
      padding: 20,
    },
    avatar: {
      alignItems: 'center' as const,
      backgroundColor: c.primary,
      borderColor: c.primaryDark,
      borderRadius: 4,
      borderWidth: 1,
      height: 56,
      justifyContent: 'center' as const,
      marginBottom: 12,
      width: 56,
    },
    avatarText: {
      color: c.onPrimary,
      fontSize: 18,
      fontWeight: '800' as const,
    },
    name: {
      color: c.text,
      fontSize: 18,
      fontWeight: '800' as const,
    },
    email: {
      color: c.textMuted,
      fontSize: 13,
      marginTop: 4,
    },
    stats: {
      flexDirection: 'row' as const,
      gap: 8,
      marginBottom: 16,
    },
    stat: {
      alignItems: 'center' as const,
      backgroundColor: c.surface,
      borderColor: c.border,
      borderRadius: 4,
      borderWidth: 1,
      flex: 1,
      padding: 12,
    },
    statValue: {
      color: c.text,
      fontSize: 22,
      fontWeight: '800' as const,
    },
    statLabel: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
      marginTop: 4,
      textTransform: 'uppercase' as const,
    },
    section: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderRadius: 4,
      borderWidth: 1,
      marginBottom: 16,
      padding: 14,
    },
    sectionTitle: {
      color: c.text,
      fontSize: 14,
      fontWeight: '800' as const,
      letterSpacing: 0.3,
      marginBottom: 2,
      textTransform: 'uppercase' as const,
    },
    sectionSubtitle: {
      color: c.textSubtle,
      fontSize: 12,
      marginBottom: 12,
    },
    themeRow: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    themeChip: {
      alignItems: 'center' as const,
      backgroundColor: c.surface,
      borderColor: c.borderStrong,
      borderRadius: 4,
      borderWidth: 1,
      flex: 1,
      paddingVertical: 10,
    },
    themeChipSelected: {
      backgroundColor: c.primary,
      borderColor: c.primaryDark,
    },
    themeChipLabel: {
      color: c.text,
      fontSize: 13,
      fontWeight: '700' as const,
    },
    themeChipLabelSelected: {
      color: c.onPrimary,
      fontWeight: '800' as const,
    },
    themeHint: {
      color: c.textSubtle,
      fontSize: 11,
      marginTop: 8,
    },
    spacer: {
      marginTop: 10,
    },
  }));

  // If either auth or data isn't ready yet, render nothing to avoid a flicker.
  if (!user || !context) return null;

  const { habits, habitLogs, categories } = context;

  // Show a native confirm before deleting the account — there's no undo.
  const confirmDelete = () => {
    Alert.alert(
      'Delete account',
      'This permanently removes your profile and all related data from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
          },
        },
      ]
    );
  };

  // Helpful hint for "system" mode so the user knows which way it's resolved right now.
  const systemLabel = mode === 'system' ? ` (now ${resolvedScheme})` : '';

  // Build a CSV of every habit log and open the native share sheet so the
  // user can email / save / AirDrop it. If there are no logs we short-
  // circuit with a friendly message rather than handing them an empty file.
  const exportCsv = async () => {
    if (habitLogs.length === 0) {
      Alert.alert('Nothing to export', 'Log a few habits first and then try again.');
      return;
    }
    setExporting(true);
    try {
      await exportHabitLogsCsv(habits, categories, habitLogs);
    } catch (e) {
      Alert.alert(
        'Export failed',
        e instanceof Error ? e.message : 'Unable to export your data right now.'
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Profile" subtitle="Account and preferences" />

        {/* User header card — initials, name, email. */}
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.displayName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        {/* Three small counters so the user can see their activity at a glance. */}
        <View style={styles.stats}>
          <Stat label="Habits" value={habits.length} styles={styles} />
          <Stat label="Categories" value={categories.length} styles={styles} />
          <Stat label="Logs" value={habitLogs.length} styles={styles} />
        </View>

        {/* The appearance chooser — where the dark mode magic actually lives. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.sectionSubtitle}>
            Choose how HabitLab looks on this device{systemLabel}.
          </Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((option) => {
              // Highlight the one that's currently in use.
              const selected = mode === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityLabel={`Use ${option.label} theme`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    // Ask the provider to change mode — it also persists the choice.
                    void setMode(option.id);
                  }}
                  style={[styles.themeChip, selected ? styles.themeChipSelected : null]}
                >
                  <Text
                    style={[
                      styles.themeChipLabel,
                      selected ? styles.themeChipLabelSelected : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.themeHint}>
            "System" follows your device's light/dark setting.
          </Text>
        </View>

        {/* Data export — writes every habit log to a CSV and opens the
            system share sheet so it can go to Files, Mail, etc. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <Text style={styles.sectionSubtitle}>
            Download your habit logs as a CSV file you can open in Excel or Numbers.
          </Text>
          <PrimaryButton
            label={exporting ? 'Preparing…' : 'Export logs (CSV)'}
            variant="secondary"
            onPress={exportCsv}
            disabled={exporting}
          />
        </View>

        {/* Sign-out, plus the destructive delete button below it. */}
        <PrimaryButton label="Sign out" variant="secondary" onPress={logout} />
        <View style={styles.spacer}>
          <PrimaryButton label="Delete account" variant="danger" onPress={confirmDelete} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Props for the little stat tile below. Takes the parent's styles so it paints
// in the right colours without having to do its own theme lookup.
type StatProps = {
  label: string;
  value: number;
  styles: {
    stat: object;
    statValue: object;
    statLabel: object;
  };
};

// Small tile that shows a number with a label underneath.
function Stat({ label, value, styles }: StatProps) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
