import { useState, useCallback } from "react";
import { Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MAX_COLS = 8;
const MAX_ROWS = 8;

export function TableBuilder() {
  const { showTableBuilder, toggleTableBuilder } = useEditorStore();
  const { toast } = useToast();
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [mode, setMode] = useState<"quick" | "custom">("quick");

  const handleCellHover = useCallback((row: number, col: number) => {
    setHoverCell({ row, col });
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    setRows(row);
    setCols(col);
    generateTable(row, col);
  }, []);

  const generateTable = useCallback((rowCount: number, colCount: number) => {
    let markdown = "\n";
    
    const headerRow = Array(colCount).fill("Header").map((h, i) => `${h} ${i + 1}`);
    markdown += "| " + headerRow.join(" | ") + " |\n";
    
    markdown += "| " + Array(colCount).fill("---").join(" | ") + " |\n";
    
    for (let i = 0; i < rowCount - 1; i++) {
      const row = Array(colCount).fill("Cell").map((c, j) => `${c} ${i + 1}-${j + 1}`);
      markdown += "| " + row.join(" | ") + " |\n";
    }
    
    markdown += "\n";

    const insertTextAtCursor = (window as any).insertTextAtCursor;
    if (insertTextAtCursor) {
      insertTextAtCursor(markdown);
    }

    toggleTableBuilder();
    toast({
      title: "Table Created",
      description: `Inserted a ${rowCount}x${colCount} table.`,
    });
  }, [toggleTableBuilder, toast]);

  const handleGenerateCustom = useCallback(() => {
    if (rows > 0 && cols > 0) {
      generateTable(rows, cols);
    }
  }, [rows, cols, generateTable]);

  return (
    <Dialog open={showTableBuilder} onOpenChange={toggleTableBuilder}>
      <DialogContent className="sm:max-w-[500px]" data-testid="table-builder-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table2 className="w-5 h-5" />
            Table Builder
          </DialogTitle>
          <DialogDescription>
            Create a Markdown table by selecting dimensions or entering custom values.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant={mode === "quick" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("quick")}
              data-testid="button-mode-quick"
            >
              Quick Select
            </Button>
            <Button
              variant={mode === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("custom")}
              data-testid="button-mode-custom"
            >
              Custom Size
            </Button>
          </div>

          {mode === "quick" ? (
            <div className="flex flex-col items-center">
              <div className="grid gap-1 p-4 bg-muted/50 rounded-lg" style={{ direction: "ltr" }}>
                {Array.from({ length: MAX_ROWS }, (_, rowIdx) => (
                  <div key={rowIdx} className="flex gap-1">
                    {Array.from({ length: MAX_COLS }, (_, colIdx) => {
                      const row = rowIdx + 1;
                      const col = colIdx + 1;
                      const isHighlighted =
                        hoverCell && row <= hoverCell.row && col <= hoverCell.col;

                      return (
                        <button
                          key={colIdx}
                          className={cn(
                            "w-8 h-8 rounded-sm border transition-colors",
                            isHighlighted
                              ? "bg-primary border-primary"
                              : "bg-background border-border hover:border-primary/50"
                          )}
                          onMouseEnter={() => handleCellHover(row, col)}
                          onMouseLeave={() => setHoverCell(null)}
                          onClick={() => handleCellClick(row, col)}
                          data-testid={`table-cell-${row}-${col}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {hoverCell
                  ? `${hoverCell.row} × ${hoverCell.col} table`
                  : "Hover to select size"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rows">Rows</Label>
                  <Input
                    id="rows"
                    type="number"
                    min={1}
                    max={20}
                    value={rows}
                    onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                    data-testid="input-rows"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cols">Columns</Label>
                  <Input
                    id="cols"
                    type="number"
                    min={1}
                    max={20}
                    value={cols}
                    onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                    data-testid="input-cols"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Will create a {rows} × {cols} table
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-3 -mx-6 px-6 border-t">
          <Button variant="outline" onClick={toggleTableBuilder} data-testid="button-cancel">
            Cancel
          </Button>
          {mode === "custom" && (
            <Button onClick={handleGenerateCustom} data-testid="button-generate">
              Generate Table
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
