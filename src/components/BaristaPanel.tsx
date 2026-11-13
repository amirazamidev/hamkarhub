import React, { useState, useMemo, useEffect } from 'react';
import {
  ChefHat,
  Coffee,
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Lock,
  AlertCircle,
  Check,
  Key,
  Sparkles,
} from 'lucide-react';
import {
  CafeCategory,
  CafeMenuItem,
  CafeOrder,
  CafeOrderStatus,
  CafeteriaInfo,
} from '../types';

interface BaristaPanelProps {
  cafeMenu: CafeMenuItem[];
  cafeOrders: CafeOrder[];
  cafeteria: CafeteriaInfo;
  onRefreshData: () => Promise<void>;
}

const CAFE_CATEGORY_LABELS: Record<CafeCategory, string> = {
  hot_coffee: 'قهوه گرم',
  cold_drink: 'نوشیدنی سرد',
  tea_herbal: 'چای و دمنوش',
  pastry_snack: 'کیک و میان‌وعده',
  food_meal: 'غذا و ناهار',
};

const CAFE_IMAGE_PRESETS = [
  { label: 'اسپرسو / لته', url: '/src/assets/images/cafe_espresso_latte_1794509112349.jpg' },
  { label: 'نوشیدنی سرد', url: '/src/assets/images/cafe_iced_coffee_1794509113123.jpg' },
  { label: 'چای و دمنوش', url: '/src/assets/images/cafe_herbal_tea_1794509113421.jpg' },
  { label: 'کیک و ساندویچ', url: '/src/assets/images/cafe_pastry_sandwich_1794509113971.jpg' },
];

