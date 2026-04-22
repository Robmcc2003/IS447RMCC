// A small alias so "light" or "dark" is spelled the same everywhere.
export type ColorScheme = 'light' | 'dark';

// The shape every palette has to match. Any new colour we want to use
// needs to be added here first, otherwise the UI can't read it.
export type Palette = {
  scheme: ColorScheme;
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  inputBorder: string;
  inputBackground: string;
  text: string;
  textStrong: string;
  textMuted: string;
  textSubtle: string;
  textPlaceholder: string;
  primary: string;
  primaryDark: string;
  primaryMuted: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabActiveBackground: string;
  tabActiveText: string;
  tabInactiveText: string;
  chartLabel: string;
  chartGrid: string;
  overlay: string;
};

// The everyday light look. Nice and bright, clean whites with the yellow brand on top.
export const LightPalette: Palette = {
  scheme: 'light',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#FAFAF7',
  surfaceElevated: '#F3F4F6',
  border: '#E5E7EB',
  borderStrong: '#9CA3AF',
  inputBorder: '#CBD5E1',
  inputBackground: '#FFFFFF',
  text: '#111827',
  textStrong: '#334155',
  textMuted: '#4B5563',
  textSubtle: '#6B7280',
  textPlaceholder: '#9CA3AF',
  // Brand yellow stays put — it's what makes the app feel like HabitLab.
  primary: '#FACC15',
  primaryDark: '#EAB308',
  primaryMuted: '#FEF9C3',
  onPrimary: '#111827',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#0F766E',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  tabActiveBackground: '#FACC15',
  tabActiveText: '#111827',
  tabInactiveText: '#6B7280',
  chartLabel: '#4B5563',
  chartGrid: '#E5E7EB',
  overlay: 'rgba(17, 24, 39, 0.4)',
};

// Same shape, darker palette. Easier on the eyes at night.
export const DarkPalette: Palette = {
  scheme: 'dark',
  // Deep navy-ish background instead of pure black — pure black is a bit harsh.
  background: '#0B0F17',
  surface: '#141A26',
  surfaceMuted: '#1A2130',
  surfaceElevated: '#1F2736',
  border: '#2A3040',
  borderStrong: '#3B4253',
  inputBorder: '#2A3040',
  inputBackground: '#141A26',
  // Text goes light so it stops squinting at us.
  text: '#F3F4F6',
  textStrong: '#E5E7EB',
  textMuted: '#9CA3AF',
  textSubtle: '#7C8594',
  textPlaceholder: '#5B6476',
  // Keep the yellow — it's still the HabitLab look, just on a darker backdrop.
  primary: '#FACC15',
  primaryDark: '#EAB308',
  primaryMuted: '#3D3410',
  onPrimary: '#111827',
  // Bumped the saturation a touch so success/danger don't look washed out.
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#2DD4BF',
  tabBarBackground: '#0F1623',
  tabBarBorder: '#1F2736',
  tabActiveBackground: '#FACC15',
  tabActiveText: '#111827',
  tabInactiveText: '#9CA3AF',
  chartLabel: '#9CA3AF',
  chartGrid: '#2A3040',
  overlay: 'rgba(0, 0, 0, 0.55)',
};

// A handful of nice colours for category dots — same in both modes so the
// brand stays consistent no matter which theme you're running.
export const CategoryPalette = [
  '#FACC15',
  '#0F766E',
  '#F59E0B',
  '#10B981',
  '#0EA5E9',
  '#EF4444',
  '#8B5CF6',
  '#111827',
];
