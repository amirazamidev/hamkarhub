// Optimize libuv threadpool for 4-core processors (e.g. AMD Phenom 9550 Quad-Core)
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '4';

import http from 'http';
import os from 'os';
import zlib from 'zlib';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import JSZip from 'jszip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');
app.set('etag', 'strong');
app.set('json spaces', 0);

// Ensure port 3000 in AI Studio preview (avoid collision with NGINX_PORT=8080) while honoring custom PORT in standalone prod
const rawAppPort = process.env.APP_PORT || process.env.DEFAULT_APP_PORT;
const PORT =
  Number(rawAppPort) ||
  (process.env.PORT && process.env.PORT !== process.env.NGINX_PORT ? Number(process.env.PORT) : 3000);
const isProd = process.env.NODE_ENV === 'production';

// Lightweight fast-level gzip compression for JSON & text responses (>1KB) tuned for legacy CPUs
app.use((req: Request, res: Response, next: NextFunction) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip') || req.path === '/api/chat/stream' || req.path.startsWith('/api/download/') || req.path.startsWith('/api/speedtest/')) {
    return next();
  }
  const origJson = res.json.bind(res);
  res.json = ((body: any) => {
    const jsonStr = JSON.stringify(body);
    if (jsonStr.length < 1024) {
      return origJson(body);
    }
    zlib.gzip(Buffer.from(jsonStr, 'utf-8'), { level: 1 }, (err, compressed) => {
      if (err) return origJson(body);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      res.send(compressed);
    });
    return res;
  }) as any;
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Always serve generated image assets cleanly in both dev & production builds
app.use(
  '/src/assets/images',
  express.static(path.join(__dirname, 'src', 'assets', 'images'), {
    maxAge: isProd ? '7d' : 0,
    etag: true,
  })
);

// Data storage path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'coworking_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface Member {
  id: string;
  name: string;
  avatar?: string;
  role: string; // e.g. Frontend Dev, UI/UX, Founder, Content Creator
  desk: string; // e.g. "میز ۱۲ - سالن باز", "اتاق سکوت"
  status: 'available' | 'busy' | 'coffee' | 'meeting';
  statusText?: string;
  skills: string[];
  lastSeen: number;
  isOnline: boolean;
  ip?: string;
  mac?: string;
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
  reactions?: Record<string, string[]>; // emoji -> [memberIds]
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
  limitBytesTotal: number;
  uptime: string;
  comment?: string;
  disabled?: boolean;
  sharedUsers?: number;
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

interface DBState {
  config: HotspotConfig;
  channels: Channel[];
  messages: ChatMessage[];
  members: Member[];
  amenities: SpaceAmenity[];
  notices: Array<{
    id: string;
    title: string;
    content: string;
    author: string;
    timestamp: number;
    priority: 'normal' | 'urgent';
  }>;
  cafeteria: CafeteriaInfo;
  staff: StaffMember[];
  hotspotUsers: HotspotUserAccount[];
  hotspotActive: HotspotActiveUser[];
  cafeMenu: CafeMenuItem[];
  cafeOrders: CafeOrder[];
}

