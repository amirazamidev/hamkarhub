import React, { useState } from 'react';
import { Coffee, PhoneCall, Users, CheckCircle2, AlertCircle, Clock, Megaphone, Plus, Sparkles } from 'lucide-react';
import { SpaceAmenity, NoticeItem, Member } from '../types';

interface AmenitiesPanelProps {
  amenities: SpaceAmenity[];
  notices: NoticeItem[];
  onUpdateAmenity: (id: string, status: SpaceAmenity['status'], statusText: string) => Promise<void>;
  onAddNotice: (title: string, content: string, priority: 'normal' | 'urgent') => Promise<void>;
  currentMember: Member;
}

export const AmenitiesPanel: React.FC<AmenitiesPanelProps> = ({
  amenities,
  notices,
  onUpdateAmenity,
  onAddNotice,
  currentMember,
}) => {
  const [selectedAmenity, setSelectedAmenity] = useState<SpaceAmenity | null>(null);
  const [newStatus, setNewStatus] = useState<SpaceAmenity['status']>('ready');
  const [newStatusText, setNewStatusText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // New notice state
  const [isAddingNotice, setIsAddingNotice] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState<'normal' | 'urgent'>('normal');

  const handleSaveAmenity = async () => {
    if (!selectedAmenity) return;
    setIsUpdating(true);
    try {
      await onUpdateAmenity(selectedAmenity.id, newStatus, newStatusText || selectedAmenity.statusText);
      setSelectedAmenity(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    await onAddNotice(noticeTitle, noticeContent, noticePriority);
    setNoticeTitle('');
    setNoticeContent('');
    setIsAddingNotice(false);
  };

  const getStatusBadge = (status: SpaceAmenity['status']) => {
    switch (status) {
      case 'ready':
      case 'free':
        return (
          <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>آزاد و آماده استفاده</span>
          </span>
        );
      case 'busy':
        return (
          <span className="text-rose-400 text-xs font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-400" />
            <span>در حال استفاده</span>
          </span>
        );
      case 'maintenance':
        return (
          <span className="text-amber-400 text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>در حال نظافت / شارژ</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Amenities Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-400" />
              <span>وضعیت زنده امکانات و فضاهای اشتراکی</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              همه اعضای متصل به وای‌فای می‌توانند وضعیت دستگاه قهوه، فون‌باکس‌ها و اتاق جلسات را ثبت و مشاهده کنند
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {amenities.map((amenity) => (
            <div
              key={amenity.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400">
                    {amenity.icon === 'Coffee' && <Coffee className="w-5 h-5" />}
                    {amenity.icon === 'PhoneCall' && <PhoneCall className="w-5 h-5" />}
                    {amenity.icon === 'Users' && <Users className="w-5 h-5" />}
                  </div>
                  {getStatusBadge(amenity.status)}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{amenity.name}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{amenity.statusText}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>به‌روزرسانی: {amenity.updatedBy}</span>
                <button
                  onClick={() => {
                    setSelectedAmenity(amenity);
                    setNewStatus(amenity.status);
                    setNewStatusText(amenity.statusText);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                >
                  تغییر وضعیت
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Cafeteria Atmosphere & Community Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col md:flex-row">
          <div className="md:w-1/2 relative min-h-[220px]">
            <img
              src="/src/assets/images/coworking_lounge_cafe_1794330975977.jpg"
              alt="کافه‌تریا فضای کار اشتراکی"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-transparent to-transparent" />
          </div>

          <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                کافه‌تریا و استراحت
              </span>
              <h3 className="text-base font-bold text-white">قهوه تازه، چای دمی و گپ دوستانه</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                اسپرسوساز حرفه‌ای در آشپزخانه طبقه همکف در دسترس است. برای ثبت سفارش ناهار جمعی، هر روز تا ساعت ۱۲ در کانال #کافه-و-سفارش-ناهار پیام بگذارید تا از تخفیف ویژه همکاران استفاده کنید.
              </p>
            </div>

            <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>چای و دمنوش رایگان در تمام طول روز مهیاست.</span>
            </div>
          </div>
        </div>

        {/* Community Manager Card */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-700/80 shrink-0">
              <img
                src="/src/assets/images/community_manager_avatar_1794330976206.jpg"
                alt="مدیر کامیونیتی"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-[11px] text-amber-400 font-medium block">میز پذیرش و ارتباطات</span>
              <h4 className="text-sm font-bold text-white">سارا رضایی</h4>
              <p className="text-xs text-slate-400">مدیر کامیونیتی فضای کار</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            «هر زمان نیاز به رزرو اتاق جلسات اختصاصی، کارت ورود روزانه، یا سوال در خصوص وای‌فای و اتصال میکروتیک داشتید، در خدمتتان هستم.»
          </p>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>محل استقرار: ورودی اصلی</span>
            <span className="text-emerald-400 font-medium">حاضر در فضا</span>
          </div>
        </div>
      </div>

      {/* Notices Board */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <span>تابلو اعلانات و رویدادهای فضا</span>
          </h2>

          <button
            onClick={() => setIsAddingNotice(true)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن اطلاعیه جدید</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition-all space-y-2 ${
                n.priority === 'urgent'
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {n.priority === 'urgent' && (
                    <span className="text-amber-400 text-xs font-bold">[مهم]</span>
                  )}
                  <span>{n.title}</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(n.timestamp).toLocaleDateString('fa-IR')}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{n.content}</p>
              <div className="pt-2 text-[11px] text-slate-500">
                <span>توسط: {n.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Edit Amenity Status */}
      {selectedAmenity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">به‌روزرسانی وضعیت {selectedAmenity.name}</h3>

            <div className="space-y-2 text-right">
              <label className="text-xs font-medium text-slate-300">وضعیت جدید:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewStatus('ready')}
                  className={`p-2 text-xs rounded-xl border cursor-pointer font-medium ${
                    newStatus === 'ready'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  آزاد / آماده
                </button>
                <button
                  type="button"
                  onClick={() => setNewStatus('busy')}
                  className={`p-2 text-xs rounded-xl border cursor-pointer font-medium ${
                    newStatus === 'busy'
                      ? 'bg-rose-950 border-rose-500 text-rose-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  اشغال
                </button>
                <button
                  type="button"
                  onClick={() => setNewStatus('maintenance')}
                  className={`p-2 text-xs rounded-xl border cursor-pointer font-medium ${
                    newStatus === 'maintenance'
                      ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  نظافت / شارژ
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">توضیح تکمیلی (اختیاری):</label>
              <input
                type="text"
                value={newStatusText}
                onChange={(e) => setNewStatusText(e.target.value)}
                placeholder="مثال: دان قهوه پر شد / تا ۱۵ دقیقه دیگر آزاد می‌شود"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveAmenity}
                disabled={isUpdating}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
              <button
                onClick={() => setSelectedAmenity(null)}
                className="py-2 px-4 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Notice */}
      {isAddingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleCreateNotice} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">افزودن اطلاعیه به تابلو اعلانات</h3>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">عنوان اطلاعیه:</label>
              <input
                type="text"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="مثال: کارگاه انتقال تجربه ساعت ۱۷ در سالن اصلی"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">متن اطلاعیه:</label>
              <textarea
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                rows={3}
                required
                placeholder="توضیحات و جزئیات رویداد یا قانون فضا..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  checked={noticePriority === 'normal'}
                  onChange={() => setNoticePriority('normal')}
                />
                <span className="text-slate-300">عادی</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  checked={noticePriority === 'urgent'}
                  onChange={() => setNoticePriority('urgent')}
                />
                <span className="text-amber-400 font-bold">مهم / فوری</span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                ثبت اطلاعیه
              </button>
              <button
                type="button"
                onClick={() => setIsAddingNotice(false)}
                className="py-2 px-4 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
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
