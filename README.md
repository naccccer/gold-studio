# Gold Studio

اپلیکیشن وب موبایل‌فرست فارسی (RTL) برای تبدیل تصاویر ضعیف محصول/جواهر به خروجی استودیویی.

## راه‌اندازی سریع

```bash
npm install
npm run dev
```

## متغیرهای محیطی موردنیاز

یک فایل `.env` بسازید:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/gold_studio"
AUTH_SECRET="a-long-random-secret"
AUTH_URL="http://localhost:3000"

SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="change-me-strong"
SEED_ADMIN_NAME="مدیر اصلی"
```

## دیتابیس و ادمین اولیه

```bash
npm run db:generate
npm run db:migrate -- --name auth_foundation
npm run db:seed
```

بعد از seed می‌توانید با کاربر ادمین وارد `/login` شوید.