// Initial seed data
const DEFAULT_DB: DBState = {
  config: {
    routerIp: '192.168.88.1',
    hotspotName: 'Hamkar Hub Wi-Fi',
    loginMethod: 'http-chap',
    serverLocalIp: '192.168.88.254',
    serverPort: 3000,
    trialDurationMinutes: 60,
    dailyVoucherPrefix: 'DAY-',
    walledGardenDomain: 'hub.local',
    welcomeNotice: 'به اینترنت و شبکه اختصاصی فضای کار اشتراکی خوش آمدید!',
  },
  channels: [
    {
      id: 'general',
      name: 'عمومی و لابی',
      description: 'گفتگوهای روزمره، معرفی اعضا و گپ دوستانه حین کار',
      icon: 'Coffee',
      isDefault: true,
    },
    {
      id: 'coworking',
      name: 'همکاری و تخصص‌ها',
      description: 'تبادل مهارت، هم‌فکری پروژه‌ها، مشاوره کد و طراحی',
      icon: 'Users',
    },
    {
      id: 'cafeteria',
      name: 'کافه و سفارش ناهار',
      description: 'هماهنگی سفارش گروهی ناهار، وضعیت قهوه و استراحت',
      icon: 'UtensilsCrossed',
    },
    {
      id: 'meeting-rooms',
      name: 'اتاق جلسات و تماس',
      description: 'هماهنگی استفاده از فون‌باکس‌ها و اتاق جلسات',
      icon: 'PhoneCall',
    },
    {
      id: 'announcements',
      name: 'تابلو اعلانات و رویدادها',
      description: 'اطلاعیه‌های مدیر فضا، ساعت کاری و کارگاه‌های هفتگی',
      icon: 'Megaphone',
    },
  ],
  members: [
    {
      id: 'admin-sara',
      name: 'سارا رضایی',
      role: 'مدیر کامیونیتی (Community Manager)',
      desk: 'میز پذیرش - ورودی اصلی',
      status: 'available',
      statusText: 'پاسخگوی سوالات و رزرو اتاق جلسات',
      skills: ['مدیریت فضا', 'شبکه‌سازی', 'رویدادها'],
      lastSeen: Date.now(),
      isOnline: true,
    },
    {
      id: 'member-ali',
      name: 'علی احمدی',
      role: 'توسعه‌دهنده فول‌استک',
      desk: 'میز شماره ۱۴ - سالن باز',
      status: 'busy',
      statusText: 'در حال تمرکز عمیق روی تسک اسپرینت',
      skills: ['React', 'Node.js', 'PostgreSQL'],
      lastSeen: Date.now() - 1000 * 60 * 3,
      isOnline: true,
    },
    {
      id: 'member-maryam',
      name: 'مریم کریمی',
      role: 'طراح تجربه کاربری (UI/UX)',
      desk: 'میز شماره ۲۱ - کنار پنجره',
      status: 'coffee',
      statusText: 'آماده گپ کاری در کافه‌تریا ☕',
      skills: ['Figma', 'Design Systems', 'User Research'],
      lastSeen: Date.now() - 1000 * 60 * 12,
      isOnline: true,
    },
    {
      id: 'member-reza',
      name: 'رضا نوری',
      role: 'متخصص سئو و مارکتینگ',
      desk: 'میز شماره ۸ - طبقه همکف',
      status: 'meeting',
      statusText: 'جلسه آنلاین تا ۱۱:۳۰',
      skills: ['SEO', 'Growth', 'Google Ads'],
      lastSeen: Date.now() - 1000 * 60 * 20,
      isOnline: true,
    },
  ],
  amenities: [
    {
      id: 'espresso-bar',
      name: 'دستگاه اسپرسو بار',
      icon: 'Coffee',
      status: 'ready',
      statusText: 'دان قهوه تازه پر شده و آب داغ آماده است',
      updatedBy: 'سارا رضایی',
      updatedAt: Date.now() - 1000 * 60 * 45,
    },
    {
      id: 'phone-booth-1',
      name: 'فون باکس ۱ (آکوستیک)',
      icon: 'PhoneCall',
      status: 'free',
      statusText: 'آزاد و تمیز - بدون رزرو قبلی',
      updatedBy: 'علی احمدی',
      updatedAt: Date.now() - 1000 * 60 * 15,
    },
    {
      id: 'phone-booth-2',
      name: 'فون باکس ۲ (آکوستیک)',
      icon: 'PhoneCall',
      status: 'busy',
      statusText: 'در حال مکالمه کاری (تا ۱۵ دقیقه دیگر)',
      updatedBy: 'رضا نوری',
      updatedAt: Date.now() - 1000 * 60 * 5,
    },
    {
      id: 'meeting-room-a',
      name: 'اتاق جلسات ۸ نفره (مجهز به نمایشگر)',
      icon: 'Users',
      status: 'free',
      statusText: 'آزاد تا ساعت ۱۴:۰۰',
      updatedBy: 'سارا رضایی',
      updatedAt: Date.now() - 1000 * 60 * 60,
    },
  ],
  messages: [],
  notices: [
    {
      id: 'not-1',
      title: 'شبکه وای‌فای ۵ گیگاهرتز اختصاصی',
      content: 'برای سرعت پایدارتر در تماس‌های ویدیویی، پیشنهاد می‌شود به باند 5GHz وای‌فای فضای کار متصل شوید.',
      author: 'پشتیبانی شبکه میکروتیک',
      timestamp: Date.now() - 1000 * 60 * 60 * 24,
      priority: 'normal',
    },
    {
      id: 'not-2',
      title: 'رعایت سکوت در زون متمرکز (Quiet Zone)',
      content: 'لطفاً برای تماس‌های تلفنی و جلسات صوتی از فون‌باکس‌ها یا بالکن استفاده فرمایید.',
      author: 'مدیریت فضا',
      timestamp: Date.now() - 1000 * 60 * 60 * 12,
      priority: 'urgent',
    },
  ],
  cafeteria: {
    title: 'قهوه تازه، چای دمی و گپ دوستانه',
    subtitle: 'کافه‌تریا و استراحت',
    description: 'اسپرسوساز حرفه‌ای در آشپزخانه طبقه همکف در دسترس است. برای ثبت سفارش ناهار جمعی، هر روز تا ساعت ۱۲ در کانال #کافه-و-سفارش-ناهار پیام بگذارید تا از تخفیف ویژه همکاران استفاده کنید.',
    imageUrl: '/src/assets/images/coworking_lounge_cafe_1794330975977.jpg',
    footerNote: 'چای و دمنوش رایگان در تمام طول روز مهیاست.',
  },
  staff: [
    {
      id: 'staff-sara',
      name: 'سارا رضایی',
      role: 'مدیر کامیونیتی فضای کار',
      desk: 'میز پذیرش - ورودی اصلی',
      quote: '«هر زمان نیاز به رزرو اتاق جلسات اختصاصی، کارت ورود روزانه، یا سوال در خصوص وای‌فای و اتصال میکروتیک داشتید، در خدمتتان هستم.»',
      avatar: '/src/assets/images/community_manager_avatar_1794330976206.jpg',
      status: 'حاضر در فضا',
    },
  ],
  hotspotUsers: [
    {
      id: 'user-ali',
      name: 'ali_ahmadi',
      profile: 'coworker-10gb',
      bytesIn: 245000000,
      bytesOut: 1850000000,
      limitBytesTotal: 10737418240, // 10 GB
      uptime: '14h 22m',
      comment: 'عضو ماهانه - میز ۱۴',
    },
    {
      id: 'user-maryam',
      name: 'maryam_karimi',
      profile: 'coworker-15gb',
      bytesIn: 412000000,
      bytesOut: 3220000000,
      limitBytesTotal: 16106127360, // 15 GB
      uptime: '22h 10m',
      comment: 'طراح محصول - میز ۲۱',
    },
    {
      id: 'user-reza',
      name: 'reza_nouri',
      profile: 'coworker-10gb',
      bytesIn: 120000000,
      bytesOut: 980000000,
      limitBytesTotal: 10737418240, // 10 GB
      uptime: '8h 45m',
      comment: 'سئو مارکتینگ - میز ۸',
    },
    {
      id: 'user-guest1',
      name: 'DAY-7392',
      profile: 'daily-pass-3gb',
      bytesIn: 45000000,
      bytesOut: 480000000,
      limitBytesTotal: 3221225472, // 3 GB
      uptime: '2h 15m',
      comment: 'ووچر روزانه مهمان',
    },
  ],
  hotspotActive: [
    {
      id: 'active-ali',
      user: 'ali_ahmadi',
      address: '192.168.88.102',
      macAddress: 'D4:61:9D:28:44:11',
      uptime: '02:45:12',
      bytesIn: 42000000,
      bytesOut: 480000000,
      timeLeft: 'نامحدود',
    },
    {
      id: 'active-maryam',
      user: 'maryam_karimi',
      address: '192.168.88.105',
      macAddress: '3C:22:FB:89:12:08',
      uptime: '01:12:30',
      bytesIn: 88000000,
      bytesOut: 920000000,
      timeLeft: 'نامحدود',
    },
  ],
  cafeMenu: [
    {
      id: 'cafe-espresso-double',
      name: 'اسپرسو دبل اسپشیالیتی',
      category: 'hot_coffee',
      price: 68000,
      description: 'عصاره‌گیری تازه از دانه ۱۰۰٪ عربیکا با کرمای غلیظ و عطر شکلات تلخ',
      imageUrl: '/src/assets/images/cafe_espresso_latte_1794509112349.jpg',
      prepMinutes: 4,
      isAvailable: true,
      options: ['رست مدیوم', 'دارک رست', 'بدون کافئین'],
      badgeText: 'پرفروش',
    },
    {
      id: 'cafe-latte-classic',
      name: 'لاته کلاسیک وانیل / کارامل',
      category: 'hot_coffee',
      price: 95000,
      description: 'اسپرسو دبل همراه با شیر بخار داده‌شده مخملی و سیروپ انتخابی',
      imageUrl: '/src/assets/images/cafe_espresso_latte_1794509112349.jpg',
      prepMinutes: 6,
      isAvailable: true,
      options: ['ساده', 'سیروپ کارامل', 'سیروپ وانیل', 'شیر بادام'],
    },
    {
      id: 'cafe-cappuccino',
      name: 'کاپوچینو ایتالیایی',
      category: 'hot_coffee',
      price: 88000,
      description: 'ترکیب متعادل اسپرسو و فوم شیر غلیظ مناسب ساعت‌های تمرکز و کار',
      imageUrl: '/src/assets/images/cafe_espresso_latte_1794509112349.jpg',
      prepMinutes: 5,
      isAvailable: true,
      options: ['شیر پرچرب', 'شیر کم‌چرب', 'پودر دارچین'],
    },
    {
      id: 'cafe-iced-caramel',
      name: 'آیس کارامل ماکیاتو',
      category: 'cold_drink',
      price: 112000,
      description: 'اسپرسو خنک روی یخ، شیر سرد و سس کارامل دست‌ساز کافه',
      imageUrl: '/src/assets/images/cafe_iced_coffee_1794509113123.jpg',
      prepMinutes: 5,
      isAvailable: true,
      options: ['یخ استاندارد', 'کم‌یخ', 'کم‌شیرین'],
      badgeText: 'محبوب تابستان',
    },
    {
      id: 'cafe-cold-brew',
      name: 'کلد برو ۱۲ ساعته',
      category: 'cold_drink',
      price: 105000,
      description: 'دم‌آوری سرد ۱۲ ساعته با کافئین بالا و اسیدیته ملایم بدون تلخی',
      imageUrl: '/src/assets/images/cafe_iced_coffee_1794509113123.jpg',
      prepMinutes: 2,
      isAvailable: true,
      options: ['خالص', 'همراه با شیر', 'برش پرتقال'],
    },
    {
      id: 'cafe-saffron-rose-tea',
      name: 'دمنوش زعفران و گل‌محمدی',
      category: 'tea_herbal',
      price: 78000,
      description: 'قوری شیشه‌ای دمنوش آرام‌بخش زعفران قائنات، غنچه گل‌محمدی و نبات',
      imageUrl: '/src/assets/images/cafe_herbal_tea_1794509113421.jpg',
      prepMinutes: 7,
      isAvailable: true,
      options: ['با نبات زعفرانی', 'بدون شیرین‌کننده', 'با عسل'],
    },
    {
      id: 'cafe-croissant-brownie',
      name: 'کروسان کره تازه / براونی شکلاتی',
      category: 'pastry_snack',
      price: 85000,
      description: 'پخت روز کارگاه قنادی همکار، ترد و گرم کنار قهوه',
      imageUrl: '/src/assets/images/cafe_pastry_sandwich_1794509113971.jpg',
      prepMinutes: 3,
      isAvailable: true,
      options: ['کروسان کره ساده', 'کروسان شکلاتی', 'براونی گردویی'],
    },
    {
      id: 'cafe-pesto-panini',
      name: 'پنینی پستو و موزارلا (میان‌وعده گرم)',
      category: 'food_meal',
      price: 165000,
      description: 'نان فوکاچیا گریل شده با سس پستو ریحان، پنیر موزارلا تازه و گوجه خشک',
      imageUrl: '/src/assets/images/cafe_pastry_sandwich_1794509113971.jpg',
      prepMinutes: 10,
      isAvailable: true,
      options: ['سرو گرم معمولی', 'بدون گوجه', 'سس تند اضافه'],
      badgeText: 'پیشنهاد سرآشپز',
    },
  ],
  cafeOrders: [],
};

// In-memory DB cache for AMD Phenom 9550 / low-I/O performance
let dbCache: DBState | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;

function flushDbSync(): void {
  if (!dbCache) return;
  try {
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(dbCache), 'utf-8');
    fs.renameSync(tmp, DB_FILE);
  } catch (err) {
    console.error('Error flushing DB file sync:', err);
  }
}

async function flushDbAsync(): Promise<void> {
  if (!dbCache || isFlushing) return;
  isFlushing = true;
  try {
    const snapshot = JSON.stringify(dbCache);
    const tmp = `${DB_FILE}.tmp`;
    await fs.promises.writeFile(tmp, snapshot, 'utf-8');
    await fs.promises.rename(tmp, DB_FILE);
  } catch (err) {
    console.error('Error flushing DB file async:', err);
  } finally {
    isFlushing = false;
  }
}

function readDb(): DBState {
  if (dbCache) {
    return dbCache;
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      let migrated = false;
      if (!parsed.cafeteria) { parsed.cafeteria = DEFAULT_DB.cafeteria; migrated = true; }
      if (!parsed.staff || !Array.isArray(parsed.staff)) { parsed.staff = DEFAULT_DB.staff; migrated = true; }
      if (!parsed.hotspotUsers || !Array.isArray(parsed.hotspotUsers)) { parsed.hotspotUsers = DEFAULT_DB.hotspotUsers; migrated = true; }
      if (!parsed.hotspotActive || !Array.isArray(parsed.hotspotActive)) { parsed.hotspotActive = DEFAULT_DB.hotspotActive; migrated = true; }
      if (!parsed.cafeMenu || !Array.isArray(parsed.cafeMenu)) { parsed.cafeMenu = DEFAULT_DB.cafeMenu; migrated = true; }
      if (!parsed.cafeOrders || !Array.isArray(parsed.cafeOrders)) { parsed.cafeOrders = []; migrated = true; }
      dbCache = parsed;
      if (migrated) {
        flushDbSync();
      }
      return dbCache!;
    }
  } catch (err) {
    console.error('Error reading DB file, using defaults:', err);
  }
  dbCache = JSON.parse(JSON.stringify(DEFAULT_DB));
  flushDbSync();
  return dbCache!;
}

