import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  message?: string;
};

export default function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    backgroundColor: '#FAFAF7',
    borderColor: '#E5E7EB',
    borderRadius: 4,
    borderWidth: 1,
    padding: 24,
  },
  title: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    color: '#4B5563',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});
