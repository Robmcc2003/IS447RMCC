import { StyleSheet, Text, View } from 'react-native';

type Props = {
  name: string;
  color: string;
};

export default function CategoryBadge({ name, color }: Props) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    borderRadius: 6,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  label: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
  },
});