function saveDb(data: DBState): void {
  dbCache = data;
  if (flushTimer) {
    clearTimeout(flushTimer);
  }
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushDbAsync();
  }, 250);
}

// Ensure clean flush on exit
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    if (flushTimer) clearTimeout(flushTimer);
    flushDbSync();
    process.exit(0);
  });
}

// SSE Clients for real-time broadcasts without cloud dependencies
const sseClients = new Set<Response>();

// Lightweight 30s heartbeat to keep LAN connections alive cleanly
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 30000);

function broadcast(event: string, payload: any) {
  const data = JSON.stringify(payload);
  for (const client of sseClients) {
    try {
      client.write(`event: ${event}\ndata: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// --- API ROUTES ---

// SSE Stream
app.get('/api/chat/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// System Performance & CPU Optimization Telemetry
app.get('/api/system/performance', (req: Request, res: Response) => {
  const cpus = os.cpus();
  const mem = process.memoryUsage();
  res.json({
    cpuModel: cpus[0]?.model?.trim() || 'Unknown CPU',
    cpuCores: cpus.length || 4,
    loadAvg1m: Number((os.loadavg()[0] || 0).toFixed(2)),
    totalMemMb: Math.round(os.totalmem() / (1024 * 1024)),
    freeMemMb: Math.round(os.freemem() / (1024 * 1024)),
    processRssMb: Math.round(mem.rss / (1024 * 1024)),
    uptimeSeconds: Math.round(process.uptime()),
    uvThreadpoolSize: process.env.UV_THREADPOOL_SIZE || '4',
    dbCacheActive: dbCache !== null,
    sseClientsCount: sseClients.size,
    gzipEnabled: true,
  });
});

// App status & environment detection
app.get('/api/status', (req: Request, res: Response) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '192.168.88.50';
  const db = readDb();
  res.json({
    ok: true,
    serverTime: Date.now(),
    clientIp: String(clientIp).replace('::ffff:', ''),
    activeClients: sseClients.size,
    onlineMembersCount: db.members.filter((m) => m.isOnline).length,
    routerIp: db.config.routerIp,
    hotspotName: db.config.hotspotName,
  });
});

// Hotspot Config
app.get('/api/hotspot/config', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.config);
});

app.post('/api/hotspot/config', (req: Request, res: Response) => {
  const db = readDb();
  db.config = { ...db.config, ...req.body };
  saveDb(db);
  broadcast('config_updated', db.config);
  res.json({ success: true, config: db.config });
});

// Channels
app.get('/api/channels', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.channels);
});

// Messages (bounded to latest 200 for optimal CPU/memory footprint)
app.get('/api/messages', (req: Request, res: Response) => {
  const channelId = req.query.channelId as string;
  const limit = Math.min(Math.max(Number(req.query.limit) || 200, 10), 500);
  const db = readDb();
  const filtered = channelId ? db.messages.filter((m) => m.channelId === channelId) : db.messages;
  res.json(filtered.slice(-limit));
});

app.post('/api/messages', (req: Request, res: Response) => {
  const { channelId, sender, content, type } = req.body;
  if (!channelId || !content || !sender || !sender.name) {
    return res.status(400).json({ error: 'اطلاعات پیام ناقص است' });
  }

  const db = readDb();
  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    channelId,
    sender: {
      id: sender.id || `guest-${Date.now()}`,
      name: sender.name,
      role: sender.role || 'عضو فضا',
      desk: sender.desk || 'میز اشتراکی',
      avatar: sender.avatar,
    },
    content: content.trim(),
    timestamp: Date.now(),
    reactions: {},
    type: type || 'text',
  };

  db.messages.push(newMessage);

  // Update member lastSeen & presence
  const existingMember = db.members.find((m) => m.id === newMessage.sender.id);
  if (existingMember) {
    existingMember.lastSeen = Date.now();
    existingMember.isOnline = true;
  } else {
    db.members.push({
      id: newMessage.sender.id,
      name: newMessage.sender.name,
      role: newMessage.sender.role,
      desk: newMessage.sender.desk,
      status: 'available',
      skills: [],
      lastSeen: Date.now(),
      isOnline: true,
      avatar: newMessage.sender.avatar,
    });
  }

  saveDb(db);
  broadcast('new_message', newMessage);
  res.status(201).json(newMessage);
});

// Reactions
app.post('/api/messages/reaction', (req: Request, res: Response) => {
  const { messageId, emoji, memberId } = req.body;
  if (!messageId || !emoji || !memberId) {
    return res.status(400).json({ error: 'اطلاعات ناقص است' });
  }

  const db = readDb();
  const msg = db.messages.find((m) => m.id === messageId);
  if (!msg) {
    return res.status(404).json({ error: 'پیام یافت نشد' });
  }

  if (!msg.reactions) {
    msg.reactions = {};
  }
  if (!msg.reactions[emoji]) {
    msg.reactions[emoji] = [];
  }

  const index = msg.reactions[emoji].indexOf(memberId);
  if (index > -1) {
    msg.reactions[emoji].splice(index, 1);
    if (msg.reactions[emoji].length === 0) {
      delete msg.reactions[emoji];
    }
  } else {
    msg.reactions[emoji].push(memberId);
  }

  saveDb(db);
  broadcast('reaction_updated', { messageId, reactions: msg.reactions });
  res.json({ success: true, reactions: msg.reactions });
});

// Members / Who's in the space
app.get('/api/members', (req: Request, res: Response) => {
  const db = readDb();
  // Filter active in last 3 hours or marked online
  const threshold = Date.now() - 1000 * 60 * 180;
  const list = db.members.map((m) => ({
    ...m,
    isOnline: m.lastSeen > threshold,
  }));
  res.json(list);
});

app.post('/api/members/checkin', (req: Request, res: Response) => {
  const { id, name, role, desk, status, statusText, skills, avatar } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'نام الزامی است' });
  }

  const db = readDb();
  const memberId = id || `member-${Date.now()}`;
  let member = db.members.find((m) => m.id === memberId);

  if (member) {
    member.name = name;
    if (role) member.role = role;
    if (desk) member.desk = desk;
    if (status) member.status = status;
    if (statusText !== undefined) member.statusText = statusText;
    if (skills) member.skills = skills;
    if (avatar) member.avatar = avatar;
    member.lastSeen = Date.now();
    member.isOnline = true;
  } else {
    member = {
      id: memberId,
      name,
      role: role || 'عضو فضا',
      desk: desk || 'سالن اصلی',
      status: status || 'available',
      statusText: statusText || 'مشغول کار',
      skills: skills || [],
      lastSeen: Date.now(),
      isOnline: true,
      avatar,
    };
    db.members.push(member);
  }

  saveDb(db);
  broadcast('member_updated', member);
  res.json(member);
});

// Amenities
app.get('/api/amenities', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.amenities);
});

app.post('/api/amenities/update', (req: Request, res: Response) => {
  const { id, status, statusText, updatedBy } = req.body;
  const db = readDb();
  const amenity = db.amenities.find((a) => a.id === id);
  if (!amenity) {
    return res.status(404).json({ error: 'مورد یافت نشد' });
  }

  if (status) amenity.status = status;
  if (statusText) amenity.statusText = statusText;
  if (updatedBy) amenity.updatedBy = updatedBy;
  amenity.updatedAt = Date.now();

  saveDb(db);
  broadcast('amenity_updated', amenity);
  res.json(amenity);
});

// Notices
app.get('/api/notices', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.notices);
});

app.post('/api/notices', (req: Request, res: Response) => {
  const { title, content, author, priority } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'عنوان و متن الزامی است' });
  }

  const db = readDb();
  const newNotice = {
    id: `not-${Date.now()}`,
    title,
    content,
    author: author || 'مدیریت فضا',
    timestamp: Date.now(),
    priority: priority || 'normal',
  };

  db.notices.unshift(newNotice);
  saveDb(db);
  broadcast('new_notice', newNotice);
  res.status(201).json(newNotice);
});

// Speed test endpoints
app.get('/api/speedtest/ping', (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.json({ pong: true, time: Date.now() });
});

app.get('/api/speedtest/payload', (req: Request, res: Response) => {
  const sizeBytes = Math.min(Math.max(Number(req.query.bytes) || 1048576, 65536), 5242880);
  res.set({
    'Content-Type': 'application/octet-stream',
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Content-Length': sizeBytes.toString(),
  });
  const chunk = Buffer.alloc(sizeBytes, 0x48);
  res.send(chunk);
});

// User self-service stats
app.get('/api/hotspot/user-stats/:username', (req: Request, res: Response) => {
  const { username } = req.params;
  const db = readDb();
  const user = db.hotspotUsers.find((u) => u.name.toLowerCase() === username.toLowerCase() || u.id === username);
  const activeDevices = db.hotspotActive.filter((a) => a.user.toLowerCase() === username.toLowerCase());

  if (!user) {
    return res.json({
      exists: false,
      username,
      totalQuotaBytes: 10737418240, // 10 GB default
      usedBytes: 1540000,
      connectedDevicesCount: Math.max(activeDevices.length, 1),
      connectedDevices: activeDevices,
    });
  }

  const usedBytes = (user.bytesIn || 0) + (user.bytesOut || 0);
  return res.json({
    exists: true,
    username: user.name,
    totalQuotaBytes: user.limitBytesTotal || 0,
    usedBytes,
    connectedDevicesCount: Math.max(activeDevices.length, 1),
    connectedDevices: activeDevices,
    uptime: user.uptime,
    comment: user.comment,
    disabled: user.disabled,
  });
});

// User self-service change password
app.post('/api/hotspot/change-password', async (req: Request, res: Response) => {
  const { username, oldPassword, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: 'نام کاربری و کلمه عبور جدید الزامی هستند' });
  }
  if (String(newPassword).length < 4) {
    return res.status(400).json({ error: 'کلمه عبور جدید باید حداقل ۴ کاراکتر باشد' });
  }

  const db = readDb();
  let user = db.hotspotUsers.find((u) => u.name.toLowerCase() === username.toLowerCase() || u.id === username);

  if (!user) {
    user = {
      id: `user-${Date.now()}`,
      name: username,
      password: newPassword,
      profile: 'default',
      bytesIn: 0,
      bytesOut: 0,
      limitBytesTotal: 10737418240,
      uptime: '0s',
      comment: 'عضو خودثبت‌نامی فضای کار',
    };
    db.hotspotUsers.push(user);
  } else {
    if (user.password && oldPassword && user.password !== oldPassword) {
      return res.status(400).json({ error: 'کلمه عبور فعلی وارد شده نادرست است' });
    }
    user.password = newPassword;
  }

  let updatedOnRouter = false;
  try {
    await callMikrotikRest(db.config, `/ip/hotspot/user/${encodeURIComponent(user.id)}`, 'PATCH', {
      password: newPassword,
    });
    updatedOnRouter = true;
  } catch {
    // offline or local mode
  }

  saveDb(db);
  broadcast('hotspot_users_updated', db.hotspotUsers);
  return res.json({
    success: true,
    message: 'کلمه عبور هات‌اسپات با موفقیت تغییر یافت.',
    updatedOnRouter,
  });
});

// Clear all chat messages
app.post('/api/admin/clear-messages', (req: Request, res: Response) => {
  const db = readDb();
  db.messages = [];
  saveDb(db);
  broadcast('messages_cleared', []);
  return res.json({ success: true, message: 'تمام پیام‌های چت با موفقیت پاکسازی شدند' });
});

// Hotspot login simulation / proxy
app.post('/api/hotspot/login', (req: Request, res: Response) => {
  const { username, password, type } = req.body;
  const clientIp = (req.socket.remoteAddress || '192.168.88.102').replace(/^.*:/, '') || '192.168.88.102';
  const db = readDb();

  // If guest/trial access
  if (type === 'trial') {
    return res.json({
      success: true,
      message: 'دسترسی آزمایشی اینترنت فعال شد.',
      session: {
        username: 'مهمان موقت (Trial)',
        uptime: '00:00:01',
        timeLeft: '01:00:00',
        bytesIn: '24 KB',
        bytesOut: '12 KB',
        ip: clientIp,
        totalQuotaBytes: 1073741824, // 1 GB
        usedBytes: 36864,
        connectedDevicesCount: 1,
        connectedDevices: [{ address: clientIp, macAddress: 'Auto-Trial', uptime: '00:00:01' }],
      },
    });
  }

  // Voucher validation or member login
  if (!username) {
    return res.status(400).json({ error: 'نام کاربری یا کد اشتراک وارد نشده است' });
  }

  const userAccount = db.hotspotUsers.find((u) => u.name.toLowerCase() === username.toLowerCase() || u.id === username);
  if (userAccount && userAccount.disabled) {
    return res.status(403).json({ error: 'این حساب کاربری توسط ادمین غیرفعال شده است. لطفاً به پذیرش مراجعه فرمایید.' });
  }

  if (userAccount && userAccount.password && password && userAccount.password !== password) {
    return res.status(401).json({ error: 'کلمه عبور وارد شده نادرست است' });
  }

  let activeDevs = db.hotspotActive.filter((a) => a.user.toLowerCase() === username.toLowerCase());
  const alreadyActive = activeDevs.find((a) => a.address === clientIp);
  if (!alreadyActive) {
    const newActive: HotspotActiveUser = {
      id: `act-${Date.now()}`,
      user: username,
      address: clientIp,
      macAddress: 'D4:61:9D:' + Math.floor(10 + Math.random() * 89) + ':' + Math.floor(10 + Math.random() * 89) + ':11',
      uptime: '00:00:01',
      bytesIn: userAccount ? Math.round(userAccount.bytesIn * 0.1) : 450000,
      bytesOut: userAccount ? Math.round(userAccount.bytesOut * 0.1) : 1200000,
      timeLeft: 'نامحدود (عضو فعال)',
    };
    db.hotspotActive.push(newActive);
    saveDb(db);
    activeDevs.push(newActive);
  }

  const totalQuota = userAccount ? userAccount.limitBytesTotal : 10737418240;
  const used = userAccount ? (userAccount.bytesIn + userAccount.bytesOut) : 2100000;

  return res.json({
    success: true,
    message: 'اتصال اینترنت با موفقیت برقرار شد.',
    session: {
      username: userAccount ? userAccount.name : username,
      uptime: userAccount?.uptime && userAccount.uptime !== '0s' ? userAccount.uptime : '00:00:05',
      timeLeft: 'نامحدود (عضو فعال)',
      bytesIn: userAccount ? `${(userAccount.bytesIn / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
      bytesOut: userAccount ? `${(userAccount.bytesOut / (1024 * 1024)).toFixed(1)} MB` : '420 KB',
      ip: clientIp,
      totalQuotaBytes: totalQuota,
      usedBytes: used,
      connectedDevicesCount: Math.max(activeDevs.length, 1),
      connectedDevices: activeDevs.map((d) => ({
        address: d.address,
        macAddress: d.macAddress,
        uptime: d.uptime,
        bytesIn: d.bytesIn,
        bytesOut: d.bytesOut,
      })),
      loginTime: Date.now(),
    },
  });
});

// --- ADMIN ROUTES ---

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  const db = readDb();
  const currentPass = db.config.adminPassword || 'admin123';
  if (password === currentPass) {
    return res.json({ success: true, token: 'admin-authorized-session' });
  }
  return res.status(401).json({ success: false, error: 'رمز عبور ادمین نادرست است' });
});

