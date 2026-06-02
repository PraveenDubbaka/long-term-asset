import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  Undo2, Redo2, Bold, Italic, Underline, ImagePlus,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  WrapText, ALargeSmall, SeparatorHorizontal, CalendarDays, Sparkles,
  ChevronDown, Layers, Type
} from "lucide-react";

export interface CoverPageFormatting {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  uppercase: boolean;
  fontSize: number;
  fontWeight?: number;
  align: "left" | "center" | "right";
  lineSpacing: string;
  bulletList: boolean;
  numberList: boolean;
}

export const defaultFormatting: CoverPageFormatting = {
  bold: true,
  italic: false,
  underline: false,
  uppercase: false,
  fontSize: 36,
  align: "right",
  lineSpacing: "1.5",
  bulletList: false,
  numberList: false,
};

interface CoverPageToolbarProps {
  visible: boolean;
  formatting: CoverPageFormatting;
  onFormattingChange: (f: CoverPageFormatting) => void;
  activeField?: string | null;
  onActiveFieldChange?: (field: string | null) => void;
}

const CoverPageToolbar = ({ visible, formatting, onFormattingChange, activeField, onActiveFieldChange }: CoverPageToolbarProps) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggle = (key: keyof CoverPageFormatting) => {
    onFormattingChange({ ...formatting, [key]: !formatting[key] });
  };

  const toggleMenu = (menu: string) => {
    setOpenMenu(prev => prev === menu ? null : menu);
  };

  const ToolButton = ({ id, icon: Icon, label, onClick, isActive, size = 17 }: {
    id?: keyof CoverPageFormatting; icon: any; label: string; onClick?: () => void; isActive?: boolean; size?: number;
  }) => {
    const active = id ? !!formatting[id] : isActive;
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <motion.button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (id && !onClick) toggle(id); onClick?.(); }}
            className="flex items-center justify-center rounded-[5px] cursor-pointer"
            style={{
              width: 30, height: 30,
              background: active ? "hsla(0, 0%, 100%, 0.25)" : "transparent",
              color: active ? "hsl(0 0% 100%)" : "hsla(0, 0%, 100%, 0.85)",
              border: active ? "1px solid hsla(0, 0%, 100%, 0.3)" : "1px solid transparent",
            }}
            whileHover={{ background: active ? "hsla(0, 0%, 100%, 0.3)" : "hsla(0, 0%, 100%, 0.15)", scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.08 }}
          >
            <Icon size={size} strokeWidth={active ? 3 : 2.4} />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent
          side="top" align="center" sideOffset={8}
          className="rounded-[6px] px-2.5 py-1 text-[11px] font-medium shadow-lg border-none"
          style={{ background: "hsl(220 20% 20%)", color: "hsl(0 0% 100%)" }}
        >
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  const DropButton = ({ icon: Icon, label, menu, children, width = 160 }: {
    icon: any; label: string; menu: string; children: React.ReactNode; width?: number;
  }) => (
    <div className="relative">
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <motion.button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleMenu(menu); }}
            className="flex items-center gap-0.5 rounded-[5px] px-1.5 cursor-pointer"
            style={{
              height: 30,
              color: openMenu === menu ? "hsl(0 0% 100%)" : "hsla(0, 0%, 100%, 0.85)",
              background: openMenu === menu ? "hsla(0, 0%, 100%, 0.25)" : "transparent",
              border: openMenu === menu ? "1px solid hsla(0, 0%, 100%, 0.3)" : "1px solid transparent",
            }}
            whileHover={{ background: openMenu === menu ? "hsla(0, 0%, 100%, 0.3)" : "hsla(0, 0%, 100%, 0.15)", scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.08 }}
          >
            <Icon size={15} strokeWidth={2.4} />
            <ChevronDown size={10} strokeWidth={3} />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent
          side="top" align="center" sideOffset={8}
          className="rounded-[6px] px-2.5 py-1 text-[11px] font-medium shadow-lg border-none"
          style={{ background: "hsl(220 20% 20%)", color: "hsl(0 0% 100%)" }}
        >
          {label}
        </TooltipContent>
      </Tooltip>
      <AnimatePresence>
        {openMenu === menu && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute left-1/2 top-full mt-1.5 z-50 rounded-[8px] overflow-hidden"
            style={{
              width, transform: "translateX(-50%)",
              background: "hsl(0 0% 100%)",
              border: "1px solid hsl(220 15% 88%)",
              boxShadow: "0 8px 28px hsl(220 20% 10% / 0.12), 0 2px 6px hsl(220 20% 10% / 0.05)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const MenuItem = ({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) => (
    <motion.button
      type="button"
      className="w-full text-left px-2.5 py-1.5 rounded-[5px] text-[13px] cursor-pointer flex items-center justify-between"
      style={{
        color: active ? "hsl(215 70% 45%)" : "hsl(220 15% 30%)",
        background: active ? "hsl(215 60% 94%)" : "transparent",
        fontWeight: active ? 600 : 400,
      }}
      whileHover={{ background: active ? "hsl(215 55% 90%)" : "hsl(220 15% 95%)" }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {label}
      {active && <span style={{ fontSize: 11, color: "hsl(215 70% 45%)" }}>✓</span>}
    </motion.button>
  );

  const Divider = () => (
    <div style={{ width: 1, height: 20, background: "hsla(0, 0%, 100%, 0.25)", margin: "0 3px", flexShrink: 0 }} />
  );

  return (
    <TooltipProvider delayDuration={300}>
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
          className="inline-flex items-center gap-0.5 rounded-[10px]"
          style={{
            padding: "4px 6px",
            background: "linear-gradient(135deg, hsl(270, 70%, 55%), hsl(220, 80%, 55%))",
            border: "1.5px solid hsla(260, 60%, 60%, 0.3)",
            boxShadow: "0 4px 20px hsla(250, 70%, 50%, 0.25), 0 2px 8px hsla(220, 60%, 40%, 0.15)",
          }}
          onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }}
        >
          {/* Mode indicator — clickable to cycle modes */}
          <motion.button
            type="button"
            className="flex items-center gap-1 rounded-[5px] px-2 cursor-pointer"
            style={{
              height: 24,
              background: "hsla(0, 0%, 100%, 0.18)",
              border: "1px solid hsla(0, 0%, 100%, 0.2)",
              color: "hsl(0 0% 100%)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.3,
              whiteSpace: "nowrap",
            }}
            whileHover={{ background: "hsla(0, 0%, 100%, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              if (!onActiveFieldChange) return;
              const fields: (string | null)[] = [null, "clientName", "periodEnd", "title"];
              const currentIdx = fields.indexOf(activeField ?? null);
              const nextIdx = (currentIdx + 1) % fields.length;
              onActiveFieldChange(fields[nextIdx]);
            }}
          >
            {activeField ? (
              <>
                <Type size={10} strokeWidth={2.5} />
                {activeField === "clientName" ? "Client Name" : activeField === "periodEnd" ? "Period End" : "Title"}
              </>
            ) : (
              <>
                <Layers size={10} strokeWidth={2.5} />
                All Fields
              </>
            )}
            <ChevronDown size={8} strokeWidth={3} style={{ marginLeft: 2, opacity: 0.7 }} />
          </motion.button>
          <Divider />

          {/* Undo / Redo */}
          <ToolButton icon={Undo2} label="Undo" onClick={() => {}} />
          <ToolButton icon={Redo2} label="Redo" onClick={() => {}} />
          <Divider />

          {/* Font Size */}
          <DropButton icon={() => <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "Arial" }}>T<sub style={{ fontSize: 8 }}>T</sub></span>} label="Font Size" menu="font" width={110}>
            {[12, 14, 16, 18, 24, 30, 36, 48, 64].map(s => (
              <MenuItem key={s} label={`${s}px`} active={formatting.fontSize === s} onClick={() => { onFormattingChange({ ...formatting, fontSize: s }); setOpenMenu(null); }} />
            ))}
          </DropButton>
          <Divider />

          {/* B I U */}
          <ToolButton id="bold" icon={Bold} label="Bold" />
          <ToolButton id="italic" icon={Italic} label="Italic" />
          <ToolButton id="underline" icon={Underline} label="Underline" />
          <Divider />

          {/* Case */}
          <ToolButton id="uppercase" icon={ALargeSmall} label="Change Case" size={18} />
          <Divider />

          {/* Image */}
          <DropButton icon={ImagePlus} label="Add Image" menu="image" width={170}>
            <MenuItem label="Background Image" onClick={() => setOpenMenu(null)} />
            <MenuItem label="Foreground Image" onClick={() => setOpenMenu(null)} />
          </DropButton>
          <Divider />

          {/* Line options */}
          <DropButton icon={SeparatorHorizontal} label="Line Options" menu="line" width={180}>
            <div className="px-2 py-1 text-[11px] font-semibold" style={{ color: "hsl(220 15% 55%)" }}>Visibility</div>
            <MenuItem label="Show Top Line" onClick={() => {}} />
            <MenuItem label="Show Bottom Line" onClick={() => {}} />
            <div className="my-0.5" style={{ height: 1, background: "hsl(220 15% 92%)" }} />
            <div className="px-2 py-1 text-[11px] font-semibold" style={{ color: "hsl(220 15% 55%)" }}>Thickness</div>
            {["0.5px — Thin", "1px — Regular", "2px — Medium", "3px — Thick"].map(t => (
              <MenuItem key={t} label={t} active={t.includes("1px")} onClick={() => setOpenMenu(null)} />
            ))}
          </DropButton>
          <Divider />

          {/* Date Format */}
          <DropButton icon={CalendarDays} label="Date Format" menu="date" width={200}>
            {["December 31, 2024", "Dec 31, 2024", "31 December 2024", "12/31/2024", "2024-12-31"].map(f => (
              <MenuItem key={f} label={f} active={f === "December 31, 2024"} onClick={() => { onFormattingChange({ ...formatting }); setOpenMenu(null); }} />
            ))}
          </DropButton>
          <Divider />

          {/* Alignment */}
          <ToolButton icon={AlignLeft} label="Align Left" isActive={formatting.align === "left"} onClick={() => onFormattingChange({ ...formatting, align: "left" })} />
          <ToolButton icon={AlignCenter} label="Align Center" isActive={formatting.align === "center"} onClick={() => onFormattingChange({ ...formatting, align: "center" })} />
          <ToolButton icon={AlignRight} label="Align Right" isActive={formatting.align === "right"} onClick={() => onFormattingChange({ ...formatting, align: "right" })} />
          <Divider />

          {/* Lists */}
          <ToolButton id="bulletList" icon={List} label="Bullet List" />
          <ToolButton id="numberList" icon={ListOrdered} label="Numbered List" />
          <Divider />

          {/* Line Spacing */}
          <DropButton icon={WrapText} label="Line Spacing" menu="spacing" width={130}>
            {["1.0", "1.15", "1.5", "2.0", "2.5", "3.0"].map(s => (
              <MenuItem key={s} label={s} active={formatting.lineSpacing === s} onClick={() => { onFormattingChange({ ...formatting, lineSpacing: s }); setOpenMenu(null); }} />
            ))}
          </DropButton>
          <Divider />

          {/* Automation */}
          <ToolButton icon={Sparkles} label="Automated Element" onClick={() => {}} />
        </motion.div>
      )}
    </AnimatePresence>
    </TooltipProvider>
  );
};

export default CoverPageToolbar;