export const BaristaPanel: React.FC<BaristaPanelProps> = ({
  cafeMenu,
  cafeOrders,
  cafeteria,
  onRefreshData,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('hamkar_cafe_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [subTab, setSubTab] = useState<'orders' | 'menu' | 'cafe_settings'>('orders');
  const [orderFilter, setOrderFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Menu CRUD Modal
  const [isCafeItemModalOpen, setIsCafeItemModalOpen] = useState(false);
  const [editingCafeItem, setEditingCafeItem] = useState<CafeMenuItem | null>(null);
  const [cafeItemName, setCafeItemName] = useState('');
  const [cafeItemCategory, setCafeItemCategory] = useState<CafeCategory>('hot_coffee');
  const [cafeItemPrice, setCafeItemPrice] = useState('65000');
  const [cafeItemPrepMinutes, setCafeItemPrepMinutes] = useState('5');
  const [cafeItemDesc, setCafeItemDesc] = useState('');
  const [cafeItemOptionsStr, setCafeItemOptionsStr] = useState('');
  const [cafeItemImageUrl, setCafeItemImageUrl] = useState(
    '/src/assets/images/cafe_espresso_latte_1794509112349.jpg'
  );
  const [cafeItemAvailable, setCafeItemAvailable] = useState(true);
  const [cafeItemBadge, setCafeItemBadge] = useState('');

  // Cafeteria Banner State
  const [cafeTitle, setCafeTitle] = useState(cafeteria.title);
  const [cafeSubtitle, setCafeSubtitle] = useState(cafeteria.subtitle);
  const [cafeDesc, setCafeDesc] = useState(cafeteria.description);
  const [cafeImg, setCafeImg] = useState(cafeteria.imageUrl);
  const [cafeNote, setCafeNote] = useState(cafeteria.footerNote);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [bannerSavedMsg, setBannerSavedMsg] = useState(false);

  // Barista Passcode State
  const [newCafePass, setNewCafePass] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setCafeTitle(cafeteria.title);
    setCafeSubtitle(cafeteria.subtitle);
    setCafeDesc(cafeteria.description);
    setCafeImg(cafeteria.imageUrl);
    setCafeNote(cafeteria.footerNote);
  }, [cafeteria]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/cafe/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('hamkar_cafe_auth', 'true');
      } else {
        setAuthError(data.error || 'رمز عبور پنل کافه نادرست است');
      }
    } catch {
      setAuthError('خطا در بررسی رمز عبور پنل کافه');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('hamkar_cafe_auth');
  };

  // --- ORDER QUEUE ACTIONS ---
  const handleUpdateOrderStatus = async (orderId: string, status: CafeOrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await fetch(`/api/cafe/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await onRefreshData();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleClearCompletedOrders = async () => {
    if (!confirm('آیا از حذف سفارش‌های تحویل شده و لغو شده از لیست مطمئن هستید؟')) return;
    await fetch('/api/admin/cafe/orders/completed', { method: 'DELETE' });
    await onRefreshData();
  };

  // --- MENU CRUD ACTIONS ---
  const handleOpenAddCafeItem = () => {
    setEditingCafeItem(null);
    setCafeItemName('');
    setCafeItemCategory('hot_coffee');
    setCafeItemPrice('65000');
    setCafeItemPrepMinutes('5');
    setCafeItemDesc('');
    setCafeItemOptionsStr('');
    setCafeItemImageUrl('/src/assets/images/cafe_espresso_latte_1794509112349.jpg');
    setCafeItemAvailable(true);
    setCafeItemBadge('');
    setIsCafeItemModalOpen(true);
  };

  const handleOpenEditCafeItem = (item: CafeMenuItem) => {
    setEditingCafeItem(item);
    setCafeItemName(item.name);
    setCafeItemCategory(item.category);
    setCafeItemPrice(String(item.price));
    setCafeItemPrepMinutes(String(item.prepMinutes));
    setCafeItemDesc(item.description || '');
    setCafeItemOptionsStr((item.options || []).join('، '));
    setCafeItemImageUrl(item.imageUrl || '/src/assets/images/cafe_espresso_latte_1794509112349.jpg');
    setCafeItemAvailable(item.isAvailable);
    setCafeItemBadge(item.badgeText || '');
    setIsCafeItemModalOpen(true);
  };

  const handleSaveCafeMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeItemName.trim()) return;
    const options = cafeItemOptionsStr
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: cafeItemName.trim(),
      category: cafeItemCategory,
      price: Number(cafeItemPrice) || 0,
      prepMinutes: Number(cafeItemPrepMinutes) || 5,
      description: cafeItemDesc.trim(),
      imageUrl: cafeItemImageUrl.trim() || '/src/assets/images/cafe_espresso_latte_1794509112349.jpg',
      isAvailable: cafeItemAvailable,
      options,
      badgeText: cafeItemBadge.trim(),
    };

    if (editingCafeItem) {
      await fetch(`/api/admin/cafe/menu/${encodeURIComponent(editingCafeItem.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/admin/cafe/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    setIsCafeItemModalOpen(false);
    setEditingCafeItem(null);
    await onRefreshData();
  };

  const handleToggleCafeItemAvailability = async (item: CafeMenuItem) => {
    await fetch(`/api/admin/cafe/menu/${encodeURIComponent(item.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    await onRefreshData();
  };

  const handleDeleteCafeMenuItem = async (id: string) => {
    if (!confirm('آیا از حذف این آیتم از منوی کافه اطمینان دارید؟')) return;
    await fetch(`/api/admin/cafe/menu/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await onRefreshData();
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBanner(true);
    setBannerSavedMsg(false);
    try {
      await fetch('/api/admin/cafeteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cafeTitle,
          subtitle: cafeSubtitle,
          description: cafeDesc,
          imageUrl: cafeImg,
          footerNote: cafeNote,
        }),
      });
      setBannerSavedMsg(true);
      await onRefreshData();
      setTimeout(() => setBannerSavedMsg(false), 3000);
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleUpdatePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (newCafePass.trim().length < 4) {
      setPassMsg({ type: 'err', text: 'رمز عبور باید حداقل ۴ کاراکتر باشد.' });
      return;
    }
    const res = await fetch('/api/cafe/admin/passcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: newCafePass.trim() }),
    });
    if (res.ok) {
      setNewCafePass('');
      setPassMsg({ type: 'ok', text: 'رمز عبور پنل کافه و باریستا با موفقیت تغییر یافت.' });
    } else {
      const data = await res.json();
      setPassMsg({ type: 'err', text: data.error || 'خطا در تغییر رمز' });
    }
  };

  const metrics = useMemo(() => {
    const pending = cafeOrders.filter((o) => o.status === 'pending').length;
    const preparing = cafeOrders.filter((o) => o.status === 'preparing').length;
    const ready = cafeOrders.filter((o) => o.status === 'ready').length;
    const revenue = cafeOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return { pending, preparing, ready, revenue };
  }, [cafeOrders]);

  const filteredOrders = useMemo(() => {
    return cafeOrders.filter((o) => {
      if (orderFilter === 'active') {
        return o.status === 'pending' || o.status === 'preparing' || o.status === 'ready';
      }
      if (orderFilter === 'completed') {
        return o.status === 'delivered' || o.status === 'cancelled';
      }
      return true;
    });
  }, [cafeOrders, orderFilter]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <ChefHat className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">ورود به پنل مستقل کافه و باریستا</h2>
          <p className="text-xs text-slate-400 mt-1">
            مدیریت صف زنده سفارش‌های میز، تغییر وضعیت آماده شدن و ویرایش منوی کافه
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-medium text-slate-300">رمز عبور پنل کافه:</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="رمز پیش‌فرض باریستا: cafe123"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
              autoFocus
            />
            <span className="text-[11px] text-slate-500 block">
              رمز اولیه باریستا: cafe123 (جدا از رمز ادمین شبکه)
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            ورود به پنل باریستا
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Bar */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
              <span>پنل مستقل باریستا</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400">همگام‌سازی زنده سفارش‌ها</span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              مدیریت سفارش‌های کافه و منوی روزانه
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
        >
          خروج از پنل کافه
        </button>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        <button
          type="button"
          onClick={() => setSubTab('orders')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 tabular-nums ${
            subTab === 'orders' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>صف زنده سفارش‌ها ({metrics.pending + metrics.preparing + metrics.ready})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('menu')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 tabular-nums ${
            subTab === 'menu' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>مدیریت منو و موجودی ({cafeMenu.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('cafe_settings')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            subTab === 'cafe_settings'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>بنر کافه و رمز باریستا</span>
        </button>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400">در انتظار تایید باریستا</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">{metrics.pending}</div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400">در حال آماده‌سازی</div>
          <div className="text-2xl font-bold text-sky-400 mt-1 tabular-nums">{metrics.preparing}</div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400">آماده تحویل به میز</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">{metrics.ready}</div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400">مجموع فروش ثبت‌شده</div>
          <div className="text-xl font-bold text-white mt-1 tabular-nums">
            {metrics.revenue.toLocaleString('fa-IR')}{' '}
            <span className="text-xs font-normal text-slate-400">تومان</span>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: LIVE ORDER QUEUE */}
      {subTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-400" />
                <span>سفارش‌های دریافت‌شده ({filteredOrders.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                سفارش‌های جدید به صورت خودکار و بدون نیاز به رفرش در این لیست ظاهر می‌شوند
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                {[
                  { id: 'active', label: 'فعال' },
                  { id: 'completed', label: 'تکمیل‌شده' },
                  { id: 'all', label: 'همه' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOrderFilter(tab.id as any)}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                      orderFilter === tab.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleClearCompletedOrders}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium rounded-xl cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاکسازی تکمیل‌شده‌ها</span>
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs space-y-2">
              <ShoppingBag className="w-8 h-8 mx-auto text-slate-700" />
              <div>سفارشی در این بخش وجود ندارد.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`cv-auto p-4 rounded-2xl border space-y-3 ${
                    order.status === 'pending'
                      ? 'bg-amber-950/15 border-amber-500/40'
                      : order.status === 'preparing'
                      ? 'bg-sky-950/15 border-sky-500/40'
                      : order.status === 'ready'
                      ? 'bg-emerald-950/15 border-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-white tabular-nums">
                        #{order.orderNumber}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="font-bold text-amber-300">{order.customerName}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-300">{order.desk}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {new Date(order.createdAt).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-slate-200">
                          <span className="font-mono font-bold text-amber-400 ml-1.5 tabular-nums">
                            {it.quantity}×
                          </span>
                          {it.name}
                          {it.selectedOption && (
                            <span className="text-[11px] text-slate-400 mr-1.5">
                              ({it.selectedOption})
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-slate-400 tabular-nums">
                          {(it.unitPrice * it.quantity).toLocaleString('fa-IR')} ت
                        </span>
                      </div>
                    ))}
                    {order.notes && (
                      <div className="pt-1.5 border-t border-slate-800 text-[11px] text-amber-300">
                        توضیح مشتری: {order.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-xs font-bold text-emerald-400 tabular-nums">
                      جمع: {order.totalAmount.toLocaleString('fa-IR')} تومان
                      <span className="text-[11px] font-normal text-slate-400 mr-2">
                        (
                        {order.paymentMethod === 'tab'
                          ? 'حساب کاربری'
                          : order.paymentMethod === 'card_transfer'
                          ? 'کارت به کارت'
                          : 'حضوری / POS'}
                        )
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {order.status === 'pending' && (
                        <button
                          type="button"
                          disabled={updatingOrderId === order.id}
                          onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                          className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                        >
                          شروع آماده‌سازی
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'preparing') && (
                        <button
                          type="button"
                          disabled={updatingOrderId === order.id}
                          onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                        >
                          آماده تحویل
                        </button>
                      )}
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <button
                          type="button"
                          disabled={updatingOrderId === order.id}
                          onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/50 font-bold rounded-lg cursor-pointer"
                        >
                          تحویل شد
                        </button>
                      )}
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <button
                          type="button"
                          disabled={updatingOrderId === order.id}
                          onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                          className="px-2 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg cursor-pointer"
                        >
                          لغو
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          تحویل‌شده
                        </span>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          لغوشده
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: MENU CRUD */}
      {subTab === 'menu' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-400" />
                <span>مدیریت کامل منو و قیمت‌های کافه ({cafeMenu.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                افزودن، ویرایش قیمت، تغییر وضعیت موجودی و حذف نوشیدنی‌ها و میان‌وعده‌ها
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddCafeItem}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن آیتم جدید به منو</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cafeMenu.map((item) => (
              <div
                key={item.id}
                className="cv-auto p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                      <span
                        className={`text-[10px] font-bold shrink-0 ${
                          item.isAvailable ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.isAvailable ? 'موجود' : 'ناموجود'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {CAFE_CATEGORY_LABELS[item.category]} · {item.prepMinutes} دقیقه
                    </div>
                    <div className="text-xs font-bold text-amber-400 tabular-nums">
                      {item.price.toLocaleString('fa-IR')} تومان
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleCafeItemAvailability(item)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border ${
                      item.isAvailable
                        ? 'bg-rose-950/50 border-rose-800/60 text-rose-300 hover:bg-rose-900/60'
                        : 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
                    }`}
                  >
                    {item.isAvailable ? 'ناموجود کردن' : 'موجود کردن'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCafeItem(item)}
                      className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                      title="ویرایش آیتم"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCafeMenuItem(item.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 cursor-pointer"
                      title="حذف آیتم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: BANNER & BARISTA PASSCODE */}
      {subTab === 'cafe_settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveBanner}
            className="lg:col-span-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">ویرایش بنر و پیام معرفی کافه</h3>
              </div>
              {bannerSavedMsg && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  ذخیره شد
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-medium text-slate-300">عنوان اصلی کافه:</label>
                <input
                  type="text"
                  value={cafeTitle}
                  onChange={(e) => setCafeTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-medium text-slate-300">زیرعنوان:</label>
                <input
                  type="text"
                  value={cafeSubtitle}
                  onChange={(e) => setCafeSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5 text-right md:col-span-2">
                <label className="text-xs font-medium text-slate-300">آدرس تصویر بنر کافه:</label>
                <input
                  type="text"
                  value={cafeImg}
                  onChange={(e) => setCafeImg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5 text-right md:col-span-2">
                <label className="text-xs font-medium text-slate-300">توضیحات کافه‌تریا:</label>
                <textarea
                  value={cafeDesc}
                  onChange={(e) => setCafeDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="space-y-1.5 text-right md:col-span-2">
                <label className="text-xs font-medium text-slate-300">یادداشت فوتر کافه:</label>
                <input
                  type="text"
                  value={cafeNote}
                  onChange={(e) => setCafeNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingBanner}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
              >
                {isSavingBanner ? 'در حال ذخیره...' : 'ذخیره اطلاعات کافه'}
              </button>
            </div>
          </form>

          <form
            onSubmit={handleUpdatePasscode}
            className="lg:col-span-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Key className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">تغییر رمز پنل کافه</h3>
            </div>

            {passMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passMsg.type === 'ok'
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                }`}
              >
                {passMsg.type === 'ok' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passMsg.text}</span>
              </div>
            )}

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">رمز عبور جدید باریستا:</label>
              <input
                type="password"
                value={newCafePass}
                onChange={(e) => setNewCafePass(e.target.value)}
                placeholder="حداقل ۴ کاراکتر"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl cursor-pointer border border-slate-700"
            >
              ثبت رمز عبور جدید
            </button>
          </form>
        </div>
      )}

      {/* MODAL: ADD / EDIT CAFE MENU ITEM */}
      {isCafeItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 overflow-y-auto">
          <form
            onSubmit={handleSaveCafeMenuItem}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                <span>
                  {editingCafeItem ? `ویرایش ${editingCafeItem.name}` : 'افزودن آیتم جدید به منوی کافه'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCafeItemModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 text-right">
                <label className="text-xs font-medium text-slate-300">نام آیتم منو:</label>
                <input
                  type="text"
                  value={cafeItemName}
                  onChange={(e) => setCafeItemName(e.target.value)}
                  required
                  placeholder="مثال: لته وانیلی"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="text-xs font-medium text-slate-300">دسته‌بندی:</label>
                <select
                  value={cafeItemCategory}
                  onChange={(e) => setCafeItemCategory(e.target.value as CafeCategory)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="hot_coffee">قهوه گرم</option>
                  <option value="cold_drink">نوشیدنی سرد</option>
                  <option value="tea_herbal">چای و دمنوش</option>
                  <option value="pastry_snack">کیک و میان‌وعده</option>
                  <option value="food_meal">غذا و ناهار</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 text-right">
                <label className="text-xs font-medium text-slate-300">قیمت (تومان):</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={cafeItemPrice}
                  onChange={(e) => setCafeItemPrice(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="text-xs font-medium text-slate-300">زمان آماده شدن (دقیقه):</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={cafeItemPrepMinutes}
                  onChange={(e) => setCafeItemPrepMinutes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="text-xs font-medium text-slate-300">نشان ویژه (اختیاری):</label>
                <input
                  type="text"
                  value={cafeItemBadge}
                  onChange={(e) => setCafeItemBadge(e.target.value)}
                  placeholder="مثال: محبوب"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-slate-300">توضیحات کوتاه:</label>
              <textarea
                value={cafeItemDesc}
                onChange={(e) => setCafeItemDesc(e.target.value)}
                rows={2}
                placeholder="مواد تشکیل‌دهنده یا توضیحات طعمی..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div className="space-y-1 text-right">
              <label className="text-xs font-medium text-slate-300">
                گزینه‌های انتخابی مشتری (با ویرگول جدا کنید، اختیاری):
              </label>
              <input
                type="text"
                value={cafeItemOptionsStr}
                onChange={(e) => setCafeItemOptionsStr(e.target.value)}
                placeholder="مثال: شیر معمولی، شیر جو دوسر، بدون شکر"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-medium text-slate-300">آدرس تصویر محصول:</label>
              <input
                type="text"
                value={cafeItemImageUrl}
                onChange={(e) => setCafeItemImageUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {CAFE_IMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setCafeItemImageUrl(preset.url)}
                    className={`px-2 py-1 text-[11px] rounded-lg border cursor-pointer ${
                      cafeItemImageUrl === preset.url
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-white">وضعیت موجودی برای سفارش:</span>
              <button
                type="button"
                onClick={() => setCafeItemAvailable(!cafeItemAvailable)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  cafeItemAvailable
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                }`}
              >
                {cafeItemAvailable ? 'موجود (قابل سفارش)' : 'ناموجود'}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                {editingCafeItem ? 'ذخیره تغییرات آیتم' : 'افزودن به منوی کافه'}
              </button>
              <button
                type="button"
                onClick={() => setIsCafeItemModalOpen(false)}
                className="py-2.5 px-4 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
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
