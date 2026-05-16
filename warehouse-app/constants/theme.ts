import { Platform } from 'react-native';

// ─── Dark palette ────────────────────────────────────────────────────────────
// bg:      #080f1c  (deepest background)
// surface: #0d1b2e  (cards, modals)
// border:  #1e3a5f  (all borders)
// accent:  #38bdf8  (primary tint, buttons, focus rings)
// text:    #f1f5f9  (primary text)
// muted:   #64748b  (secondary / placeholder)
// danger:  #f87171
// success: #34d399
// ─────────────────────────────────────────────────────────────────────────────

export const DarkTheme = {
  bg: '#080f1c',
  surface: '#0d1b2e',
  surface2: '#0a1525',
  border: '#1e3a5f',
  accent: '#38bdf8',
  accentGreen: '#34d399',
  text: '#f1f5f9',
  textSub: '#94a3b8',
  muted: '#64748b',
  danger: '#f87171',
  warn: '#fbbf24',
  success: '#34d399',
  tint: '#38bdf8',
  icon: '#64748b',
  tabIconDefault: '#475569',
  tabIconSelected: '#38bdf8',
  background: '#080f1c',
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#f8fafc',
    tint: '#0284c7',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0284c7',
    surface: '#ffffff',
    surface2: '#f1f5f9',
    border: '#cbd5e1',
    accent: '#0284c7',
    muted: '#94a3b8',
    danger: '#ef4444',
    warn: '#f59e0b',
    success: '#10b981',
  },
  dark: {
    text: '#f1f5f9',
    background: '#080f1c',
    tint: '#38bdf8',
    icon: '#64748b',
    tabIconDefault: '#475569',
    tabIconSelected: '#38bdf8',
    surface: '#0d1b2e',
    surface2: '#0a1525',
    border: '#1e3a5f',
    accent: '#38bdf8',
    muted: '#64748b',
    danger: '#f87171',
    warn: '#fbbf24',
    success: '#34d399',
  },
};

export type AppTheme = (typeof Colors)['dark'];

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
