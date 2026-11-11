import React from 'react';
import { Wifi, Users, Coffee, Router, CheckCircle2, Shield } from 'lucide-react';
import { HotspotSession } from '../types';

interface HeaderProps {
  activeTab: 'portal' | 'members' | 'amenities' | 'mikrotik' | 'admin';
  setActiveTab: (tab: 'portal' | 'members' | 'amenities' | 'mikrotik' | 'admin') => void;
  session: HotspotSession;
  onOpenHotspotModal: () => void;
  onlineCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  session,
  onOpenHotspotModal,
  onlineCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 h-16">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
            همـ
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            همکار هاب
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs lg:text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('portal')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer pb-1 ${
              activeTab === 'portal'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>کپتیو پورتال و چت</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer pb-1 ${
              activeTab === 'members'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>حاضرین ({onlineCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('amenities')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer pb-1 ${
              activeTab === 'amenities'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>امکانات و کافه</span>
          </button>

          <button
            onClick={() => setActiveTab('mikrotik')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer pb-1 ${
              activeTab === 'mikrotik'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Router className="w-4 h-4" />
            <span>راهنمای میکروتیک</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer pb-1 ${
              activeTab === 'admin'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>پنل ادمین</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenHotspotModal}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
              session.isConnected
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-sm shadow-amber-500/20'
            }`}
          >
            {session.isConnected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">اینترنت فعال:</span>
                <span className="font-mono text-emerald-200">{session.username}</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                <span>ورود به اینترنت</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav tabs */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-900/95 py-2 px-1 text-[11px]">
        <button
          onClick={() => setActiveTab('portal')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded ${
            activeTab === 'portal' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Wifi className="w-4 h-4" />
          <span>پورتال و چت</span>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded ${
            activeTab === 'members' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>حاضرین</span>
        </button>
        <button
          onClick={() => setActiveTab('amenities')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded ${
            activeTab === 'amenities' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>امکانات</span>
        </button>
        <button
          onClick={() => setActiveTab('mikrotik')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded ${
            activeTab === 'mikrotik' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Router className="w-4 h-4" />
          <span>میکروتیک</span>
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded ${
            activeTab === 'admin' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>ادمین</span>
        </button>
      </div>
    </header>
  );
};
