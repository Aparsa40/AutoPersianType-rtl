# AutoPersianType Design Guidelines

## Design Approach

**Selected Approach:** Design System with Reference Inspiration
**Primary References:** VS Code (editor interface), Notion (document experience), Typora (Markdown focus)
**Design System:** Custom system drawing from Fluent Design principles with productivity-focused refinements

**Key Principles:**

- Clean, distraction-free editing environment
- Clear visual hierarchy between editor and preview
- Seamless RTL/LTR support without visual disruption
- Professional yet approachable interface

---

## Typography

**Font Families:**

- **English/Code:** 'Inter' for UI, 'JetBrains Mono' for editor
- **Farsi/RTL:** 'Vazirmatn' for all Persian text and mixed content
- **Fallback:** system-ui, sans-serif

**Hierarchy:**

- Menu bar: 14px medium weight
- Editor content: 16px (user adjustable 12-24px)
- Preview headings: H1 32px, H2 24px, H3 20px, H4 18px
- Settings labels: 14px regular
- Buttons/actions: 14px medium

---

## Layout System

**Spacing Units:** Tailwind-based with 2, 4, 6, 8, 12, 16, 24 unit increments

- Tight spacing: 2-4 units (p-2, m-4)
- Standard spacing: 6-8 units (p-6, gap-8)
- Section spacing: 12-16 units (py-12, mb-16)
- Large spacing: 24 units (py-24 for major sections)

**Grid Structure:**

- Application uses flexible split-pane layout (not traditional grid)
- Editor/Preview: Resizable 50/50 split (user adjustable 30/70 to 70/30)
- Sidebar: Fixed 280px width when expanded, 0px when collapsed
- Settings panel: 400px fixed overlay from right

---

## Core Layout Components

### Application Shell

- **Top Menu Bar:** Full-width, 48px height, fixed position
  - Left: App logo + menu items (File, Edit, View, Tools)
  - Right: Theme toggle + settings icon
  - Background: Subtle elevation with 1px bottom border

### Main Workspace (3-panel layout)

- **Left Sidebar (collapsible):** 280px width
  - Document outline (auto-generated from headings)
  - Recent files list
  - Padding: p-4, gap-2 between items

- **Center Editor Panel:** Flexible width
  - Monaco editor embedded, full height minus menu bar
  - No padding (editor handles internal spacing)
  - Line numbers on left (configurable)

- **Right Preview Panel (toggleable):** Flexible width
  - Live Markdown preview
  - Padding: p-8 for content breathing room
  - Matches editor scroll position

### Settings Panel Overlay

- Slides in from right, 400px width
- Semi-transparent backdrop (backdrop-blur)
- Close button top-right
- Sections: Font Settings, Editor Settings, Appearance
- Padding: p-6, gap-4 between sections

---

## Component Library

### Navigation (Menu Bar)

- Horizontal menu with dropdown support
- Items: px-4 py-2 spacing
- Hover state: subtle background change
- Active dropdown: shadow-lg, rounded corners
- Icons: 16px, aligned with text

### Editor Integration

- Monaco container: Full bleed, no borders
- Minimap: Optional, right side
- Status bar bottom: 32px height with file info, cursor position, language mode
- RTL/LTR indicator: Visual badge when auto-detected

### Preview Panel

- Clean typography rendering
- Code blocks: Background panel with syntax highlighting
- Tables: Full borders, alternating row backgrounds
- Blockquotes: Left border accent (4px width)
- Links: Underlined on hover
- Images: Max-width with centered alignment

### Buttons & Controls

- Primary action: Filled, 10px padding vertical, 20px horizontal, rounded-md
- Secondary: Outlined with border-2
- Icon buttons: Square 36px, rounded-md, centered icon
- Disabled state: 50% opacity

### Forms (Settings Panel)

- Labels: mb-2, font-medium
- Select dropdowns: Full width, p-2, border rounded
- Number inputs: w-24, p-2
- Toggle switches: Modern pill design, 48px width
- Spacing between form groups: mb-6

