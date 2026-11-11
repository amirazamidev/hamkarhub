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
