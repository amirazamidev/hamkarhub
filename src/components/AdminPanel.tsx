import React, { useState, useEffect } from 'react';
import {
  Lock,
  Plus,
  Trash2,
  Edit2,
  Coffee,
  PhoneCall,
  Users,
  Tv,
  Printer,
  Gamepad2,
  Mic,
  Wifi,
  Hash,
  Download,
  Terminal,
  Check,
  AlertCircle,
  Settings,
  Megaphone,
  Radio,
  Server,
  Key,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  HardDrive,
  RefreshCw,
  LogOut,
  UserCheck,
  UserX,
  Sparkles,
  MapPin,
  Image as ImageIcon,
  Copy,
  GitBranch,
  ExternalLink,
} from 'lucide-react';
import {
  SpaceAmenity,
  Channel,
  NoticeItem,
  HotspotConfig,
  CafeteriaInfo,
  StaffMember,
  HotspotUserAccount,
  HotspotActiveUser,
} from '../types';

interface AdminPanelProps {
  amenities: SpaceAmenity[];
  channels: Channel[];
  notices: NoticeItem[];
  cafeteria: CafeteriaInfo;
  staff: StaffMember[];
  config: HotspotConfig;
  onRefreshData: () => Promise<void>;
  onUpdateConfig: (newConfig: Partial<HotspotConfig>) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  amenities,
  channels,
  notices,
  cafeteria,
  staff,
  config,
  onRefreshData,
  onUpdateConfig,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('hamkar_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Sub-tab
  const [adminSubTab, setAdminSubTab] = useState<
    'mikrotik_api' | 'cafeteria_staff' | 'amenities' | 'channels' | 'notices' | 'settings' | 'downloads'
  >('mikrotik_api');

  // --- MIKROTIK REST API STATE ---
  const [hotspotUsers, setHotspotUsers] = useState<HotspotUserAccount[]>([]);
  const [activeUsers, setActiveUsers] = useState<HotspotActiveUser[]>([]);
  const [isRouterConnected, setIsRouterConnected] = useState<boolean | null>(null);
  const [routerStatusMsg, setRouterStatusMsg] = useState<string>('');
  const [isLoadingMikrotik, setIsLoadingMikrotik] = useState(false);

  // Router API Config Form
  const [apiUsername, setApiUsername] = useState(config.apiUsername || 'admin');
  const [apiPassword, setApiPassword] = useState(config.apiPassword || '');
  const [apiPort, setApiPort] = useState(config.apiPort || 80);
  const [apiUseSsl, setApiUseSsl] = useState(config.apiUseSsl || false);

  // Add Hotspot User Form
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserQuotaGb, setNewUserQuotaGb] = useState('5');
  const [newUserComment, setNewUserComment] = useState('');
  const [newUserProfile, setNewUserProfile] = useState('default');

  // Adjust Quota Form
  const [adjustingUser, setAdjustingUser] = useState<HotspotUserAccount | null>(null);
  const [customQuotaGb, setCustomQuotaGb] = useState('10');

  // --- CAFETERIA FORM STATE ---
  const [cafeTitle, setCafeTitle] = useState(cafeteria.title);
  const [cafeSubtitle, setCafeSubtitle] = useState(cafeteria.subtitle);
  const [cafeDesc, setCafeDesc] = useState(cafeteria.description);
  const [cafeImg, setCafeImg] = useState(cafeteria.imageUrl);
  const [cafeNote, setCafeNote] = useState(cafeteria.footerNote);
  const [isSavingCafe, setIsSavingCafe] = useState(false);
  const [cafeSavedMsg, setCafeSavedMsg] = useState(false);

