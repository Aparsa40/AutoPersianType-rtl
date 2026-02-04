# AutoPersianType — ویرایشگر Markdown حرفه‌ای (RTL/LTR) / Professional Markdown Editor (RTL/LTR)

**AutoPersianType** یک ویرایشگر Markdown متن‌باز با پشتیبانی هوشمند **RTL/LTR**، ویرایش با نگاشت منبع (source mapping) و خروجی **PDF/HTML/MD** است.
این ریپو تحت **MIT License** منتشر شده و آمادهٔ مشارکت شماست. فایل‌های اصلی راه‌انداز و استقرار تحت سیاست حفاظت ویژه (`CODEOWNERS`) قرار دارند.

**AutoPersianType** is an open-source Markdown editor with smart **RTL/LTR** support, source mapping, and PDF/HTML/MD export.
Core bootstrap/deployment files are protected under `CODEOWNERS`.

---

## 🚀 شروع سریع / Quick Start

### توسعه / Development

```bash
npm install
npm run dev
## ساخت و پیش‌نمایش / Build & Preview
npm run build
npm run preview
## اجرای Production / Production
npm run build
npm run start

🧪 تست کامل رندر Markdown / Markdown Rendering Test

فایل نمونه: docs/markdown-test.md

یا محتوای تست را در ویرایشگر قرار دهید و پیش‌نمایش بررسی شود.

هدینگ‌ها، لیست‌ها، جدول‌ها، بلوک‌های کد و ترکیب متن فارسی/انگلیسی (RTL/LTR) باید درست رندر شوند.
Headings, lists, tables, code blocks, and mixed RTL/LTR content should render correctly.

✨ ویژگی‌های جدید / New Features
🖋 Page Settings

منوی جدید زیر Tools → Page Settings اضافه شد تا ظاهر صفحه (فونت، اندازه، رنگ، فاصله صفحات، بوردر) را برای پیش‌نمایش و خروجی HTML/PDF تنظیم کنید.

New Tools → Page Settings menu allows you to configure font, size, colors, spacing, and borders for live preview and HTML/PDF export.

🔠 آپلود فونت / Font Upload

امکان آپلود فونت‌های محلی (.ttf, .otf, .woff, .woff2) در هر دو پنل Editor Settings و Page Settings اضافه شد.

Local font upload (.ttf, .otf, .woff, .woff2) is now available in Editor Settings and Page Settings.

## 🖼 درج تصویر / Image Insert

درج تصویر از Tools → Insert Picture باعث ذخیره تصویر در مدل سند (blocks) و اضافه شدن Markdown tag در محل نشانگر ویرایشگر می‌شود.

Inserting an image via Tools → Insert Picture saves it in the document model and adds a Markdown tag at the cursor.

## ⚡ بهبود عملکرد و رفع باگ‌ها / Performance & Bug Fixes
بهبود رندر پیش‌نمایش، رفع مشکلات ذخیره‌سازی محلی (localStorage) و بهبود تجربه کاربری کلی

Improved preview rendering, fixed localStorage issues, and general UX enhancements.

## 📦 PWA و آیکون‌ها / PWA and Icons
File Description
client/public/manifest.json تنظیمات PWA / PWA manifest
client/public/sw.js Service worker برای فعال‌سازی آفلاین / Offline service worker
🎨 تم‌ها / Themes
Theme Background Text Surface Accent
Light #FFFFFF #1A1A1A #F8F9FA #2563EB
Dark #1E1E1E #E0E0E0 #252526 #3B82F6
تم‌ها شامل Editor، Preview، Menu و Sidebar می‌شوند.
Themes affect Editor, Preview, Menu, Sidebar, and all UI components.
🛠 توسعه مشارکتی / Contributing

License: MIT — مشارکت آزاد

تغییر فایل‌های هسته‌ای (server/, package.json, drizzle.config.ts, vite.config.ts) نیازمند بررسی نگهدارندگان (CODEOWNERS)
See CONTRIBUTING.md for workflow and CODEOWNERS for core file protection.

## 🛠 راهنمای دیپلوی به Render / Deploying to Render
ریپو را در GitHub قرار دهید / Push the repo to GitHub
Web Service جدید بسازید / Create a new Web Service in Render
Build Command: npm run build
Start Command: npm run start
Environment: Node (latest)
(اختیاری) سرو کردن فایل‌های استاتیک / Optional: Serve static files via Web Service
راهنمای کامل: docs/deploy-to-render.md / Full guide in docs/deploy-to-render.md

## 🔗 مستندات و فایل‌های مرتبط / Documentation & Files
CONTRIBUTING.md — راهنمای مشارکت / Contribution guide
CODEOWNERS — حفاظت فایل‌های هسته‌ای / Core file protection
SECURITY.md — امنیت و گزارش باگ / Security and bug reporting
SECURITY_CONTACT.txt — راهنمای تماس / Security contact
design_guidelines.md — دستورالعمل‌های طراحی / Design guidelines

# New README_UPDATE.md
# AutoPersianType

AutoPersianType is a web application for typing Persian text efficiently.
AutoPersianType یک برنامه وب برای تایپ سریع و بهینه متن فارسی است.

---

## Features / امکانات

- Fast Persian typing / تایپ سریع فارسی
- RTL support / پشتیبانی از راست‌به‌چپ
- Customizable keyboard / کیبورد قابل تنظیم

---

## Deployment / نسخه دیپلوی

- Live on Render: [autopersiantype-rtl.onrender.com](https://autopersiantype-rtl.onrender.com)

---

## Repository / ریپو

- GitHub: [https://github.com/Aparsa40/AutoPersianType-rtl](https://github.com/Aparsa40/AutoPersianType-rtl.git)

---

## Contributing / مشارکت

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.
لطفاً برای قوانین مشارکت به [CONTRIBUTING.md](./CONTRIBUTING.md) مراجعه کنید.

---

## Security / امنیت

Please see [SECURITY.md](./SECURITY.md) for reporting vulnerabilities.
برای گزارش مشکلات امنیتی به [SECURITY.md](./SECURITY.md) مراجعه کنید.


# 📄 License

این پروژه تحت مجوز MIT منتشر شده است — به LICENSE مراجعه کنید.
This project is licensed under MIT — see LICENSE.

# 💡 نکات مهم / Tips

تمامی تغییرات UI و تنظیمات فونت/صفحه در Page Settings اعمال می‌شوند.
پیش‌نمایش زنده همیشه با محتوا همگام است و جهت متن (RTL/LTR) خودکار شناسایی می‌شود.
استفاده از ریپو برای توسعه، تست و Export کاملاً رایگان است و محدودیتی ندارد.
