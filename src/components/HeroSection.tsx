import React from 'react';
import { Wifi, MessageSquare, Coffee, ShieldCheck, ArrowLeft, Radio } from 'lucide-react';
import { HotspotConfig, HotspotSession } from '../types';

interface HeroSectionProps {
  config: HotspotConfig;
  session: HotspotSession;
  clientIp: string;
  onlineCount: number;
  onOpenChat: () => void;
  onOpenHotspotModal: () => void;
  onOpenCheckIn: () => void;
  espressoStatus: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  config,
  session,
  clientIp,
  onlineCount,
  onOpenChat,
  onOpenHotspotModal,
  onOpenCheckIn,
  espressoStatus,
}) => {
  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column (Persian Right): Headline & Value Props */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium tracking-wide">
              <Radio className="w-4 h-4 animate-pulse text-amber-400" />
              <span>شبکه محلی و کپتیو پورتال فضای کار اشتراکی</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400 font-mono">SSID: {config.hotspotName}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
              ارتباط زنده با همکاران در فضا،
              <span className="block text-amber-400 mt-1">همگام با ورود به اینترنت میکروتیک</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              به محض اتصال به وای‌فای فضای کار اشتراکی، بدون نیاز به اینترنت می‌توانید در چت لوکال با بقیه اعضا گفتگو کنید، از وضعیت اتاق جلسات و قهوه‌ساز باخبر شوید و از همین صفحه وارد اینترنت میکروتیک شوید.
            </p>

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenChat}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>ورود به چت لابی</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenHotspotModal}
                className={`px-4 py-2.5 text-sm font-medium rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                  session.isConnected
                    ? 'bg-slate-800/80 border-slate-700 text-emerald-400 hover:bg-slate-800'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <Wifi className="w-4 h-4 text-amber-400" />
                <span>{session.isConnected ? 'مدیریت اتصال اینترنت' : 'لاگین کپتیو پورتال'}</span>
              </button>

              <button
                onClick={onOpenCheckIn}
                className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                + ثبت شماره میز من در فضا
              </button>
            </div>
          </div>

          {/* Right Column: Visual Anchor with Real Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
              <img
                src="/src/assets/images/coworking_space_hero_1794330975447.jpg"
                alt="فضای کار اشتراکی همکار هاب"
                className="w-full h-64 sm:h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              
              {/* Overlay card */}
              <div className="absolute bottom-4 right-4 left-4 p-3.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-medium text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    سرور لوکال شبکه فعال است
                  </span>
                  <span className="text-slate-400 font-mono">Walled Garden: OK</span>
                </div>
                <div className="text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span>آی‌پی دستگاه شما: <span className="font-mono text-amber-300">{clientIp}</span></span>
                  <span>روتر: <span className="font-mono text-slate-300">{config.routerIp}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Live Metric Strip */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1">
            <div className="text-slate-400">حاضرین آنلاین در فضا</div>
            <div className="text-lg font-bold text-white font-mono tabular-nums flex items-center gap-1.5">
              <span>{onlineCount}</span>
              <span className="text-xs font-normal text-slate-400">همکار فعال</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1">
            <div className="text-slate-400">وضعیت اینترنت کپتیو</div>
            <div className={`text-sm font-semibold flex items-center gap-1.5 ${session.isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              <Wifi className="w-3.5 h-3.5" />
              <span>{session.isConnected ? 'متصل به وب' : 'دسترسی لوکال / در انتظار ورود'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1">
            <div className="text-slate-400">وضعیت اسپرسو بار</div>
            <div className="text-sm font-medium text-slate-200 flex items-center gap-1.5 truncate">
              <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{espressoStatus || 'دان قهوه تازه آماده است'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1">
            <div className="text-slate-400">نوع هات‌اسپات میکروتیک</div>
            <div className="text-sm font-mono text-slate-300 flex items-center gap-1.5">
              <span>{config.loginMethod.toUpperCase()}</span>
              <span className="text-slate-500">·</span>
              <span>Trial {config.trialDurationMinutes}m</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
