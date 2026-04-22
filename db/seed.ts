import { eq } from 'drizzle-orm';
import { db } from './client';
import { categories, habits, habitLogs, targets, users } from './schema';
import { hashPassword } from '@/auth/password';

export const DEMO_EMAIL = 'demo@habittracker.app';
export const DEMO_PASSWORD = 'demo1234';
const DEMO_NAME = 'Demo User';

export async function seedDemoDataIfEmpty() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, DEMO_EMAIL));

  // If the demo user already exists we don't want to wipe their data, but we
  // DO want to make sure the stored password hash is in sync with the current
  // DEMO_PASSWORD / salt. This guards against stale local DBs from earlier
  // dev runs where the password or hashing code may have been different —
  // without it, "Use demo account" fails with "Incorrect password" forever.
  if (existing.length > 0) {
    if (existing[0].passwordHash !== passwordHash) {
      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.email, DEMO_EMAIL));
    }
    return;
  }

  const [demoUser] = await db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      displayName: DEMO_NAME,
      passwordHash,
    })
    .returning();

  const categoryRows = await db
    .insert(categories)
    .values([
      { userId: demoUser.id, name: 'Health', color: '#FACC15', icon: 'heart' },
      { userId: demoUser.id, name: 'Learning', color: '#0F766E', icon: 'book' },
      { userId: demoUser.id, name: 'Mindfulness', color: '#F59E0B', icon: 'leaf' },
      { userId: demoUser.id, name: 'Fitness', color: '#111827', icon: 'flash' },
    ])
    .returning();

  const [health, learning, mindfulness, fitness] = categoryRows;

  const habitRows = await db
    .insert(habits)
    .values([
      {
        userId: demoUser.id,
        categoryId: health.id,
        name: 'Drink water',
        description: 'Stay hydrated throughout the day.',
        metricType: 'count',
        unit: 'glasses',
      },
      {
        userId: demoUser.id,
        categoryId: learning.id,
        name: 'Read a book',
        description: 'Non-fiction or fiction, any genre.',
        metricType: 'duration',
        unit: 'minutes',
      },
      {
        userId: demoUser.id,
        categoryId: mindfulness.id,
        name: 'Meditate',
        description: 'Guided or silent meditation.',
        metricType: 'duration',
        unit: 'minutes',
      },
      {
        userId: demoUser.id,
        categoryId: fitness.id,
        name: 'Exercise',
        description: 'Gym, run, or home workout.',
        metricType: 'duration',
        unit: 'minutes',
      },
      {
        userId: demoUser.id,
        categoryId: health.id,
        name: 'Sleep early',
        description: 'Lights out before 23:00.',
        metricType: 'count',
        unit: 'days',
      },
    ])
    .returning();

  const today = new Date();
  const logValues: {
    habitId: number;
    userId: number;
    date: string;
    value: number;
  }[] = [];

  for (let i = 0; i < 21; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const dateStr = day.toISOString().slice(0, 10);

    for (const habit of habitRows) {
      const value =
        habit.metricType === 'count'
          ? Math.floor(Math.random() * 8) + 1
          : Math.floor(Math.random() * 40) + 10;

      if (Math.random() > 0.25) {
        logValues.push({
          habitId: habit.id,
          userId: demoUser.id,
          date: dateStr,
          value,
        });
      }
    }
  }

  await db.insert(habitLogs).values(logValues);

  await db.insert(targets).values([
    { userId: demoUser.id, habitId: habitRows[0].id, period: 'weekly', targetValue: 40 },
    { userId: demoUser.id, habitId: habitRows[1].id, period: 'weekly', targetValue: 180 },
    { userId: demoUser.id, habitId: habitRows[2].id, period: 'monthly', targetValue: 600 },
    { userId: demoUser.id, categoryId: fitness.id, period: 'weekly', targetValue: 200 },
  ]);
}
