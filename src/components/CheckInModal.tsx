import React, { useState } from 'react';
import { X, User, MapPin, Briefcase, Sparkles, Coffee, Clock } from 'lucide-react';
import { Member } from '../types';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMember: Member;
  onSaveMember: (updated: Partial<Member>) => Promise<void>;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  currentMember,
  onSaveMember,
}) => {
  const [name, setName] = useState(currentMember.name);
  const [role, setRole] = useState(currentMember.role);
  const [desk, setDesk] = useState(currentMember.desk);
  const [status, setStatus] = useState<Member['status']>(currentMember.status);
  const [statusText, setStatusText] = useState(currentMember.statusText || '');
  const [skillsText, setSkillsText] = useState(currentMember.skills.join('، '));
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const skillsArray = skillsText
        .split(/[،,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      await onSaveMember({
        name: name.trim(),
        role: role.trim() || 'عضو فضا',
        desk: desk.trim() || 'میز اشتراکی',
        status,
        statusText: statusText.trim(),
        skills: skillsArray,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ثبت حضور من در فضای کار اشتراکی</h2>
              <p className="text-xs text-slate-400">به سایر همکاران نشان دهید کجای سالن مستقر هستید</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">نام و نام خانوادگی:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: پویا رادمنش"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">نقش / تخصص شما:</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="مثال: طراح رابط کاربری / برنامه‌نویس پایتون"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-right">
            <label className="text-xs font-medium text-slate-300">محل استقرار / شماره میز در فضا:</label>
            <input
              type="text"
              value={desk}
              onChange={(e) => setDesk(e.target.value)}
              placeholder="مثال: میز شماره ۱۶ - سالن باز کنار پنجره"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-2 text-right">
            <label className="text-xs font-medium text-slate-300">وضعیت در دسترس بودن شما امروز:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setStatus('available')}
                className={`p-2 text-xs rounded-xl border cursor-pointer font-medium flex items-center justify-center gap-1.5 ${
                  status === 'available'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>آزاد برای گپ</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('busy')}
                className={`p-2 text-xs rounded-xl border cursor-pointer font-medium flex items-center justify-center gap-1.5 ${
                  status === 'busy'
                    ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>تمرکز عمیق</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('coffee')}
                className={`p-2 text-xs rounded-xl border cursor-pointer font-medium flex items-center justify-center gap-1.5 ${
                  status === 'coffee'
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>کافه‌تریا</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('meeting')}
                className={`p-2 text-xs rounded-xl border cursor-pointer font-medium flex items-center justify-center gap-1.5 ${
                  status === 'meeting'
                    ? 'bg-rose-950 border-rose-500 text-rose-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>در جلسه</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 text-right">
            <label className="text-xs font-medium text-slate-300">وضعیت کوتاه / حال و هوا (Status Message):</label>
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="مثال: در حال دیباگ اسپرینت - برای چای ساعت ۱۶ آزادم ☕"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1.5 text-right">
            <label className="text-xs font-medium text-slate-300">مهارت‌ها برای شبکه‌سازی (با ویرگول جدا کنید):</label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="مثال: React، Next.js، Docker، Tailwind"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'در حال ثبت...' : 'ثبت اطلاعات در شبکه داخلی'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
