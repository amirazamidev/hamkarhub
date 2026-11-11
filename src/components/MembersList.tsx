import React, { useState } from 'react';
import { Users, MapPin, Coffee, Briefcase, MessageSquare, Check, Sparkles, Filter, Search } from 'lucide-react';
import { Member } from '../types';

interface MembersListProps {
  members: Member[];
  onOpenCheckIn: () => void;
  onStartDirectChat: (memberName: string) => void;
}

export const MembersList: React.FC<MembersListProps> = ({
  members,
  onOpenCheckIn,
  onStartDirectChat,
}) => {
  const [filter, setFilter] = useState<'all' | 'available' | 'busy' | 'coffee' | 'meeting'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter((m) => {
    const matchesFilter = filter === 'all' || m.status === filter;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.desk.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: Member['status']) => {
    switch (status) {
      case 'available':
        return (
          <span className="text-emerald-400 text-xs flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            آزاد برای گپ و همکاری
          </span>
        );
      case 'busy':
        return (
          <span className="text-amber-400 text-xs flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            تمرکز عمیق (دیپ‌ورک)
          </span>
        );
      case 'coffee':
        return (
          <span className="text-cyan-400 text-xs flex items-center gap-1 font-medium">
            <Coffee className="w-3.5 h-3.5" />
            استراحت در کافه
          </span>
        );
      case 'meeting':
        return (
          <span className="text-rose-400 text-xs flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            در حال جلسه / تماس
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Check-in CTA */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>همکاران حاضر در فضای کار امروز</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            افرادی که در حال حاضر به شبکه وای‌فای متصل هستند و شماره میز خود را ثبت نموده‌اند
          </p>
        </div>

        <button
          onClick={onOpenCheckIn}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          <span>ثبت / ویرایش مشخصات من</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Interactive Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            همه ({members.length})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'available'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            آماده گپ ☕
          </button>
          <button
            onClick={() => setFilter('busy')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'busy'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            تمرکز عمیق
          </button>
          <button
            onClick={() => setFilter('coffee')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'coffee'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            کافه‌تریا
          </button>
          <button
            onClick={() => setFilter('meeting')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'meeting'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            در جلسه
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام، تخصص یا شماره میز..."
            className="w-full pl-3 pr-9 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700/80 transition-all space-y-4 shadow-sm"
          >
            {/* Header: Avatar, Name, Desk */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-sm font-bold text-amber-300 overflow-hidden">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    member.name.slice(0, 1)
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{member.name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>{member.role}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>{getStatusBadge(member.status)}</div>
            </div>

            {/* Location & Status text */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-medium">{member.desk}</span>
              </div>

              {member.statusText && (
                <p className="text-slate-400 text-xs italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                  «{member.statusText}»
                </p>
              )}
            </div>

            {/* Skills: Zero-Pill clean unboxed text list separated by bullet */}
            {member.skills && member.skills.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
                <span className="text-slate-500 text-[11px]">مهارت‌ها:</span>
                {member.skills.map((skill, idx) => (
                  <React.Fragment key={skill}>
                    <span className="text-slate-300 font-medium">{skill}</span>
                    {idx < member.skills.length - 1 && (
                      <span aria-hidden="true" className="text-slate-600">·</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Action */}
            <div className="pt-2">
              <button
                onClick={() => onStartDirectChat(member.name)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700/80 text-amber-300 font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>پیام در لابی به {member.name.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