// Independent Barista / Cafe Panel Login & Settings
app.post('/api/cafe/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  const db = readDb();
  const cafePass = db.config.cafePassword || 'cafe123';
  if (password === cafePass) {
    return res.json({ success: true, token: 'cafe-authorized-session' });
  }
  return res.status(401).json({ success: false, error: 'رمز عبور پنل کافه نادرست است' });
});

app.post('/api/cafe/admin/passcode', (req: Request, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || String(newPassword).trim().length < 4) {
    return res.status(400).json({ error: 'رمز عبور پنل کافه باید حداقل ۴ کاراکتر باشد' });
  }
  const db = readDb();
  db.config.cafePassword = String(newPassword).trim();
  saveDb(db);
  return res.json({ success: true });
});

// Admin Amenities Management
app.post('/api/admin/amenities', (req: Request, res: Response) => {
  const { name, icon, status, statusText } = req.body;
  if (!name) return res.status(400).json({ error: 'نام امکانات الزامی است' });
  const db = readDb();
  const newAmenity: SpaceAmenity = {
    id: `amenity-${Date.now()}`,
    name,
    icon: icon || 'Coffee',
    status: status || 'ready',
    statusText: statusText || 'آماده استفاده',
    updatedBy: 'مدیر فضا',
    updatedAt: Date.now(),
  };
  db.amenities.push(newAmenity);
  saveDb(db);
  broadcast('amenity_updated', newAmenity);
  res.status(201).json(newAmenity);
});

app.put('/api/admin/amenities/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, icon, status, statusText } = req.body;
  const db = readDb();
  const amenity = db.amenities.find((a) => a.id === id);
  if (!amenity) return res.status(404).json({ error: 'مورد یافت نشد' });
  if (name) amenity.name = name;
  if (icon) amenity.icon = icon;
  if (status) amenity.status = status;
  if (statusText !== undefined) amenity.statusText = statusText;
  amenity.updatedAt = Date.now();
  saveDb(db);
  broadcast('amenity_updated', amenity);
  res.json(amenity);
});

app.delete('/api/admin/amenities/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  db.amenities = db.amenities.filter((a) => a.id !== id);
  saveDb(db);
  broadcast('amenity_deleted', { id });
  res.json({ success: true });
});

// Admin Channels Management
app.post('/api/admin/channels', (req: Request, res: Response) => {
  const { name, description, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'نام کانال الزامی است' });
  const db = readDb();
  const newChannel: Channel = {
    id: `ch-${Date.now()}`,
    name,
    description: description || '',
    icon: icon || 'Hash',
  };
  db.channels.push(newChannel);
  saveDb(db);
  broadcast('channel_created', newChannel);
  res.status(201).json(newChannel);
});

app.put('/api/admin/channels/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, icon } = req.body;
  const db = readDb();
  const channel = db.channels.find((c) => c.id === id);
  if (!channel) return res.status(404).json({ error: 'کانال یافت نشد' });
  if (name) channel.name = name;
  if (description !== undefined) channel.description = description;
  if (icon) channel.icon = icon;
  saveDb(db);
  broadcast('channel_updated', channel);
  res.json(channel);
});

app.delete('/api/admin/channels/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  if (db.channels.length <= 1) {
    return res.status(400).json({ error: 'حداقل یک کانال باید در سامانه باقی بماند' });
  }
  db.channels = db.channels.filter((c) => c.id !== id);
  saveDb(db);
  broadcast('channel_deleted', { id });
  res.json({ success: true });
});