### Table Builder Modal

- Centered overlay, 600px width
- Grid preview: 8x8 cell selector
- Visual cell hover feedback
- Generate button: bottom-right, primary style
- Padding: p-6

### Modals & Overlays

- Centered on screen
- Max-width: 600px for dialogs, 400px for alerts
- Backdrop: Semi-transparent dark (rgba with backdrop-blur)
- Padding: p-6
- Close icon: top-right corner

---

## Responsive Behavior

**Desktop (>1024px):**

- Full 3-panel layout as described
- Menu bar with all items visible
- Settings panel 400px overlay

**Tablet (768px-1024px):**

- Editor/Preview stacked or side-by-side (user toggle)
- Sidebar collapses to hamburger menu
- Settings panel full-screen overlay

**Mobile (<768px):**

- Single panel view (Editor OR Preview)
- Toggle button to switch views
- Menu bar collapses to hamburger
- Settings panel: full-screen modal
- Simplified toolbar with essential actions only

---

## Theming Architecture

**Light Theme:**

- Background: Pure white (#FFFFFF)
- Surface: Light gray (#F8F9FA)
- Text: Dark gray (#1A1A1A)
- Borders: Light gray (#E0E0E0)
- Accent: Blue (#2563EB)

**Dark Theme:**

- Background: Deep dark (#1E1E1E)
- Surface: Charcoal (#252526)
- Text: Light gray (#E0E0E0)
- Borders: Dark gray (#3E3E42)
- Accent: Bright blue (#3B82F6)

**Theme Affects:**

- Editor background and syntax colors (Monaco theme switching)
- Preview panel background and text
- Menu bar and sidebar
- All UI components and borders
- Modal overlays

---

## RTL/LTR Visual Treatment

- Direction changes are content-based, not UI-based
- UI always LTR (menu bar, buttons, settings)
- Editor content: Auto-detects and applies direction per paragraph
- Preview: Matches editor direction exactly
- Visual indicator: Small badge showing current direction when auto-detected
- No layout shifts when direction changes—only text alignment

---

## Accessibility

- All interactive elements: min 44px touch target
- Keyboard navigation: Full support with visible focus rings
- Screen reader: Proper ARIA labels on all controls
- Color contrast: WCAG AA compliant in both themes
- Focus trap in modals

---

## No Images Required

This is a productivity tool—no hero images or marketing visuals needed. All visual interest comes from typography, spacing, and the editor/preview split interface.

دستورالعمل‌های طراحی # AutoPersianType'RTL'

## رویکرد طراحی

**رویکرد منتخب:** طراحی سیستم با الهام از منابع
**منابع اصلی:** VS Code (رابط ویرایشگر)، Notion (تجربه سند)، Typora (تمرکز بر Markdown)
**سیستم طراحی:** طراحی سیستم سفارشی از اصول طراحی فلوئنت با اصلاحات متمرکز بر بهره‌وری
**اصول کلیدی:**

- محیط ویرایش تمیز و بدون حواس‌پرتی
- سلسله مراتب بصری واضح بین ویرایشگر و پیش نمایش
- پشتیبانی یکپارچه از RTL/LTR بدون اختلال در دید
- رابط کاربری حرفه‌ای اما کاربرپسند

---

## تایپوگرافی

**خانواده فونت‌ها:**

- **انگلیسی/کد:** 'Inter' برای رابط کاربری، 'JetBrains Mono' برای ویرایشگر
- **فارسی/RTL:** 'Vazirmatn' برای تمام متن‌های فارسی و محتوای ترکیبی
- **جایگزین:** system-ui، sans-serif
**سلسله مراتب:**
- نوار منو: ۱۴ پیکسل با ضخامت متوسط
- محتوای ویرایشگر: 16 پیکسل (قابل تنظیم توسط کاربر 12-24 پیکسل)
- پیش‌نمایش سرتیترها: H1 32px، H2 24px، H3 20px، H4 18px
- برچسب‌های تنظیمات: ۱۴ پیکسل معمولی
- دکمه‌ها/عملکردها: ۱۴ پیکسل متوسط

---

## سیستم چیدمان

**واحدهای فاصله‌گذاری:** مبتنی بر Tailwind با افزایش‌های ۲، ۴، ۶، ۸، ۱۲، ۱۶، ۲۴ واحدی

- فاصله کم: ۲-۴ واحد (p-2، m-4)
- فاصله استاندارد: ۶-۸ واحد (p-6، gap-8)
- فاصله بین بخش‌ها: ۱۲-۱۶ واحد (py-12، mb-16)
- فاصله زیاد: ۲۴ واحد (py-24 برای بخش‌های اصلی)

**ساختار شبکه‌ای:**

- برنامه از طرح‌بندی انعطاف‌پذیر چندبخشی (نه شبکه سنتی) استفاده می‌کند
- ویرایشگر/پیش‌نمایش: تقسیم‌بندی قابل تغییر اندازه ۵۰/۵۰ (قابل تنظیم توسط کاربر از ۳۰/۷۰ تا ۷۰/۳۰)
- نوار کناری: عرض ثابت ۲۸۰ پیکسل در حالت باز، ۰ پیکسل در حالت بسته
- پنل تنظیمات: پوشش ثابت ۴۰۰ پیکسلی از راست

---

اجزای طرح‌بندی اصلی

### پوسته برنامه

- **نوار منوی بالا:** تمام عرض، ارتفاع ۴۸ پیکسل، موقعیت ثابت
- چپ: لوگوی برنامه + موارد منو (فایل، ویرایش، مشاهده، ابزارها)
- راست: تغییر تم + آیکون تنظیمات
- پس‌زمینه: برجستگی ظریف با حاشیه پایین ۱ پیکسل

### فضای کاری اصلی (طرح ۳ پنلی)

- **نوار کناری چپ (قابل جمع شدن):** عرض ۲۸۰ پیکسل
- طرح کلی سند (به صورت خودکار از سرفصل‌ها تولید می‌شود)
- لیست فایل‌های اخیر
- فاصله‌گذاری: p-4، فاصله بین آیتم‌ها 2

- **پنل ویرایشگر مرکزی:** عرض انعطاف‌پذیر
- ویرایشگر موناکو تعبیه شده، تمام قد منهای نوار منو
- بدون فاصله‌گذاری (ویرایشگر فاصله‌گذاری داخلی را مدیریت می‌کند)
- شماره خطوط در سمت چپ (قابل تنظیم)

- **پنل پیش‌نمایش سمت راست (قابل تغییر):** عرض انعطاف‌پذیر
- پیش‌نمایش زنده‌ی Markdown
- لایه گذاری: p-8 برای فضای تنفس محتوا
- با موقعیت اسکرول ویرایشگر مطابقت دارد

### پوشش پنل تنظیمات

- از سمت راست به صورت اسلایدی، با عرض ۴۰۰ پیکسل نمایش داده می‌شود
- پس‌زمینه نیمه‌شفاف (backdrop-blur)
- دکمه بستن در بالا سمت راست
- بخش‌ها: تنظیمات فونت، تنظیمات ویرایشگر، ظاهر
- لایه گذاری: p-6، فاصله بین بخش ها -4

کتابخانه کامپوننت

### ناوبری (نوار منو)

- منوی افقی با پشتیبانی از منوی کشویی
- موارد: فاصله پیکسل-۴، فاصله پی-۲
- حالت شناور: تغییر نامحسوس پس‌زمینه
- منوی کشویی فعال: shadow-lg، گوشه‌های گرد
- آیکن‌ها: ۱۶ پیکسل، هم‌تراز با متن

### ادغام ویرایشگر

- ظرف موناکو: لبه‌دار، بدون حاشیه
- مینی‌مپ: اختیاری، سمت راست
- نوار وضعیت پایین: ارتفاع ۳۲ پیکسل با اطلاعات فایل، موقعیت مکان‌نما، حالت زبان
- نشانگر RTL/LTR: نشان بصری هنگام شناسایی خودکار

### پنل پیش‌نمایش

- رندر تایپوگرافی تمیز
- بلوک‌های کد: پنل پس‌زمینه با هایلایت کردن سینتکس
- جداول: حاشیه کامل، پس‌زمینه ردیف‌های متناوب
- نقل قول‌های بلوکی: تأکید حاشیه چپ (عرض ۴ پیکسل)
- لینک‌ها: با نگه داشتن ماوس روی آنها زیرخط‌دار می‌شوند
- تصاویر: حداکثر عرض با ترازبندی مرکزی

### دکمه‌ها و کنترل‌ها

- اکشن اصلی: پر شده، فاصله عمودی 10 پیکسل، افقی 20 پیکسل، گرد-md
- ثانویه: با حاشیه-۲ مشخص شده است
- دکمه‌های آیکون: مربع ۳۶ پیکسل، گرد-md، آیکون در مرکز
- حالت غیرفعال: کدورت ۵۰٪

### فرم‌ها (پنل تنظیمات)

- برچسب‌ها: mb-2، font-medium
- منوی کشویی انتخاب: تمام عرض، p-2، حاشیه گرد
- ورودی‌های عدد: w-24، p-2
- کلیدهای تغییر وضعیت: طراحی قرصی مدرن، عرض ۴۸ پیکسل
- فاصله بین گروه‌های فرم: mb-6

### جدول ساز مودال

- پوشش مرکزی، عرض ۶۰۰ پیکسل
- پیش‌نمایش شبکه‌ای: انتخابگر سلول 8x8
- بازخورد شناور سلول بصری
- دکمه تولید: پایین سمت راست، سبک اصلی
- لایه گذاری: p-6

### ماژول‌ها و پوشش‌ها

- در مرکز صفحه نمایش
- حداکثر عرض: ۶۰۰ پیکسل برای دیالوگ‌ها، ۴۰۰ پیکسل برای هشدارها
- پس‌زمینه: نیمه‌شفاف تیره (rgba با پس‌زمینه تار)
- لایه گذاری: p-6
- آیکون بستن: گوشه بالا سمت راست

---

## رفتار واکنشی

**دسکتاپ (بیش از ۱۰۲۴ پیکسل):**

- طرح‌بندی کامل ۳ پنلی مطابق توضیحات
- نوار منو با تمام موارد قابل مشاهده
- پنل تنظیمات با پوشش ۴۰۰ پیکسلی

**تبلت (768px-1024px):**

- ویرایشگر/پیش‌نمایش به صورت روی هم چیده شده یا در کنار هم (با لمس کاربر)
- نوار کناری به منوی همبرگری تبدیل می‌شود
- پنل تنظیمات با پوشش تمام صفحه

**موبایل (<768px):**

- نمای تک پنل (ویرایشگر یا پیش نمایش)
- دکمه تغییر وضعیت برای تغییر نماها
- نوار منو به حالت همبرگری جمع می‌شود
- پنل تنظیمات: مودال تمام صفحه
- نوار ابزار ساده شده فقط با اقدامات ضروری

---

## معماری قالب‌بندی‌شده

**تم روشن:**

- پس‌زمینه: سفید خالص (#FFFFFF)
- سطح: خاکستری روشن (#F8F9FA)
- متن: خاکستری تیره (#1A1A1A)
- حاشیه‌ها: خاکستری روشن (#E0E0E0)
- رنگ: آبی (#2563EB)

**تم تیره:**

- پس‌زمینه: تیره‌ی تیره (#1E1E1E)
- سطح: زغال چوب (#252526)
- متن: خاکستری روشن (#E0E0E0)
- مرزها: دار
