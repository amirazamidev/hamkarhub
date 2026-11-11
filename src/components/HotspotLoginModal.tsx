import React, { useState } from 'react';
import { X, Wifi, ShieldCheck, Key, Ticket, Sparkles, LogOut, ExternalLink, AlertCircle } from 'lucide-react';
import { HotspotConfig, HotspotSession } from '../types';

interface HotspotLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HotspotConfig;
  session: HotspotSession;
  clientIp: string;
  onLoginSuccess: (session: HotspotSession) => void;
  onLogout: () => void;
}

export const HotspotLoginModal: React.FC<HotspotLoginModalProps> = ({
  isOpen,
  onClose,
  config,
  session,
  clientIp,
  onLoginSuccess,
  onLogout,
}) => {
  const [tab, setTab] = useState<'user' | 'voucher' | 'trial'>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [voucher, setVoucher] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('لطفاً نام کاربری را وارد نمایید');
      return;
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
          ip: clientIp || '192.168.88.102',
          uptime: '00:00:01',
          timeLeft: 'نامحدود (عضو فعال)',
          bytesIn: '3.4 MB',
          bytesOut: '1.1 MB',
          loginTime: Date.now(),
        });
        onClose();
      } else {
        setErrorMsg(data.error || 'خطا در احراز هویت میکروتیک');
      }
    } catch {
      setErrorMsg('عدم برقراری ارتباط با سرویس هات‌اسپات');
    } finally {
      setLoading(false);
    }
  };

  const handleVoucherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucher.trim()) {
      setErrorMsg('لطفاً کد ووچر را وارد فرمایید');
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
          ip: clientIp || '192.168.88.102',
          uptime: '00:00:01',
          timeLeft: '۸ ساعت (پاس روزانه)',
          bytesIn: '5.2 MB',
          bytesOut: '800 KB',
          loginTime: Date.now(),
        });
        onClose();
      } else {
        setErrorMsg(data.error || 'کد ووچر نامعتبر یا منقضی شده است');
      }
    } catch {
      setErrorMsg('خطا در بررسی ووچر میکروتیک');
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
          username: 'کاربر آزمایشی (Trial)',
          ip: clientIp || '192.168.88.102',
          uptime: '00:00:01',
          timeLeft: `${config.trialDurationMinutes} دقیقه`,
          bytesIn: '1.2 MB',
          bytesOut: '450 KB',
          loginTime: Date.now(),
        });
        onClose();
      }
    } catch {
      setErrorMsg('امکان فعال‌سازی دسترسی آزمایشی وجود ندارد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">درگاه کپتیو پورتال میکروتیک</h2>
              <p className="text-xs text-slate-400">اتصال به اینترنت فضای کار اشتراکی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {session.isConnected ? (
            /* Connected state */
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    ارتباط اینترنت میکروتیک فعال است
                  </span>
                  <span className="font-mono text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded">
                    {session.username}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-emerald-800/40">
                  <div>
                    <span className="text-slate-400 block">آی‌پی اختصاص‌یافته:</span>
                    <span className="font-mono text-slate-200">{session.ip}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">مدت اتصال جاری:</span>
                    <span className="font-mono text-slate-200 tabular-nums">{session.uptime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">اعتبار زمانی باقی‌مانده:</span>
                    <span className="text-emerald-300 font-medium">{session.timeLeft}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">مصرف داده (دانلود / آپلود):</span>
                    <span className="font-mono text-slate-200">{session.bytesIn} / {session.bytesOut}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-slate-400 leading-relaxed">
                  روتر میکروتیک شما به آدرس <span className="font-mono text-slate-200">{config.routerIp}</span> متصل است. در صورت تمایل می‌توانید نشست اینترنت خود را قطع نمایید یا به چت همکاران ادامه دهید.
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onLogout}
                    className="flex-1 py-2.5 px-4 bg-rose-600/90 hover:bg-rose-500 text-white font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>خروج و قطع اینترنت میکروتیک</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl transition-all cursor-pointer"
                  >
                    بستن پنجره
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Login Form */
            <div className="space-y-5">
              {/* Login Method Segmented Control */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setTab('user'); setErrorMsg(null); }}
                  className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    tab === 'user'
                      ? 'bg-slate-800 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>عضویت ماهانه</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setTab('voucher'); setErrorMsg(null); }}
                  className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    tab === 'voucher'
                      ? 'bg-slate-800 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5 text-amber-400" />
                  <span>ووچر روزانه</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setTab('trial'); setErrorMsg(null); }}
                  className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    tab === 'trial'
                      ? 'bg-slate-800 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>مهمان موقت</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Tab 1: Regular User & Password */}
              {tab === 'user' && (
                <form onSubmit={handleUserLogin} className="space-y-4">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-medium text-slate-300">نام کاربری یا شناسه اشتراک</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="مثال: ali_ahmadi یا 104"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition-colors font-mono"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">کلمه عبور</label>
                      <span className="text-[11px] text-slate-500">دریافت شده از پذیرش</span>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'در حال برقراری اتصال با میکروتیک...' : 'ورود و فعال‌سازی اینترنت'}
                  </button>
                </form>
              )}

              {/* Tab 2: Voucher PIN */}
              {tab === 'voucher' && (
                <form onSubmit={handleVoucherLogin} className="space-y-4">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-medium text-slate-300">کد ووچر یا کارت عبور روزانه</label>
                    <input
                      type="text"
                      value={voucher}
                      onChange={(e) => setVoucher(e.target.value)}
                      placeholder="مثال: DAY-7392"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition-colors font-mono tracking-wider uppercase"
                      autoFocus
                    />
                    <p className="text-[11px] text-slate-400 pt-1">
                      کد عبور چاپ‌شده روی فیش ورودی یا پیامک‌شده توسط رزرو روزانه
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'در حال اعتبارسنجی ووچر...' : 'فعال‌سازی پاس روزانه'}
                  </button>
                </form>
              )}

              {/* Tab 3: Free Trial */}
              {tab === 'trial' && (
                <div className="space-y-4 text-center">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                    <h3 className="text-sm font-bold text-white">دسترسی موقت مهمان ({config.trialDurationMinutes} دقیقه)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      اگر به تازگی وارد فضا شده‌اید و کارت اشتراک ندارید، می‌توانید با یک کلیک از دسترسی اینترنت آزمایشی رایگان استفاده کنید.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTrialLogin}
                    disabled={loading}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'در حال صدور مجوز ورود...' : 'اتصال ۱ کلیکه مهمان (Free Trial)'}
                  </button>
                </div>
              )}

              {/* Informational note about Walled Garden */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  نکته: حتی قبل از فعال‌سازی اینترنت، سرور چت داخلی و تمام بخش‌های گفتگوی همکار هاب برای دستگاه شما کاملاً آزاد و رایگان در دسترس است.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
