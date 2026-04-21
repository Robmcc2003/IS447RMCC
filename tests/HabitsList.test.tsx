jest.mock('@/db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn().mockResolvedValue('mock-hash'),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

import { render } from '@testing-library/react-native';
import React from 'react';
import HabitsScreen from '@/app/(tabs)/index';
import { Category, DataContext, Habit, HabitLog, Target } from '@/app/_layout';

const categories: Category[] = [
  { id: 1, userId: 1, name: 'Health', color: '#FACC15', icon: 'heart' },
  { id: 2, userId: 1, name: 'Learning', color: '#0F766E', icon: 'book' },
];

const habits: Habit[] = [
  {
    id: 1,
    userId: 1,
    categoryId: 1,
    name: 'Drink water',
    description: 'Stay hydrated',
    metricType: 'count',
    unit: 'glasses',
    archived: 0,
  },
  {
    id: 2,
    userId: 1,
    categoryId: 2,
    name: 'Read a book',
    description: null,
    metricType: 'duration',
    unit: 'minutes',
    archived: 0,
  },
];

const habitLogs: HabitLog[] = [];
const targets: Target[] = [];

describe('HabitsScreen', () => {
  it('renders seeded habits from the data context', () => {
    const { getByText } = render(
      <DataContext.Provider
        value={{
          categories,
          setCategories: jest.fn(),
          habits,
          setHabits: jest.fn(),
          habitLogs,
          setHabitLogs: jest.fn(),
          targets,
          setTargets: jest.fn(),
          reload: jest.fn(),
        }}
      >
        <HabitsScreen />
      </DataContext.Provider>
    );

    expect(getByText('Habits')).toBeTruthy();
    expect(getByText('Add habit')).toBeTruthy();
    expect(getByText('Drink water')).toBeTruthy();
    expect(getByText('Read a book')).toBeTruthy();
  });
});
