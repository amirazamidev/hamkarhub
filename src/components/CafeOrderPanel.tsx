import React, { useState, useMemo } from 'react';
import {
  Coffee,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Clock,
  CheckCircle2,
  Search,
  MapPin,
  FileText,
  CreditCard,
  UtensilsCrossed,
  XCircle,
  ChefHat,
  PackageCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  CafeCategory,
  CafeMenuItem,
  CafeOrder,
  CafeOrderStatus,
  CafeteriaInfo,
  Member,
} from '../types';

export interface CartLineItem {
  key: string; // menuItemId + '::' + (selectedOption || '')
  menuItemId: string;
  name: string;
  unitPrice: number;
  imageUrl: string;
  quantity: number;
  selectedOption?: string;
}

interface CafeOrderPanelProps {
  menu: CafeMenuItem[];
  orders: CafeOrder[];
  cafeteria: CafeteriaInfo;
  currentMember: Member;
  cart: CartLineItem[];
  onAddToCart: (item: CafeMenuItem, selectedOption?: string) => void;
  onUpdateCartQty: (key: string, delta: number) => void;
  onRemoveFromCart: (key: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: CafeOrder) => void;
  onOrderStatusUpdated: (order: CafeOrder) => void;
}

const CATEGORY_LABELS: Record<'all' | CafeCategory, string> = {
  all: 'همه آیتم‌ها',
  hot_coffee: 'قهوه گرم',
  cold_drink: 'نوشیدنی سرد',
  tea_herbal: 'چای و دمنوش',
  pastry_snack: 'کیک و میان‌وعده',
  food_meal: 'غذا و ناهار',
};

const ORDER_STATUS_META: Record<
  CafeOrderStatus,
  { label: string; colorClass: string; stepIndex: number }
> = {
  pending: { label: 'در انتظار تایید باریستا', colorClass: 'text-amber-300', stepIndex: 1 },
  preparing: { label: 'در حال آماده‌سازی', colorClass: 'text-sky-300', stepIndex: 2 },
  ready: { label: 'آماده تحویل به میز شما', colorClass: 'text-emerald-300', stepIndex: 3 },
  delivered: { label: 'تحویل داده شد', colorClass: 'text-slate-400', stepIndex: 4 },
  cancelled: { label: 'لغو شده', colorClass: 'text-rose-400', stepIndex: 0 },
};

const PAYMENT_LABELS: Record<CafeOrder['paymentMethod'], string> = {
  tab: 'ثبت در حساب کاربری (تسویه روزانه)',
  cash_pos: 'پرداخت حضوری / کارت‌خوان کافه',
  card_transfer: 'کارت به کارت',
};

