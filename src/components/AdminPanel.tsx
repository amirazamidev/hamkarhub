import React, { useState } from 'react';
import {
  ShieldAlert,
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
} from 'lucide-react';
import { SpaceAmenity, Channel, NoticeItem, HotspotConfig } from '../types';

interface AdminPanelProps {
  amenities: SpaceAmenity[];
  channels: Channel[];
  notices: NoticeItem[];
  config: HotspotConfig;
  onRefreshData: () => Promise<void>;
  onUpdateConfig: (newConfig: Partial<HotspotConfig>) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  amenities,
  channels,
  notices,
  config,
  onRefreshData,
  onUpdateConfig,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('hamkar_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Admin Sub-tab
  const [adminSubTab, setAdminSubTab] = useState<'amenities' | 'channels' | 'notices' | 'settings' | 'downloads'>(
    'amenities'
  );

  // Amenity Form modal state
  const [editingAmenity, setEditingAmenity] = useState<SpaceAmenity | null>(null);
  const [isAddingAmenity, setIsAddingAmenity] = useState(false);
  const [amenityName, setAmenityName] = useState('');
  const [amenityIcon, setAmenityIcon] = useState('Coffee');
  const [amenityStatus, setAmenityStatus] = useState<SpaceAmenity['status']>('ready');
  const [amenityStatusText, setAmenityStatusText] = useState('');

  // Channel Form state
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [channelIcon, setChannelIcon] = useState('Hash');

  // Notice Form state
  const [isAddingNotice, setIsAddingNotice] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState<'normal' | 'urgent'>('normal');

  // Config settings form
  const [spaceName, setSpaceName] = useState(config.hotspotName);
  const [routerIp, setRouterIp] = useState(config.routerIp);
  const [serverLocalIp, setServerLocalIp] = useState(config.serverLocalIp);
  const [serverPort, setServerPort] = useState(config.serverPort);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [configSuccessMsg, setConfigSuccessMsg] = useState(false);

  const [copiedCli, setCopiedCli] = useState(false);

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

  // Amenities CRUD
  const handleSaveAmenity = async (e: React.FormEvent) => {
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
  };

  const handleDeleteAmenity = async (id: string) => {
    if (!confirm('آیا از حذف این مورد اطمینان دارید؟')) return;
    await fetch(`/api/admin/amenities/${id}`, { method: 'DELETE' });
    await onRefreshData();
  };

  // Channels CRUD
  const handleSaveChannel = async (e: React.FormEvent) => {
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
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('آیا از حذف این کانال چت اطمینان دارید؟')) return;
    const res = await fetch(`/api/admin/channels/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'امکان حذف وجود ندارد');
      return;
    }
    await onRefreshData();
  };

  // Notices CRUD
  const handleSaveNotice = async (e: React.FormEvent) => {
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
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('آیا از حذف این اطلاعیه مطمئن هستید؟')) return;
    await fetch(`/api/admin/notices/${id}`, { method: 'DELETE' });
    await onRefreshData();
  };

  // Config Update
  const handleSaveSettings = async (e: React.FormEvent) => {
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
  };

  const getAmenityIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'PhoneCall':
        return <PhoneCall className="w-4 h-4 text-rose-400" />;
      case 'Users':
        return <Users className="w-4 h-4 text-indigo-400" />;
      case 'Tv':
        return <Tv className="w-4 h-4 text-cyan-400" />;
      case 'Printer':
        return <Printer className="w-4 h-4 text-slate-300" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
      case 'Mic':
        return <Mic className="w-4 h-4 text-purple-400" />;
      default:
        return <Coffee className="w-4 h-4 text-amber-400" />;
    }
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
            مدیریت کامل امکانات کافه، کانال‌های گفتگو، اعلانات و پکیج اوبونتو
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
            <span className="text-[11px] text-slate-500 block">رمز عبور اولیه: admin123</span>
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
      {/* Top Banner with Subtabs and Logout */}
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
            <p className="text-xs text-slate-400">امکان تغییر، حذف و اضافه کلیه بخش‌های سیستم</p>
          </div>
        </div>

        <button
          onClick={handleLogoutAdmin}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs rounded-xl transition-colors cursor-pointer"
        >
          خروج از ادمین
        </button>
      </div>

      {/* Admin Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        <button
          onClick={() => setAdminSubTab('amenities')}
          className={`px-3 py-2 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === 'amenities' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>مدیریت امکانات و کافه ({amenities.length})</span>
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
          <Download className="w-4 h-4" />
          <span>دانلود پکیج اوبونتو و میکروتیک</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUBTAB 1: AMENITIES & CAFE MANAGEMENT */}
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
                    <div className="p-2 rounded-xl bg-slate-800">{getAmenityIcon(item.icon)}</div>
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
                    {item.status === 'ready' ? 'آماده' : item.status === 'free' ? 'آزاد' : item.status === 'busy' ? 'اشغال' : 'نظافت/تعمیر'}
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
                    onClick={() => handleDeleteAmenity(item.id)}
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
      {/* SUBTAB 2: CHANNELS MANAGEMENT */}
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
                  onClick={() => handleDeleteChannel(ch.id)}
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
      {/* SUBTAB 3: NOTICES MANAGEMENT */}
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
                    onClick={() => handleDeleteNotice(n.id)}
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
      {/* SUBTAB 4: SETTINGS & ADMIN PASSWORD */}
      {/* ============================================================== */}
      {adminSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
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
      {/* SUBTAB 5: UBUNTU DOWNLOAD & MIKROTIK PACKAGE */}
      {/* ============================================================== */}
      {adminSubTab === 'downloads' && (
        <div className="space-y-6">
          {/* Solution to challenge response error */}
          <div className="p-5 bg-amber-950/20 border border-amber-500/40 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>راهکار قطعی خطای «challenge response, try again, enable javascript» میکروتیک:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              این خطا در میکروتیک به دلیل تنظیم بودن هات‌اسپات روی فقط متد <span className="font-mono text-amber-300">http-chap</span> رخ می‌دهد. با اجرای دستور زیر در ترمینال میکروتیک، متد <span className="font-mono text-emerald-400">http-pap</span> فعال می‌شود و میکروتیک پسورد ورودی را از صفحه کپتیو بدون ارور چلنج مستقیماً می‌پذیرد:
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 flex items-center justify-between overflow-x-auto" dir="ltr">
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

          {/* Download cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ubuntu Server Package */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Server className="w-5 h-5" />
                  <span>پکیج کامل سرور اوبونتو (Ubuntu Server Package)</span>
                </div>
                <h4 className="text-sm font-bold text-white">فایل‌های اصلی برنامه برای اجرا روی اوبونتو</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  شامل تمام کدهای فرانت‌اند و بک‌اند، فایل‌های پیکربندی و اسکریپت نصب خودکار <span className="font-mono text-slate-200">install-ubuntu.sh</span> برای نصب Node.js و اجرای اتوماتیک روی اوبونتو به عنوان سرویس پس‌زمینه (systemd).
                </p>
              </div>

              <a
                href="/api/download/ubuntu-package"
                download="hamkarhub-ubuntu-package.zip"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/10"
              >
                <Download className="w-4 h-4" />
                <span>دانلود پکیج کامل اوبونتو (.ZIP)</span>
              </a>
            </div>

            {/* MikroTik Hotspot Files Package */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Wifi className="w-5 h-5" />
                  <span>پکیج قالب‌های هات‌اسپات میکروتیک (MikroTik Hotspot Files)</span>
                </div>
                <h4 className="text-sm font-bold text-white">فایل‌های آماده پوشه Files/hotspot</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  شامل فایل‌های <span className="font-mono text-slate-200">login.html</span>، <span className="font-mono text-slate-200">status.html</span>، <span className="font-mono text-slate-200">setup.rsc</span> جهت بارگذاری مستقیم با نرم‌افزار Winbox داخل حافظه روتر میکروتیک.
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

      {/* Add / Edit Amenity Modal */}
      {isAddingAmenity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleSaveAmenity} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">
              {editingAmenity ? `ویرایش ${editingAmenity.name}` : 'افزودن امکانات جدید به فضا'}
            </h3>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">نام امکانات یا دستگاه:</label>
              <input
                type="text"
                value={amenityName}
                onChange={(e) => setAmenityName(e.target.value)}
                placeholder="مثال: دستگاه اسپرسوساز دلونگی / اتاق ضبط پادکست"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">آیکون:</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'Coffee', label: 'قهوه' },
                  { id: 'PhoneCall', label: 'تماس' },
                  { id: 'Users', label: 'جلسه' },
                  { id: 'Tv', label: 'تلویزیون' },
                  { id: 'Printer', label: 'پرینتر' },
                  { id: 'Gamepad2', label: 'بازی' },
                  { id: 'Mic', label: 'پادکست' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAmenityIcon(item.id)}
                    className={`p-2 rounded-xl text-xs flex flex-col items-center gap-1 cursor-pointer border ${
                      amenityIcon === item.id ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {getAmenityIcon(item.id)}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
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
                ذخیره
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

      {/* Add Channel Modal */}
      {isAddingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleSaveChannel} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
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
                placeholder="مثال: تبادل نظر در خصوص مدل‌های AI و ابزارها"
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

      {/* Add Notice Modal */}
      {isAddingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleSaveNotice} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
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
