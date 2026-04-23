# HabitLab — IS4447 Project    https://github.com/Robmcc2003/IS447RMCC

A local-first habit tracker built with **React Native (Expo)**, **Drizzle ORM**, and **SQLite**. Users can log activity, group habits into categories, set weekly/monthly targets, and view aggregated insights with a bar chart.


### Expo Go
- https://expo.dev/preview/update?message=Initial+publish&updateRuntimeVersion=1.0.0&createdAt=2026-04-23T18%3A35%3A44.521Z&slug=exp&projectId=7c1c04be-cbbd-42eb-b12c-81b1d2d91a3f&group=2fc6a91a-4b1c-4d21-afbe-52f0164319d3

-exp://u.expo.dev/7c1c04be-cbbd-42eb-b12c-81b1d2d91a3f/group/2fc6a91a-4b1c-4d21-afbe-52f0164319d3
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

## Testing
The sample-project style is followed: tests live in `tests/` and mock the `db/client` module directly.

```bash
npm test
```

### AI Used
- Chatgpt for the monotnous styling https://chatgpt.com/share/69ea6913-c6a4-83eb-be23-63b8187df369