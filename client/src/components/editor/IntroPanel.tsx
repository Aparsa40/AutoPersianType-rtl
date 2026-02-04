import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useEditorStore } from "@/lib/store";

const INTRO_SEEN_KEY = "AutoPersianType.intro_shown";

export function IntroPanel() {
  const { showIntro, toggleIntro, setShowIntro, introItems, focusedIntroId } = useEditorStore();

  useEffect(() => {
    // run once on mount: if user hasn't seen intro, open it
    try {
      const seen = localStorage.getItem(INTRO_SEEN_KEY);
      if (!seen) {
        useEditorStore.getState().setShowIntro(true);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // scroll to focused intro item when opening specifically via openIntroFor
  useEffect(() => {
    if (!showIntro || !focusedIntroId) return;
    try {
      const el = document.getElementById(`intro-${focusedIntroId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {}
  }, [showIntro, focusedIntroId]);

  const markSeen = () => {
    try { localStorage.setItem(INTRO_SEEN_KEY, "1"); } catch {}
    useEditorStore.getState().setShowIntro(false);
  };

  return (
    <Sheet open={showIntro} onOpenChange={(open) => setShowIntro(Boolean(open))}>
      <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto" data-testid="intro-panel">
        <SheetHeader className="mb-3">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-semibold">معرفی و راهنما</SheetTitle>
              <SheetDescription>راهنمای کوتاه برای منوها و امکانات اصلی برنامه</SheetDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={markSeen}>دیگر نشان نده</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowIntro(false)}><X /></Button>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {introItems.map((it) => (
            <section key={it.id} id={`intro-${it.id}`} className={focusedIntroId === it.id ? 'ring-2 ring-primary rounded-sm p-2' : ''}>
              <h4 className="text-sm font-medium mb-2">{it.title}</h4>
              <p className="text-sm text-muted-foreground">{it.description}</p>
              <Separator className="my-3" />
            </section>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => setShowIntro(false)}>بستن</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
