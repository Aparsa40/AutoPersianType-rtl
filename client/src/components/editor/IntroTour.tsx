import React, { useEffect, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/store";

type Step = {
  key: string;
  selector: string;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    key: "editor",
    selector: '[data-testid="monaco-editor-container"]',
    title: "Editor",
    description: "محیط اصلی تایپ و ویرایش متن",
  },
  {
    key: "preview",
    selector: '[data-testid="markdown-preview-container"]',
    title: "Preview",
    description: "نمایش زنده خروجی مارک‌داون",
  },
  {
    key: "file",
    selector: '[data-testid="menu-file"]',
    title: "File Menu",
    description: "ساخت، باز کردن و خروجی گرفتن فایل",
  },
  {
    key: "settings",
    selector: '[data-testid="button-settings"]',
    title: "Settings",
    description: "تنظیمات و شخصی‌سازی محیط",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

export function IntroTour() {
  const { showIntro, setShowIntro } = useEditorStore();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = steps[index];

  // فقط یک بار: آیا قبلاً دیده شده؟
  useEffect(() => {
    try {
      if (!localStorage.getItem("typewriterpro-intro-seen")) {
        setShowIntro(true);
      }
    } catch {
      setShowIntro(true);
    }
  }, [setShowIntro]);

  // محاسبه موقعیت المان
  const calculateRect = () => {
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }

    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });

    try {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    } catch {}
  };

  useLayoutEffect(() => {
    if (!showIntro) return;
    calculateRect();

    window.addEventListener("resize", calculateRect);
    window.addEventListener("scroll", calculateRect, true);

    return () => {
      window.removeEventListener("resize", calculateRect);
      window.removeEventListener("scroll", calculateRect, true);
    };
  }, [showIntro, index]);

  const close = (persist = true) => {
    setShowIntro(false);
    if (persist) {
      try {
        localStorage.setItem("typewriterpro-intro-seen", "1");
      } catch {}
    }
  };

  if (!showIntro) return null;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* Overlay */}
      {rect && (
        <>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => close()} />

          {/* Highlight box */}
          <div
            className="absolute border-2 border-primary rounded-md pointer-events-none"
            style={{
              top: rect.top - 4,
              left: rect.left - 4,
              width: rect.width + 8,
              height: rect.height + 8,
            }}
          />
        </>
      )}

      {/* Tooltip */}
      <div
        className="absolute pointer-events-auto bg-card text-card-foreground shadow-lg rounded-lg p-4 w-72"
        style={{
          top: rect ? rect.top : 80,
          left: rect
            ? Math.min(rect.left + rect.width + 12, window.innerWidth - 300)
            : 40,
        }}
      >
        <h3 className="font-semibold mb-2">{step.title}</h3>
        <p className="text-sm mb-4">{step.description}</p>

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => close()}>
            رد کردن
          </Button>

          {index < steps.length - 1 ? (
            <Button size="sm" onClick={() => setIndex((i) => i + 1)}>
              بعدی
            </Button>
          ) : (
            <Button size="sm" onClick={() => close()}>
              تمام
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default IntroTour;

