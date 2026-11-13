export interface Member {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  desk: string;
  status: 'available' | 'busy' | 'coffee' | 'meeting';
  statusText?: string;
  skills: string[];
  lastSeen: number;
  isOnline: boolean;
  ip?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  sender: {
    id: string;
    name: string;
    role: string;
    desk: string;
    avatar?: string;
  };
  content: string;
  timestamp: number;
  reactions?: Record<string, string[]>;
  isPinned?: boolean;
  type?: 'text' | 'announcement' | 'system' | 'poll';
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  icon: string;
  isDefault?: boolean;
}

export interface HotspotConfig {
  routerIp: string;
  hotspotName: string;
  loginMethod: string;
  serverLocalIp: string;
  serverPort: number;
  trialDurationMinutes: number;
  dailyVoucherPrefix: string;
  walledGardenDomain: string;
  welcomeNotice: string;
  adminPassword?: string;
  cafePassword?: string;
  apiUsername?: string;
  apiPassword?: string;
  apiPort?: number;
  apiUseSsl?: boolean;
}

export interface SpaceAmenity {
  id: string;
  name: string;
  icon: string;
  status: 'free' | 'busy' | 'maintenance' | 'ready';
  statusText: string;
  updatedBy: string;
  updatedAt: number;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: number;
  priority: 'normal' | 'urgent';
}

export interface HotspotSession {
  isConnected: boolean;
  username: string;
  ip: string;
  uptime: string;
  timeLeft: string;
  bytesIn: string;
  bytesOut: string;
  loginTime?: number;
  totalQuotaBytes?: number;
  usedBytes?: number;
  connectedDevicesCount?: number;
  connectedDevices?: Array<{
    address: string;
    macAddress?: string;
    uptime?: string;
    bytesIn?: number;
    bytesOut?: number;
  }>;
}

export interface CafeteriaInfo {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  footerNote: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  desk: string;
  quote: string;
  avatar: string;
  status: string;
}

export interface HotspotUserAccount {
  id: string;
  name: string;
  password?: string;
  profile: string;
  bytesIn: number;
  bytesOut: number;
  limitBytesTotal: number; // 0 for unlimited, or bytes
  uptime: string;
  comment?: string;
  disabled?: boolean;
  sharedUsers?: number; // Max allowed concurrent devices
}

export interface HotspotActiveUser {
  id: string;
  user: string;
  address: string;
  macAddress: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
  timeLeft?: string;
}

export type CafeCategory = 'hot_coffee' | 'cold_drink' | 'tea_herbal' | 'pastry_snack' | 'food_meal';

export interface CafeMenuItem {
  id: string;
  name: string;
  category: CafeCategory;
  price: number;
  description: string;
  imageUrl: string;
  prepMinutes: number;
  isAvailable: boolean;
  options?: string[];
  badgeText?: string;
}

export interface CafeOrderItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  selectedOption?: string;
}

export type CafeOrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface CafeOrder {
  id: string;
  orderNumber: number;
  customerId: string;
  customerName: string;
  desk: string;
  items: CafeOrderItem[];
  totalAmount: number;
  paymentMethod: 'tab' | 'cash_pos' | 'card_transfer';
  notes?: string;
  status: CafeOrderStatus;
  createdAt: number;
  updatedAt: number;
}

export interface SystemPerformanceInfo {
  cpuModel: string;
  cpuCores: number;
  loadAvg1m: number;
  totalMemMb: number;
  freeMemMb: number;
  processRssMb: number;
  uptimeSeconds: number;
  uvThreadpoolSize: string;
  dbCacheActive: boolean;
  sseClientsCount: number;
  gzipEnabled: boolean;
}

