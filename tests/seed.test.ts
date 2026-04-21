jest.mock('@/db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

jest.mock('@/auth/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('mock-hash'),
}));

import { db } from '@/db/client';
import { seedDemoDataIfEmpty } from '@/db/seed';

const mockDb = db as unknown as { select: jest.Mock; insert: jest.Mock };

function buildInsertChain(returnValue: unknown[]) {
  const returning = jest.fn().mockResolvedValue(returnValue);
  const values = jest.fn().mockReturnValue({ returning });
  const valuesOnly = jest.fn().mockResolvedValue(undefined);

  return {
    onReturning: () => ({ values }),
    onVoid: () => ({ values: valuesOnly }),
    values,
    valuesOnly,
    returning,
  };
}

describe('seedDemoDataIfEmpty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts demo data into all core tables when users table is empty', async () => {
    const from = jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([]),
    });
    mockDb.select.mockReturnValue({ from });

    const userInsert = buildInsertChain([
      { id: 1, email: 'demo@habittracker.app', displayName: 'Demo User' },
    ]);
    const categoryInsert = buildInsertChain([
      { id: 1, userId: 1, name: 'Health' },
      { id: 2, userId: 1, name: 'Learning' },
      { id: 3, userId: 1, name: 'Mindfulness' },
      { id: 4, userId: 1, name: 'Fitness' },
    ]);
    const habitInsert = buildInsertChain([
      { id: 1, userId: 1, categoryId: 1, name: 'Drink water', metricType: 'count' },
      { id: 2, userId: 1, categoryId: 2, name: 'Read a book', metricType: 'duration' },
      { id: 3, userId: 1, categoryId: 3, name: 'Meditate', metricType: 'duration' },
      { id: 4, userId: 1, categoryId: 4, name: 'Exercise', metricType: 'duration' },
      { id: 5, userId: 1, categoryId: 1, name: 'Sleep early', metricType: 'count' },
    ]);
    const logInsert = buildInsertChain([]);
    const targetInsert = buildInsertChain([]);

    mockDb.insert
      .mockReturnValueOnce({ values: userInsert.values })
      .mockReturnValueOnce({ values: categoryInsert.values })
      .mockReturnValueOnce({ values: habitInsert.values })
      .mockReturnValueOnce({ values: logInsert.valuesOnly })
      .mockReturnValueOnce({ values: targetInsert.valuesOnly });

    await seedDemoDataIfEmpty();

    expect(mockDb.insert).toHaveBeenCalledTimes(5);
    expect(userInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'demo@habittracker.app' })
    );
    expect(categoryInsert.values).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Health' }),
        expect.objectContaining({ name: 'Fitness' }),
      ])
    );
    expect(habitInsert.values).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Drink water' }),
        expect.objectContaining({ name: 'Read a book' }),
      ])
    );
    expect(logInsert.valuesOnly).toHaveBeenCalledTimes(1);
    expect(targetInsert.valuesOnly).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ period: 'weekly' }),
        expect.objectContaining({ period: 'monthly' }),
      ])
    );
  });

  it('does nothing when demo user already exists', async () => {
    const from = jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([{ id: 1, email: 'demo@habittracker.app' }]),
    });
    mockDb.select.mockReturnValue({ from });

    await seedDemoDataIfEmpty();

    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
