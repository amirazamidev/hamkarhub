import React from 'react';
import { Wifi, Users, Coffee, UtensilsCrossed, CheckCircle2, Shield, ChefHat } from 'lucide-react';
import { HotspotSession } from '../types';

export type MainTab = 'portal' | 'members' | 'cafe' | 'barista' | 'amenities' | 'mikrotik' | 'admin';

interface HeaderProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  session: HotspotSession;
  onOpenHotspotModal: () => void;
  onlineCount: number;
  cartCount?: number;
  activeOrdersCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  session,
  onOpenHotspotModal,
  onlineCount,
  cartCount = 0,
  activeOrdersCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 lg:gap-8 h-16">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          همکار هاب
        </span>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-3.5 lg:gap-5 text-xs lg:text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('portal')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer pb-1 ${
              activeTab === 'portal'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>پورتال و چت</span>
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
            <span className="tabular-nums">حاضرین ({onlineCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('cafe')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer pb-1 ${
              activeTab === 'cafe'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span className="tabular-nums">
              سفارش کافه{cartCount > 0 ? ` (${cartCount})` : ''}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('barista')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer pb-1 ${
              activeTab === 'barista'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span className="tabular-nums">
              پنل کافه{activeOrdersCount > 0 ? ` (${activeOrdersCount})` : ''}
            </span>
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
            <span>امکانات</span>
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
            <span>ادمین</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenHotspotModal}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
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
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-900 py-1.5 px-1 text-[10px]">
        <button
          onClick={() => setActiveTab('portal')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded ${
            activeTab === 'portal' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>پورتال</span>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded ${
            activeTab === 'members' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>حاضرین</span>
        </button>
        <button
          onClick={() => setActiveTab('cafe')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded ${
            activeTab === 'cafe' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span className="tabular-nums">سفارش{cartCount > 0 ? `(${cartCount})` : ''}</span>
        </button>
        <button
          onClick={() => setActiveTab('barista')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded ${
            activeTab === 'barista' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span className="tabular-nums">باریستا{activeOrdersCount > 0 ? `(${activeOrdersCount})` : ''}</span>
        </button>
        <button
          onClick={() => setActiveTab('amenities')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded ${
            activeTab === 'amenities' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>امکانات</span>
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded ${
            activeTab === 'admin' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>ادمین</span>
        </button>
      </div>
    </header>
  );
};
