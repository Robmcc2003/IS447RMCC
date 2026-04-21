import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useAuth } from '@/auth/auth-context';
import { useContext } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DataContext } from '../_layout';

export default function ProfileScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const context = useContext(DataContext);

  if (!user || !context) return null;

  const { habits, habitLogs, categories } = context;

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Profile" subtitle="Account and preferences" />

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.displayName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.stats}>
          <Stat label="Habits" value={habits.length} />
          <Stat label="Categories" value={categories.length} />
          <Stat label="Logs" value={habitLogs.length} />
        </View>

        <PrimaryButton label="Sign out" variant="secondary" onPress={logout} />
        <View style={styles.spacer}>
          <PrimaryButton label="Delete account" variant="danger" onPress={confirmDelete} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  card: {
    alignItems: 'center',
    backgroundColor: '#FAFAF7',
    borderColor: '#E5E7EB',
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 16,
    padding: 20,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#FACC15',
    borderColor: '#EAB308',
    borderRadius: 4,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    marginBottom: 12,
    width: 56,
  },
  avatarText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  name: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  email: {
    color: '#4B5563',
    fontSize: 13,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  statValue: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  spacer: {
    marginTop: 10,
  },
});
