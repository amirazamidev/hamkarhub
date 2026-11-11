import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Coffee,
  Users,
  UtensilsCrossed,
  PhoneCall,
  Megaphone,
  Smile,
  Hash,
  Pin,
  HelpCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Channel, ChatMessage, Member } from '../types';

interface ChatViewProps {
  channels: Channel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  messages: ChatMessage[];
  currentMember: Member;
  onSendMessage: (channelId: string, content: string) => Promise<void>;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onOpenCheckIn: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  channels,
  activeChannelId,
  onSelectChannel,
  messages,
  currentMember,
  onSendMessage,
  onToggleReaction,
  onOpenCheckIn,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const DEFAULT_CHANNEL: Channel = {
    id: 'general',
    name: 'عمومی و لابی',
    description: 'گفتگوهای روزمره، معرفی اعضا و گپ دوستانه حین کار',
    icon: 'Coffee',
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0] || DEFAULT_CHANNEL;
  const channelMessages = messages.filter((m) => m.channelId === (activeChannel?.id || activeChannelId));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText;
    setInputText('');
    setIsSending(true);
    try {
      await onSendMessage(activeChannelId, text);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const addTag = (tag: string) => {
    setInputText((prev) => (prev ? `${prev} ${tag} ` : `${tag} `));
  };

  const getChannelIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'Users':
        return <Users className="w-4 h-4 text-indigo-400" />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed className="w-4 h-4 text-emerald-400" />;
      case 'PhoneCall':
        return <PhoneCall className="w-4 h-4 text-rose-400" />;
      case 'Megaphone':
        return <Megaphone className="w-4 h-4 text-amber-400" />;
      default:
        return <Hash className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  const quickReactions = ['👍', '❤️', '☕', '🔥', '🙏', '🙋‍♂️'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[640px]">
        {/* Right Sidebar (Channels List in Persian RTL) */}
        <aside className="lg:col-span-4 xl:col-span-3 border-b lg:border-b-0 lg:border-l border-slate-800 bg-slate-950/40 p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                کانال‌های گفتگوی فضا
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {channels.length} کانال فعال
              </span>
            </div>

            <div className="space-y-1">
              {channels.map((channel) => {
                const isActive = channel.id === activeChannelId;
                const unreadCount = messages.filter((m) => m.channelId === channel.id).length;
                return (
                  <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel.id)}
                    className={`w-full text-right p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/10 border border-amber-500/30 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-amber-500/20' : 'bg-slate-800'}`}>
                        {getChannelIcon(channel.icon)}
                      </div>
                      <div className="truncate">
                        <div className={`text-xs font-semibold ${isActive ? 'text-amber-400' : 'text-slate-200'}`}>
                          {channel.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {channel.description}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums shrink-0 mr-2">
                      {unreadCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current User Card at bottom of sidebar */}
          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                  {currentMember.name ? currentMember.name.slice(0, 1) : 'ش'}
                </div>
                <div className="truncate text-xs">
                  <div className="font-semibold text-white truncate">{currentMember.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{currentMember.desk}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onOpenCheckIn}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap cursor-pointer hover:underline"
              >
                ویرایش
              </button>
            </div>
          </div>
        </aside>

        {/* Left/Main Column: Chat Feed & Composer */}
        <main className="lg:col-span-8 xl:col-span-9 flex flex-col justify-between bg-slate-900/30">
          {/* Channel Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60">
                {getChannelIcon(activeChannel.icon)}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{activeChannel.name}</span>
                  <span className="text-[11px] text-slate-500 font-normal">#{activeChannel.id}</span>
                </h2>
                <p className="text-xs text-slate-400">{activeChannel.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="hidden sm:inline">شبکه لوکال:</span>
              <span className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                LAN Active
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[500px]">
            {channelMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                <Coffee className="w-10 h-10 text-slate-600" />
                <div className="text-sm font-medium text-slate-300">هنوز پیامی در این کانال ارسال نشده است</div>
                <div className="text-xs text-slate-500 max-w-sm">
                  شما اولین نفری باشید که سلام می‌گوید یا سوال و نیازمندی خود را با همکاران در میان می‌گذارد!
                </div>
              </div>
            ) : (
              channelMessages.map((msg) => {
                const isCurrentUser = msg.sender.id === currentMember.id;
                const isAnnouncement = msg.type === 'announcement' || msg.channelId === 'announcements';

                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl transition-all ${
                      isAnnouncement
                        ? 'bg-amber-950/20 border border-amber-500/30'
                        : 'bg-slate-950/40 border border-slate-800/80 hover:border-slate-700/60'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-slate-700/80 flex items-center justify-center text-xs font-bold text-amber-300">
                          {msg.sender.avatar ? (
                            <img
                              src={msg.sender.avatar}
                              alt={msg.sender.name}
                              className="w-full h-full rounded-xl object-cover"
                            />
                          ) : (
                            msg.sender.name.slice(0, 1)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{msg.sender.name}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] text-amber-400 font-medium bg-amber-500/10 px-1.5 py-0.2 rounded">
                                شما
                              </span>
                            )}
                          </div>
                          {/* Unboxed metadata separated by middot as per Constitution */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span>{msg.sender.role}</span>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {msg.sender.desk}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        {isAnnouncement && (
                          <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                            <Pin className="w-3 h-3" />
                            اطلاعیه
                          </span>
                        )}
                        <span>{formatTime(msg.timestamp)}</span>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap pl-2 pr-10">
                      {msg.content}
                    </div>

                    {/* Reactions Bar */}
                    <div className="mt-3 pt-2 border-t border-slate-800/50 flex flex-wrap items-center gap-1.5 text-xs">
                      {msg.reactions &&
                        Object.entries(msg.reactions).map(([emoji, memberIds]) => {
                          const hasReacted = memberIds.includes(currentMember.id);
                          return (
                            <button
                              key={emoji}
                              onClick={() => onToggleReaction(msg.id, emoji)}
                              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                                hasReacted
                                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="font-mono text-[11px] tabular-nums">{memberIds.length}</span>
                            </button>
                          );
                        })}

                      {/* Quick React Picker */}
                      <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity mr-auto">
                        {quickReactions.slice(0, 4).map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => onToggleReaction(msg.id, emoji)}
                            className="p-1 rounded hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                            title={`واکنش با ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Tag Helper & Message Composer */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3">
            {/* Quick helper tag buttons */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
              <span className="text-slate-500 text-[11px] whitespace-nowrap">برچسب سریع:</span>
              <button
                type="button"
                onClick={() => addTag('#سوال_فنی')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                #سوال_فنی
              </button>
              <button
                type="button"
                onClick={() => addTag('#سفارش_ناهار')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                #سفارش_ناهار 🥗
              </button>
              <button
                type="button"
                onClick={() => addTag('#کابل_مانیتور')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                #کابل_امانت
              </button>
              <button
                type="button"
                onClick={() => addTag('#وقت_استراحت_قهوه')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                #قهوه ☕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <div className="relative flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`پیام در #${activeChannel.name}... (Enter برای ارسال)`}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
              >
                <Send className="w-5 h-5 rtl:-rotate-90" />
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};