// Admin Notices Management
app.delete('/api/admin/notices/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  db.notices = db.notices.filter((n) => n.id !== id);
  saveDb(db);
  broadcast('notice_deleted', { id });
  res.json({ success: true });
});

// Admin Settings
app.post('/api/admin/settings', (req: Request, res: Response) => {
  const { adminPassword, ...otherConfig } = req.body;
  const db = readDb();
  if (adminPassword) {
    db.config.adminPassword = adminPassword;
  }
  db.config = { ...db.config, ...otherConfig };
  saveDb(db);
  broadcast('config_updated', db.config);
  res.json({ success: true, config: db.config });
});

// --- CAFETERIA SHOWCASE API ---
app.get('/api/cafeteria', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.cafeteria);
});

app.post('/api/admin/cafeteria', (req: Request, res: Response) => {
  const db = readDb();
  const { title, subtitle, description, imageUrl, footerNote } = req.body;
  db.cafeteria = {
    title: title ?? db.cafeteria.title,
    subtitle: subtitle ?? db.cafeteria.subtitle,
    description: description ?? db.cafeteria.description,
    imageUrl: imageUrl ?? db.cafeteria.imageUrl,
    footerNote: footerNote ?? db.cafeteria.footerNote,
  };
  saveDb(db);
  broadcast('cafeteria_updated', db.cafeteria);
  res.json({ success: true, cafeteria: db.cafeteria });
});

// --- CAFE MENU & FULL ORDERING SYSTEM API ---

// Get Cafe Menu
app.get('/api/cafe/menu', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.cafeMenu);
});

// Admin Create Menu Item
app.post('/api/admin/cafe/menu', (req: Request, res: Response) => {
  const { name, category, price, description, imageUrl, prepMinutes, isAvailable, options, badgeText } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'نام آیتم و قیمت الزامی هستند' });
  }
  const db = readDb();
  const newItem: CafeMenuItem = {
    id: `cafe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: String(name).trim(),
    category: category || 'hot_coffee',
    price: Math.max(0, Number(price) || 0),
    description: description || '',
    imageUrl: imageUrl || '/src/assets/images/cafe_espresso_latte_1794509112349.jpg',
    prepMinutes: Math.max(1, Number(prepMinutes) || 5),
    isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
    options: Array.isArray(options) ? options : [],
    badgeText: badgeText || '',
  };
  db.cafeMenu.push(newItem);
  saveDb(db);
  broadcast('cafe_menu_updated', db.cafeMenu);
  res.status(201).json(newItem);
});

// Admin Update Menu Item
app.put('/api/admin/cafe/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const item = db.cafeMenu.find((m) => m.id === id);
  if (!item) return res.status(404).json({ error: 'آیتم منو یافت نشد' });

  const { name, category, price, description, imageUrl, prepMinutes, isAvailable, options, badgeText } = req.body;
  if (name !== undefined) item.name = String(name).trim();
  if (category !== undefined) item.category = category;
  if (price !== undefined) item.price = Math.max(0, Number(price) || 0);
  if (description !== undefined) item.description = description;
  if (imageUrl !== undefined) item.imageUrl = imageUrl;
  if (prepMinutes !== undefined) item.prepMinutes = Math.max(1, Number(prepMinutes) || 5);
  if (isAvailable !== undefined) item.isAvailable = Boolean(isAvailable);
  if (options !== undefined) item.options = Array.isArray(options) ? options : [];
  if (badgeText !== undefined) item.badgeText = badgeText;

  saveDb(db);
  broadcast('cafe_menu_updated', db.cafeMenu);
  res.json({ success: true, item });
});

// Admin Delete Menu Item
app.delete('/api/admin/cafe/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  db.cafeMenu = db.cafeMenu.filter((m) => m.id !== id);
  saveDb(db);
  broadcast('cafe_menu_updated', db.cafeMenu);
  res.json({ success: true });
});

// Get Cafe Orders
app.get('/api/cafe/orders', (req: Request, res: Response) => {
  const customerId = req.query.customerId as string;
  const db = readDb();
  const orders = customerId
    ? db.cafeOrders.filter((o) => o.customerId === customerId)
    : db.cafeOrders;
  res.json(orders.slice(0, 150));
});

// Place New Cafe Order
app.post('/api/cafe/orders', (req: Request, res: Response) => {
  const { customerId, customerName, desk, items, paymentMethod, notes } = req.body;
  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'نام سفارش‌دهنده و حداقل یک آیتم الزامی است' });
  }

  const db = readDb();
  const validatedItems: CafeOrderItem[] = [];
  let totalAmount = 0;

  for (const reqItem of items) {
    const menuItem = db.cafeMenu.find((m) => m.id === reqItem.menuItemId);
    if (!menuItem || !menuItem.isAvailable) {
      return res.status(400).json({ error: `آیتم «${reqItem.name || reqItem.menuItemId}» در حال حاضر موجود نیست` });
    }
    const qty = Math.min(Math.max(1, Number(reqItem.quantity) || 1), 25);
    totalAmount += menuItem.price * qty;
    validatedItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      unitPrice: menuItem.price,
      quantity: qty,
      selectedOption: reqItem.selectedOption ? String(reqItem.selectedOption) : undefined,
    });
  }

  const nextNumber =
    db.cafeOrders.length > 0 ? Math.max(...db.cafeOrders.map((o) => o.orderNumber || 100)) + 1 : 101;
  const now = Date.now();
  const newOrder: CafeOrder = {
    id: `ord-${now}-${Math.random().toString(36).substring(2, 6)}`,
    orderNumber: nextNumber,
    customerId: customerId || `guest-${now}`,
    customerName: String(customerName).trim(),
    desk: String(desk || 'سالن اصلی').trim(),
    items: validatedItems,
    totalAmount,
    paymentMethod: paymentMethod || 'cash_pos',
    notes: notes ? String(notes).trim() : '',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  db.cafeOrders.unshift(newOrder);
  if (db.cafeOrders.length > 300) {
    db.cafeOrders = db.cafeOrders.slice(0, 300);
  }
  saveDb(db);
  broadcast('cafe_order_created', newOrder);
  res.status(201).json(newOrder);
});

// Update Order Status (Barista / Admin or User Cancel Pending)
app.put('/api/cafe/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed: CafeOrderStatus[] = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'وضعیت سفارش نامعتبر است' });
  }

  const db = readDb();
  const order = db.cafeOrders.find((o) => o.id === id);
  if (!order) return res.status(404).json({ error: 'سفارش یافت نشد' });

  order.status = status;
  order.updatedAt = Date.now();
  saveDb(db);
  broadcast('cafe_order_updated', order);
  res.json({ success: true, order });
});

// Clear Completed / Cancelled Orders (Admin)
app.delete('/api/admin/cafe/orders/completed', (req: Request, res: Response) => {
  const db = readDb();
  db.cafeOrders = db.cafeOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  saveDb(db);
  broadcast('cafe_orders_cleared', db.cafeOrders);
  res.json({ success: true, remaining: db.cafeOrders });
});

// --- STAFF / MANAGERS API ---
app.get('/api/staff', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.staff);
});

app.post('/api/admin/staff', (req: Request, res: Response) => {
  const { name, role, desk, quote, avatar, status } = req.body;
  if (!name) return res.status(400).json({ error: 'نام پرسنل الزامی است' });
  const db = readDb();
  const newStaff: StaffMember = {
    id: `staff-${Date.now()}`,
    name,
    role: role || 'مدیر کامیونیتی',
    desk: desk || 'میز پذیرش',
    quote: quote || '',
    avatar: avatar || '/src/assets/images/community_manager_avatar_1794330976206.jpg',
    status: status || 'حاضر در فضا',
  };
  db.staff.push(newStaff);
  saveDb(db);
  broadcast('staff_updated', db.staff);
  res.status(201).json(newStaff);
});

app.put('/api/admin/staff/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, role, desk, quote, avatar, status } = req.body;
  const db = readDb();
  const staff = db.staff.find((s) => s.id === id);
  if (!staff) return res.status(404).json({ error: 'عضو کادر یافت نشد' });
  if (name) staff.name = name;
  if (role) staff.role = role;
  if (desk) staff.desk = desk;
  if (quote !== undefined) staff.quote = quote;
  if (avatar) staff.avatar = avatar;
  if (status) staff.status = status;
  saveDb(db);
  broadcast('staff_updated', db.staff);
  res.json(staff);
});

app.delete('/api/admin/staff/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  db.staff = db.staff.filter((s) => s.id !== id);
  saveDb(db);
  broadcast('staff_updated', db.staff);
  res.json({ success: true });
});

// --- MIKROTIK HOTSPOT API & USER MANAGEMENT ---

// Helper to make RouterOS REST API calls
async function callMikrotikRest(config: HotspotConfig, pathStr: string, method: string = 'GET', body?: any) {
  if (!config.apiUsername) {
    throw new Error('نام کاربری API تنظیم نشده است');
  }
  const protocol = config.apiUseSsl ? 'https' : 'http';
  const port = config.apiPort || (config.apiUseSsl ? 443 : 80);
  const url = `${protocol}://${config.routerIp}:${port}/rest${pathStr}`;
  const auth = Buffer.from(`${config.apiUsername}:${config.apiPassword || ''}`).toString('base64');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`RouterOS response ${response.status}: ${txt}`);
    }
    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Test RouterOS API Connection
