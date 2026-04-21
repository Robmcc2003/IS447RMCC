import { Platform } from 'react-native';

export const Colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#FAFAF7',
  border: '#E5E7EB',
  borderStrong: '#111827',
  text: '#111827',
  textMuted: '#4B5563',
  textSubtle: '#9CA3AF',
  primary: '#FACC15',
  primaryDark: '#EAB308',
  primaryMuted: '#FEF9C3',
  onPrimary: '#111827',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#0F766E',
};

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

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