const ProductThumbnail: React.FC<{ src: string; alt: string; unavailable?: boolean }> = ({
  src,
  alt,
  unavailable,
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-600 gap-1.5">
        <Coffee className="w-8 h-8 text-amber-500/40" />
        <span className="text-[11px] text-slate-500">کافه همکار هاب</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
        unavailable ? 'grayscale opacity-50' : ''
      }`}
    />
  );
};

export const CafeOrderPanel: React.FC<CafeOrderPanelProps> = ({
  menu,
  orders,
  cafeteria,
  currentMember,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onClearCart,
  onOrderPlaced,
  onOrderStatusUpdated,
}) => {
  const [subView, setSubView] = useState<'menu' | 'my_orders'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<'all' | CafeCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOptionsByItem, setSelectedOptionsByItem] = useState<Record<string, string>>({});

  // Checkout state
  const [customerName, setCustomerName] = useState(currentMember.name || '');
  const [desk, setDesk] = useState(currentMember.desk || '');
  const [paymentMethod, setPaymentMethod] = useState<CafeOrder['paymentMethod']>('cash_pos');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<CafeOrder | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filteredMenu = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menu.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    });
  }, [menu, selectedCategory, searchQuery]);

  // Show orders belonging to this member or matching their name
  const myOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.customerId === currentMember.id ||
        (currentMember.name && o.customerName === currentMember.name)
    );
  }, [orders, currentMember.id, currentMember.name]);

  const activeMyOrdersCount = useMemo(
    () => myOrders.filter((o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready').length,
    [myOrders]
  );

  const cartTotalCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartTotalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const getOptionForItem = (item: CafeMenuItem): string | undefined => {
    if (!item.options || item.options.length === 0) return undefined;
    return selectedOptionsByItem[item.id] || item.options[0];
  };

  const getCartQtyForItem = (item: CafeMenuItem): number => {
    const opt = getOptionForItem(item);
    const key = `${item.id}::${opt || ''}`;
    return cart.find((c) => c.key === key)?.quantity || 0;
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      setSubmitError('لطفاً نام سفارش‌دهنده را وارد نمایید.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/cafe/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentMember.id,
          customerName: customerName.trim(),
          desk: desk.trim() || currentMember.desk || 'سالن اصلی',
          paymentMethod,
          notes: notes.trim(),
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            name: c.name,
            quantity: c.quantity,
            selectedOption: c.selectedOption,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'خطا در ثبت سفارش کافه');
        return;
      }

      onOrderPlaced(data);
      onClearCart();
      setNotes('');
      setConfirmedOrder(data);
      setIsMobileCartOpen(false);
    } catch {
      setSubmitError('خطا در برقراری ارتباط با سرور کافه');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/cafe/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        onOrderStatusUpdated(data.order);
      }
    } finally {
      setCancellingId(null);
    }
  };

  const renderCartCheckoutForm = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">سبد سفارش شما</h3>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
          >
            خالی کردن سبد
          </button>
        )}
      </div>

      {confirmedOrder && cart.length === 0 && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/70 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              سفارش با موفقیت ثبت شد
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              #{confirmedOrder.orderNumber}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            سفارش شما برای <span className="text-white font-semibold">{confirmedOrder.desk}</span> به باریستا ارسال شد.
          </p>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              setSubView('my_orders');
            }}
            className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            پیگیری زنده وضعیت سفارش
          </button>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="py-8 text-center space-y-2 text-slate-500">
          <Coffee className="w-8 h-8 mx-auto text-slate-700" />
          <p className="text-xs text-slate-400">سبد خرید شما فعلاً خالی است</p>
          <p className="text-[11px] text-slate-500">
            از منوی روبرو نوشیدنی یا میان‌وعده دلخواهتان را انتخاب کنید
          </p>
        </div>
      ) : (
        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          {/* Cart Items */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pl-1">
            {cart.map((line) => (
              <div
                key={line.key}
                className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{line.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 tabular-nums">
                    <span>{line.unitPrice.toLocaleString('fa-IR')} تومان</span>
                    {line.selectedOption && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-300 truncate">{line.selectedOption}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateCartQty(line.key, -1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                    aria-label="کاهش تعداد"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-white tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateCartQty(line.key, 1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                    aria-label="افزایش تعداد"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFromCart(line.key)}
                    className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer mr-0.5"
                    aria-label="حذف آیتم"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery & Payment Fields */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1 text-right">
                <label className="text-[11px] text-slate-400">نام سفارش‌دهنده:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="نام شما"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="text-[11px] text-slate-400">شماره میز / محل تحویل:</label>
                <input
                  type="text"
                  value={desk}
                  onChange={(e) => setDesk(e.target.value)}
                  placeholder="مثال: میز ۹"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="text-[11px] text-slate-400 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-amber-400" />
                <span>روش تسویه:</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as CafeOrder['paymentMethod'])}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="cash_pos">پرداخت در کافه / دستگاه کارت‌خوان</option>
                <option value="tab">ثبت روی حساب کاربری (تسویه آخر روز)</option>
                <option value="card_transfer">کارت به کارت</option>
              </select>
            </div>

            <div className="space-y-1 text-right">
              <label className="text-[11px] text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-500" />
                <span>توضیحات برای باریستا (اختیاری):</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: بدون شکر، یخ کمتر، تحویل روی میز"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {submitError && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Total & Submit */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">جمع کل سفارش ({cartTotalCount} قلم):</span>
              <span className="text-base font-bold text-amber-400 tabular-nums">
                {cartTotalAmount.toLocaleString('fa-IR')} تومان
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ارسال به باریستا...' : 'ثبت نهایی سفارش کافه'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 lg:pb-8">
      {/* Compact Storefront Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
            <UtensilsCrossed className="w-4 h-4" />
            <span>{cafeteria.subtitle || 'کافه‌تریا و سفارش آنلاین همکار هاب'}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-emerald-400">سفارش مستقیم از شبکه داخلی</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white">
            {cafeteria.title || 'منوی کافه، نوشیدنی‌های تازه و میان‌وعده'}
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {cafeteria.footerNote || 'سفارش خود را بدون نیاز به اینترنت انتخاب کنید تا باریستا مستقیماً روی میز شما تحویل دهد.'}
          </p>
        </div>

        {/* View Switcher: Menu vs My Orders */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setSubView('menu')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              subView === 'menu'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>منوی کافه</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('my_orders')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 tabular-nums ${
              subView === 'my_orders'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>
              سفارش‌های من{activeMyOrdersCount > 0 ? ` (${activeMyOrdersCount})` : ''}
            </span>
          </button>
        </div>
      </div>

      {subView === 'menu' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Main Column: Categories + Product Grid */}
          <div className="lg:col-span-8 space-y-5">
            {/* Search & Category Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(Object.keys(CATEGORY_LABELS) as Array<'all' | CafeCategory>).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              <div className="relative sm:w-56 shrink-0">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در منو..."
                  className="w-full pr-9 pl-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Menu Grid */}
            {filteredMenu.length === 0 ? (
              <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2 text-slate-400">
                <Coffee className="w-9 h-9 mx-auto text-slate-600" />
                <div className="text-sm font-bold text-slate-300">آیتمی مطابق جستجوی شما یافت نشد</div>
                <div className="text-xs text-slate-500">دسته‌بندی یا عبارت جستجو را تغییر دهید.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMenu.map((item) => {
                  const activeOption = getOptionForItem(item);
                  const qtyInCart = getCartQtyForItem(item);
                  const cartKey = `${item.id}::${activeOption || ''}`;

                  return (
                    <article
                      key={item.id}
                      className="cv-auto group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors"
                    >
                      {/* 4:3 Photo */}
                      <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                        <ProductThumbnail
                          src={item.imageUrl}
                          alt={item.name}
                          unavailable={!item.isAvailable}
                        />
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                            <span className="text-xs font-bold text-rose-300 bg-slate-900/90 border border-rose-500/40 px-3 py-1 rounded-lg">
                              ناموجود در این لحظه
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span>{CATEGORY_LABELS[item.category]}</span>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1 tabular-nums">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {item.prepMinutes} دقیقه
                            </span>
                            {item.badgeText && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                                  <Sparkles className="w-3 h-3" />
                                  {item.badgeText}
                                </span>
                              </>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-white leading-snug">{item.name}</h3>

                          {item.description && (
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Options Selector */}
                        {item.options && item.options.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[11px] text-slate-400 block">انتخاب نوع:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.options.map((opt) => {
                                const isOptSelected = activeOption === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    disabled={!item.isAvailable}
                                    onClick={() =>
                                      setSelectedOptionsByItem((prev) => ({
                                        ...prev,
                                        [item.id]: opt,
                                      }))
                                    }
                                    className={`px-2 py-1 text-[11px] rounded-lg border transition-colors cursor-pointer disabled:opacity-40 ${
                                      isOptSelected
                                        ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 font-semibold'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Price & Add/Stepper Action */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="text-sm font-bold text-amber-400 tabular-nums">
                            {item.price.toLocaleString('fa-IR')}{' '}
                            <span className="text-[11px] font-normal text-slate-400">تومان</span>
                          </div>

                          {!item.isAvailable ? (
                            <span className="text-[11px] text-slate-500">اتمام موجودی</span>
                          ) : qtyInCart > 0 ? (
                            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl p-1">
                              <button
                                type="button"
                                onClick={() => onUpdateCartQty(cartKey, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                                aria-label="کم کردن"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-bold text-amber-400 tabular-nums">
                                {qtyInCart}
                              </span>
                              <button
                                type="button"
                                onClick={() => onAddToCart(item, activeOption)}
                                className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center cursor-pointer"
                                aria-label="افزودن"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onAddToCart(item, activeOption)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>افزودن</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column (Desktop Sticky Checkout Sidebar) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24">
            {renderCartCheckoutForm()}
          </aside>
        </div>
      ) : (
        /* MY ORDERS LIVE TRACKER */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-amber-400" />
                <span>پیگیری زنده سفارش‌های کافه شما</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تغییر وضعیت سفارش توسط باریستا به صورت لحظه‌ای در این صفحه نمایش داده می‌شود
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubView('menu')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              ثبت سفارش جدید
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3 text-slate-400">
              <UtensilsCrossed className="w-10 h-10 mx-auto text-slate-600" />
              <div className="text-sm font-bold text-slate-300">هنوز سفارشی ثبت نکرده‌اید</div>
              <button
                type="button"
                onClick={() => setSubView('menu')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl cursor-pointer"
              >
                مشاهده منوی کافه
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myOrders.map((order) => {
                const statusMeta = ORDER_STATUS_META[order.status];
                return (
                  <div
                    key={order.id}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white tabular-nums">
                          سفارش #{order.orderNumber}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {order.desk}
                        </span>
                      </div>

                      <span className={`text-xs font-bold ${statusMeta.colorClass}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    {/* Progress Steps (hidden if cancelled) */}
                    {order.status !== 'cancelled' && (
                      <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                        {[
                          { idx: 1, title: 'ثبت شد' },
                          { idx: 2, title: 'آماده‌سازی' },
                          { idx: 3, title: 'آماده تحویل' },
                          { idx: 4, title: 'تحویل شد' },
                        ].map((step) => {
                          const reached = statusMeta.stepIndex >= step.idx;
                          return (
                            <div key={step.idx} className="space-y-1 text-center">
                              <div
                                className={`h-1.5 rounded-full ${
                                  reached ? 'bg-amber-400' : 'bg-slate-800'
                                }`}
                              />
                              <span className={reached ? 'text-amber-300 font-semibold' : 'text-slate-500'}>
                                {step.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Items list */}
                    <div className="space-y-1.5 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/70">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2">
                          <span className="text-slate-200">
                            <span className="font-mono font-bold text-amber-400 ml-1.5 tabular-nums">
                              {it.quantity}×
                            </span>
                            {it.name}
                            {it.selectedOption && (
                              <span className="text-slate-400 text-[11px] mr-1.5">
                                ({it.selectedOption})
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-slate-400 tabular-nums">
                            {(it.unitPrice * it.quantity).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      ))}
                      {order.notes && (
                        <div className="pt-1.5 border-t border-slate-800/70 text-[11px] text-slate-400">
                          یادداشت: {order.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="text-slate-400 space-y-0.5">
                        <div>{PAYMENT_LABELS[order.paymentMethod]}</div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {new Date(order.createdAt).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-400 tabular-nums">
                          {order.totalAmount.toLocaleString('fa-IR')} تومان
                        </span>
                        {order.status === 'pending' && (
                          <button
                            type="button"
                            disabled={cancellingId === order.id}
                            onClick={() => handleCancelOrder(order.id)}
                            className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/70 text-rose-300 text-[11px] font-semibold rounded-lg cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>لغو</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mobile Compact Sticky Cart Bar (only when items in cart & in menu view) */}
      {subView === 'menu' && (cartTotalCount > 0 || confirmedOrder) && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-slate-900 border-t border-slate-800 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="text-xs">
              {cartTotalCount > 0 ? (
                <>
                  <span className="text-slate-400 tabular-nums">{cartTotalCount} قلم در سبد</span>
                  <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span>
                  <span className="font-bold text-amber-400 tabular-nums">
                    {cartTotalAmount.toLocaleString('fa-IR')} تومان
                  </span>
                </>
              ) : (
                <span className="text-emerald-300 font-semibold">
                  سفارش #{confirmedOrder?.orderNumber} ثبت شد
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                cartTotalCount > 0 ? setIsMobileCartOpen(true) : setSubView('my_orders')
              }
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{cartTotalCount > 0 ? 'تکمیل سفارش' : 'پیگیری سفارش'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Drawer Modal */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/90 p-4">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(false)}
              className="absolute left-3 top-3 z-10 text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded-lg cursor-pointer"
            >
              بستن ✕
            </button>
            {renderCartCheckoutForm()}
          </div>
        </div>
      )}
    </div>
  );
};
