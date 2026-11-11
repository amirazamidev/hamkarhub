import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import JSZip from 'jszip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
  messages: [
    {
      id: 'msg-1',
      channelId: 'announcements',
      sender: {
        id: 'admin-sara',
        name: 'سارا رضایی',
        role: 'مدیر کامیونیتی',
        desk: 'میز پذیرش',
      },
      content: 'سلام همکاران گرامی! صبحتون بخیر. امروز بعدازظهر ساعت ۱۶ دورهمی کوتاه ۲۰ دقیقه‌ای برای معرفی اعضای جدید در کافه داریم. همه دعوت هستید!',
      timestamp: Date.now() - 1000 * 60 * 90,
      reactions: { '👋': ['member-ali', 'member-maryam'], '☕': ['member-reza'] },
      type: 'announcement',
    },
    {
      id: 'msg-2',
      channelId: 'general',
      sender: {
        id: 'member-maryam',
        name: 'مریم کریمی',
        role: 'طراح UI/UX',
        desk: 'میز ۲۱',
      },
      content: 'صبح بخیر همگی! کسی هست مانیتور اضافه یا کابل HDMI Type-C همراهش باشه برای ۲ ساعت امانت بده؟',
      timestamp: Date.now() - 1000 * 60 * 35,
      reactions: { '👍': ['member-ali'] },
    },
    {
      id: 'msg-3',
      channelId: 'general',
      sender: {
        id: 'member-ali',
        name: 'علی احمدی',
        role: 'توسعه‌دهنده فول‌استک',
        desk: 'میز ۱۴',
      },
      content: 'سلام مریم جان، من یه کابل HDMI روی میز ۱۴ دارم، بیا ببر مشکلی نداره.',
      timestamp: Date.now() - 1000 * 60 * 30,
      reactions: { '🙏': ['member-maryam'] },
    },
    {
      id: 'msg-4',
      channelId: 'cafeteria',
      sender: {
        id: 'member-reza',
        name: 'رضا نوری',
        role: 'متخصص سئو',
        desk: 'میز ۸',
      },
      content: 'دوستان برای ناهار امروز از رستوران اطراف سفارش جمعی می‌زنیم. تا ساعت ۱۲ هر کسی مایل هست بگه تا با تخفیف گروهی ثبت کنیم 🍕🥗',
      timestamp: Date.now() - 1000 * 60 * 18,
      reactions: { '🙋‍♂️': ['member-ali', 'member-maryam'] },
    },
  ],
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
};

function readDb(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (!parsed.cafeteria) parsed.cafeteria = DEFAULT_DB.cafeteria;
      if (!parsed.staff || !Array.isArray(parsed.staff)) parsed.staff = DEFAULT_DB.staff;
      if (!parsed.hotspotUsers || !Array.isArray(parsed.hotspotUsers)) parsed.hotspotUsers = DEFAULT_DB.hotspotUsers;
      if (!parsed.hotspotActive || !Array.isArray(parsed.hotspotActive)) parsed.hotspotActive = DEFAULT_DB.hotspotActive;
      return parsed;
    }
  } catch (err) {
    console.error('Error reading DB file, using defaults:', err);
  }
  saveDb(DEFAULT_DB);
  return DEFAULT_DB;
}

