#!/bin/bash
# ==============================================================
# اسکریپت نصب و راه‌اندازی خودکار همکار هاب روی سرور اوبونتو
# سازگار با: Ubuntu 20.04 / 22.04 / 24.04 LTS
# ==============================================================
set -e

echo "🚀 در حال آماده‌سازی و نصب سامانه همکار هاب روی سرور اوبونتو..."

# ۱. به‌روزرسانی مخازن اوبونتو
sudo apt-get update -y
sudo apt-get install -y curl ufw unzip git

# ۲. بررسی و نصب Node.js نسخه ۲۰ LTS
if ! command -v node &> /dev/null; then
    echo "📦 در حال نصب Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ نسخه Node.js: $(node -v)"
echo "✅ نسخه NPM: $(npm -v)"

# ۳. نصب وابستگی‌های پروژه
echo "📦 در حال نصب پکیج‌های پروژه..."
npm install

# ۴. کامپایل و بیلد فرانت‌اند
echo "🔨 در حال کامپایل پروژه..."
npm run build

# ۵. باز کردن پورت ۳۰۰۰ در فایروال اوبونتو (UFW)
sudo ufw allow 3000/tcp || true

# ۶. ثبت سرویس خودکار پس‌زمینه در systemd برای اجرای دائمی
CURRENT_DIR=$(pwd)
NODE_EXEC=$(which node)

echo "⚙️ در حال پیکربندی سرویس daemon در systemd..."

sudo bash -c "cat <<EOF > /etc/systemd/system/hamkarhub.service
[Unit]
Description=HamkarHub Coworking Local Chat and MikroTik Hotspot Server
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$CURRENT_DIR
ExecStart=$NODE_EXEC $CURRENT_DIR/node_modules/tsx/dist/cli.mjs server.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable hamkarhub.service
sudo systemctl restart hamkarhub.service

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================================="
echo "🎉 سامانه همکار هاب با موفقیت نصب و فعال شد!"
echo "🌐 آدرس دسترسی در شبکه وای‌فای: http://$SERVER_IP:3000"
echo "🔐 پنل مدیریت ادمین: http://$SERVER_IP:3000 (رمز عبور اولیه: admin123)"
echo "📌 وضعیت سرویس: sudo systemctl status hamkarhub"
echo "=========================================================="
