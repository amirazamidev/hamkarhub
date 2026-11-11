import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { UnifiedPortalView } from './components/UnifiedPortalView';
import { MembersList } from './components/MembersList';
import { AmenitiesPanel } from './components/AmenitiesPanel';
import { MikrotikIntegrationGuide } from './components/MikrotikIntegrationGuide';
import { HotspotLoginModal } from './components/HotspotLoginModal';
import { CheckInModal } from './components/CheckInModal';
import { AdminPanel } from './components/AdminPanel';
import {
  Channel,
  ChatMessage,
  Member,
  HotspotConfig,
  SpaceAmenity,
  NoticeItem,
  HotspotSession,
  CafeteriaInfo,
  StaffMember,
} from './types';
import { Wifi, ShieldCheck, Radio } from 'lucide-react';

const STORAGE_KEY_USER = 'hamkar_user_profile';
const STORAGE_KEY_SESSION = 'hamkar_hotspot_session';

export default function App() {
  const [activeTab, setActiveTab] = useState<'portal' | 'members' | 'amenities' | 'mikrotik' | 'admin'>('portal');
  const [activeChannelId, setActiveChannelId] = useState<string>('general');

  // Modals
  const [isHotspotModalOpen, setIsHotspotModalOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  // Initial channels seed so view never renders with empty channels
  const INITIAL_CHANNELS: Channel[] = [
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
  ];

  // Data states
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [amenities, setAmenities] = useState<SpaceAmenity[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [cafeteria, setCafeteria] = useState<CafeteriaInfo>({
    title: 'قهوه تازه، چای دمی و گپ دوستانه',
    subtitle: 'کافه‌تریا و استراحت',
    description:
      'اسپرسوساز حرفه‌ای در آشپزخانه طبقه همکف در دسترس است. برای ثبت سفارش ناهار جمعی، هر روز تا ساعت ۱۲ در کانال #کافه-و-سفارش-ناهار پیام بگذارید تا از تخفیف ویژه همکاران استفاده کنید.',
    imageUrl: '/src/assets/images/coworking_lounge_cafe_1794330975977.jpg',
    footerNote: 'چای و دمنوش رایگان در تمام طول روز مهیاست.',
  });
  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: 'staff-sara',
      name: 'سارا رضایی',
      role: 'مدیر کامیونیتی فضای کار',
      desk: 'میز پذیرش - ورودی اصلی',
      quote:
        '«هر زمان نیاز به رزرو اتاق جلسات اختصاصی، کارت ورود روزانه، یا سوال در خصوص وای‌فای و اتصال میکروتیک داشتید، در خدمتتان هستم.»',
      avatar: '/src/assets/images/community_manager_avatar_1794330976206.jpg',
      status: 'حاضر در فضا',
    },
  ]);
  const [config, setConfig] = useState<HotspotConfig>({
    routerIp: '192.168.88.1',
    hotspotName: 'Hamkar Hub Wi-Fi',
    loginMethod: 'http-chap',
    serverLocalIp: '192.168.88.254',
    serverPort: 3000,
    trialDurationMinutes: 60,
    dailyVoucherPrefix: 'DAY-',
    walledGardenDomain: 'hub.local',
    welcomeNotice: 'به اینترنت و شبکه اختصاصی فضای کار اشتراکی خوش آمدید!',
  });
  const [clientIp, setClientIp] = useState<string>('192.168.88.102');

  // Current User Profile
  const [currentMember, setCurrentMember] = useState<Member>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: `guest-${Math.random().toString(36).substring(2, 8)}`,
      name: 'همکار مهمان',
      role: 'کاربر فضای کار',
      desk: 'میز اشتراکی شماره ۹',
      status: 'available',
      statusText: 'به شبکه متصل هستم',
      skills: ['توسعه‌دهنده'],
      lastSeen: Date.now(),
      isOnline: true,
    };
  });

  // Hotspot Connection Session
  const [session, setSession] = useState<HotspotSession>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      isConnected: false,
      username: '',
      ip: '192.168.88.102',
      uptime: '00:00:00',
      timeLeft: '',
      bytesIn: '0 KB',
      bytesOut: '0 KB',
    };
  });

  // Fetch initial data
  const loadData = useCallback(async () => {
    try {
      const [
        statusRes,
        channelsRes,
        messagesRes,
        membersRes,
        amenitiesRes,
        noticesRes,
        configRes,
        cafeteriaRes,
        staffRes,
      ] = await Promise.all([
        fetch('/api/status').then((r) => r.json()),
        fetch('/api/channels').then((r) => r.json()),
        fetch('/api/messages').then((r) => r.json()),
        fetch('/api/members').then((r) => r.json()),
        fetch('/api/amenities').then((r) => r.json()),
        fetch('/api/notices').then((r) => r.json()),
        fetch('/api/hotspot/config').then((r) => r.json()),
        fetch('/api/cafeteria').then((r) => r.json()),
        fetch('/api/staff').then((r) => r.json()),
      ]);

      if (statusRes.clientIp) setClientIp(statusRes.clientIp);
      if (channelsRes) setChannels(channelsRes);
      if (messagesRes) setMessages(messagesRes);
      if (membersRes) setMembers(membersRes);
      if (amenitiesRes) setAmenities(amenitiesRes);
      if (noticesRes) setNotices(noticesRes);
      if (configRes) setConfig(configRes);
      if (cafeteriaRes) setCafeteria(cafeteriaRes);
      if (staffRes) setStaff(staffRes);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Connect to SSE for zero-latency live updates on local Wi-Fi
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout>;

    function connectSSE() {
      eventSource = new EventSource('/api/chat/stream');

      eventSource.addEventListener('new_message', (e) => {
        try {
          const newMsg = JSON.parse(e.data);
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      });

      eventSource.addEventListener('reaction_updated', (e) => {
        try {
          const { messageId, reactions } = JSON.parse(e.data);
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
          );
        } catch (err) {
          console.error('SSE reaction parse error:', err);
        }
      });

      eventSource.addEventListener('member_updated', (e) => {
        try {
          const updated = JSON.parse(e.data);
          setMembers((prev) => {
            const index = prev.findIndex((m) => m.id === updated.id);
            if (index > -1) {
              const copy = [...prev];
              copy[index] = updated;
              return copy;
            }
            return [...prev, updated];
          });
        } catch (err) {
          console.error('SSE member parse error:', err);
        }
      });

      eventSource.addEventListener('amenity_updated', (e) => {
        try {
          const updated = JSON.parse(e.data);
          setAmenities((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
        } catch (err) {
          console.error('SSE amenity parse error:', err);
        }
      });

      eventSource.addEventListener('amenity_deleted', (e) => {
        try {
          const { id } = JSON.parse(e.data);
          setAmenities((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
          console.error('SSE amenity delete parse error:', err);
        }
      });

      eventSource.addEventListener('new_notice', (e) => {
        try {
          const newNotice = JSON.parse(e.data);
          setNotices((prev) => [newNotice, ...prev]);
        } catch (err) {
          console.error('SSE notice parse error:', err);
        }
      });

      eventSource.addEventListener('notice_deleted', (e) => {
        try {
          const { id } = JSON.parse(e.data);
          setNotices((prev) => prev.filter((n) => n.id !== id));
        } catch (err) {
          console.error('SSE notice delete parse error:', err);
        }
      });

      eventSource.addEventListener('cafeteria_updated', (e) => {
        try {
          const newCafeteria = JSON.parse(e.data);
          setCafeteria(newCafeteria);
        } catch (err) {
          console.error('SSE cafeteria parse error:', err);
        }
      });

      eventSource.addEventListener('staff_updated', (e) => {
        try {
          const newStaff = JSON.parse(e.data);
          setStaff(newStaff);
        } catch (err) {
          console.error('SSE staff parse error:', err);
        }
      });

      eventSource.addEventListener('channel_created', (e) => {
        try {
          const newChannel = JSON.parse(e.data);
          setChannels((prev) => [...prev, newChannel]);
        } catch (err) {
          console.error('SSE channel created parse error:', err);
        }
      });

      eventSource.addEventListener('channel_updated', (e) => {
        try {
          const updated = JSON.parse(e.data);
          setChannels((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        } catch (err) {
          console.error('SSE channel update parse error:', err);
        }
      });

      eventSource.addEventListener('channel_deleted', (e) => {
        try {
          const { id } = JSON.parse(e.data);
          setChannels((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
          console.error('SSE channel delete parse error:', err);
        }
      });

      eventSource.addEventListener('config_updated', (e) => {
        try {
          const newConfig = JSON.parse(e.data);
          setConfig(newConfig);
        } catch (err) {
          console.error('SSE config parse error:', err);
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        retryTimer = setTimeout(connectSSE, 3000);
      };
    }

    connectSSE();

    return () => {
      eventSource?.close();
      clearTimeout(retryTimer);
    };
  }, []);

  // Send Message
  const handleSendMessage = async (channelId: string, content: string) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          content,
          sender: {
            id: currentMember.id,
            name: currentMember.name,
            role: currentMember.role,
            desk: currentMember.desk,
            avatar: currentMember.avatar,
          },
        }),
      });
      const data = await res.json();
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Toggle Reaction
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch('/api/messages/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          emoji,
          memberId: currentMember.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: data.reactions } : m))
        );
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  // Check-in / Save current member profile
  const handleSaveMember = async (updated: Partial<Member>) => {
    try {
      const full = { ...currentMember, ...updated };
      const res = await fetch('/api/members/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(full),
      });
      const data = await res.json();
      setCurrentMember(data);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving member:', err);
    }
  };

  // Update Amenity Status
  const handleUpdateAmenity = async (id: string, status: SpaceAmenity['status'], statusText: string) => {
    try {
      const res = await fetch('/api/amenities/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          statusText,
          updatedBy: currentMember.name,
        }),
      });
      const data = await res.json();
      setAmenities((prev) => prev.map((a) => (a.id === id ? data : a)));
    } catch (err) {
      console.error('Error updating amenity:', err);
    }
  };

  // Add Notice
  const handleAddNotice = async (title: string, content: string, priority: 'normal' | 'urgent') => {
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          author: currentMember.name,
          priority,
        }),
      });
      const data = await res.json();
      setNotices((prev) => [data, ...prev]);
    } catch (err) {
      console.error('Error adding notice:', err);
    }
  };

  // Update MikroTik Hotspot Config
  const handleUpdateConfig = async (newConfig: Partial<HotspotConfig>) => {
    try {
      const res = await fetch('/api/hotspot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Error updating config:', err);
    }
  };

  // Login & Logout Hotspot
  const handleLoginSuccess = (newSession: HotspotSession) => {
    setSession(newSession);
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(newSession));
  };

  const handleLogout = () => {
    const cleared: HotspotSession = {
      isConnected: false,
      username: '',
      ip: clientIp,
      uptime: '00:00:00',
      timeLeft: '',
      bytesIn: '0 KB',
      bytesOut: '0 KB',
    };
    setSession(cleared);
    localStorage.removeItem(STORAGE_KEY_SESSION);
    setIsHotspotModalOpen(false);
  };

  // Direct chat helper from member list
  const handleStartDirectChat = (memberName: string) => {
    setActiveTab('portal');
    setActiveChannelId('general');
    handleSendMessage('general', `@${memberName} سلام! من روی ${currentMember.desk} مستقر هستم.`);
  };

  const onlineCount = members.filter((m) => m.isOnline).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        session={session}
        onOpenHotspotModal={() => setIsHotspotModalOpen(true)}
        onlineCount={onlineCount}
      />

      {/* Network Status Top Strip */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-medium text-white">وای‌فای داخلی:</span>
            <span className="font-mono text-amber-300 font-semibold">{config.hotspotName}</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>آی‌پی شما:</span>
            <span className="font-mono text-slate-200">{clientIp}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">درگاه میکروتیک:</span>
              <span className="font-mono text-slate-300">{config.routerIp}</span>
            </div>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${session.isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={session.isConnected ? 'text-emerald-300 font-medium' : 'text-amber-300'}>
                {session.isConnected ? 'اینترنت فعال' : 'دسترسی چت محلی (Walled Garden)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'portal' && (
          <UnifiedPortalView
            channels={channels}
            activeChannelId={activeChannelId}
            onSelectChannel={setActiveChannelId}
            messages={messages}
            currentMember={currentMember}
            onSendMessage={handleSendMessage}
            onToggleReaction={handleToggleReaction}
            onOpenCheckIn={() => setIsCheckInOpen(true)}
            config={config}
            session={session}
            clientIp={clientIp}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
            amenities={amenities}
            notices={notices}
            onlineCount={onlineCount}
          />
        )}

        {activeTab === 'members' && (
          <MembersList
            members={members}
            onOpenCheckIn={() => setIsCheckInOpen(true)}
            onStartDirectChat={handleStartDirectChat}
          />
        )}

        {activeTab === 'amenities' && (
          <AmenitiesPanel
            amenities={amenities}
            notices={notices}
            cafeteria={cafeteria}
            staff={staff}
            onUpdateAmenity={handleUpdateAmenity}
            onAddNotice={handleAddNotice}
            currentMember={currentMember}
          />
        )}

        {activeTab === 'mikrotik' && (
          <MikrotikIntegrationGuide
            config={config}
            onUpdateConfig={handleUpdateConfig}
            clientIp={clientIp}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            amenities={amenities}
            channels={channels}
            notices={notices}
            cafeteria={cafeteria}
            staff={staff}
            config={config}
            onRefreshData={loadData}
            onUpdateConfig={handleUpdateConfig}
          />
        )}
      </main>

      {/* Hotspot Captive Login Modal */}
      <HotspotLoginModal
        isOpen={isHotspotModalOpen}
        onClose={() => setIsHotspotModalOpen(false)}
        config={config}
        session={session}
        clientIp={clientIp}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Check-In Presence Modal */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        currentMember={currentMember}
        onSaveMember={handleSaveMember}
      />

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">همکار هاب</span>
            <span>—</span>
            <span>سامانه شبکه محلی فضای کار اشتراکی و کپتیو پورتال میکروتیک</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>سرور لوکال شبکه</span>
            <span aria-hidden="true">·</span>
            <span>پورتال هات‌اسپات Walled Garden</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