app.get('/api/mikrotik/test-connection', async (req: Request, res: Response) => {
  const db = readDb();
  try {
    const systemRes = await callMikrotikRest(db.config, '/system/resource');
    res.json({
      connected: true,
      message: 'اتصال به API میکروتیک با موفقیت برقرار است',
      data: systemRes,
    });
  } catch (err: any) {
    res.json({
      connected: false,
      message: `عدم برقراری ارتباط با روتر (${err.message}). در حال کار با حافظه محلی سرور.`,
    });
  }
});

// Get Hotspot Users
app.get('/api/mikrotik/users', async (req: Request, res: Response) => {
  const db = readDb();
  try {
    const routerUsers = await callMikrotikRest(db.config, '/ip/hotspot/user');
    if (Array.isArray(routerUsers)) {
      // Map router format to our HotspotUserAccount
      const mapped: HotspotUserAccount[] = routerUsers.map((u: any) => ({
        id: u['.id'] || u.name,
        name: u.name,
        profile: u.profile || 'default',
        bytesIn: Number(u['bytes-in'] || 0),
        bytesOut: Number(u['bytes-out'] || 0),
        limitBytesTotal: Number(u['limit-bytes-total'] || 0),
        uptime: u.uptime || '0s',
        comment: u.comment || '',
        disabled: u.disabled === 'true' || u.disabled === true,
      }));
      db.hotspotUsers = mapped;
      saveDb(db);
      return res.json({ connectedToRouter: true, users: mapped });
    }
  } catch {
    // Router offline or dev mode fallback
  }
  return res.json({
    connectedToRouter: false,
    message: 'فراخوانی از پایگاه داده لوکال سرور',
    users: db.hotspotUsers,
  });
});

// Create Hotspot User
app.post('/api/mikrotik/users', async (req: Request, res: Response) => {
  const { name, password, profile, limitBytesTotal, comment } = req.body;
  if (!name) return res.status(400).json({ error: 'نام کاربری الزامی است' });
  const db = readDb();

  const newUser: HotspotUserAccount = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    password: password || '',
    profile: profile || 'default',
    bytesIn: 0,
    bytesOut: 0,
    limitBytesTotal: Number(limitBytesTotal) || 0,
    uptime: '0s',
    comment: comment || 'عضو فضای کار اشتراکی',
  };

  let createdOnRouter = false;
  try {
    const routerBody: any = {
      name: newUser.name,
      password: newUser.password,
      profile: newUser.profile,
      comment: newUser.comment,
    };
    if (newUser.limitBytesTotal > 0) {
      routerBody['limit-bytes-total'] = newUser.limitBytesTotal;
    }
    const result = await callMikrotikRest(db.config, '/ip/hotspot/user', 'PUT', routerBody);
    if (result && result['.id']) {
      newUser.id = result['.id'];
      createdOnRouter = true;
    }
  } catch {
    // router offline, stored in local DB
  }

  db.hotspotUsers.push(newUser);
  saveDb(db);
  broadcast('hotspot_users_updated', db.hotspotUsers);
  res.status(201).json({ success: true, createdOnRouter, user: newUser });
});

// Update / Adjust Quota for Hotspot User
app.post('/api/mikrotik/users/:id/adjust-quota', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { deltaBytes, setExactLimit } = req.body;
  const db = readDb();
  const user = db.hotspotUsers.find((u) => u.id === id || u.name === id);
  if (!user) return res.status(404).json({ error: 'کاربر هات‌اسپات یافت نشد' });

  if (setExactLimit !== undefined) {
    user.limitBytesTotal = Number(setExactLimit);
  } else if (deltaBytes !== undefined) {
    user.limitBytesTotal = Math.max(0, user.limitBytesTotal + Number(deltaBytes));
  }

  let updatedOnRouter = false;
  try {
    const patchBody: any = {
      'limit-bytes-total': user.limitBytesTotal,
    };
    await callMikrotikRest(db.config, `/ip/hotspot/user/${encodeURIComponent(user.id)}`, 'PATCH', patchBody);
    updatedOnRouter = true;
  } catch {
    // Fallback
  }

  saveDb(db);
  broadcast('hotspot_users_updated', db.hotspotUsers);
  res.json({ success: true, updatedOnRouter, user });
});

// Delete Hotspot User
app.delete('/api/mikrotik/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const user = db.hotspotUsers.find((u) => u.id === id || u.name === id);

  try {
    await callMikrotikRest(db.config, `/ip/hotspot/user/${encodeURIComponent(id)}`, 'DELETE');
  } catch {
    // Fallback
  }

  db.hotspotUsers = db.hotspotUsers.filter((u) => u.id !== id && u.name !== id);
  saveDb(db);
  broadcast('hotspot_users_updated', db.hotspotUsers);
  res.json({ success: true });
});

// Full Edit / Update Hotspot User Account
app.put('/api/mikrotik/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, password, profile, limitBytesTotal, comment, disabled, sharedUsers } = req.body;
  const db = readDb();
  const user = db.hotspotUsers.find((u) => u.id === id || u.name === id);
  if (!user) {
    return res.status(404).json({ error: 'کاربر هات‌اسپات یافت نشد' });
  }

  if (name && name.trim()) user.name = name.trim();
  if (password !== undefined) user.password = password;
  if (profile) user.profile = profile;
  if (limitBytesTotal !== undefined) user.limitBytesTotal = Number(limitBytesTotal);
  if (comment !== undefined) user.comment = comment;
  if (disabled !== undefined) user.disabled = Boolean(disabled);
  if (sharedUsers !== undefined) user.sharedUsers = Number(sharedUsers);

  let updatedOnRouter = false;
  try {
    const patchBody: any = {
      name: user.name,
      profile: user.profile,
      comment: user.comment || '',
      disabled: user.disabled ? 'true' : 'false',
    };
    if (user.password) patchBody.password = user.password;
    if (user.limitBytesTotal > 0) patchBody['limit-bytes-total'] = user.limitBytesTotal;

    await callMikrotikRest(db.config, `/ip/hotspot/user/${encodeURIComponent(user.id)}`, 'PATCH', patchBody);
    updatedOnRouter = true;
  } catch {
    // Router offline, updated in local database
  }

  saveDb(db);
  broadcast('hotspot_users_updated', db.hotspotUsers);
  return res.json({ success: true, updatedOnRouter, user });
});

// Get Active Live Hotspot Users
app.get('/api/mikrotik/active', async (req: Request, res: Response) => {
  const db = readDb();
  try {
    const routerActive = await callMikrotikRest(db.config, '/ip/hotspot/active');
    if (Array.isArray(routerActive)) {
      const mapped: HotspotActiveUser[] = routerActive.map((a: any) => ({
        id: a['.id'] || a.user,
        user: a.user,
        address: a.address,
        macAddress: a['mac-address'],
        uptime: a.uptime,
        bytesIn: Number(a['bytes-in'] || 0),
        bytesOut: Number(a['bytes-out'] || 0),
        timeLeft: a['session-time-left'] || a['time-left'] || 'نامحدود',
      }));
      db.hotspotActive = mapped;
      saveDb(db);
      return res.json({ connectedToRouter: true, activeUsers: mapped });
    }
  } catch {
    // Fallback
  }

  return res.json({
    connectedToRouter: false,
    message: 'فراخوانی وضعیت کاربران آنلاین از حافظه سرور',
    activeUsers: db.hotspotActive,
  });
});

// Kick / Disconnect Active Hotspot User
app.delete('/api/mikrotik/active/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();

  try {
    await callMikrotikRest(db.config, `/ip/hotspot/active/${encodeURIComponent(id)}`, 'DELETE');
  } catch {
    // Fallback
  }

  db.hotspotActive = db.hotspotActive.filter((a) => a.id !== id && a.user !== id);
  saveDb(db);
  broadcast('hotspot_active_updated', db.hotspotActive);
  res.json({ success: true, message: 'کاربر از هات‌اسپات دیسکانکت شد' });
});

// --- ZIP DOWNLOAD PACKAGES (UBUNTU & MIKROTIK) ---

async function buildCompleteProjectZipBuffer(): Promise<Buffer> {
  const zip = new JSZip();

  const serviceUnit = `[Unit]
Description=HamkarHub Coworking Local Chat & Cafe Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/hamkarhub
ExecStart=/usr/bin/node /opt/hamkarhub/node_modules/tsx/dist/cli.mjs server.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=UV_THREADPOOL_SIZE=4
Environment=NODE_OPTIONS=--max-old-space-size=1024

[Install]
WantedBy=multi-user.target
`;

  zip.file('hamkarhub.service', serviceUnit);

  const rootFiles = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'server.ts',
    'install.sh',
    'install-ubuntu.sh',
    'install-quick.sh',
    'README-UBUNTU.md',
    '.env.example',
    '.gitignore',
    'metadata.json',
  ];

  for (const f of rootFiles) {
    const p = path.join(__dirname, f);
    if (fs.existsSync(p)) {
      zip.file(f, fs.readFileSync(p, 'utf-8'));
    }
  }

  function addDirToZip(dirPath: string, zipFolder: JSZip) {
    if (!fs.existsSync(dirPath)) return;
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      if (item === 'node_modules' || item === 'dist' || item === '.git' || item === 'data' || item.endsWith('.zip')) continue;
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        addDirToZip(fullPath, zipFolder.folder(item)!);
      } else {
        zipFolder.file(item, fs.readFileSync(fullPath));
      }
    }
  }

  addDirToZip(path.join(__dirname, 'src'), zip.folder('src')!);

  return await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 3 },
  });
}

