import { TextStyle } from 'react-native';

export const colors = {
  primary: '#0E7A4A',
  primaryDark: '#0B5E39',
  primaryLight: '#128A55',
  primarySoft: '#E4F3EC',
  primaryTint: '#F0F8F4',
  bg: '#FFFFFF',
  bgSoft: '#F7F8FA',
  bgMuted: '#EFF1F3',
  card: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  border: '#E5E7EB',
  divider: '#F0F0F0',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  info: '#2563EB',
  infoSoft: '#DBEAFE',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  gold: '#C89B3C',
  goldSoft: '#FDF3DD',
  overlay: 'rgba(0,0,0,0.55)',
  scrim: 'rgba(0,0,0,0.35)',
  cardGreen: '#0B5E39',
  cardGold: '#C89B3C',
  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
  full: 999,
};

export const typography: Record<string, TextStyle> = {
  display: { fontSize: 32, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  heading: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  subheading: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  small: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  micro: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4, lineHeight: 14 },
  price: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const layout = {
  screenPadding: 20,
  cardPadding: 16,
  touchTarget: 44,
  maxContentWidth: 680,
};

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadow,
  layout,
};

export default theme;
