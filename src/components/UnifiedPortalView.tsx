import React, { useState, useMemo } from 'react';
import {
  Wifi,
  ShieldCheck,
  Key,
  Ticket,
  Sparkles,
  LogOut,
  Coffee,
  PhoneCall,
  Users,
  MapPin,
  Send,
  AlertCircle,
  Hash,
  ExternalLink,
  ChevronDown,
  Info,
  Activity,
  ArrowDown,
  ArrowUp,
  Gauge,
  Check,
  Laptop,
  Smartphone,
  Lock,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Channel,
  ChatMessage,
  Member,
  HotspotConfig,
  SpaceAmenity,
  NoticeItem,
  HotspotSession,
} from '../types';

interface ChatMessageRowProps {
  msg: ChatMessage;
  isCurrentUser: boolean;
  currentMemberId: string;
  onToggleReaction: (messageId: string, emoji: string) => void;
}

const ChatMessageRow = React.memo<ChatMessageRowProps>(
  ({ msg, isCurrentUser, currentMemberId, onToggleReaction }) => {
    return (
      <div
        className={`p-3.5 rounded-xl border transition-colors ${
          msg.type === 'announcement'
            ? 'bg-amber-950/20 border-amber-500/30'
            : isCurrentUser
            ? 'bg-slate-950/70 border-slate-700/60'
            : 'bg-slate-950/30 border-slate-800/80 hover:border-slate-700/60'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">{msg.sender.name}</span>
            {isCurrentUser && (
              <span className="text-[10px] text-amber-400 font-medium bg-amber-500/10 px-1 py-0.2 rounded">
                شما
              </span>
            )}
            <span className="text-[11px] text-slate-400">·</span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              {msg.sender.desk}
            </span>
          </div>

          <span className="text-[10px] text-slate-500 font-mono tabular-nums">
            {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Content */}
        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap pl-1 pr-6">
          {msg.content}
        </div>

        {/* Reactions */}
        <div className="mt-2.5 pt-1.5 border-t border-slate-800/50 flex items-center gap-1 text-xs">
          {msg.reactions &&
            Object.entries(msg.reactions).map(([emoji, userIds]) => (
              <button
                key={emoji}
                onClick={() => onToggleReaction(msg.id, emoji)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                  userIds.includes(currentMemberId)
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-400'
                }`}
              >
                <span>{emoji}</span>
                <span className="font-mono text-[10px] tabular-nums">{userIds.length}</span>
              </button>
            ))}

          <div className="flex items-center gap-1 mr-auto opacity-60 hover:opacity-100 transition-opacity">
            {['👍', '❤️', '☕', '🔥'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => onToggleReaction(msg.id, emoji)}
                className="p-0.5 rounded hover:bg-slate-800 text-[11px] cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

interface UnifiedPortalViewProps {
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  messages: ChatMessage[];
  currentMember: Member;
  onSendMessage: (channelId: string, content: string) => Promise<void>;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onOpenCheckIn: () => void;
  config: HotspotConfig;
  session: HotspotSession;
  clientIp: string;
  onLoginSuccess: (session: HotspotSession) => void;
  onLogout: () => void;
  amenities: SpaceAmenity[];
  notices: NoticeItem[];
  onlineCount: number;
}

export const UnifiedPortalView: React.FC<UnifiedPortalViewProps> = ({
  channels,
  activeChannelId,
  onSelectChannel,
  messages,
  currentMember,
  onSendMessage,
  onToggleReaction,
  onOpenCheckIn,
  config,
  session,
  clientIp,
  onLoginSuccess,
  onLogout,
  amenities,
  notices,
  onlineCount,
}) => {
  // Hotspot Form state
  const [loginTab, setLoginTab] = useState<'user' | 'voucher' | 'trial'>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [voucher, setVoucher] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loginMethodMode, setLoginMethodMode] = useState<'direct_router' | 'lan_server'>('lan_server');

  // Chat Composer state
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  // Mobile view toggle (on small captive assistant screens)
  const [mobileTab, setMobileTab] = useState<'login' | 'chat'>('login');
  const [showAllMessages, setShowAllMessages] = useState(false);

  // User Self-Service Live Account Stats & Password Change State
  const [liveUserStats, setLiveUserStats] = useState<{
    totalQuotaBytes: number;
    usedBytes: number;
    connectedDevicesCount: number;
    connectedDevices: Array<{ address: string; macAddress?: string; uptime?: string }>;
  } | null>(null);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassStatus, setChangePassStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDevicesList, setShowDevicesList] = useState(false);

  // Speed Test State
  const [speedTestRunning, setSpeedTestRunning] = useState(false);
  const [speedTestPhase, setSpeedTestPhase] = useState<'idle' | 'ping' | 'download' | 'done'>('idle');
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [jitterMs, setJitterMs] = useState<number | null>(null);
  const [downloadMbps, setDownloadMbps] = useState<number | null>(null);
  const [speedTestProgress, setSpeedTestProgress] = useState(0);

  // Fetch live stats whenever session is connected
  React.useEffect(() => {
    if (session.isConnected && session.username && !session.username.includes('Trial')) {
      fetch(`/api/hotspot/user-stats/${encodeURIComponent(session.username)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data) {
            setLiveUserStats({
              totalQuotaBytes: data.totalQuotaBytes || session.totalQuotaBytes || 0,
              usedBytes: data.usedBytes || session.usedBytes || 0,
              connectedDevicesCount: data.connectedDevicesCount || session.connectedDevicesCount || 1,
              connectedDevices: data.connectedDevices || session.connectedDevices || [],
            });
          }
        })
        .catch((e) => console.error(e));
    }
  }, [session.isConnected, session.username, session.totalQuotaBytes, session.usedBytes, session.connectedDevicesCount]);

  const runSpeedTest = async () => {
    setSpeedTestRunning(true);
    setSpeedTestPhase('ping');
    setSpeedTestProgress(20);
    try {
      // Phase 1: Ping & Jitter
      const pings: number[] = [];
      for (let i = 0; i < 3; i++) {
        const t0 = performance.now();
        await fetch('/api/speedtest/ping?t=' + Date.now(), { cache: 'no-store' });
        const t1 = performance.now();
        pings.push(Math.round(t1 - t0));
        setSpeedTestProgress(20 + (i + 1) * 15);
        await new Promise((r) => setTimeout(r, 60));
      }
      const avgPing = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
      const jitter = Math.max(0.2, Number(((Math.abs(pings[0] - pings[1]) + Math.abs(pings[1] - pings[2])) / 2).toFixed(1)));
      setPingMs(avgPing);
      setJitterMs(jitter);

      // Phase 2: Throughput
      setSpeedTestPhase('download');
      setSpeedTestProgress(75);
      const startDown = performance.now();
      const payloadRes = await fetch('/api/speedtest/payload?bytes=1048576&t=' + Date.now(), { cache: 'no-store' });
      const blob = await payloadRes.blob();
      const endDown = performance.now();
      const durationSeconds = Math.max(0.01, (endDown - startDown) / 1000);
      const bitsTransferred = blob.size * 8;
      const mbps = Number(((bitsTransferred / durationSeconds) / 1_000_000).toFixed(1));
      setDownloadMbps(mbps);
      setSpeedTestProgress(100);
      setSpeedTestPhase('done');
    } catch (err) {
      console.error('Speed test error:', err);
      setSpeedTestPhase('done');
    } finally {
      setSpeedTestRunning(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassInput !== confirmPassInput) {
      setChangePassStatus({ type: 'error', message: 'کلمه عبور جدید و تکرار آن یکسان نیستند.' });
      return;
    }
    if (newPassInput.length < 4) {
      setChangePassStatus({ type: 'error', message: 'کلمه عبور جدید باید حداقل ۴ کاراکتر باشد.' });
      return;
    }
    setChangePassLoading(true);
    setChangePassStatus(null);
    try {
      const res = await fetch('/api/hotspot/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: session.username,
          oldPassword: currentPassInput,
          newPassword: newPassInput,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChangePassStatus({ type: 'success', message: 'کلمه عبور حساب با موفقیت تغییر یافت.' });
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setCurrentPassInput('');
          setNewPassInput('');
          setConfirmPassInput('');
          setChangePassStatus(null);
        }, 1800);
      } else {
        setChangePassStatus({ type: 'error', message: data.error || 'خطا در تغییر رمز' });
      }
    } catch {
      setChangePassStatus({ type: 'error', message: 'خطا در برقراری ارتباط با سرور' });
    } finally {
      setChangePassLoading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const DEFAULT_CHANNEL: Channel = {
    id: 'general',
    name: 'عمومی و لابی',
    description: 'گفتگوهای روزمره و معرفی اعضا',
    icon: 'Coffee',
  };

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) || channels[0] || DEFAULT_CHANNEL,
    [channels, activeChannelId]
  );
  const channelMessages = useMemo(
    () => messages.filter((m) => m.channelId === (activeChannel?.id || activeChannelId)),
    [messages, activeChannel, activeChannelId]
  );
  const visibleMessages = useMemo(() => {
    if (showAllMessages || channelMessages.length <= 100) return channelMessages;
    return channelMessages.slice(-100);
  }, [channelMessages, showAllMessages]);

  React.useEffect(() => {
    setShowAllMessages(false);
  }, [activeChannelId]);

  React.useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  // Helper to parse strings like "3.8 MB" or "1.2 GB" to numeric megabytes for chart
  const parseTrafficToMB = (trafficStr: string = '0 MB'): number => {
    if (!trafficStr) return 0;
    const match = trafficStr.match(/([\d.]+)\s*([A-Za-z]+)?/);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const unit = (match[2] || 'MB').toUpperCase();
    if (unit === 'GB') return Number((val * 1024).toFixed(2));
    if (unit === 'KB') return Number((val / 1024).toFixed(3));
    if (unit === 'B') return Number((val / (1024 * 1024)).toFixed(4));
    return val;
  };

  const totalDownloadMB = parseTrafficToMB(session.bytesIn);
  const totalUploadMB = parseTrafficToMB(session.bytesOut);

  // Time-series trend data points based on session consumption
  const consumptionTrend = useMemo(() => {
    const points = 6;
    return Array.from({ length: points }).map((_, i) => {
      const ratio = (i + 1) / points;
      const factor = Math.min(1, Math.pow(ratio, 1.3));
      const down = Number((totalDownloadMB * factor).toFixed(2));
      const up = Number((totalUploadMB * factor).toFixed(2));
      const label = i === points - 1 ? 'اکنون' : `T-${(points - 1 - i) * 3}د`;
      return {
        time: label,
        download: down,
        upload: up,
        total: Number((down + up).toFixed(2)),
      };
    });
  }, [totalDownloadMB, totalUploadMB]);

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('لطفاً نام کاربری را وارد نمایید');
      return;
    }

    if (loginMethodMode === 'direct_router') {
      // Direct POST to MikroTik router hotspot
      const form = document.getElementById('mikrotik-direct-form') as HTMLFormElement;
      if (form) {
        form.submit();
        return;
      }
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/hotspot/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, type: 'credentials' }),
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess({
          isConnected: true,
          username,
          ip: clientIp,
          uptime: '00:00:01',
          timeLeft: 'نامحدود (عضو فعال)',
          bytesIn: '3.8 MB',
          bytesOut: '1.2 MB',
          loginTime: Date.now(),
        });
      } else {
        setErrorMsg(data.error || 'خطا در احراز هویت میکروتیک');
      }
    } catch {
      setErrorMsg('خطا در برقراری ارتباط با سرور هات‌اسپات');
    } finally {
      setLoading(false);
    }
  };

  const handleVoucherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucher.trim()) {
      setErrorMsg('لطفاً کد کارت یا ووچر را وارد نمایید');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/hotspot/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: voucher.toUpperCase(), password: '', type: 'voucher' }),
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess({
          isConnected: true,
          username: voucher.toUpperCase(),
          ip: clientIp,
          uptime: '00:00:01',
          timeLeft: '۸ ساعت (پاس روزانه)',
          bytesIn: '1.4 MB',
          bytesOut: '420 KB',
          loginTime: Date.now(),
        });
      } else {
        setErrorMsg(data.error || 'کد ووچر نامعتبر است');
      }
    } catch {
      setErrorMsg('خطا در بررسی ووچر');
    } finally {
      setLoading(false);
    }
  };

  const handleTrialLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/hotspot/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'trial' }),
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess({
          isConnected: true,
          username: 'مهمان موقت (Trial)',
          ip: clientIp,
          uptime: '00:00:01',
          timeLeft: `${config.trialDurationMinutes} دقیقه`,
          bytesIn: '1.1 MB',
          bytesOut: '310 KB',
          loginTime: Date.now(),
        });
      }
    } catch {
      setErrorMsg('امکان فعال‌سازی ورود آزمایشی وجود ندارد');
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;
    const txt = chatInput;
    setChatInput('');
    setIsSending(true);
    try {
      await onSendMessage(activeChannelId, txt);
    } finally {
      setIsSending(false);
    }
  };

  const addTagToChat = (tag: string) => {
    setChatInput((prev) => (prev ? `${prev} ${tag} ` : `${tag} `));
  };

  const espressoStatus = amenities.find((a) => a.id === 'espresso-bar')?.statusText;
  const urgentNotice = notices.find((n) => n.priority === 'urgent') || notices[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* Mobile view switcher for small Captive Portal popups */}
      <div className="lg:hidden flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          onClick={() => setMobileTab('login')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            mobileTab === 'login'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wifi className="w-4 h-4" />
          <span>لاگین اینترنت میکروتیک</span>
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            mobileTab === 'chat'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>چت لوکال فضای کار</span>
        </button>
      </div>

      {/* Main Split Grid: Captive Login on Right/Left + Chat on the other side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* COLUMN 1 (4/12): MIKROTIK HOTSPOT CAPTIVE PORTAL LOGIN BOX */}
        {/* ========================================================= */}
        <section
          className={`lg:col-span-5 xl:col-span-4 space-y-4 ${
            mobileTab === 'chat' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Main Hotspot Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>کپتیو پورتال میکروتیک</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                      Walled Garden
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    اتصال به اینترنت وای‌فای فضای کار اشتراکی
                  </p>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-5">
              {session.isConnected ? (
                /* CONNECTED STATE */
                <div className="space-y-4">
                  {/* MAIN STATUS & QUOTA CARD */}
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-3.5 shadow-lg shadow-emerald-950/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        اینترنت فعال روی میکروتیک
                      </span>
                      <span className="font-mono text-xs text-emerald-200 bg-emerald-900/60 px-2.5 py-0.5 rounded-lg font-bold border border-emerald-700/50">
                        {session.username}
                      </span>
                    </div>

                    {/* VOLUME & QUOTA PROGRESS */}
                    {(() => {
                      const totalQuota = liveUserStats?.totalQuotaBytes ?? session.totalQuotaBytes ?? 10737418240;
                      const usedQuota = liveUserStats?.usedBytes ?? session.usedBytes ?? 1540000;
                      const hasLimit = totalQuota > 0;
                      const remainingBytes = hasLimit ? Math.max(0, totalQuota - usedQuota) : 0;
                      const pctUsed = hasLimit ? Math.min(100, Math.round((usedQuota / totalQuota) * 100)) : 0;

                      return (
                        <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-900/40 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              سهمیه حجم اینترنت اکانت:
                            </span>
                            <span className="font-mono font-bold text-amber-300">
                              {hasLimit ? formatSize(totalQuota) : 'نامحدود (Unlimited)'}
                            </span>
                          </div>

                          {hasLimit ? (
                            <>
                              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    pctUsed > 85 ? 'bg-rose-500' : pctUsed > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`}
                                  style={{ width: `${pctUsed}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                                <span>مصرف: {formatSize(usedQuota)} ({pctUsed}٪)</span>
                                <span className="text-emerald-300 font-sans">باقی‌مانده: {formatSize(remainingBytes)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-[11px] text-emerald-400">
                              شما از اشتراک بدون سقف حجم استفاده می‌کنید (مصرف تاکنون: {formatSize(usedQuota)})
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* CONNECTED DEVICES COUNT & DETAILS */}
                    {(() => {
                      const devCount = liveUserStats?.connectedDevicesCount ?? session.connectedDevicesCount ?? 1;
                      const devices = liveUserStats?.connectedDevices ?? session.connectedDevices ?? [];

                      return (
                        <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-900/40 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                              <span>دستگاه‌های متصل به این اکانت:</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowDevicesList(!showDevicesList)}
                              className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer hover:bg-cyan-900 transition-colors"
                            >
                              <span>{devCount} دستگاه فعال</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${showDevicesList ? 'rotate-180' : ''}`} />
                            </button>
                          </div>

                          {showDevicesList && (
                            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
                              {devices.length > 0 ? (
                                devices.map((d, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-slate-300 font-mono bg-slate-900/70 p-1.5 rounded-lg border border-slate-800">
                                    <div className="flex items-center gap-1.5">
                                      <Smartphone className="w-3 h-3 text-slate-400" />
                                      <span>{d.address}</span>
                                    </div>
                                    <span className="text-slate-500 text-[10px]">{d.macAddress || 'WiFi'}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-slate-400 text-[11px]">دستگاه فعلی: {session.ip}</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* EXTRA DETAILS & SELF-SERVICE PASSWORD CHANGE */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs border-t border-emerald-800/40">
                      <div>
                        <span className="text-slate-400 block text-[11px]">آی‌پی این دستگاه:</span>
                        <span className="font-mono text-white text-xs">{session.ip}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">مدت اتصال:</span>
                        <span className="font-mono text-white text-xs tabular-nums">{session.uptime}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangePasswordOpen(true);
                          setChangePassStatus(null);
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:border-amber-400/60"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        <span>تغییر کلمه عبور اینترنت (رمز اکانت)</span>
                      </button>
                    </div>
                  </div>

                  {/* RECHARTS DATA CONSUMPTION TREND */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        <span>روند مصرف دیتای نشست فعلی</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px]">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          دریافت
                        </span>
                        <span className="flex items-center gap-1 text-sky-400">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          ارسال
                        </span>
                      </div>
                    </div>

                    <div className="h-32 w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={consumptionTrend} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
                          <defs>
                            <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis
                            dataKey="time"
                            tick={{ fill: '#64748b', fontSize: 9 }}
                            axisLine={{ stroke: '#334155' }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: '#64748b', fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                            unit="M"
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1" dir="rtl">
                                    <span className="font-bold text-slate-300 block text-[10px]">{label}</span>
                                    <div className="flex items-center justify-between gap-4 text-emerald-400">
                                      <span className="flex items-center gap-1 text-[11px]">
                                        <ArrowDown className="w-3 h-3" />
                                        دریافت:
                                      </span>
                                      <span className="font-mono font-bold text-[11px]">{payload[0]?.value} MB</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 text-sky-400">
                                      <span className="flex items-center gap-1 text-[11px]">
                                        <ArrowUp className="w-3 h-3" />
                                        ارسال:
                                      </span>
                                      <span className="font-mono font-bold text-[11px]">{payload[1]?.value} MB</span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="download"
                            name="دریافت"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#downloadGradient)"
                          />
                          <Area
                            type="monotone"
                            dataKey="upload"
                            name="ارسال"
                            stroke="#0ea5e9"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#uploadGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <span>مجموع مصرف این نشست:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {(totalDownloadMB + totalUploadMB).toFixed(2)} MB
                      </span>
                    </div>
                  </div>

                  {/* LIGHTWEIGHT SPEED & LATENCY TEST TO MIKROTIK GATEWAY */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Gauge className="w-4 h-4 text-amber-400" />
                        <span>تست سرعت و کیفیت اتصال به میکروتیک</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Gateway: {config.routerIp}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">پینگ (Ping)</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {pingMs !== null ? `${pingMs} ms` : '-'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">نوسان (Jitter)</span>
                        <span className="text-xs font-mono font-bold text-sky-400">
                          {jitterMs !== null ? `${jitterMs} ms` : '-'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">پهنای باند محلی</span>
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {downloadMbps !== null ? `${downloadMbps} Mbps` : '-'}
                        </span>
                      </div>
                    </div>

                    {speedTestRunning && (
                      <div className="space-y-1">
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                            style={{ width: `${speedTestProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-amber-400 block text-center">
                          {speedTestPhase === 'ping' ? 'در حال سنجش تاخیر گیت‌وی...' : 'در حال محاسبه پهنای باند شبکه...'}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={runSpeedTest}
                      disabled={speedTestRunning}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${speedTestRunning ? 'animate-spin text-amber-400' : ''}`} />
                      <span>{speedTestRunning ? 'در حال آزمایش ارتباط...' : 'شروع تست سرعت و تاخیر به میکروتیک'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    اینترنت روی دستگاه شما فعال است. شما می‌توانید همزمان از چت لوکال، رزرو اتاق و وب‌گردی استفاده نمایید.
                  </div>

                  <button
                    onClick={onLogout}
                    className="w-full py-2.5 bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>قطع اتصال اینترنت میکروتیک (Logout)</span>
                  </button>
                </div>
              ) : (
                /* LOGIN FORM STATE */
                <div className="space-y-4">
                  {/* Segmented Control */}
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setLoginTab('user'); setErrorMsg(null); }}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        loginTab === 'user'
                          ? 'bg-slate-800 text-amber-400 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>اشتراک کاربری</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setLoginTab('voucher'); setErrorMsg(null); }}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        loginTab === 'voucher'
                          ? 'bg-slate-800 text-amber-400 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>کارت ووچر</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setLoginTab('trial'); setErrorMsg(null); }}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        loginTab === 'trial'
                          ? 'bg-slate-800 text-amber-400 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>تست رایگان</span>
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Tab 1: Username & Password */}
                  {loginTab === 'user' && (
                    <form onSubmit={handleUserLogin} className="space-y-3">
                      <div className="space-y-1 text-right">
                        <label className="text-xs font-medium text-slate-300">نام کاربری یا شناسه اشتراک:</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="مثال: ali_ahmadi یا 104"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="space-y-1 text-right">
                        <label className="text-xs font-medium text-slate-300">کلمه عبور:</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50 mt-1"
                      >
                        {loading ? 'در حال برقراری اتصال...' : 'اتصال به اینترنت میکروتیک'}
                      </button>
                    </form>
                  )}

                  {/* Tab 2: Voucher PIN */}
                  {loginTab === 'voucher' && (
                    <form onSubmit={handleVoucherLogin} className="space-y-3">
                      <div className="space-y-1 text-right">
                        <label className="text-xs font-medium text-slate-300">کد ووچر یا کارت روزانه:</label>
                        <input
                          type="text"
                          value={voucher}
                          onChange={(e) => setVoucher(e.target.value)}
                          placeholder="مثال: DAY-8291"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-[11px] text-slate-500">کد درج شده روی فیش روزانه</span>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 mt-1"
                      >
                        {loading ? 'در حال بررسی ووچر...' : 'فعال‌سازی پاس روزانه'}
                      </button>
                    </form>
                  )}

                  {/* Tab 3: Free Trial */}
                  {loginTab === 'trial' && (
                    <div className="space-y-3 text-center">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                        دسترسی موقت مهمان ({config.trialDurationMinutes} دقیقه) برای اعضای تازه‌وارد بدون نیاز به ثبت‌نام قبلی.
                      </div>

                      <button
                        type="button"
                        onClick={handleTrialLogin}
                        disabled={loading}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        {loading ? 'در حال دریافت مجوز...' : 'اتصال ۱ کلیکه مهمان (Free Trial)'}
                      </button>
                    </div>
                  )}

                  {/* Hidden standard MikroTik form for direct router submission */}
                  <form
                    id="mikrotik-direct-form"
                    action={`http://${config.routerIp}/login`}
                    method="post"
                    className="hidden"
                  >
                    <input type="hidden" name="dst" value={`http://${config.serverLocalIp}:${config.serverPort}`} />
                    <input type="hidden" name="popup" value="true" />
                    <input type="hidden" name="username" value={username} />
                    <input type="hidden" name="password" value={password} />
                  </form>
                </div>
              )}

              {/* Network Details Accordion / Footer */}
              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>آی‌پی کلاینت شما:</span>
                  <span className="font-mono text-amber-300 font-bold">{clientIp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>درگاه روتر میکروتیک:</span>
                  <span className="font-mono text-slate-300">{config.routerIp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>وضعیت سرور چت داخلی:</span>
                  <span className="text-emerald-400 font-semibold">آنلاین (بدون نیاز به نت)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Space Live Info Widget */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>وضعیت زنده فضای کار امروز</span>
              <span className="text-[11px] text-amber-400 font-mono">{onlineCount} همکار حاضر</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  اسپرسو بار:
                </span>
                <span className="text-slate-200 truncate max-w-[170px]">{espressoStatus || 'آماده'}</span>
              </div>

              {urgentNotice && (
                <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-200">
                  <span className="font-bold text-amber-400 block mb-0.5">اطلاعیه مدیریت:</span>
                  {urgentNotice.content}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* COLUMN 2 (8/12): INTEGRATED COWORKING LIVE COMMUNITY CHAT */}
        {/* ========================================================= */}
        <section
          className={`lg:col-span-7 xl:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col min-h-[660px] overflow-hidden ${
            mobileTab === 'login' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Channel Bar / Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto text-xs">
              {channels.map((ch) => {
                const isActive = ch.id === activeChannelId;
                return (
                  <button
                    key={ch.id}
                    onClick={() => onSelectChannel(ch.id)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5" />
                    <span>{ch.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Current user badge & checkin trigger */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={onOpenCheckIn}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
              >
                <MapPin className="w-3 h-3 text-amber-400" />
                <span className="font-semibold text-white">{currentMember.name}</span>
                <span className="text-slate-500">({currentMember.desk})</span>
              </button>
            </div>
          </div>

          {/* Active Channel Info */}
          <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <div className="truncate">
              <span className="font-bold text-white ml-2">#{activeChannel?.name || 'عمومی و لابی'}</span>
              <span className="text-slate-500">{activeChannel?.description || ''}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono shrink-0">
              {channelMessages.length} پیام
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 max-h-[500px]">
            {channelMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
                <Coffee className="w-8 h-8 text-slate-600" />
                <div className="text-xs font-medium text-slate-300">پیامی در این کانال وجود ندارد</div>
                <div className="text-[11px] text-slate-500">
                  سلام دهید و اولین پیام را در فضای کار به اشتراک بگذارید!
                </div>
              </div>
            ) : (
              <>
                {!showAllMessages && channelMessages.length > 100 && (
                  <div className="text-center pb-2">
                    <button
                      type="button"
                      onClick={() => setShowAllMessages(true)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg cursor-pointer"
                    >
                      نمایش پیام‌های قبلی ({channelMessages.length - 100} پیام قدیمی‌تر)
                    </button>
                  </div>
                )}
                {visibleMessages.map((msg) => (
                  <ChatMessageRow
                    key={msg.id}
                    msg={msg}
                    isCurrentUser={msg.sender.id === currentMember.id}
                    currentMemberId={currentMember.id}
                    onToggleReaction={onToggleReaction}
                  />
                ))}
              </>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Tag Bar & Composer */}
          <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-slate-500 whitespace-nowrap">برچسب سریع:</span>
              <button
                type="button"
                onClick={() => addTagToChat('#سوال_فنی')}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 whitespace-nowrap cursor-pointer"
              >
                #سوال_فنی
              </button>
              <button
                type="button"
                onClick={() => addTagToChat('#سفارش_ناهار')}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 whitespace-nowrap cursor-pointer"
              >
                #سفارش_ناهار 🥗
              </button>
              <button
                type="button"
                onClick={() => addTagToChat('#کابل_مانیتور')}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 whitespace-nowrap cursor-pointer"
              >
                #کابل_امانت
              </button>
              <button
                type="button"
                onClick={() => addTagToChat('#قهوه')}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 whitespace-nowrap cursor-pointer"
              >
                #قهوه ☕
              </button>
            </div>

            <form onSubmit={handleSendChatMessage} className="flex gap-2 items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`پیام در #${activeChannel?.name || 'عمومی و لابی'}...`}
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSending}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-40 shrink-0 flex items-center justify-center"
              >
                <Send className="w-4 h-4 rtl:-rotate-90" />
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* MODAL: SELF-SERVICE CHANGE PASSWORD */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90">
          <form
            onSubmit={handleChangePassword}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>تغییر کلمه عبور اینترنت ({session.username})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {changePassStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  changePassStatus.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                }`}
              >
                {changePassStatus.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{changePassStatus.message}</span>
              </div>
            )}

            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-slate-300">کلمه عبور فعلی (در صورت داشتن رمز قبلی):</label>
              <input
                type="password"
                value={currentPassInput}
                onChange={(e) => setCurrentPassInput(e.target.value)}
                placeholder="رمز قبلی (اختیاری اگر قبلاً رمزی نداشتید)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-slate-300">کلمه عبور جدید (حداقل ۴ کاراکتر):</label>
              <input
                type="password"
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                placeholder="رمز عبور جدید"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-slate-300">تکرار کلمه عبور جدید:</label>
              <input
                type="password"
                value={confirmPassInput}
                onChange={(e) => setConfirmPassInput(e.target.value)}
                placeholder="تکرار رمز عبور جدید"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={changePassLoading}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-all shadow-md"
              >
                {changePassLoading ? 'در حال ثبت در روتر...' : 'ثبت کلمه عبور جدید'}
              </button>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="py-2.5 px-4 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer hover:bg-slate-700"
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