app.get('/api/download/ubuntu-package', async (req: Request, res: Response) => {
  try {
    const zipBuffer = await buildCompleteProjectZipBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="hamkarhub-ubuntu-package.zip"');
    return res.send(zipBuffer);
  } catch (err) {
    console.error('Error generating ubuntu zip:', err);
    res.status(500).json({ error: 'خطا در تولید فایل فشرده اوبونتو' });
  }
});

app.get('/api/download/project-zip', async (req: Request, res: Response) => {
  try {
    const zipBuffer = await buildCompleteProjectZipBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="hamkarhub-complete.zip"');
    return res.send(zipBuffer);
  } catch (err) {
    console.error('Error generating project zip:', err);
    res.status(500).json({ error: 'خطا در تولید فایل فشرده پروژه' });
  }
});

// --- ONE-LINE AUTO INSTALLER SCRIPT (curl -sSL <URL>/install.sh | bash) ---
app.get('/install.sh', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const script = `#!/usr/bin/env bash
# ==============================================================
# 🚀 HamkarHub One-Line Automated Installer for Ubuntu / Debian
# سامانه چت لوکال و پورتال فضای کار اشتراکی (یکپارچه با میکروتیک)
# ==============================================================
set -e

# بررسی مجوز روت یا sudo
if [ "\\$EUID" -ne 0 ]; then
    if ! command -v sudo &> /dev/null; then
        echo "❌ لطفاً این اسکریپت را با دسترسی root یا sudo اجرا نمایید."
        exit 1
    fi
    SUDO="sudo"
else
    SUDO=""
fi

echo ""
echo "=========================================================="
echo "  🚀 شروع نصب خودکار سامانه همکار هاب (HamkarHub Server)"
echo "  🌐 دریافت مستقیم از سورس: ${baseUrl}"
echo "=========================================================="
echo ""

# ۱. به‌روزرسانی مخازن و نصب بسته‌های پایه‌ای
echo "📦 ۱/۶ در حال به‌روزرسانی سیستم و نصب ابزارها (curl, git, unzip, ufw)..."
\\$SUDO apt-get update -y
\\$SUDO apt-get install -y curl wget unzip git ufw build-essential

# ۲. بررسی و نصب خودکار Node.js 20 LTS
echo "📦 ۲/۶ بررسی پیش‌نیاز Node.js 20..."
NEED_NODE=0
if ! command -v node &> /dev/null; then
    NEED_NODE=1
else
    NODE_MAJOR=\\$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "\\$NODE_MAJOR" -lt 18 ]; then
        echo "نسخه Node.js فعلی (\\$NODE_MAJOR) قدیمی است، ارتقا به نسخه 20..."
        NEED_NODE=1
    fi
fi

if [ "\\$NEED_NODE" -eq 1 ]; then
    echo "⚡ در حال نصب Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
    if [ "\\$EUID" -ne 0 ]; then
        sudo bash /tmp/nodesource_setup.sh
        sudo apt-get install -y nodejs
    else
        bash /tmp/nodesource_setup.sh
        apt-get install -y nodejs
    fi
    rm -f /tmp/nodesource_setup.sh
fi

echo "✅ نسخه Node.js: \\$(node -v)"
echo "✅ نسخه NPM: \\$(npm -v)"

# ۳. آماده‌سازی دایرکتوری در /opt/hamkarhub
INSTALL_DIR="/opt/hamkarhub"
echo "📁 ۳/۶ در حال آماده‌سازی دایرکتوری در \\$INSTALL_DIR..."
\\$SUDO mkdir -p "\\$INSTALL_DIR"
cd "\\$INSTALL_DIR"

# ۴. دانلود مستقیم سورس پروژه از سرور
echo "📥 ۴/۶ در حال دانلود مستقیم بسته پروژه از وب‌سرور..."
TMP_ZIP="/tmp/hamkarhub-\\$(date +%s).zip"
curl -fsSL "${baseUrl}/api/download/ubuntu-package" -o "\\$TMP_ZIP"

echo "📂 در حال اکسترکت فایل‌ها..."
\\$SUDO unzip -q -o "\\$TMP_ZIP" -d "\\$INSTALL_DIR"
\\$SUDO rm -f "\\$TMP_ZIP"

# ۵. نصب پکیج‌های پروژه و کامپایل بیلد (بهینه‌سازی شده برای پردازنده‌های ۴ هسته‌ای)
echo "📦 ۵/۶ در حال نصب وابستگی‌های NPM و کامپایل فرانت‌اند..."
export UV_THREADPOOL_SIZE=4
npm install --legacy-peer-deps
NODE_OPTIONS="--max-old-space-size=1536" npm run build

# ۶. فایروال و سرویس daemon دائمی systemd
echo "⚙️ ۶/۶ پیکربندی فایروال و سرویس دائمی پس‌زمینه (systemd)..."
\\$SUDO ufw allow 3000/tcp || true

NODE_PATH=\\$(which node)
SERVICE_USER=\\$(logname 2>/dev/null || echo \\$SUDO_USER)
if [ -z "\\$SERVICE_USER" ]; then
    SERVICE_USER=\\$(whoami)
fi

\\$SUDO bash -c "cat <<EOF > /etc/systemd/system/hamkarhub.service
[Unit]
Description=HamkarHub Coworking Hotspot Chat Server (Phenom 9550 Tuned)
After=network.target

[Service]
Type=simple
User=\\$SERVICE_USER
WorkingDirectory=\\$INSTALL_DIR
ExecStart=\\$NODE_PATH \\$INSTALL_DIR/node_modules/tsx/dist/cli.mjs server.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=UV_THREADPOOL_SIZE=4
Environment=NODE_OPTIONS=--max-old-space-size=1024

[Install]
WantedBy=multi-user.target
EOF"

\\$SUDO chown -R \\$SERVICE_USER:\\$SERVICE_USER "\\$INSTALL_DIR" || true

\\$SUDO systemctl daemon-reload
\\$SUDO systemctl enable hamkarhub.service
\\$SUDO systemctl restart hamkarhub.service

SERVER_IP=\\$(hostname -I | awk '{print \\$1}')

echo ""
echo "=========================================================="
echo "🎉 سامانه همکار هاب با موفقیت با یک دستور نصب و فعال شد!"
echo "=========================================================="
echo "🌐 آدرس دسترسی در شبکه وای‌فای: http://\${SERVER_IP}:3000"
echo "🔐 پنل ادمین و مدیریت میکروتیک: http://\${SERVER_IP}:3000 (رمز پیش‌فرض: admin123)"
echo "📌 دستورات مانیتورینگ سرویس در اوبونتو:"
echo "   - بررسی وضعیت: sudo systemctl status hamkarhub"
echo "   - لاگ‌های زنده: sudo journalctl -u hamkarhub -f"
echo "   - ری‌استارت:    sudo systemctl restart hamkarhub"
echo "=========================================================="
echo ""
`;

  res.setHeader('Content-Type', 'text/x-shellscript; charset=utf-8');
  res.send(script);
});

