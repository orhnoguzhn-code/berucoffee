import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import {
  Home,
  Coffee,
  ShoppingBag,
  ScanLine,
  Wallet,
  QrCode,
  Star,
  Gift,
  Ticket,
  MapPin,
  User,
  Settings,
  Languages,
  LogOut,
  ShoppingCart,
  Search,
  X,
  ArrowLeft,
  Check,
  Plus,
  Minus,
  Pencil,
  Trash2,
  ChevronRight,
  Info,
  Clock,
  Wifi,
  Car,
  Flame,
  Calendar,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Heart,
  Bike,
  Footprints,
  Banknote,
  CreditCard,
  Inbox,
  CheckCircle2,
  History,
  Utensils,
  Bell,
  BellRing,
  Megaphone,
  CircleAlert,
  CircleHelp,
} from 'lucide-react-native';

const ICONS: Record<string, React.ComponentType<any>> = {
  home: Home,
  menu: Coffee,
  order: ShoppingBag,
  scan: ScanLine,
  pay: Wallet,
  qr: QrCode,
  rewards: Star,
  gift: Gift,
  offers: Ticket,
  ticket: Ticket,
  history: History,
  store: MapPin,
  account: User,
  settings: Settings,
  language: Languages,
  logout: LogOut,
  cart: ShoppingCart,
  search: Search,
  close: X,
  back: ArrowLeft,
  check: Check,
  plus: Plus,
  minus: Minus,
  edit: Pencil,
  trash: Trash2,
  arrow: ChevronRight,
  info: Info,
  star: Star,
  starFill: Star,
  location: MapPin,
  clock: Clock,
  wifi: Wifi,
  car: Car,
  coffee: Coffee,
  cup: Coffee,
  fire: Flame,
  calendar: Calendar,
  phone: Phone,
  person: User,
  mail: Mail,
  lock: Lock,
  eye: Eye,
  eyeOff: EyeOff,
  refresh: RefreshCw,
  pin: MapPin,
  heart: Heart,
  heartOutline: Heart,
  delivery: Bike,
  pickup: Footprints,
  cash: Banknote,
  card: CreditCard,
  empty: Inbox,
  success: CheckCircle2,
  utensils: Utensils,
  bell: Bell,
  bellRing: BellRing,
  megaphone: Megaphone,
  alert: CircleAlert,
  help: CircleHelp,
};

export { ICONS };

interface Props {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Icon({ name, size = 20, color = '#1A1A1A', strokeWidth = 2, style }: Props) {
  const IconComp = ICONS[name];
  if (!IconComp) return null;
  const filled = name === 'starFill' || name === 'heart';
  return (
    <View style={style}>
      <IconComp size={size} color={color} strokeWidth={strokeWidth} fill={filled ? color : 'none'} />
    </View>
  );
}