  // --- STAFF FORM STATE ---
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffDesk, setStaffDesk] = useState('');
  const [staffQuote, setStaffQuote] = useState('');
  const [staffAvatar, setStaffAvatar] = useState('');
  const [staffStatus, setStaffStatus] = useState('حاضر در فضا');

  // --- AMENITY FORM STATE ---
  const [editingAmenity, setEditingAmenity] = useState<SpaceAmenity | null>(null);
  const [isAddingAmenity, setIsAddingAmenity] = useState(false);
  const [amenityName, setAmenityName] = useState('');
  const [amenityIcon, setAmenityIcon] = useState('Coffee');
  const [amenityStatus, setAmenityStatus] = useState<SpaceAmenity['status']>('ready');
  const [amenityStatusText, setAmenityStatusText] = useState('');

  // --- CHANNELS & NOTICES FORM STATE ---
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [channelIcon, setChannelIcon] = useState('Hash');

  const [isAddingNotice, setIsAddingNotice] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState<'normal' | 'urgent'>('normal');

  // --- SETTINGS FORM STATE ---
  const [spaceName, setSpaceName] = useState(config.hotspotName);
  const [routerIp, setRouterIp] = useState(config.routerIp);
  const [serverLocalIp, setServerLocalIp] = useState(config.serverLocalIp);
  const [serverPort, setServerPort] = useState(config.serverPort);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [configSuccessMsg, setConfigSuccessMsg] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedWebInstaller, setCopiedWebInstaller] = useState(false);
  const [copiedGitInstaller, setCopiedGitInstaller] = useState(false);
  const [copiedGitClone, setCopiedGitClone] = useState(false);
  const [gitRepoUrl, setGitRepoUrl] = useState('https://github.com/amirazamidev/hamkarhub');

  // Sync cafeteria prop changes
  useEffect(() => {
    setCafeTitle(cafeteria.title);
    setCafeSubtitle(cafeteria.subtitle);
    setCafeDesc(cafeteria.description);
    setCafeImg(cafeteria.imageUrl);
    setCafeNote(cafeteria.footerNote);
  }, [cafeteria]);

  // Load MikroTik API data
  const loadMikrotikData = async () => {
    setIsLoadingMikrotik(true);
    try {
      const [usersRes, activeRes, connRes] = await Promise.all([
        fetch('/api/mikrotik/users').then((r) => r.json()),
        fetch('/api/mikrotik/active').then((r) => r.json()),
        fetch('/api/mikrotik/test-connection').then((r) => r.json()),
      ]);

      if (usersRes.users) setHotspotUsers(usersRes.users);
      if (activeRes.activeUsers) setActiveUsers(activeRes.activeUsers);
      setIsRouterConnected(connRes.connected);
      setRouterStatusMsg(connRes.message || '');
    } catch {
      setIsRouterConnected(false);
      setRouterStatusMsg('خطا در برقراری ارتباط با سرویس محلی سرور');
    } finally {
      setIsLoadingMikrotik(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminSubTab === 'mikrotik_api') {
      loadMikrotikData();
    }
  }, [isAuthenticated, adminSubTab]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('hamkar_admin_auth', 'true');
      } else {
        setAuthError(data.error || 'رمز عبور نادرست است');
      }
    } catch {
      setAuthError('خطا در بررسی رمز عبور');
    }
  };

  const handleLogoutAdmin = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('hamkar_admin_auth');
  };

  // --- MIKROTIK ACTIONS ---

  const handleSaveRouterApiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateConfig({
      apiUsername,
      apiPassword,
      apiPort: Number(apiPort),
      apiUseSsl,
    });
    await loadMikrotikData();
  };

  const handleCreateHotspotUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    const limitBytesTotal = Number(newUserQuotaGb) * 1024 * 1024 * 1024;
    await fetch('/api/mikrotik/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newUsername.trim(),
        password: newUserPass,
        profile: newUserProfile,
        limitBytesTotal,
        comment: newUserComment || 'عضو فضای کار',
      }),
    });

    setIsAddingUser(false);
    setNewUsername('');
    setNewUserPass('');
    setNewUserComment('');
    await loadMikrotikData();
  };

  const handleAdjustQuota = async (userId: string, deltaGb: number) => {
    const deltaBytes = deltaGb * 1024 * 1024 * 1024;
    await fetch(`/api/mikrotik/users/${encodeURIComponent(userId)}/adjust-quota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deltaBytes }),
    });
    await loadMikrotikData();
  };

  const handleSetExactQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    const setExactLimit = Number(customQuotaGb) * 1024 * 1024 * 1024;
    await fetch(`/api/mikrotik/users/${encodeURIComponent(adjustingUser.id)}/adjust-quota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setExactLimit }),
    });
    setAdjustingUser(null);
    await loadMikrotikData();
  };

  const handleDeleteHotspotUser = async (userId: string) => {
    if (!confirm(`آیا از حذف اکانت ${userId} اطمینان دارید؟`)) return;
    await fetch(`/api/mikrotik/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    await loadMikrotikData();
  };

  const handleKickActiveUser = async (activeId: string, userName: string) => {
    if (!confirm(`آیا می‌خواهید اتصال اینترنت ${userName} قطع شود؟`)) return;
    await fetch(`/api/mikrotik/active/${encodeURIComponent(activeId)}`, {
      method: 'DELETE',
    });
    await loadMikrotikData();
  };

  // --- CAFETERIA ACTIONS ---
  const handleSaveCafeteria = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCafe(true);
    setCafeSavedMsg(false);
    try {
      await fetch('/api/admin/cafeteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cafeTitle,
          subtitle: cafeSubtitle,
          description: cafeDesc,
          imageUrl: cafeImg,
          footerNote: cafeNote,
        }),
      });
      setCafeSavedMsg(true);
      await onRefreshData();
      setTimeout(() => setCafeSavedMsg(false), 3000);
    } finally {
      setIsSavingCafe(false);
    }
  };

  // --- STAFF ACTIONS ---
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;

    if (editingStaff) {
      await fetch(`/api/admin/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffName,
          role: staffRole,
          desk: staffDesk,
          quote: staffQuote,
          avatar: staffAvatar,
          status: staffStatus,
        }),
      });
    } else {
      await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffName,
          role: staffRole || 'مدیر کامیونیتی',
          desk: staffDesk || 'میز پذیرش',
          quote: staffQuote,
          avatar: staffAvatar || '/src/assets/images/community_manager_avatar_1794330976206.jpg',
          status: staffStatus || 'حاضر در فضا',
        }),
      });
    }

    setIsAddingStaff(false);
    setEditingStaff(null);
    setStaffName('');
    setStaffRole('');
    setStaffDesk('');
    setStaffQuote('');
    setStaffAvatar('');
    await onRefreshData();
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('آیا از حذف این عضو کادر اطمینان دارید؟')) return;
    await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
    await onRefreshData();
  };

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  // Login view if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">ورود به پنل مدیریت ادمین</h2>
          <p className="text-xs text-slate-400 mt-1">
            کنترل مصرف کاربران میکروتیک، ویرایش کافه و پرسنل، امکانات و کانال‌ها
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-medium text-slate-300">رمز عبور ادمین:</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="رمز عبور پیش‌فرض: admin123"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
              autoFocus
            />
            <span className="text-[11px] text-slate-500 block">رمز اولیه: admin123</span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10"
          >
            ورود به پنل مدیریت
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header bar */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>پنل مدیریت ادمین همکار هاب</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                مدیر ارشد
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              مدیریت زنده کاربران میکروتیک، حجم مصرفی، کافه‌تریا، پرسنل و امکانات
            </p>
          </div>
        </div>

        <button
          onClick={handleLogoutAdmin}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs rounded-xl transition-colors cursor-pointer"
        >
          خروج از ادمین
        </button>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        <button
          onClick={() => setAdminSubTab('mikrotik_api')}
          className={`px-3 py-2 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === 'mikrotik_api' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>مدیریت کاربران و حجم میکروتیک ({hotspotUsers.length})</span>
        </button>

        <button
          onClick={() => setAdminSubTab('cafeteria_staff')}
          className={`px-3 py-2 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === 'cafeteria_staff' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>کافه‌تریا و کارت مدیران ({staff.length})</span>
        </button>

        <button
          onClick={() => setAdminSubTab('amenities')}
          className={`px-3 py-2 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === 'amenities' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>امکانات و دستگاه‌ها ({amenities.length})</span>
        </button>

        <button
          onClick={() => setAdminSubTab('channels')}
          className={`px-3 py-2 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === 'channels' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>کانال‌های چت ({channels.length})</span>
        </button>

        <button
          onClick={() => setAdminSubTab('notices')}
          className={`px-3 py-2 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === 'notices' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>تابلو اعلانات ({notices.length})</span>
        </button>

        <button
          onClick={() => setAdminSubTab('settings')}
          className={`px-3 py-2 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === 'settings' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>تنظیمات شبکه و رمز ادمین</span>
        </button>

        <button
          onClick={() => setAdminSubTab('downloads')}
          className={`px-3 py-2 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === 'downloads' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>نصب تک‌کامند و پکیج‌ها</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUBTAB 1: MIKROTIK HOTSPOT API & USER QUOTA MANAGEMENT */}
      {/* ============================================================== */}
      {adminSubTab === 'mikrotik_api' && (
        <div className="space-y-6">
          {/* Router API Connection Status Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isRouterConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>وضعیت اتصال API به روتر میکروتیک:</span>
                  <span className={isRouterConnected ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                    {isRouterConnected ? 'روتر آنلاین (RouterOS REST Active)' : 'حالت لوکال (سرویس محلی)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{routerStatusMsg || 'در حال آماده‌باش'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadMikrotikData}
                disabled={isLoadingMikrotik}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMikrotik ? 'animate-spin' : ''}`} />
                <span>به‌روزرسانی اطلاعات روتر</span>
              </button>

              <button
                onClick={() => setIsAddingUser(true)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تعریف کاربر جدید هات‌اسپات</span>
              </button>
            </div>
          </div>

          {/* SECTION A: ACTIVE LIVE SESSIONS (/ip hotspot active) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>کاربران متصل به کپتیو پورتال در لحظه ({activeUsers.length} کاربر آنلاین)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  دستگاه‌هایی که هم‌اکنون از طریق هات‌اسپات میکروتیک به اینترنت متصل هستند
                </p>
              </div>
            </div>

            {activeUsers.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                در حال حاضر هیچ نشست فعالی روی روتر یافت نشد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">نام کاربری</th>
                      <th className="py-2.5 px-3">آدرس آی‌پی</th>
                      <th className="py-2.5 px-3">مک آدرس (MAC)</th>
                      <th className="py-2.5 px-3">مدت اتصال</th>
                      <th className="py-2.5 px-3">دانلود / آپلود</th>
                      <th className="py-2.5 px-3 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {activeUsers.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-2.5 px-3 font-sans font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span>{a.user}</span>
                        </td>
                        <td className="py-2.5 px-3 text-amber-300">{a.address}</td>
                        <td className="py-2.5 px-3 text-slate-400 uppercase text-[11px]">{a.macAddress}</td>
                        <td className="py-2.5 px-3 text-slate-300 tabular-nums">{a.uptime}</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">
                          <span className="text-emerald-400">{formatBytes(a.bytesOut)}</span> /{' '}
                          <span className="text-cyan-400">{formatBytes(a.bytesIn)}</span>
                        </td>
                        <td className="py-2.5 px-3 text-left font-sans">
                          <button
                            onClick={() => handleKickActiveUser(a.id, a.user)}
                            className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-600/40 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            قطع اتصال (Kick)
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION B: HOTSPOT USER ACCOUNTS & QUOTA LIMITS (/ip hotspot user) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>فهرست اکانت‌های هات‌اسپات و مدیریت سهمیه حجم اینترنت ({hotspotUsers.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  می‌توانید حجم مصرفی هر کاربر را کم یا زیاد کنید یا اکانت را حذف نمایید
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">نام کاربری</th>
                    <th className="py-2.5 px-3">پروفایل</th>
                    <th className="py-2.5 px-3">حجم مصرفی فعلی</th>
                    <th className="py-2.5 px-3">سقف حجم مجاز (Quota)</th>
                    <th className="py-2.5 px-3">توضیحات</th>
                    <th className="py-2.5 px-3 text-left">تغییر سهمیه و حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {hotspotUsers.map((u) => {
                    const totalLimitStr =
                      u.limitBytesTotal > 0 ? formatBytes(u.limitBytesTotal) : 'نامحدود (Unlimited)';
                    const usedBytes = u.bytesIn + u.bytesOut;
                    const percentUsed =
                      u.limitBytesTotal > 0 ? Math.min(100, Math.round((usedBytes / u.limitBytesTotal) * 100)) : 0;

                    return (
                      <tr key={u.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-white">{u.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{u.profile}</td>
                        <td className="py-3 px-3">
                          <div className="font-mono text-slate-200">{formatBytes(usedBytes)}</div>
                          {u.limitBytesTotal > 0 && (
                            <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-full ${
                                  percentUsed > 90
                                    ? 'bg-rose-500'
                                    : percentUsed > 70
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-400'
                                }`}
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-amber-300 font-mono">{totalLimitStr}</td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">{u.comment || '-'}</td>
                        <td className="py-3 px-3 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Increase 1GB */}
                            <button
                              onClick={() => handleAdjustQuota(u.id, 1)}
                              className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 rounded-lg text-[11px] font-mono cursor-pointer"
                              title="افزایش ۱ گیگابایت حجم"
                            >
                              +1 GB
                            </button>
                            {/* Increase 5GB */}
                            <button
                              onClick={() => handleAdjustQuota(u.id, 5)}
                              className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 rounded-lg text-[11px] font-mono cursor-pointer"
                              title="افزایش ۵ گیگابایت حجم"
                            >
                              +5 GB
                            </button>
                            {/* Decrease 1GB */}
                            <button
                              onClick={() => handleAdjustQuota(u.id, -1)}
                              className="px-2 py-1 bg-amber-950 hover:bg-amber-900/80 text-amber-300 border border-amber-800 rounded-lg text-[11px] font-mono cursor-pointer"
                              title="کاهش ۱ گیگابایت حجم"
                            >
                              -1 GB
                            </button>
                            {/* Custom Quota */}
                            <button
                              onClick={() => {
                                setAdjustingUser(u);
                                setCustomQuotaGb(
                                  u.limitBytesTotal > 0 ? (u.limitBytesTotal / (1024 * 1024 * 1024)).toString() : '10'
                                );
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] cursor-pointer"
                            >
                              تنظیم سقف
                            </button>
                            {/* Delete User */}
                            <button
                              onClick={() => handleDeleteHotspotUser(u.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                              title="حذف اکانت"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Router API Settings Accordion */}
          <form
            onSubmit={handleSaveRouterApiConfig}
            className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>پیکربندی اتصال REST API به روتر میکروتیک (اختیاری برای اتصال زنده)</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">نام کاربری ادمین میکروتیک:</label>
                <input
                  type="text"
                  value={apiUsername}
                  onChange={(e) => setApiUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">رمز عبور ادمین میکروتیک:</label>
                <input
                  type="password"
                  value={apiPassword}
                  onChange={(e) => setApiPassword(e.target.value)}
                  placeholder="رمز روتر"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">پورت وب/REST روتر:</label>
                <input
                  type="number"
                  value={apiPort}
                  onChange={(e) => setApiPort(Number(e.target.value))}
                  placeholder="80"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl cursor-pointer"
                >
                  ذخیره اطلاعات API روتر
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 2: CAFETERIA & STAFF MANAGEMENT */}
      {/* ============================================================== */}
      {adminSubTab === 'cafeteria_staff' && (
        <div className="space-y-6">
          {/* CAFETERIA CUSTOMIZER */}
          <form
            onSubmit={handleSaveCafeteria}
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">ویرایش بنر و توضیحات کافه‌تریا</h3>
              </div>
              {cafeSavedMsg && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  اطلاعات کافه‌تریا ذخیره شد
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-medium text-slate-300">عنوان اصلی کافه‌تریا:</label>
                <input
                  type="text"
                  value={cafeTitle}
                  onChange={(e) => setCafeTitle(e.target.value)}
                  placeholder="مثال: قهوه تازه، چای دمی و گپ دوستانه"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-medium text-slate-300">زیرعنوان / برچسب بالای تیتر:</label>
                <input
                  type="text"
                  value={cafeSubtitle}
                  onChange={(e) => setCafeSubtitle(e.target.value)}
                  placeholder="مثال: کافه‌تریا و استراحت"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5 text-right md:col-span-2">
                <label className="text-xs font-medium text-slate-300">آدرس عکس کافه (URL یا مسیر عکس):</label>
                <input
                  type="text"
                  value={cafeImg}
                  onChange={(e) => setCafeImg(e.target.value)}
                  placeholder="/src/assets/images/coworking_lounge_cafe_1794330975977.jpg"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5 text-right md:col-span-2">
                <label className="text-xs font-medium text-slate-300">توضیحات کامل کافه‌تریا و سفارش ناهار:</label>
                <textarea
                  value={cafeDesc}
                  onChange={(e) => setCafeDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5 text-right md:col-span-2">
                <label className="text-xs font-medium text-slate-300">یادداشت پایین کارت (Footer Note):</label>
                <input
                  type="text"
                  value={cafeNote}
                  onChange={(e) => setCafeNote(e.target.value)}
                  placeholder="مثال: چای و دمنوش رایگان در تمام طول روز مهیاست."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingCafe}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10"
              >
                {isSavingCafe ? 'در حال ذخیره...' : 'ذخیره تغییرات کافه‌تریا'}
              </button>
            </div>
          </form>

          {/* STAFF & COMMUNITY MANAGERS (Sara Rezaei & others) */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>مدیریت کارت مدیران و پرسنل فضا (مانند کارت سارا رضایی)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  می‌توانید اطلاعات سارا رضایی را تغییر دهید یا مدیران دیگری اضافه و حذف کنید
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingStaff(null);
                  setStaffName('');
                  setStaffRole('مدیر کامیونیتی');
                  setStaffDesk('میز پذیرش');
                  setStaffQuote('');
                  setStaffAvatar('/src/assets/images/community_manager_avatar_1794330976206.jpg');
                  setStaffStatus('حاضر در فضا');
                  setIsAddingStaff(true);
                }}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن عضو جدید کادر / مدیر</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((p) => (
                <div
                  key={p.id}
                  className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-700/80 shrink-0">
                        <img
                          src={p.avatar || '/src/assets/images/community_manager_avatar_1794330976206.jpg'}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{p.name}</h4>
                        <p className="text-xs text-amber-400 mt-0.5">{p.role}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{p.desk}</p>
                      </div>
                    </div>

                    {p.quote && (
                      <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
                        «{p.quote}»
                      </p>
                    )}

                    <div className="text-[11px] flex items-center justify-between text-slate-400 pt-1">
                      <span>وضعیت:</span>
                      <span className="text-emerald-400 font-semibold">{p.status}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingStaff(p);
                        setStaffName(p.name);
                        setStaffRole(p.role);
                        setStaffDesk(p.desk);
                        setStaffQuote(p.quote);
                        setStaffAvatar(p.avatar);
                        setStaffStatus(p.status);
                        setIsAddingStaff(true);
                      }}
                      className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="ویرایش مشخصات"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(p.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="حذف این عضو"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 3: AMENITIES MANAGEMENT */}
      {/* ============================================================== */}
      {adminSubTab === 'amenities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>فهرست امکانات فضا، دستگاه‌های کافه و اتاق‌ها</span>
            </h3>

            <button
              onClick={() => {
                setEditingAmenity(null);
                setAmenityName('');
                setAmenityStatus('ready');
                setAmenityStatusText('آماده استفاده');
                setIsAddingAmenity(true);
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن امکانات جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {amenities.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-800">
                      {item.icon === 'Coffee' && <Coffee className="w-4 h-4 text-amber-400" />}
                      {item.icon === 'PhoneCall' && <PhoneCall className="w-4 h-4 text-rose-400" />}
                      {item.icon === 'Users' && <Users className="w-4 h-4 text-indigo-400" />}
                      {item.icon === 'Tv' && <Tv className="w-4 h-4 text-cyan-400" />}
                      {item.icon === 'Printer' && <Printer className="w-4 h-4 text-slate-300" />}
                      {item.icon === 'Gamepad2' && <Gamepad2 className="w-4 h-4 text-emerald-400" />}
                      {item.icon === 'Mic' && <Mic className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.statusText}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.status === 'ready' || item.status === 'free'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : item.status === 'busy'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {item.status === 'ready'
                      ? 'آماده'
                      : item.status === 'free'
                      ? 'آزاد'
                      : item.status === 'busy'
                      ? 'اشغال'
                      : 'نظافت/تعمیر'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => {
                      setEditingAmenity(item);
                      setAmenityName(item.name);
                      setAmenityIcon(item.icon);
                      setAmenityStatus(item.status);
                      setAmenityStatusText(item.statusText);
                      setIsAddingAmenity(true);
                    }}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="ویرایش"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('آیا از حذف این امکانات اطمینان دارید؟')) return;
                      await fetch(`/api/admin/amenities/${item.id}`, { method: 'DELETE' });
                      await onRefreshData();
                    }}
                    className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 4: CHANNELS MANAGEMENT */}
      {/* ============================================================== */}
      {adminSubTab === 'channels' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-amber-400" />
              <span>مدیریت کانال‌های چت و موضوعات گفتگو</span>
            </h3>

            <button
              onClick={() => {
                setChannelName('');
                setChannelDesc('');
                setIsAddingChannel(true);
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کانال چت</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-amber-400" />
                    <span>{ch.name}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">{ch.description}</p>
                </div>

                <button
                  onClick={async () => {
                    if (!confirm('آیا از حذف این کانال اطمینان دارید؟')) return;
                    await fetch(`/api/admin/channels/${ch.id}`, { method: 'DELETE' });
                    await onRefreshData();
                  }}
                  className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="حذف کانال"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 5: NOTICES MANAGEMENT */}
      {/* ============================================================== */}
      {adminSubTab === 'notices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>مدیریت تابلو اعلانات و رویدادهای فضا</span>
            </h3>

            <button
              onClick={() => {
                setNoticeTitle('');
                setNoticeContent('');
                setIsAddingNotice(true);
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن اطلاعیه</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border space-y-2 ${
                  n.priority === 'urgent' ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  <button
                    onClick={async () => {
                      if (!confirm('آیا از حذف این اطلاعیه مطمئن هستید؟')) return;
                      await fetch(`/api/admin/notices/${n.id}`, { method: 'DELETE' });
                      await onRefreshData();
                    }}
                    className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-300">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 6: SETTINGS & ADMIN PASSWORD */}
      {/* ============================================================== */}
      {adminSubTab === 'settings' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setConfigSuccessMsg(false);
            await onUpdateConfig({
              hotspotName: spaceName,
              routerIp,
              serverLocalIp,
              serverPort: Number(serverPort),
              ...(newAdminPassword.trim() ? { adminPassword: newAdminPassword.trim() } : {}),
            });
            setConfigSuccessMsg(true);
            setNewAdminPassword('');
            setTimeout(() => setConfigSuccessMsg(false), 3000);
          }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>تنظیمات سراسری سامانه و رمز عبور ادمین</span>
            </h3>
            {configSuccessMsg && (
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" />
                تنظیمات با موفقیت ذخیره شد
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">نام فضای کار / نام هات‌اسپات وای‌فای:</label>
              <input
                type="text"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">آدرس آی‌پی روتر میکروتیک:</label>
              <input
                type="text"
                value={routerIp}
                onChange={(e) => setRouterIp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">آدرس آی‌پی سرور اوبونتو در شبکه وای‌فای:</label>
              <input
                type="text"
                value={serverLocalIp}
                onChange={(e) => setServerLocalIp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">تغییر رمز عبور ادمین (در صورت تمایل):</label>
              <input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="برای تغییر، رمز عبور جدید بنویسید"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10"
            >
              ذخیره کلیه تنظیمات
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 7: UBUNTU DOWNLOAD & MIKROTIK PACKAGE */}
      {/* ============================================================== */}
      {adminSubTab === 'downloads' && (
        <div className="space-y-6">
          {/* ONE-COMMAND WEB INSTALLER */}
          <div className="p-6 bg-slate-900 border-2 border-amber-500/60 rounded-2xl space-y-4 shadow-xl shadow-amber-500/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                <Terminal className="w-5 h-5 shrink-0" />
                <span>نصب خودکار روی سرور اوبونتو فقط با ۱ کامند (بدون نیاز به انتقال فایل)</span>
              </div>
              <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-600/50">
                پیشنهادی و فوق‌العاده سریع
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              نیازی به دانلود و آپلود دستی فایل‌ها به سرور (با SCP یا FTP) نیست! وارد محیط ترمینال سرور اوبونتو شوید و دستور زیر را اجرا فرمایید. این اسکریپت به صورت خودکار Node.js 20 را نصب کرده، آخرین نسخه پروژه را مستقیماً از وب‌سرور دانلود و اکسترکت نموده، پکیج‌ها را نصب، فرانت‌اند را بیلد و سرویس دائمی <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">systemd</code> را فعال می‌کند:
            </p>

            <div
              className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 flex items-center justify-between gap-3 overflow-x-auto shadow-inner"
              dir="ltr"
            >
              <code className="select-all">
                {`curl -sSL ${typeof window !== 'undefined' ? window.location.origin : ''}/install.sh | bash`}
              </code>
              <button
                onClick={() => {
                  const cmd = `curl -sSL ${window.location.origin}/install.sh | bash`;
                  navigator.clipboard.writeText(cmd);
                  setCopiedWebInstaller(true);
                  setTimeout(() => setCopiedWebInstaller(false), 2000);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shrink-0 flex items-center gap-1.5 cursor-pointer transition-all shadow"
              >
                {copiedWebInstaller ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWebInstaller ? 'کپی شد!' : 'کپی دستور نصب'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>نصب اتوماتیک Node.js 20 LTS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>تنظیم خودکار فایروال UFW روی پورت ۳۰۰۰</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>سرویس خودکار در بوت اوبونتو (systemd)</span>
              </div>
            </div>
          </div>

          {/* GITHUB ONE-LINER INSTALLER */}
          <div className="p-6 bg-slate-900 border-2 border-sky-500/60 rounded-2xl space-y-4 shadow-xl shadow-sky-500/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sky-400 font-bold text-sm">
                <GitBranch className="w-5 h-5 shrink-0" />
                <span>نصب و اجرای خودکار از مخزن گیت‌هاب (روش اصلی و پیشنهادی)</span>
              </div>
              <span className="text-[11px] font-bold text-sky-300 bg-sky-950/80 px-2.5 py-1 rounded-full border border-sky-800/50">
                همگام با گیت‌هاب و آپدیت با git pull
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              با اتصال پروژه به گیت‌هاب، کافیست آدرس دقیق مخزن گیت‌هاب خود را در کادر زیر قرار دهید. سپس دستور را در ترمینال اوبونتو کپی و پیست کنید. این دستور پروژه را کلون کرده، Node.js 20 را نصب نموده و سرویس دائمی را استارت می‌زند:
            </p>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">آدرس مخزن گیت‌هاب شما (GitHub Repository URL):</label>
              <div className="flex items-center gap-2" dir="ltr">
                <input
                  type="text"
                  value={gitRepoUrl}
                  onChange={(e) => setGitRepoUrl(e.target.value)}
                  placeholder="https://github.com/USERNAME/REPO"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            {/* GitHub clone command (Primary) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-emerald-400">✅ دستور نصب ۱-خطی استاندارد (پشتیبانی از مخازن عمومی و خصوصی):</span>
              </div>
              <div
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 flex items-center justify-between gap-3 overflow-x-auto shadow-inner"
                dir="ltr"
              >
                <code className="select-all">
                  {`git clone ${gitRepoUrl.replace(/\.git$/, '')}.git hamkarhub && cd hamkarhub && sudo ./install-ubuntu.sh`}
                </code>
                <button
                  onClick={() => {
                    const cleanRepo = gitRepoUrl.replace(/\.git$/, '');
                    const cmd = `git clone ${cleanRepo}.git hamkarhub && cd hamkarhub && sudo ./install-ubuntu.sh`;
                    navigator.clipboard.writeText(cmd);
                    setCopiedGitClone(true);
                    setTimeout(() => setCopiedGitClone(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shrink-0 flex items-center gap-1.5 cursor-pointer transition-all shadow"
                >
                  {copiedGitClone ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedGitClone ? 'کپی شد!' : 'کپی دستور'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                💡 این دستور برای هر دو نوع مخزن (Public و Private) بدون ارور کار می‌کند. در صورت خصوصی بودن مخزن، ترمینال اوبونتو نام کاربری و توکن گیت‌هاب را می‌پرسد.
              </p>
            </div>

            {/* GitHub curl one liner */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">روش دوم: اجرای اسکریپت با curl (فقط برای مخازن عمومی / Public):</span>
              </div>
              <div
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-sky-300 flex items-center justify-between gap-3 overflow-x-auto"
                dir="ltr"
              >
                <code className="select-all">
                  {`bash -c "$(curl -fsSL ${gitRepoUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace(/\.git$/, '')}/main/install-quick.sh)"`}
                </code>
                <button
                  onClick={() => {
                    const rawUrl = gitRepoUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace(/\.git$/, '');
                    const cmd = `bash -c "$(curl -fsSL ${rawUrl}/main/install-quick.sh)"`;
                    navigator.clipboard.writeText(cmd);
                    setCopiedGitInstaller(true);
                    setTimeout(() => setCopiedGitInstaller(false), 2000);
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] rounded-lg shrink-0 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {copiedGitInstaller ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedGitInstaller ? 'کپی شد!' : 'کپی'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* MIKROTIK CHAP ERROR FIX */}
          <div className="p-5 bg-amber-950/20 border border-amber-500/40 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>دستور رفع ارور «challenge response, try again, enable javascript» میکروتیک:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              با اجرای دستور زیر در ترمینال میکروتیک، ورود HTTP-PAP فعال شده و میکروتیک پسوردهای ارسالی را بدون چالش جاوااسکریپت و بدون ارور می‌پذیرد:
            </p>

            <div
              className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between overflow-x-auto"
              dir="ltr"
            >
              <code>/ip hotspot profile set [find] login-by=http-pap,http-chap,trial,cookie</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('/ip hotspot profile set [find] login-by=http-pap,http-chap,trial,cookie');
                  setCopiedCli(true);
                  setTimeout(() => setCopiedCli(false), 2000);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] rounded-lg shrink-0 mr-2 cursor-pointer"
              >
                {copiedCli ? 'کپی شد!' : 'کپی دستور'}
              </button>
            </div>
          </div>

          {/* MANUAL ZIP PACKAGES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                  <Server className="w-5 h-5 text-amber-400" />
                  <span>دانلود دستی پکیج کامل سرور اوبونتو (Ubuntu Server Package)</span>
                </div>
                <h4 className="text-sm font-bold text-white">فایل‌های فشرده سورس برای استفاده آفلاین</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  اگر به هر دلیل تمایل به دانلود فایل زیپ روی کامپیوتر شخصی و انتقال دستی دارید، می‌توانید پکیج را دانلود کنید.
                </p>
              </div>

              <a
                href="/api/download/ubuntu-package"
                download="hamkarhub-ubuntu-package.zip"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>دانلود پکیج کامل اوبونتو (.ZIP)</span>
              </a>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Wifi className="w-5 h-5" />
                  <span>پکیج قالب‌های هات‌اسپات میکروتیک</span>
                </div>
                <h4 className="text-sm font-bold text-white">فایل‌های آماده پوشه Files/hotspot</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  شامل فایل‌های login.html، status.html و setup.rsc جهت بارگذاری مستقیم با Winbox روی روتر.
                </p>
              </div>

              <a
                href="/api/download/mikrotik-hotspot"
                download="mikrotik-hotspot-files.zip"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <Download className="w-4 h-4" />
                <span>دانلود فایل‌های میکروتیک (.ZIP)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD HOTSPOT USER */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreateHotspotUser}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-sm font-bold text-white">تعریف کاربر جدید در هات‌اسپات میکروتیک</h3>

            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-slate-300">نام کاربری یا شماره اشتراک:</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="مثال: pouya_rad یا 108"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-slate-300">کلمه عبور:</label>
              <input
                type="password"
                value={newUserPass}
                onChange={(e) => setNewUserPass(e.target.value)}
                placeholder="رمز عبور کاربر"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-slate-300">سقف سهمیه حجم (Quota بر حسب گیگابایت):</label>
              <select
                value={newUserQuotaGb}
                onChange={(e) => setNewUserQuotaGb(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="1">۱ گیگابایت (1 GB)</option>
                <option value="3">۳ گیگابایت (3 GB)</option>
                <option value="5">۵ گیگابایت (5 GB)</option>
                <option value="10">۱۰ گیگابایت (10 GB)</option>
                <option value="20">۲۰ گیگابایت (20 GB)</option>
                <option value="50">۵۰ گیگابایت (50 GB)</option>
                <option value="0">نامحدود (Unlimited)</option>
              </select>
            </div>

            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-slate-300">توضیحات کاربر (Comment):</label>
              <input
                type="text"
                value={newUserComment}
                onChange={(e) => setNewUserComment(e.target.value)}
                placeholder="مثال: عضو ماهانه - میز شماره ۳"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                ایجاد اکانت در میکروتیک
              </button>
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="py-2 px-4 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CUSTOM QUOTA ADJUSTMENT */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleSetExactQuota}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4"
          >
            <h3 className="text-sm font-bold text-white">تنظیم سهمیه حجم کاربر {adjustingUser.name}</h3>

            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-slate-300">سقف حجم کل جدید (گیگابایت):</label>
              <input
                type="number"
                step="0.5"
                value={customQuotaGb}
                onChange={(e) => setCustomQuotaGb(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                placeholder="مثال: 15"
                required
              />
              <span className="text-[11px] text-slate-500">برای نامحدود کردن، مقدار 0 قرار دهید.</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                ثبت سهمیه جدید
              </button>
              <button
                type="button"
                onClick={() => setAdjustingUser(null)}
                className="py-2 px-4 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD / EDIT STAFF */}
      {isAddingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveStaff}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-sm font-bold text-white">
              {editingStaff ? `ویرایش کارت ${editingStaff.name}` : 'افزودن عضو جدید به کادر مدیریت'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 text-right">
                <label className="text-xs font-medium text-slate-300">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="مثال: سارا رضایی"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="text-xs font-medium text-slate-300">سمت / نقش:</label>
                <input
                  type="text"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  placeholder="مثال: مدیر کامیونیتی"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 text-right">
                <label className="text-xs font-medium text-slate-300">محل استقرار / شماره میز:</label>
                <input
                  type="text"
                  value={staffDesk}
                  onChange={(e) => setStaffDesk(e.target.value)}
                  placeholder="مثال: میز پذیرش - ورودی اصلی"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="text-xs font-medium text-slate-300">وضعیت حضور:</label>
                <input
                  type="text"
                  value={staffStatus}
                  onChange={(e) => setStaffStatus(e.target.value)}
                  placeholder="مثال: حاضر در فضا"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-slate-300">آدرس عکس پرسنلی (URL):</label>
              <input
                type="text"
                value={staffAvatar}
                onChange={(e) => setStaffAvatar(e.target.value)}
                placeholder="/src/assets/images/community_manager_avatar_1794330976206.jpg"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-slate-300">متن پیام یا خوش‌آمدگویی مدیر:</label>
              <textarea
                value={staffQuote}
                onChange={(e) => setStaffQuote(e.target.value)}
                rows={3}
                placeholder="هر زمان نیاز به رزرو اتاق جلسات داشتید در خدمت هستم..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                ذخیره مشخصات مدیر
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingStaff(false);
                  setEditingStaff(null);
                }}
                className="py-2 px-4 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD / EDIT AMENITY */}
      {isAddingAmenity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!amenityName.trim()) return;

              if (editingAmenity) {
                await fetch(`/api/admin/amenities/${editingAmenity.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: amenityName,
                    icon: amenityIcon,
                    status: amenityStatus,
                    statusText: amenityStatusText,
                  }),
                });
              } else {
                await fetch('/api/admin/amenities', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: amenityName,
                    icon: amenityIcon,
                    status: amenityStatus,
                    statusText: amenityStatusText || 'آماده استفاده',
                  }),
                });
              }

              setIsAddingAmenity(false);
              setEditingAmenity(null);
              setAmenityName('');
              setAmenityStatusText('');
              await onRefreshData();
            }}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-sm font-bold text-white">
              {editingAmenity ? `ویرایش ${editingAmenity.name}` : 'افزودن امکانات جدید به فضا'}
            </h3>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">نام امکانات یا دستگاه:</label>
              <input
                type="text"
                value={amenityName}
                onChange={(e) => setAmenityName(e.target.value)}
                placeholder="مثال: دستگاه اسپرسوساز دلونگی"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">وضعیت فعلی:</label>
              <select
                value={amenityStatus}
                onChange={(e) => setAmenityStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="ready">آماده و فعال</option>
                <option value="free">آزاد و بدون استفاده</option>
                <option value="busy">در حال استفاده / اشغال</option>
                <option value="maintenance">در حال نظافت / در دست تعمیر</option>
              </select>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">متن وضعیت برای کاربران:</label>
              <input
                type="text"
                value={amenityStatusText}
                onChange={(e) => setAmenityStatusText(e.target.value)}
                placeholder="مثال: دان قهوه تازه پر شده است"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                ذخیره امکانات
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingAmenity(false);
                  setEditingAmenity(null);
                }}
                className="py-2 px-4 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD CHANNEL */}
      {isAddingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!channelName.trim()) return;
              await fetch('/api/admin/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: channelName,
                  description: channelDesc,
                  icon: channelIcon,
                }),
              });
              setIsAddingChannel(false);
              setChannelName('');
              setChannelDesc('');
              await onRefreshData();
            }}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-sm font-bold text-white">افزودن کانال چت جدید</h3>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">نام کانال:</label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="مثال: هوش مصنوعی و داده"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">توضیحات کانال:</label>
              <input
                type="text"
                value={channelDesc}
                onChange={(e) => setChannelDesc(e.target.value)}
                placeholder="مثال: تبادل نظر در خصوص مدل‌های AI"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                ایجاد کانال
              </button>
              <button
                type="button"
                onClick={() => setIsAddingChannel(false)}
                className="py-2 px-4 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD NOTICE */}
      {isAddingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!noticeTitle.trim() || !noticeContent.trim()) return;
              await fetch('/api/notices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: noticeTitle,
                  content: noticeContent,
                  author: 'مدیریت فضا',
                  priority: noticePriority,
                }),
              });
              setIsAddingNotice(false);
              setNoticeTitle('');
              setNoticeContent('');
              await onRefreshData();
            }}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-sm font-bold text-white">افزودن اطلاعیه مدیریت به تابلو</h3>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">عنوان:</label>
              <input
                type="text"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="مثال: تغییر ساعت کاری در روز پنجشنبه"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">متن:</label>
              <textarea
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                rows={3}
                required
                placeholder="توضیحات اطلاعیه..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="noticePriority"
                  checked={noticePriority === 'normal'}
                  onChange={() => setNoticePriority('normal')}
                />
                <span className="text-slate-300">عادی</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="noticePriority"
                  checked={noticePriority === 'urgent'}
                  onChange={() => setNoticePriority('urgent')}
                />
                <span className="text-amber-400 font-bold">فوری / مهم</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                ثبت اطلاعیه
              </button>
              <button
                type="button"
                onClick={() => setIsAddingNotice(false)}
                className="py-2 px-4 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
