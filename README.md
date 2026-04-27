# Gold Studio MVP

اپلیکیشن وب موبایل‌فرست فارسی/RTL برای تبدیل عکس خام محصول و جواهر به تصویر استودیویی.

## Tech
- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma + MySQL
- Gemini API

## Setup
1. نصب وابستگی‌ها:
   ```bash
   npm install
   ```
2. ساخت فایل env:
   ```bash
   cp .env.example .env
   ```
3. مقداردهی متغیرهای `.env` (شامل `DATABASE_URL` و `PRISMA_ACCELERATE_URL`).
4. ساخت کلاینت Prisma:
   ```bash
   npx prisma generate
   ```
5. اعمال migration روی دیتابیس:
   ```bash
   npx prisma migrate dev --name init
   ```
6. اجرا:
   ```bash
   npm run dev
   ```

## مسیرها
- `/` لندینگ
- `/signup` و `/login` احراز هویت
- `/dashboard` داشبورد کاربر
- `/projects/new` ایجاد پروژه با آپلود + انتخاب سبک + تولید
- `/projects` و `/projects/[projectId]` مشاهده نتیجه و دانلود
- `/admin` مدیریت دستی اعتبار کاربران
