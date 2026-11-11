#!/usr/bin/env bash
# ==============================================================
# 🚀 HamkarHub Quick GitHub Installer
# اسکریپت نصب یک‌خطی همکار هاب مستقیم از گیت‌هاب روی اوبونتو
# ==============================================================
set -e

# بررسی مجوز روت یا sudo
if [ "$EUID" -ne 0 ]; then
    if ! command -v sudo &> /dev/null; then
        echo "❌ لطفاً این اسکریپت را با کاربر root یا با دستور sudo اجرا فرمایید."
        exit 1
    fi
    SUDO="sudo"
else
    SUDO=""
fi

echo ""
echo "=========================================================="
echo "  🚀 نصب خودکار سامانه همکار هاب از مخزن گیت‌هاب"
echo "  سازگار با: Ubuntu 20.04 / 22.04 / 24.04 LTS"
echo "=========================================================="
echo ""

# ۱. نصب پیش‌نیازهای اولیه
echo "📦 ۱/۵ نصب ابزارهای پایه (git, curl, ufw, build-essential)..."
$SUDO apt-get update -y
$SUDO apt-get install -y git curl ufw unzip build-essential

# ۲. بررسی و نصب Node.js 20 LTS
echo "📦 ۲/۵ بررسی و نصب Node.js 20 LTS..."
NEED_NODE=0
if ! command -v node &> /dev/null; then
    NEED_NODE=1
else
    NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "نسخه Node.js فعلی ($NODE_MAJOR) قدیمی است، ارتقا به نسخه 20..."
        NEED_NODE=1
    fi
fi

if [ "$NEED_NODE" -eq 1 ]; then
    echo "⚡ در حال راه‌اندازی مخزن رسمی Node.js 20 LTS..."
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

# ۳. تعیین دایرکتوری نصب یا کلون از گیت‌هاب
TARGET_DIR="/opt/hamkarhub"

# اگر کاربر از داخل یک پوشه ریپو این اسکریپت را صدا زده باشد:
if [ -f "./server.ts" ] && [ -f "./package.json" ]; then
    TARGET_DIR=$(pwd)
    echo "📁 تشخیص داده شد که از قبل درون ریپو قرار دارید: $TARGET_DIR"
else
    # دریافت آدرس ریپو در صورت پاس دادن به عنوان متغیر یا آرگومان اول
    REPO_URL="${1:-${GITHUB_REPO:-}}"
    if [ -z "$REPO_URL" ]; then
        # اگر کاربر ریپو را پاس نداده باشد، اگر در گیت‌هاب باشیم می‌توانیم از مبدا استفاده کنیم
        REPO_URL="https://github.com/amirazamidev/hamkarhub.git"
    fi

    echo "📁 ۳/۵ آماده‌سازی دایرکتوری در $TARGET_DIR..."
    if [ -d "$TARGET_DIR/.git" ]; then
        echo "🔄 ریپو از قبل وجود دارد، در حال به‌روزرسانی (git pull)..."
        cd "$TARGET_DIR"
        $SUDO git pull || true
    else
        $SUDO rm -rf "$TARGET_DIR" 2>/dev/null || true
        echo "📥 در حال کلون کردن پروژه از گیت‌هاب ($REPO_URL)..."
        $SUDO git clone "$REPO_URL" "$TARGET_DIR" || {
            echo "⚠️ کلون از آدرس مستقیم ناموفق بود."
            echo "در صورت خصوصی بودن مخزن (Private)، ابتدا با دستور زیر کلون کنید:"
            echo "   git clone https://github.com/amirazamidev/hamkarhub.git $TARGET_DIR"
            exit 1
        }
        cd "$TARGET_DIR"
    fi
fi

cd "$TARGET_DIR"

RUN_USER="${SUDO_USER:-$(whoami)}"
$SUDO chown -R "$RUN_USER:$RUN_USER" "$TARGET_DIR" || true

# ۴. نصب وابستگی‌های پکیج و ساخت بیلد فرانت‌اند
echo "📦 ۴/۵ در حال نصب پکیج‌های npm (این فرآیند ممکن است ۱ تا ۲ دقیقه طول بکشد)..."
npm install --legacy-peer-deps

echo "🔨 در حال ساخت بیلد نهایی پروژه (npm run build)..."
npm run build

# ۵. پیکربندی فایروال و سرویس daemon دائمی systemd
echo "⚙️ ۵/۵ راه‌اندازی سرویس خودکار پس‌زمینه (systemd)..."
$SUDO ufw allow 3000/tcp || true

NODE_PATH=$(which node)
RUN_USER=$(logname 2>/dev/null || echo $SUDO_USER)
if [ -z "$RUN_USER" ]; then
    RUN_USER=$(whoami)
fi

$SUDO bash -c "cat <<EOF > /etc/systemd/system/hamkarhub.service
[Unit]
Description=HamkarHub Coworking Hotspot Chat Server
After=network.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$TARGET_DIR
ExecStart=$NODE_PATH $TARGET_DIR/node_modules/tsx/dist/cli.mjs server.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF"

$SUDO chown -R $RUN_USER:$RUN_USER "$TARGET_DIR" || true

$SUDO systemctl daemon-reload
$SUDO systemctl enable hamkarhub.service
$SUDO systemctl restart hamkarhub.service

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================================="
echo "🎉 سامانه همکار هاب با یک کامند با موفقیت نصب و فعال شد!"
echo "=========================================================="
echo "🌐 آدرس دسترسی در شبکه وای‌فای: http://${SERVER_IP}:3000"
echo "🔐 پنل ادمین و مدیریت میکروتیک: http://${SERVER_IP}:3000 (رمز پیش‌فرض: admin123)"
echo "📊 وضعیت سرویس: sudo systemctl status hamkarhub"
echo "🔄 ری‌استارت سرویس: sudo systemctl restart hamkarhub"
echo "=========================================================="
echo ""
