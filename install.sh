#!/bin/bash
# ==============================================================================
# اسکریپت نصب و راه‌اندازی کامل سامانه همکار هاب روی سرور اوبونتو (install.sh)
# سازگار با Ubuntu 20.04 / 22.04 / 24.04 LTS
# ==============================================================================
set -e

echo ""
echo "=========================================================="
echo "  🚀 در حال راه‌اندازی و نصب سامانه همکار هاب..."
echo "=========================================================="
echo ""

# ۱. تشخیص سطح دسترسی (اجرا با دسترسی root یا sudo)
if [ "$EUID" -ne 0 ]; then
    if ! command -v sudo &> /dev/null; then
        echo "❌ خطا: لطفاً این اسکریپت را با دسترسی root یا با دستور sudo اجرا کنید."
        exit 1
    fi
    SUDO="sudo"
else
    SUDO=""
fi

# ۲. به‌روزرسانی مخازن و نصب بسته‌های پیش‌نیاز
echo "📦 ۱/۵ به‌روزرسانی مخازن لینوکس و نصب پیش‌نیازها..."
$SUDO apt-get update -y
$SUDO apt-get install -y curl ufw unzip git build-essential

# ۳. بررسی و نصب Node.js نسخه ۲۰ LTS
echo "📦 ۲/۵ بررسی و نصب Node.js نسخه 20 LTS..."
NEED_NODE=0
if ! command -v node &> /dev/null; then
    NEED_NODE=1
else
    NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "نسخه فعلی Node.js ($NODE_MAJOR) قدیمی است؛ ارتقا به نسخه 20..."
        NEED_NODE=1
    fi
fi

if [ "$NEED_NODE" -eq 1 ]; then
    echo "⚡ در حال راه‌اندازی مخزن رسمی NodeSource نسخه 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
    if [ "$EUID" -ne 0 ]; then
        sudo bash /tmp/nodesource_setup.sh
        sudo apt-get install -y nodejs
    else
        bash /tmp/nodesource_setup.sh
        apt-get install -y nodejs
    fi
    rm -f /tmp/nodesource_setup.sh
fi

echo "✅ نسخه Node.js: $(node -v)"
echo "✅ نسخه NPM: $(npm -v)"

# ۴. حل تداخل وابستگی‌های esbuild و نصب کامل پکیج‌ها
CURRENT_DIR=$(pwd)
SERVICE_USER="${SUDO_USER:-$(whoami)}"

echo "⚙️ تنظیم مالکیت دایرکتوری برای کاربر $SERVICE_USER..."
$SUDO chown -R "$SERVICE_USER:$SERVICE_USER" "$CURRENT_DIR" || true

echo "📦 ۳/۵ نصب وابستگی‌های پروژه با رفع تداخل esbuild (--legacy-peer-deps)..."
npm install --legacy-peer-deps

# ۵. کامپایل و ساخت بیلد فرانت‌اند با بهینه‌سازی حافظه و ۴ هسته پردازنده
echo "🔨 ۴/۵ ساخت بیلد نهایی پروژه (npm run build)..."
export UV_THREADPOOL_SIZE=4
NODE_OPTIONS="--max-old-space-size=1536" npm run build

# ۶. باز کردن پورت ۳۰۰۰ در فایروال اوبونتو (UFW)
echo "🛡️ باز کردن پورت 3000 در فایروال UFW..."
$SUDO ufw allow 3000/tcp || true

# ۷. ایجاد و راه‌اندازی سرویس دائمی systemd در پس‌زمینه
echo "⚙️ ۵/۵ پیکربندی سرویس دائمی در systemd..."
NODE_EXEC=$(which node)

$SUDO bash -c "cat <<EOF > /etc/systemd/system/hamkarhub.service
[Unit]
Description=HamkarHub Coworking Hotspot Chat Server
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$CURRENT_DIR
ExecStart=$NODE_EXEC $CURRENT_DIR/node_modules/tsx/dist/cli.mjs server.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=UV_THREADPOOL_SIZE=4
Environment=NODE_OPTIONS=--max-old-space-size=1024

[Install]
WantedBy=multi-user.target
EOF"

$SUDO systemctl daemon-reload
$SUDO systemctl enable hamkarhub.service
$SUDO systemctl restart hamkarhub.service

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================================="
echo "🎉 نصب با موفقیت تکمیل شد و پروژه آماده اجرا است!"
echo "=========================================================="
echo "🌐 آدرس سامانه در شبکه: http://${SERVER_IP}:3000"
echo "🔐 پنل مدیریت ادمین:   http://${SERVER_IP}:3000 (رمز پیش‌فرض: admin123)"
echo "📌 مدیریت سرویس در اوبونتو:"
echo "   - بررسی وضعیت: sudo systemctl status hamkarhub"
echo "   - ری‌استارت:    sudo systemctl restart hamkarhub"
echo "   - لاگ زنده:    sudo journalctl -u hamkarhub -f"
echo "=========================================================="
echo ""
