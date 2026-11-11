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
};

function readDb(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
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
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "نسخه Node: $(node -v)"
echo "در حال نصب پکیج‌ها..."
npm install

echo "در حال کامپایل و بیلد فرانت‌اند..."
npm run build

sudo ufw allow 3000/tcp || true

APP_DIR=$(pwd)
NODE_PATH=$(which node)

sudo bash -c "cat <<EOF > /etc/systemd/system/hamkarhub.service
[Unit]
Description=HamkarHub Coworking Local Chat and MikroTik Hotspot
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$APP_DIR
ExecStart=$NODE_PATH $APP_DIR/node_modules/tsx/dist/cli.mjs server.ts
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
