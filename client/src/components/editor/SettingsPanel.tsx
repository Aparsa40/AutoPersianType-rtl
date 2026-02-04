import { useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useEditorStore } from "@/lib/store";

export function SettingsPanel() {
  const { showSettings, toggleSettings, settings, setSettings } = useEditorStore();

  return (
    <Sheet open={showSettings} onOpenChange={toggleSettings}>
      <SheetContent className="w-[400px] sm:max-w-[400px] overflow-y-auto" data-testid="settings-panel">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-semibold">Settings</SheetTitle>
          <SheetDescription>
            Customize your editing experience
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          <Separator />

          <section>
            <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wide">
              Editor Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="word-wrap">Word Wrap</Label>
                  <p className="text-xs text-muted-foreground">
                    Wrap long lines to fit the editor width
                  </p>
                </div>
                <Switch
                  id="word-wrap"
                  checked={settings.wordWrap}
                  onCheckedChange={(checked) => setSettings({ wordWrap: checked })}
                  data-testid="switch-word-wrap"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="line-numbers">Line Numbers</Label>
                  <p className="text-xs text-muted-foreground">
                    Show line numbers in the gutter
                  </p>
                </div>
                <Switch
                  id="line-numbers"
                  checked={settings.showLineNumbers}
                  onCheckedChange={(checked) => setSettings({ showLineNumbers: checked })}
                  data-testid="switch-line-numbers"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="minimap">Minimap</Label>
                  <p className="text-xs text-muted-foreground">
                    Show document overview on the side
                  </p>
                </div>
                <Switch
                  id="minimap"
                  checked={settings.showMinimap}
                  onCheckedChange={(checked) => setSettings({ showMinimap: checked })}
                  data-testid="switch-minimap"
                />
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wide">
              Localization
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-direction">Auto Direction</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically detect RTL/LTR for Farsi and English
                  </p>
                </div>
                <Switch
                  id="auto-direction"
                  checked={settings.autoDirection}
                  onCheckedChange={(checked) => setSettings({ autoDirection: checked })}
                  data-testid="switch-auto-direction"
                />
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
