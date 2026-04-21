# HabitLab — IS4447 Project

A local-first habit tracker built with **React Native (Expo)**, **Drizzle ORM**, and **SQLite**. Users can log activity, group habits into categories, set weekly/monthly targets, and view aggregated insights with a bar chart.

## Running the app

```bash
npm install
npm start
```

Then scan the QR code with Expo Go (iOS/Android) or press `i` / `a` to launch a simulator.

### Demo account

A demo user is seeded on first launch:

- **Email:** `demo@habittracker.app`
- **Password:** `demo1234`

You can also register a new account from the login screen.

## Scripts

| Script | Description |
| --- | --- |
| `npm start` | Launch the Expo dev server. |
| `npm run ios` / `npm run android` | Launch the app in a simulator. |
| `npm test` | Run the Jest test suite. |
| `npm run generate` | Generate Drizzle migrations (writes to `./drizzle`). |
| `npm run studio` | Open Drizzle Studio to inspect the database. |

## Project structure

```
app/                  Expo Router screens (auth, tabs, modal routes)
  (auth)/login.tsx
  (auth)/register.tsx
  (tabs)/index.tsx    Habits list
  (tabs)/categories.tsx
  (tabs)/insights.tsx
  (tabs)/profile.tsx
  habit/new.tsx
  habit/[id]/index.tsx
  habit/[id]/edit.tsx
  category/new.tsx
  category/[id]/edit.tsx
  _layout.tsx         AuthProvider + DataContext
auth/                 Password hashing + AuthContext
components/           HabitCard + components/ui/* (form-field, primary-button, …)
constants/theme.ts    Colors, palette, fonts
db/                   Drizzle client, schema, seed function
tests/                Jest tests (seed, FormField, HabitsList)
drizzle.config.ts     Drizzle Kit config
eslint.config.js      Flat Expo ESLint config
jest.config.js        jest-expo preset + @/ path mapping
```

## Data model

| Table | Key fields |
| --- | --- |
| `users` | `email`, `display_name`, `password_hash` |
| `categories` | `user_id`, `name`, `color`, `icon` |
| `habits` | `user_id`, `category_id`, `name`, `metric_type`, `unit` |
| `habit_logs` | `habit_id`, `user_id`, `date`, `value` |
| `targets` | `user_id`, `habit_id` / `category_id`, `period`, `target_value` |

DDL is created on first app launch (`db/client.ts`). Seed data is added by `seedDemoDataIfEmpty()` in `db/seed.ts` and is idempotent.

## Implemented features

- **Records (CRUD)** for habits with per-date logs, quick-log buttons, and per-habit targets.
- **Categories** with create / edit / delete and colour swatches; each habit must reference a category.
- **Targets** (weekly / monthly, per habit or per category) with progress bars.
- **Insights** with total-tracked summary and a bar chart by category, plus target progress.
- **Search & filter** habits by text and category.
- **Persistence** via local SQLite using Drizzle ORM; seed script populates all tables.
- **Accessibility**: labels and roles on buttons, inputs, cards.
- **Auth**: local-only register, login, logout, delete account. Passwords hashed with SHA-256 + salt (`expo-crypto`). Session persisted in `AsyncStorage`.

## Testing

The sample-project style is followed: tests live in `tests/` and mock the `db/client` module directly.

```bash
npm test
```

Suites:

- `tests/seed.test.ts` — verifies `seedDemoDataIfEmpty` inserts into users, categories, habits, habit_logs, and targets, and is idempotent.
- `tests/FormField.test.tsx` — renders the label/placeholder, fires `onChangeText`, and renders error messages.
- `tests/HabitsList.test.tsx` — integration: supplies seeded data via `DataContext` and asserts habit names render.

## Notes on coding style

Matches the lab sample (`react-native-lab`):

- Root-level folders (`db/`, `components/`, `constants/`, `auth/`) with `@/*` → `./*` path alias.
- kebab-case filenames for UI components (`form-field.tsx`, `primary-button.tsx`, `screen-header.tsx`, …), PascalCase for entity cards (`HabitCard.tsx`).
- Default exports with inline `type Props = { … }`.
- `db/client.ts` creates tables inline with `execSync` and exports a module-scoped Drizzle `db`.
- Seed function is a side-effect `seedXIfEmpty()` with no parameters.
- Global state lives in `_layout.tsx` contexts (`AuthContext`, `DataContext`); mutations write to DB then call `setX`.
- Add / edit operations are separate routes (`app/habit/new.tsx`, `app/habit/[id]/edit.tsx`, …) rather than modals.
