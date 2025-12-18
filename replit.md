# AutoPersianType - Professional bilingual Markdown Editor

## Overview

AutoPersianType is a cross-platform professional Markdown editor built with React and Express. The application provides a sophisticated writing environment with intelligent RTL/LTR auto-detection for Farsi and English content, live preview rendering, and multiple export formats. It features a Monaco Editor integration (VS Code's editor) for a premium editing experience, along with a comprehensive theming system and document management capabilities.

The application is designed for writers who work with multilingual content, particularly those who write in both Farsi (Persian) and English, requiring seamless direction switching without manual intervention.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- Single-page application (SPA) architecture

**State Management**
- Zustand with persistence middleware for global application state
- TanStack React Query for server state management and caching
- Local state stored in browser's localStorage for settings persistence

**UI Component System**
- shadcn/ui component library based on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Custom theme system supporting light and dark modes
- Design inspired by VS Code (editor), Notion (document experience), and Typora (Markdown focus)

**Editor Integration**
- Monaco Editor (VS Code's editor) via @monaco-editor/react
- Custom themes defined for light and dark modes
- Markdown syntax highlighting with custom token rules
- Auto-direction detection for RTL/LTR content

**Layout System**
- Resizable split-pane layout using react-resizable-panels
- Flexible editor/preview split (default 50/50, adjustable 30/70 to 70/30)
- Collapsible sidebar for document outline (280px fixed width)
- Settings panel as right-side sheet overlay (400px width)

**Direction Detection & Rendering**
- Custom direction detection algorithm analyzing Unicode character ranges
- RTL detection for Persian/Arabic scripts (U+0591-U+07FF, U+FB1D-U+FDFD, U+FE70-U+FEFC)
- LTR detection for Latin characters
- Per-paragraph direction application in preview
- Real-time direction feedback in status bar

**Markdown Processing**
- Marked.js for Markdown-to-HTML conversion
- GitHub Flavored Markdown (GFM) support
- Custom HTML post-processing for direction attributes
- Dynamic styling for blockquotes, lists, and headings based on text direction

**Export Capabilities**
- PDF export using html2canvas and jsPDF
- HTML export with embedded styles
- Markdown export (raw content)
- Export functionality integrated into MenuBar component

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- Dual-mode server configuration (development and production)
- Custom logging middleware for API requests

**Development vs Production**
- Development: Vite middleware integration with HMR support
- Production: Static file serving from pre-built dist directory
- Environment-based configuration using NODE_ENV

**API Design**
- RESTful API endpoints under `/api` namespace
- JSON request/response format
- Error handling with appropriate HTTP status codes

**Storage Layer**
- Abstracted storage interface (`IStorage`) for flexibility
- In-memory storage implementation (`MemStorage`) as default
- Prepared for database migration with schema-first approach
- Document model includes: id, title, content, createdAt, updatedAt

**API Endpoints**
- `GET /api/documents` - List all documents (sorted by updatedAt descending)
- `GET /api/documents/:id` - Retrieve specific document
- `POST /api/documents` - Create new document
- `PATCH /api/documents/:id` - Update existing document
- `DELETE /api/documents/:id` - Delete document

### Data Management

**Schema Validation**
- Zod for runtime type validation
- Schema definitions in shared directory for client/server consistency
- Type inference from Zod schemas for TypeScript types

**Document Schema**
```typescript
{
  id: string
  title: string
  content: string
  createdAt: string (ISO date)
  updatedAt: string (ISO date)
}
```

**Editor Settings Schema**
- Font family, size, and line height
- Word wrap and auto-direction toggles
- Line numbers and minimap visibility
- Tab size configuration
- All settings with default values and validation ranges

**Application State**
- Current document reference
- Theme preference (light/dark)
- Editor settings
- UI panel visibility flags (sidebar, preview, settings, table builder)
- Real-time metrics (headings, cursor position, word/character counts)
- Document modification status

### Database Preparation

**Drizzle ORM Configuration**
- Configured for PostgreSQL dialect
- Schema location: `./shared/schema.ts`
- Migrations output: `./migrations` directory
- Connection via DATABASE_URL environment variable
- Currently using in-memory storage but ready for database migration

**Note on Database**
The application is configured with Drizzle ORM and PostgreSQL schema but currently uses in-memory storage. The schema structure in `shared/schema.ts` defines the data models, and the storage interface in `server/storage.ts` provides an abstraction layer allowing easy migration to database-backed storage without modifying API routes.

### Typography & Internationalization

**Font Strategy**
- English/Code: Inter (UI), JetBrains Mono (editor)
- Farsi/RTL: Vazirmatn for all Persian text
- Fallback: system-ui, sans-serif
- Fonts loaded via Google Fonts with preconnect optimization

**Direction Handling**
- Automatic detection at paragraph level
- Separate detection for editor and preview
- Mixed-content support with character-ratio analysis
- Visual indicators in status bar

## External Dependencies

### UI & Styling
- **Radix UI**: Comprehensive set of accessible, unstyled component primitives (@radix-ui/react-*)
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **class-variance-authority**: For component variant management
- **tailwind-merge**: Intelligent Tailwind class merging

### Editor & Markdown
- **Monaco Editor** (@monaco-editor/react): VS Code's editor component
- **marked**: Fast Markdown parser and compiler
- **html2canvas**: HTML to canvas conversion for PDF export
- **jsPDF**: PDF generation library

### State Management & Data Fetching
- **Zustand**: Lightweight state management with persistence
- **TanStack React Query**: Server state management and caching
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Validation resolver for React Hook Form

### Routing & Utilities
- **wouter**: Minimalist routing library
- **date-fns**: Modern date utility library
- **nanoid**: Unique ID generation
- **clsx**: Conditional class name utility

### Database & Validation
- **Drizzle ORM** (drizzle-orm, drizzle-kit): TypeScript ORM
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **Zod**: TypeScript-first schema validation
- **drizzle-zod**: Integration between Drizzle and Zod

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety across the stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution for development server
- **@replit/vite-plugin-***: Replit-specific development enhancements

### Session & Middleware
- **connect-pg-simple**: PostgreSQL session store for Express
- **express-session** (implied): Session middleware for Express

### Design System References
The UI design draws inspiration from:
- **VS Code**: Editor interface patterns
- **Notion**: Document experience and interaction patterns
- **Typora**: Markdown-focused writing environment



# AutoPersianType - ویرایشگر حرفه‌ای Markdown دو زبانه

## مرور کلی

AutoPersianType یک ویرایشگر حرفه‌ای Markdown چندسکویی است که با React و Express ساخته شده است. این برنامه یک محیط نوشتاری پیشرفته با تشخیص خودکار هوشمند RTL/LTR برای محتوای فارسی و انگلیسی، رندر پیش‌نمایش زنده و فرمت‌های خروجی متعدد ارائه می‌دهد. این برنامه دارای یک ادغام ویرایشگر مونوکو (ویرایشگر VS Code) برای تجربه ویرایش ممتاز، به همراه یک سیستم تم‌سازی جامع و قابلیت‌های مدیریت سند است.

این برنامه برای نویسندگانی طراحی شده است که با محتوای چندزبانه کار می‌کنند، به‌ویژه کسانی که به‌طور همزمان به فارسی (پارسی) و انگلیسی می‌نویسند و به تغییر جهت بدون دخالت دستی نیاز دارند.

## ترجیحات کاربر

سبک ارتباطی مورد نظر: زبان ساده و روزمره.

## معماری سیستم

### معماری فرانت‌اند

**فریم‌ورک و سیستم ساخت**
- React 18 با TypeScript برای ایمنی نوع
- Vite به عنوان ابزار ساخت و سرور توسعه
- Wouter برای مسیریابی سمت کلاینت (جایگزین سبک‌وزن React Router)
- معماری برنامه تک‌صفحه‌ای (SPA)

**مدیریت وضعیت**
- Zustand با middleware پایداری برای وضعیت جهانی برنامه
- TanStack React Query برای مدیریت وضعیت سرور و کشینگ
- وضعیت محلی ذخیره شده در localStorage مرورگر برای پایداری تنظیمات

**سیستم کامپوننت UI**
- کتابخانه کامپوننت shadcn/ui مبتنی بر اصول Radix UI
- Tailwind CSS برای طراحی با توکن‌های طراحی سفارشی
- سیستم تم سفارشی که از حالت‌های روشن و تاریک پشتیبانی می‌کند
- طراحی الهام گرفته از VS Code (ویرایشگر)، Notion (تجربه سند) و Typora (تمرکز بر Markdown)

**ادغام ویرایشگر**
- ویرایشگر مونوکو (ویرایشگر VS Code) از طریق @monaco-editor/react
- تم‌های سفارشی تعریف شده برای حالت‌های روشن و تاریک
- هایلایت سینتکس Markdown با قوانین توکن سفارشی
- تشخیص خودکار جهت برای محتوای RTL/LTR

**سیستم چیدمان**
- چیدمان پنل تقسیم‌پذیر قابل تغییر اندازه با استفاده از react-resizable-panels
- تقسیم ویرایشگر/پیش‌نمایش انعطاف‌پذیر (پیش‌فرض 50/50، قابل تنظیم 30/70 تا 70/30)
- نوار کناری قابل جمع شدن برای نمای کلی سند (عرض ثابت 280px)
- پنل تنظیمات به عنوان پوشش ورق سمت راست (عرض 400px)

**تشخیص و رندر جهت**
- الگوریتم تشخیص جهت سفارشی که دامنه‌های کاراکتر Unicode را تحلیل می‌کند
- تشخیص RTL برای اسکریپت‌های فارسی/عربی (U+0591-U+07FF, U+FB1D-U+FDFD, U+FE70-U+FEFC)
- تشخیص LTR برای کاراکترهای لاتین
- اعمال جهت به‌ازای هر پاراگراف در پیش‌نمایش
- بازخورد جهت در زمان واقعی در نوار وضعیت

**پردازش Markdown**
- Marked.js برای تبدیل Markdown به HTML
- پشتیبانی از Markdown طعم‌دار GitHub (GFM)
- پردازش پس از HTML سفارشی برای ویژگی‌های جهت
- طراحی پویا برای نقل‌قول‌ها، لیست‌ها و عناوین بر اساس جهت متن

**قابلیت‌های خروجی**
- خروجی PDF با استفاده از html2canvas و jsPDF
- خروجی HTML با استایل‌های درون‌ساخته
- خروجی Markdown (محتوای خام)
- قابلیت خروجی ادغام شده در کامپوننت MenuBar

### معماری بک‌اند

**فریم‌ورک سرور**
- Express.js با TypeScript
- پیکربندی سرور دو حالته (توسعه و تولید)
- middleware لاگ‌گذاری سفارشی برای درخواست‌های API

**توسعه در مقابل تولید**
- توسعه: ادغام middleware Vite با پشتیبانی HMR
- تولید: سرویس‌دهی فایل‌های استاتیک از دایرکتوری dist پیش‌ساخته
- پیکربندی مبتنی بر محیط با استفاده از NODE_ENV

**طراحی API**
- نقاط پایانی API RESTful تحت فضای نام `/api`
- فرمت درخواست/پاسخ JSON
- مدیریت خطا با کدهای وضعیت HTTP مناسب

**لایه ذخیره‌سازی**
- رابط ذخیره‌سازی انتزاعی (`IStorage`) برای انعطاف‌پذیری
- پیاده‌سازی ذخیره‌سازی در حافظه (`MemStorage`) به عنوان پیش‌فرض
- آماده برای مهاجرت پایگاه داده با رویکرد مبتنی بر طرح
- مدل سند شامل: id، عنوان، محتوا، createdAt، updatedAt

**نقاط پایانی API**
- `GET /api/documents` - لیست تمام اسناد (مرتب شده بر اساس updatedAt به ترتیب نزولی)
- `GET /api/documents/:id` - بازیابی سند خاص
- `POST /api/documents` - ایجاد سند جدید
- `PATCH /api/documents/:id` - به‌روزرسانی سند موجود
- `DELETE /api/documents/:id` - حذف سند

### مدیریت داده‌ها

**اعتبارسنجی طرح**
- Zod برای اعتبارسنجی نوع در زمان اجرا
- تعاریف طرح در دایرکتوری مشترک برای سازگاری کلاینت/سرور
- استنتاج نوع از طرح‌های Zod برای انواع TypeScript

**طرح سند**
```typescript
{
  id: string
  title: string
  content: string
  createdAt: string (ISO date)
  updatedAt: string (ISO date)
}
```

**طرح تنظیمات ویرایشگر**
- خانواده فونت، اندازه و ارتفاع خط
- تنظیمات برش کلمات و تغییر خودکار جهت
- شماره خطوط و قابلیت مشاهده مینی‌مپ
- پیکربندی اندازه تب
- تمام تنظیمات با مقادیر پیش‌فرض و دامنه‌های اعتبارسنجی

**وضعیت برنامه**
- مرجع سند فعلی
- ترجیح تم (روشن/تاریک)
- تنظیمات ویرایشگر
- پرچم‌های قابلیت مشاهده پنل UI (نوار کناری، پیش‌نمایش، تنظیمات، سازنده جدول)
- معیارهای زمان واقعی (عناوین، موقعیت نشانگر، تعداد کلمات/کاراکترها)
- وضعیت تغییر سند

### آماده‌سازی پایگاه داده

**پیکربندی Drizzle ORM**
- پیکربندی شده برای گویش PostgreSQL
- محل طرح: `./shared/schema.ts`
- مهاجرت

پیش‌نیازها (حتماً داشته باش)

قبل از هر چیز این‌ها باید نصب باشند:

Node.js

نسخه پیشنهادی: Node 18 یا 20 (LTS)

با این دستور چک کن:

node -v


npm

معمولاً همراه Node نصب میشه

npm -v

نصب وابستگی‌ها (Dependencies)
حالت ایده‌آل (با lockfile)

چون خودت گفتی package-lock.json داری 👇
بهترین انتخاب همین است:

npm ci


✔️ مزیت‌ها:

دقیقاً همون نسخه‌هایی که پروژه باهاش تست شده نصب میشه

بیلد و اجرا پایدارتر

برای پروژه‌های جدی کاملاً استاندارد

⚠️ شرطش:

package-lock.json باید موجود و سالم باشه

حالت جایگزین (اگر lockfile نداشتی)
npm install

اجرای پروژه به صورت محلی (Development Mode)

با توجه به معماری‌ای که گفتی (React + Express با Vite middleware):

npm run dev


در این حالت:

Vite فرانت‌اند رو بالا میاره

Express به‌صورت dev با Vite یکپارچه میشه

HMR فعاله

معمولاً روی یکی از این‌ها اجرا میشه:

http://localhost:5173

یا پورتی که ترمینال اعلام می‌کنه

بیلد و اجرای Production (محلی)
1. بیلد پروژه
npm run build


این کار معمولاً:

React → dist/client یا dist

Server → فایل نهایی مثل dist/server.js یا مشابه

(دقیقش بستگی به اسکریپت‌هات داره ولی ساختارت استاندارده)

2. اجرای سرور بیلدشده
npm start


یا اگر اسکریپت نداشتی:

node dist/server.js


در این حالت:

Express فایل‌های استاتیک بیلد شده رو سرو می‌کنه

دیگه خبری از Vite و HMR نیست

دقیقاً مثل محیط پروداکشن

متغیرهای محیطی (در صورت نیاز)

اگر بعداً خواستی دیتابیس واقعی وصل کنی:

DATABASE_URL=postgresql://user:pass@host:port/db
NODE_ENV=production


فعلاً چون MemStorage فعاله، بدون دیتابیس هم اجرا میشه 👍

جمع‌بندی سریع

✔️ بله، npm ci کاملاً اوکی و انتخاب درستیه
✔️ ترتیب استاندارد:

npm ci
npm run dev


یا برای پروداکشن:

npm ci
npm run build
npm start


اگر دوست داری:

package.json و package-lock.json رو بفرست
→ دقیق می‌گم کدوم اسکریپت دقیقاً چی می‌سازه، کجا بیلد میشه و چی اجرا میشه

هر وقت آماده‌ای، بفرست 👌