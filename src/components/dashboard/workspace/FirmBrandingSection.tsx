import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Trash2, Upload, Layers, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useLayoutSettings, ImageOverlay } from "./LayoutSettingsContext";

const FirmBrandingSection = () => {
  const { settings, applySettings } = useLayoutSettings();
  const firmBranding = settings.firmBranding;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addLayer, setAddLayer] = useState<"background" | "foreground">("foreground");
  const [isDragOver, setIsDragOver] = useState(false);

  const updateOverlay = (id: string, updates: Partial<ImageOverlay>) => {
    applySettings({
      ...settings,
      firmBranding: {
        overlays: firmBranding.overlays.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      },
    });
  };

  const deleteOverlay = (id: string) => {
    applySettings({
      ...settings,
      firmBranding: {
        overlays: firmBranding.overlays.filter((o) => o.id !== id),
      },
    });
  };

  const addImage = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const newOverlay: ImageOverlay = {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        src,
        fileName: file.name,
        layer: addLayer,
        x: 10,
        y: 10,
        width: 25,
        opacity: addLayer === "background" ? 0.15 : 1,
        locked: false,
      };
      applySettings({
        ...settings,
        firmBranding: {
          overlays: [...firmBranding.overlays, newOverlay],
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(addImage);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Layer selector */}
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Add as</label>
        <div className="flex gap-1.5">
          {([
            { value: "foreground" as const, label: "Foreground", desc: "On top of content" },
            { value: "background" as const, label: "Background", desc: "Behind content" },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAddLayer(opt.value)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
              style={{
                background: addLayer === opt.value ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted) / 0.4)",
                color: addLayer === opt.value ? "#1c63a6" : "hsl(var(--muted-foreground))",
                border: addLayer === opt.value ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid transparent",
              }}
            >
              <span>{opt.label}</span>
              <span className="text-[10px] opacity-60">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-xl transition-all"
        style={{
          border: isDragOver
            ? "2px dashed hsl(215 70% 55%)"
            : "2px dashed hsl(var(--border))",
          background: isDragOver
            ? "hsl(215 70% 55% / 0.06)"
            : "hsl(var(--muted) / 0.3)",
          padding: "24px 16px",
          textAlign: "center",
        }}
      >
        <Upload size={24} style={{ color: "#1c63a6", margin: "0 auto 8px" }} />
        <p className="text-[13px] font-medium text-foreground">
          Drag & drop image or <span style={{ color: "#1c63a6" }}>browse</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          PNG, JPG, SVG up to 5MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Overlay list */}
      {firmBranding.overlays.length > 0 && (
        <div className="space-y-2">
          <div className="border-t border-border pt-3" />
          <p className="text-[14px] font-semibold italic" style={{ color: "#1c63a6" }}>
            Added Images ({firmBranding.overlays.length})
          </p>

          {firmBranding.overlays.map((overlay) => (
            <motion.div
              key={overlay.id}
              layout
              className="rounded-lg overflow-hidden"
              style={{
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--muted) / 0.3)",
              }}
            >
              <div className="flex items-center gap-3 p-3">
                <div
                  className="rounded-md overflow-hidden shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    background: "hsl(var(--muted))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={overlay.src}
                    alt={overlay.fileName}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{overlay.fileName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                      style={{
                        background: overlay.layer === "foreground" ? "hsl(215 70% 55% / 0.12)" : "hsl(280 60% 55% / 0.12)",
                        color: overlay.layer === "foreground" ? "hsl(215 70% 45%)" : "hsl(280 60% 45%)",
                      }}
                    >
                      {overlay.layer}
                    </span>
                    {overlay.locked && <span className="text-[10px] text-muted-foreground">🔒</span>}
                  </div>
                </div>

                <button
                  onClick={() => deleteOverlay(overlay.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 size={14} className="text-destructive" />
                </button>
              </div>

              <div className="px-3 pb-3 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] text-muted-foreground">Opacity</label>
                    <span className="text-[12px] font-mono text-muted-foreground">{Math.round(overlay.opacity * 100)}%</span>
                  </div>
                  <Slider
                    value={[overlay.opacity * 100]}
                    onValueChange={([v]) => updateOverlay(overlay.id, { opacity: v / 100 })}
                    min={5} max={100} step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] text-muted-foreground">Size</label>
                    <span className="text-[12px] font-mono text-muted-foreground">{Math.round(overlay.width)}%</span>
                  </div>
                  <Slider
                    value={[overlay.width]}
                    onValueChange={([v]) => updateOverlay(overlay.id, { width: v })}
                    min={5} max={100} step={1}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateOverlay(overlay.id, { layer: overlay.layer === "foreground" ? "background" : "foreground" })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer"
                    style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}
                  >
                    <Layers size={12} />
                    Switch to {overlay.layer === "foreground" ? "BG" : "FG"}
                  </button>
                  <button
                    onClick={() => updateOverlay(overlay.id, { locked: !overlay.locked })}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer"
                    style={{
                      background: overlay.locked ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted) / 0.5)",
                      border: overlay.locked ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid hsl(var(--border))",
                      color: overlay.locked ? "#1c63a6" : undefined,
                    }}
                  >
                    {overlay.locked ? "🔒" : "🔓"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 text-[14px] text-muted-foreground">
        <Info size={14} className="shrink-0 mt-0.5" style={{ color: "#1c63a6" }} />
        <span>In edit mode, drag images to position them anywhere on the statement page. Use the resize handle to adjust size.</span>
      </div>
    </div>
  );
};

export default FirmBrandingSection;