function saveDb(data: DBState): void {
  try {
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_FILE);
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

// SSE Clients for real-time broadcasts without cloud dependencies
const sseClients = new Set<Response>();

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

// Messages
app.get('/api/messages', (req: Request, res: Response) => {
  const channelId = req.query.channelId as string;
  const db = readDb();
  if (channelId) {
    res.json(db.messages.filter((m) => m.channelId === channelId));
  } else {
    res.json(db.messages);
  }
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

// Hotspot login simulation / proxy
app.post('/api/hotspot/login', (req: Request, res: Response) => {
  const { username, password, type } = req.body;
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
        ip: req.socket.remoteAddress || '192.168.88.102',
      },
    });
  }

  // Voucher validation or member login
  if (!username) {
    return res.status(400).json({ error: 'نام کاربری یا کد اشتراک وارد نشده است' });
  }

  return res.json({
    success: true,
    message: 'اتصال اینترنت با موفقیت برقرار شد.',
    session: {
      username,
      uptime: '00:00:05',
      timeLeft: 'نامحدود (عضو فعال)',
      bytesIn: '1.2 MB',
      bytesOut: '420 KB',
      ip: req.socket.remoteAddress || '192.168.88.102',
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

app.get('/api/download/ubuntu-package', async (req: Request, res: Response) => {
  try {
    const zip = new JSZip();
    const db = readDb();

    const installScript = `#!/bin/bash
# HamkarHub Auto-Installer for Ubuntu 20.04 / 22.04 / 24.04
set -e
echo "=========================================================="
echo "  نصب خودکار سامانه همکار هاب روی سرور اوبونتو"
echo "=========================================================="

sudo apt-get update
sudo apt-get install -y curl ufw

if ! command -v node &> /dev/null; then
    echo "در حال نصب Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
    if [ "\$EUID" -ne 0 ]; then
        sudo bash /tmp/nodesource_setup.sh
        sudo apt-get install -y nodejs
    else
        bash /tmp/nodesource_setup.sh
        apt-get install -y nodejs
    fi
    rm -f /tmp/nodesource_setup.sh
fi

echo "نسخه Node: $(node -v)"
echo "در حال نصب پکیج‌ها..."
npm install --legacy-peer-deps

echo "در حال کامپایل و بیلد فرانت‌اند..."
npm run build

sudo ufw allow 3000/tcp || true

APP_DIR=$(pwd)
NODE_PATH=$(which node)

RUN_USER="\${SUDO_USER:-\$(whoami)}"
sudo chown -R "\$RUN_USER:\$RUN_USER" "\$APP_DIR" || true

sudo bash -c "cat <<EOF > /etc/systemd/system/hamkarhub.service
[Unit]
Description=HamkarHub Coworking Local Chat and MikroTik Hotspot
After=network.target

[Service]
Type=simple
User=\$RUN_USER
WorkingDirectory=\$APP_DIR
ExecStart=\$NODE_PATH \$APP_DIR/node_modules/tsx/dist/cli.mjs server.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable hamkarhub.service
sudo systemctl restart hamkarhub.service

SERVER_IP=$(hostname -I | awk '{print $1}')
echo "=========================================================="
echo "✅ نصب با موفقیت انجام شد!"
echo "🌐 آدرس دسترسی در شبکه وای‌فای: http://$SERVER_IP:3000"
echo "=========================================================="
`;

    const serviceUnit = `[Unit]
Description=HamkarHub Coworking Local Chat
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

[Install]
WantedBy=multi-user.target
`;

    const readme = `# راهنمای راه‌اندازی همکار هاب روی سرور اوبونتو (Ubuntu Server)

این پکیج شامل تمام کدهای فرانت‌اند و بک‌اند سامانه همکار هاب برای اجرای محلی روی سرور شبکه وای‌فای است.

## نحوه نصب سریع با یک دستور در ترمینال اوبونتو:
\`\`\`bash
chmod +x install-ubuntu.sh
./install-ubuntu.sh
\`\`\`

سامانه روی پورت 3000 و آدرس آی‌پی محلی سرور شما بالا خواهد آمد.
`;

    zip.file('install-ubuntu.sh', installScript);
    zip.file('hamkarhub.service', serviceUnit);
    zip.file('README-UBUNTU.md', readme);

    // Read and add project files
    const rootFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'index.html', 'server.ts'];
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
        if (item === 'node_modules' || item === 'dist' || item === '.git') continue;
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

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="hamkarhub-ubuntu-package.zip"');
    return res.send(zipBuffer);
  } catch (err) {
    console.error('Error generating ubuntu zip:', err);
    res.status(500).json({ error: 'خطا در تولید فایل فشرده اوبونتو' });
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

# ۵. نصب پکیج‌های پروژه و کامپایل بیلد
echo "📦 ۵/۶ در حال نصب وابستگی‌های NPM و کامپایل فرانت‌اند..."
npm install --legacy-peer-deps
npm run build

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
Description=HamkarHub Coworking Hotspot Chat Server
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
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HamkarHub Coworking Chat & MikroTik Captive Portal running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
