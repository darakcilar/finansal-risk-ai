/**
 * Finansal Risk AI — Design System (React Native)
 * Web uygulamasındaki CSS variables'ın birebir karşılığı
 */

export const COLORS = {
  // Arka planlar
  bgPrimary: '#050a1a',
  bgSecondary: '#0a1128',
  bgCard: 'rgba(15, 23, 55, 0.6)',
  bgCardHover: 'rgba(20, 30, 70, 0.7)',
  bgGlass: 'rgba(255, 255, 255, 0.04)',
  bgGlassStrong: 'rgba(255, 255, 255, 0.08)',

  // Kenarlıklar
  borderGlass: 'rgba(255, 255, 255, 0.08)',
  borderGlassHover: 'rgba(255, 255, 255, 0.15)',

  // Metinler
  textPrimary: '#e8ecf4',
  textSecondary: '#8b95b0',
  textMuted: '#5a6380',
  textAccent: '#a5b4fc',

  // Vurgu Renkleri
  accentBlue: '#667eea',
  accentPurple: '#764ba2',
  accentPink: '#f093fb',
  accentCyan: '#4fd1c5',
  accentGreen: '#68d391',
  accentYellow: '#fbd38d',
  accentRed: '#fc8181',
  accentOrange: '#f6ad55',

  // Risk Renkleri
  riskLow: '#68d391',
  riskMedium: '#fbd38d',
  riskHigh: '#fc8181',

  // Özel Renkler
  skyBlue: '#38bdf8',
  emerald: '#10b981',
  violet: '#8b5cf6',
  blue500: '#3b82f6',
  red500: '#ef4444',
  green500: '#10b981',
  amber500: '#f59e0b',
  slate700: '#334155',
  slate600: '#475569',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
};

// Gradient tanımları (LinearGradient bileşeni için)
export const GRADIENTS = {
  primary: ['#667eea', '#764ba2'],
  riskLow: ['#68d391', '#4fd1c5'],
  riskMedium: ['#fbd38d', '#f6ad55'],
  riskHigh: ['#fc8181', '#f56565'],
  purple: ['#8b5cf6', '#764ba2'],
  blue: ['#38bdf8', '#667eea'],
  progressBar: ['#38bdf8', '#10b981'],
};

export const FONTS = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semiBold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  extraBold: { fontWeight: '800' },
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  glowBlue: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
};
