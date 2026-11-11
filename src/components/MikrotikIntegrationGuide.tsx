import React, { useState, useEffect } from 'react';
import {
  Router,
  Copy,
  Check,
  Download,
  Terminal,
  Settings,
  ShieldCheck,
  FileCode,
  Laptop,
  Wifi,
  ExternalLink,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { HotspotConfig } from '../types';

interface MikrotikIntegrationGuideProps {
  config: HotspotConfig;
  onUpdateConfig: (newConfig: Partial<HotspotConfig>) => Promise<void>;
  clientIp: string;
}

export const MikrotikIntegrationGuide: React.FC<MikrotikIntegrationGuideProps> = ({
  config,
  onUpdateConfig,
  clientIp,
}) => {
  const [routerIp, setRouterIp] = useState(config.routerIp);
  const [serverLocalIp, setServerLocalIp] = useState(config.serverLocalIp);
  const [serverPort, setServerPort] = useState(config.serverPort);
  const [hotspotName, setHotspotName] = useState(config.hotspotName);
  const [walledGardenDomain, setWalledGardenDomain] = useState(config.walledGardenDomain);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [activeCodeTab, setActiveCodeTab] = useState<'cli' | 'login' | 'status' | 'alogin'>('cli');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [templates, setTemplates] = useState<{
    loginHtml: string;
    statusHtml: string;
    mikrotikCli: string;
    serverUrl: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/hotspot/mikrotik-files')
      .then((res) => res.json())
      .then((data) => setTemplates(data))
      .catch((err) => console.error(err));
  }, [config]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateConfig({
        routerIp,
        serverLocalIp,
        serverPort: Number(serverPort),
        hotspotName,
        walledGardenDomain,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCodeContent = () => {
    if (!templates) return '// در حال دریافت قالب‌ها...';
    switch (activeCodeTab) {
      case 'cli':
        return templates.mikrotikCli;
      case 'login':
        return templates.loginHtml;
      case 'status':
        return templates.statusHtml;
      case 'alogin':
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="2; url=http://${serverLocalIp}:${serverPort}">
  <title>اتصال با موفقیت برقرار شد</title>
  <style>
    body { background: #0f172a; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; direction: rtl; }
    .card { background: #1e293b; padding: 24px; border-radius: 16px; text-align: center; max-width: 400px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>اتصال به اینترنت برقرار شد!</h2>
    <p>در حال انتقال به چت و پورتال همکار هاب...</p>
    <a href="http://${serverLocalIp}:${serverPort}" style="color: #f59e0b; text-decoration: none; font-weight: bold;">ورود مستقیم به چت</a>
  </div>
</body>
</html>`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Introduction Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Router className="w-4 h-4" />
            <span>معماری ادغام با کپتیو پورتال میکروتیک (MikroTik Hotspot + Walled Garden)</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            چگونه این چت لوکال با صفحه لاگین وای‌فای میکروتیک یکی می‌شود؟
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            در میکروتیک قابلیتی به نام <span className="font-mono text-amber-300">Walled Garden</span> وجود دارد. با افزودن آی‌پی این سرور به وال‌گاردن، هر کاربری که به وای‌فای وصل می‌شود (حتی قبل از زدن یوزرنیم/پسورد اینترنت) بدون مسدود شدن می‌تواند این برنامه را باز کند، در چت لوکال پیام بدهد و مستقیماً از داخل همین صفحه، فرم لاگین اینترنت را سابمیت کند.
          </p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 shrink-0 min-w-[220px]">
          <div className="text-slate-400">آی‌پی شناسایی‌شده شما:</div>
          <div className="font-mono text-amber-400 font-bold text-sm">{clientIp}</div>
          <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-800">
            درگاه میکروتیک فعلی: <span className="font-mono text-slate-300">{config.routerIp}</span>
          </div>
        </div>
      </div>

      {/* Network Configuration Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            <span>تنظیمات شبکه و آدرس روتر میکروتیک شما</span>
          </h3>
          {saveSuccess && (
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" />
              تنظیمات ذخیره شد
            </span>
          )}
        </div>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-medium text-slate-300">آدرس آی‌پی روتر میکروتیک (Router IP):</label>
            <input
              type="text"
              value={routerIp}
              onChange={(e) => setRouterIp(e.target.value)}
              placeholder="192.168.88.1"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
            <span className="text-[11px] text-slate-500">پیش‌فرض میکروتیک: 192.168.88.1</span>
          </div>

          <div className="space-y-1.5 text-right">
            <label className="text-xs font-medium text-slate-300">آدرس آی‌پی لوکال این سرور چت (Server Local IP):</label>
            <input
              type="text"
              value={serverLocalIp}
              onChange={(e) => setServerLocalIp(e.target.value)}
              placeholder="192.168.88.254"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
            <span className="text-[11px] text-slate-500">آی‌پی سیستم/سروری که برنامه روی آن اجراست</span>
          </div>

          <div className="space-y-1.5 text-right">
            <label className="text-xs font-medium text-slate-300">پورت سرور (Port):</label>
            <input
              type="number"
              value={serverPort}
              onChange={(e) => setServerPort(Number(e.target.value))}
              placeholder="3000"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
            <span className="text-[11px] text-slate-500">پیش‌فرض: 3000</span>
          </div>

          <div className="space-y-1.5 text-right">
            <label className="text-xs font-medium text-slate-300">نام شبکه وای‌فای (Hotspot Name / SSID):</label>
            <input
              type="text"
              value={hotspotName}
              onChange={(e) => setHotspotName(e.target.value)}
              placeholder="فضای کار اشتراکی همکار"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1.5 text-right">
            <label className="text-xs font-medium text-slate-300">دامنه لوکال دی‌ان‌اس (اختیاری):</label>
            <input
              type="text"
              value={walledGardenDomain}
              onChange={(e) => setWalledGardenDomain(e.target.value)}
              placeholder="hub.local"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
            <span className="text-[11px] text-slate-500">مثال: hub.local یا portal.lan</span>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'در حال ذخیره...' : 'ذخیره و تولید مجدد اسکریپت‌ها'}
            </button>
          </div>
        </form>
      </div>

      {/* Two Integration Architecture Paths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: Modern Walled Garden Embedding */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                ۱
              </span>
              <h3 className="text-sm font-bold text-white">
                روش اول: قرار دادن سرور در Walled Garden (پیشنهادی)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              در این روش، کافی است دستور تک‌خطی Walled Garden را در ترمینال میکروتیک اجرا کنید. از آن لحظه به بعد:
            </p>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed pr-2">
              <li>کاربران متصل به وای‌فای، به محض باز کردن صفحه به سرور متصل می‌شوند.</li>
              <li>چت، معرفی اعضا و منوی کافه بدون نیاز به اینترنت کار می‌کند.</li>
              <li>با فشردن دکمه «ورود به اینترنت میکروتیک»، به صورت خودکار به درگاه هات‌اسپات متصل می‌شوند.</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveCodeTab('cli')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Terminal className="w-4 h-4" />
              <span>مشاهده و کپی دستور ترمینال میکروتیک</span>
            </button>
          </div>
        </div>

        {/* Method 2: Template Files Upload into MikroTik Files/hotspot */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                ۲
              </span>
              <h3 className="text-sm font-bold text-white">
                روش دوم: جایگزینی فایل‌های login.html میکروتیک
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              اگر می‌خواهید صفحه کپتیو پورتال پیش‌فرض میکروتیک (صفحه‌ای که در گوشی‌ها هنگام اتصال به وای‌فای خودبه‌خود بالا می‌آید) با چت لوکال ادغام شود:
            </p>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed pr-2">
              <li>فایل‌های آماده <span className="font-mono text-slate-200">login.html</span> و <span className="font-mono text-slate-200">status.html</span> را دانلود کنید.</li>
              <li>در نرم‌افزار Winbox وارد منوی <span className="text-slate-200 font-medium">Files &rarr; hotspot</span> شده و فایل‌ها را Paste کنید.</li>
              <li>صفحه لاگین حاوی بخش چت داخلی و لینک مستقیم به فضای همکاران خواهد بود.</li>
            </ul>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('login')}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FileCode className="w-4 h-4" />
              <span>مشاهده قالب login.html</span>
            </button>
            <button
              onClick={() => templates && downloadFile(templates.loginHtml, 'login.html')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
              title="دانلود فایل login.html"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Code Viewer & Interactive Copy Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
        {/* Header Tabs */}
        <div className="px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveCodeTab('cli')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeCodeTab === 'cli'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>دستورات ترمینال میکروتیک (Terminal CLI)</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('login')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeCodeTab === 'login'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>login.html (کپتیو پورتال)</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('status')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeCodeTab === 'status'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>status.html (وضعیت اتصال)</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('alogin')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeCodeTab === 'alogin'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>alogin.html (هدایت پس از لاگین)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(getCodeContent(), activeCodeTab)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === activeCodeTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی کدها</span>
                </>
              )}
            </button>

            {activeCodeTab !== 'cli' && (
              <button
                onClick={() => downloadFile(getCodeContent(), `${activeCodeTab}.html`)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود فایل</span>
              </button>
            )}
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed select-all" dir="ltr">
          <pre>{getCodeContent()}</pre>
        </div>
      </div>

      {/* Step-by-Step Practical Winbox Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <span>راهنمای گام‌به‌گام پیاده‌سازی روی میکروتیک (Winbox / WebFig)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="text-amber-400 font-bold text-xs">گام اول: ثابت کردن آی‌پی سرور</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              در Winbox به منوی <span className="font-mono text-slate-200">IP &rarr; DHCP Server &rarr; Leases</span> بروید، سرور چت را پیدا کرده و روی <span className="font-medium text-amber-300">Make Static</span> کلیک کنید تا آی‌پی سرور تغییر نکند.
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="text-amber-400 font-bold text-xs">گام دوم: اجرای دستور Walled Garden</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              در Winbox روی <span className="font-mono text-slate-200">New Terminal</span> کلیک کنید و دستورات بخش اول را کپی و Paste فرمایید. با این کار ترافیک پورت ۳۰۰۰ سرور از احراز هویت هات‌اسپات معاف می‌شود.
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="text-amber-400 font-bold text-xs">گام سوم: تست اتصال کلاینت‌ها</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              با گوشی یا لپ‌تاپ به وای‌فای وصل شوید. بدون وارد کردن یوزرنیم اینترنت، آدرس <span className="font-mono text-amber-300">http://{serverLocalIp}:{serverPort}</span> را باز کنید. چت لوکال آماده استفاده است!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
