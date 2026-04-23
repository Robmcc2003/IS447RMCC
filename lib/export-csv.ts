import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Category, Habit, HabitLog } from '@/app/_layout';

// Anything we put in a CSV cell needs to be escaped if it contains a comma,
// a double quote or a newline — otherwise Excel / Sheets will split columns
// in the wrong place or break rows. RFC 4180 style: wrap in "..." and double
// up any existing quotes. We also stringify nulls/undefineds to empty cells.
function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Turn an array of rows into a CSV string with a trailing newline so editors
// don't complain about a missing EOL at end of file.
function rowsToCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

// Pull habit name + category into a single wide row per log — that's the
// spreadsheet shape most people expect when they open a CSV export.
export function buildHabitLogCsv(
  habits: Habit[],
  categories: Category[],
  logs: HabitLog[]
): string {
  const habitById = new Map(habits.map((h) => [h.id, h]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const header = ['date', 'habit', 'category', 'metric_type', 'value', 'unit', 'notes'];

  // Sort by date ascending then habit name so exports are deterministic and
  // easier to diff between exports if anyone compares two files.
  const sortedLogs = [...logs].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const ha = habitById.get(a.habitId)?.name ?? '';
    const hb = habitById.get(b.habitId)?.name ?? '';
    return ha.localeCompare(hb);
  });

  const rows = sortedLogs.map((log) => {
    const habit = habitById.get(log.habitId);
    const category = habit ? categoryById.get(habit.categoryId) : undefined;
    return [
      log.date,
      habit?.name ?? '',
      category?.name ?? '',
      habit?.metricType ?? '',
      log.value,
      habit?.unit ?? '',
      log.notes ?? '',
    ];
  });

  return rowsToCsv([header, ...rows]);
}

// Write the CSV to the cache directory and hand it to the native share
// sheet. Returns the number of rows exported so the caller can show a
// confirmation like "Exported 42 logs". We throw if sharing isn't
// available (e.g. on certain web environments) so the caller can surface
// a helpful error to the user.
export async function exportHabitLogsCsv(
  habits: Habit[],
  categories: Category[],
  logs: HabitLog[]
): Promise<{ rowCount: number }> {
  const csv = buildHabitLogCsv(habits, categories, logs);

  // Tag the filename with a timestamp so repeated exports don't clobber
  // each other in the cache and so the user can tell them apart in the
  // share sheet preview.
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = new File(Paths.cache, `habitlab-export-${stamp}.csv`);
  file.create({ overwrite: true });
  file.write(csv);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: 'Export HabitLab data',
  });

  return { rowCount: logs.length };
}