app.get('/api/download/mikrotik-hotspot', async (req: Request, res: Response) => {
  try {
    const zip = new JSZip();
    const db = readDb();
    const serverUrl = `http://${db.config.serverLocalIp}:${db.config.serverPort}`;

    const loginHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${db.config.hotspotName} | ورودی وای‌فای و چت لوکال</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 440px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .badge { display: inline-block; background: #f59e0b; color: #000; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 6px; margin-bottom: 12px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
    .chat-banner { background: #0f172a; border: 1px dashed #475569; border-radius: 12px; padding: 14px; margin-bottom: 20px; text-align: center; }
    .chat-banner a { color: #38bdf8; text-decoration: none; font-weight: 600; font-size: 14px; display: block; margin-top: 6px; }
    .form-group { margin-bottom: 14px; text-align: right; }
    label { display: block; font-size: 12px; color: #cbd5e1; margin-bottom: 6px; font-weight: 500; }
    input[type="text"], input[type="password"] { width: 100%; padding: 12px 14px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; font-size: 14px; outline: none; }
    input:focus { border-color: #38bdf8; }
    .btn-submit { width: 100%; padding: 12px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 8px; }
    .btn-submit:hover { background: #1d4ed8; }
    .trial-box { margin-top: 16px; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }
    .trial-link { color: #f59e0b; text-decoration: none; font-size: 13px; font-weight: 600; }
    .error-msg { background: #ef444422; border: 1px solid #ef4444; color: #fca5a5; padding: 10px; border-radius: 8px; font-size: 12px; margin-bottom: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">هاب وای‌فای فضای کار اشتراکی</span>
    <h1>${db.config.hotspotName}</h1>
    <p>${db.config.welcomeNotice}</p>

    <div class="chat-banner">
      <div style="font-size: 12px; color: #94a3b8;">بدون نیاز به اینترنت در چت لوکال حضور دارید:</div>
      <a href="${serverUrl}" target="_blank">ورود به چت داخلی و شبکه همکاران &larr;</a>
    </div>

    $(if error)
    <div class="error-msg">$(error)</div>
    $(endif)

    <form name="login" action="$(link-login-only)" method="post">
      <input type="hidden" name="dst" value="$(link-orig)" />
      <input type="hidden" name="popup" value="true" />

      <div class="form-group">
        <label>نام کاربری یا شناسه اشتراک:</label>
        <input type="text" name="username" value="$(username)" placeholder="مثال: member104" required autofocus />
      </div>

      <div class="form-group">
        <label>کلمه عبور:</label>
        <input type="password" name="password" placeholder="••••••••" required />
      </div>

      <button type="submit" class="btn-submit">اتصال به اینترنت</button>
    </form>

    $(if trial == 'yes')
    <div class="trial-box">
      <a class="trial-link" href="$(link-login-only)?dst=$(link-orig-esc)&amp;username=T-$(mac-esc)">ورود آزمایشی رایگان (Free Trial)</a>
    </div>
    $(endif)
  </div>
</body>
</html>`;

    const statusHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>وضعیت اتصال اینترنت میکروتیک</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 440px; padding: 24px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 13px; }
    .btn { display: block; text-align: center; text-decoration: none; padding: 12px; border-radius: 8px; font-weight: 600; margin-top: 14px; font-size: 14px; }
    .btn-chat { background: #f59e0b; color: #0f172a; }
    .btn-logout { background: #ef4444; color: #fff; border: none; width: 100%; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h2 style="font-size: 18px; margin-bottom: 16px; text-align: center;">وضعیت اتصال اینترنت میکروتیک</h2>
    <div class="row"><span>کاربر:</span><span>$(username)</span></div>
    <div class="row"><span>آدرس آی‌پی:</span><span>$(ip)</span></div>
    <div class="row"><span>مک آدرس:</span><span>$(mac)</span></div>
    <div class="row"><span>مدت اتصال:</span><span>$(uptime)</span></div>
    <div class="row"><span>حجم مصرفی دانلود:</span><span>$(bytes-out-nice)</span></div>
    <div class="row"><span>حجم مصرفی آپلود:</span><span>$(bytes-in-nice)</span></div>

    <a href="${serverUrl}" class="btn btn-chat">ورود به چت لوکال فضای کار</a>

    <form action="$(link-logout)" name="logout" method="post" style="margin-top: 10px;">
      <input type="hidden" name="erase-cookie" value="on">
      <button type="submit" class="btn btn-logout">قطع اتصال اینترنت</button>
    </form>
  </div>
</body>
</html>`;

    const mikrotikRsc = `# ==============================================================
# ۱. رفع خطای "challenge response, try again, enable javascript":
# با فعال‌سازی متد http-pap، میکروتیک پسورد ساده را از صفحه وب می‌پذیرد:
/ip hotspot profile set [find] login-by=http-pap,http-chap,trial,cookie

# ۲. دسترسی به سرور چت لوکال برای کاربران قبل از لاگین:
/ip hotspot walled-garden ip
add action=accept comment="HamkarHub Server" dst-address=${db.config.serverLocalIp} dst-port=${db.config.serverPort}

# ۳. تنظیم دی‌ان‌اس داخلی (اختیاری):
/ip dns static
add address=${db.config.serverLocalIp} name="${db.config.walledGardenDomain}" comment="HamkarHub Local Hub"
`;

    zip.file('login.html', loginHtml);
    zip.file('status.html', statusHtml);
    zip.file('setup.rsc', mikrotikRsc);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="mikrotik-hotspot-files.zip"');
    return res.send(zipBuffer);
  } catch (err) {
    console.error('Error generating mikrotik zip:', err);
    res.status(500).json({ error: 'خطا در تولید فایل‌های میکروتیک' });
  }
});

// Generate MikroTik Template Files
app.get('/api/hotspot/mikrotik-files', (req: Request, res: Response) => {
  const db = readDb();
  const serverUrl = `http://${db.config.serverLocalIp}:${db.config.serverPort}`;

  const loginHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${db.config.hotspotName} | ورودی وای‌فای و چت لوکال</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 440px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .badge { display: inline-block; background: #f59e0b; color: #000; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 6px; margin-bottom: 12px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
    .chat-banner { background: #0f172a; border: 1px dashed #475569; border-radius: 12px; padding: 14px; margin-bottom: 20px; text-align: center; }
    .chat-banner a { color: #38bdf8; text-decoration: none; font-weight: 600; font-size: 14px; display: block; margin-top: 6px; }
    .form-group { margin-bottom: 14px; text-align: right; }
    label { display: block; font-size: 12px; color: #cbd5e1; margin-bottom: 6px; font-weight: 500; }
    input[type="text"], input[type="password"] { width: 100%; padding: 12px 14px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; font-size: 14px; outline: none; }
    input:focus { border-color: #38bdf8; }
    .btn-submit { width: 100%; padding: 12px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 8px; }
    .btn-submit:hover { background: #1d4ed8; }
    .trial-box { margin-top: 16px; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }
    .trial-link { color: #f59e0b; text-decoration: none; font-size: 13px; font-weight: 600; }
    .error-msg { background: #ef444422; border: 1px solid #ef4444; color: #fca5a5; padding: 10px; border-radius: 8px; font-size: 12px; margin-bottom: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">هاب وای‌فای فضای کار اشتراکی</span>
    <h1>${db.config.hotspotName}</h1>
    <p>${db.config.welcomeNotice}</p>

    <div class="chat-banner">
      <div style="font-size: 12px; color: #94a3b8;">بدون نیاز به اینترنت هم اکنون در چت محلی حضور دارید:</div>
      <a href="${serverUrl}" target="_blank">ورود به چت داخلی و شبکه همکاران &larr;</a>
    </div>

    $(if error)
    <div class="error-msg">$(error)</div>
    $(endif)

    <form name="login" action="$(link-login-only)" method="post">
      <input type="hidden" name="dst" value="$(link-orig)" />
      <input type="hidden" name="popup" value="true" />

      <div class="form-group">
        <label>نام کاربری یا شماره اشتراک:</label>
        <input type="text" name="username" value="$(username)" placeholder="مثال: member104" required autofocus />
      </div>

      <div class="form-group">
        <label>کلمه عبور:</label>
        <input type="password" name="password" placeholder="••••••••" required />
      </div>

      <button type="submit" class="btn-submit">اتصال به اینترنت</button>
    </form>

    $(if trial == 'yes')
    <div class="trial-box">
      <a class="trial-link" href="$(link-login-only)?dst=$(link-orig-esc)&amp;username=T-$(mac-esc)">ورود آزمایشی ۱ ساعته رایگان (Free Trial)</a>
    </div>
    $(endif)
  </div>
</body>
</html>`;

  const statusHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>وضعیت اتصال اینترنت میکروتیک</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 440px; padding: 24px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 13px; }
    .btn { display: block; text-align: center; text-decoration: none; padding: 12px; border-radius: 8px; font-weight: 600; margin-top: 14px; font-size: 14px; }
    .btn-chat { background: #f59e0b; color: #0f172a; }
    .btn-logout { background: #ef4444; color: #fff; border: none; width: 100%; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h2 style="font-size: 18px; margin-bottom: 16px; text-align: center;">وضعیت اتصال اینترنت میکروتیک</h2>
    <div class="row"><span>کاربر:</span><span>$(username)</span></div>
    <div class="row"><span>آدرس آی‌پی:</span><span>$(ip)</span></div>
    <div class="row"><span>مک آدرس:</span><span>$(mac)</span></div>
    <div class="row"><span>مدت اتصال:</span><span>$(uptime)</span></div>
    <div class="row"><span>حجم مصرفی دانلود:</span><span>$(bytes-out-nice)</span></div>
    <div class="row"><span>حجم مصرفی آپلود:</span><span>$(bytes-in-nice)</span></div>

    <a href="${serverUrl}" class="btn btn-chat">ورود به چت لوکال فضای کار</a>

    <form action="$(link-logout)" name="logout" method="post" style="margin-top: 10px;">
      <input type="hidden" name="erase-cookie" value="on">
      <button type="submit" class="btn btn-logout">قطع اتصال اینترنت</button>
    </form>
  </div>
</body>
</html>`;

  const mikrotikCli = `# ==============================================================
# دستورات راه‌اندازی Walled Garden میکروتیک برای سرور چت لوکال
# در ترمینال میکروتیک (Winbox -> New Terminal) کپی و اجرا فرمایید:
# ==============================================================

# ۱. تعریف آی‌پی سرور در وال‌گاردن (تا بدون لاگین به چت دسترسی داشته باشند)
/ip hotspot walled-garden ip
add action=accept comment="HamkarHub Local Chat Server" dst-address=${db.config.serverLocalIp} dst-port=${db.config.serverPort}

# ۲. تعریف دامنه محلی (در صورت داشتن نام دامنه داخلی)
/ip hotspot walled-garden
add action=accept comment="HamkarHub Domain" dst-host="${db.config.walledGardenDomain}"

# ۳. تنظیم DNS استاتیک روی میکروتیک برای دسترسی راحت‌تر اعضا:
/ip dns static
add address=${db.config.serverLocalIp} name="${db.config.walledGardenDomain}" comment="Coworking Local Hub"

# با این تنظیمات، تمام کاربران متصل به وای‌فای حتی قبل از وارد کردن یوزرنیم/پسورد
# می‌توانند وارد آدرس http://${db.config.serverLocalIp}:${db.config.serverPort} یا http://${db.config.walledGardenDomain}:${db.config.serverPort} شوند!
`;

  res.json({
    loginHtml,
    statusHtml,
    mikrotikCli,
    serverUrl,
  });
});

// Serve frontend assets in dev or prod
async function startServer() {
  const server = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : true,
        ws: disableHmr ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '7d',
        etag: true,
      })
    );
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Warm up in-memory DB cache before listening
  readDb();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`HamkarHub Coworking Chat, Cafe & MikroTik Portal running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
