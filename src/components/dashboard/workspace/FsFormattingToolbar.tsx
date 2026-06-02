import { motion } from "framer-motion";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Strikethrough,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ListOrdered,
  List,
  RemoveFormatting,
  ChevronDown,
  Palette,
  Droplet,
} from "lucide-react";

const FONT = "'DM Sans', system-ui, sans-serif";
const BORDER = "hsl(215 75% 22%)";

interface Props {
  onCommand: (cmd: string, value?: string) => void;
}

const cellCls =
  "w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_96%)]";

const FsFormattingToolbar = ({ onCommand }: Props) => {
  const btn = (icon: React.ReactNode, cmd: string, value?: string, title?: string) => (
    <button
      type="button"
      title={title || cmd}
      onMouseDown={(e) => {
        e.preventDefault();
        onCommand(cmd, value);
      }}
      className={cellCls}
      style={{ background: "white", border: "1px solid hsl(220 20% 88%)", color: "hsl(215 75% 22%)" }}
    >
      {icon}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[14px] px-3 py-2.5"
      style={{
        background: "white",
        border: `1.5px solid ${BORDER}`,
        boxShadow:
          "0 12px 32px hsl(220 40% 22% / 0.16), 0 4px 12px hsl(220 40% 22% / 0.08)",
        fontFamily: FONT,
        display: "inline-flex",
        flexDirection: "column",
        gap: 6,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-1.5">
        {btn(<Undo2 size={14} strokeWidth={2.2} />, "undo", undefined, "Undo")}
        {btn(<Redo2 size={14} strokeWidth={2.2} />, "redo", undefined, "Redo")}
        <div style={{ width: 1, height: 18, background: "hsl(220 20% 88%)", margin: "0 4px" }} />
        {btn(<Bold size={14} strokeWidth={2.6} />, "bold", undefined, "Bold")}
        {btn(<Italic size={14} strokeWidth={2.4} />, "italic", undefined, "Italic")}
        {btn(<Strikethrough size={14} strokeWidth={2.4} />, "strikeThrough", undefined, "Strikethrough")}
        {btn(<Underline size={14} strokeWidth={2.4} />, "underline", undefined, "Underline")}
        <div className="relative">
          <label
            className={cellCls}
            style={{ background: "white", border: "1px solid hsl(220 20% 88%)", color: "hsl(215 75% 22%)", cursor: "pointer" }}
            title="Text color"
          >
            <Palette size={14} strokeWidth={2.2} />
            <input
              type="color"
              defaultValue="#0f1e3a"
              onChange={(e) => onCommand("foreColor", e.target.value)}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            />
          </label>
        </div>
        <div className="relative">
          <label
            className={cellCls}
            style={{ background: "white", border: "1px solid hsl(220 20% 88%)", color: "hsl(215 75% 22%)", cursor: "pointer" }}
            title="Highlight"
          >
            <Droplet size={14} strokeWidth={2.2} />
            <input
              type="color"
              defaultValue="#fff59d"
              onChange={(e) => onCommand("hiliteColor", e.target.value)}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            />
          </label>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {btn(<AlignLeft size={14} strokeWidth={2.2} />, "justifyLeft", undefined, "Align left")}
        {btn(<AlignCenter size={14} strokeWidth={2.2} />, "justifyCenter", undefined, "Align center")}
        {btn(<AlignRight size={14} strokeWidth={2.2} />, "justifyRight", undefined, "Align right")}
        {btn(<AlignJustify size={14} strokeWidth={2.2} />, "justifyFull", undefined, "Justify")}
        <div style={{ width: 1, height: 18, background: "hsl(220 20% 88%)", margin: "0 4px" }} />
        {btn(<ListOrdered size={14} strokeWidth={2.2} />, "insertOrderedList", undefined, "Numbered list")}
        {btn(<List size={14} strokeWidth={2.2} />, "insertUnorderedList", undefined, "Bulleted list")}
        {btn(<RemoveFormatting size={14} strokeWidth={2.2} />, "removeFormat", undefined, "Clear formatting")}
        {btn(
          <div className="flex items-center" style={{ gap: 1 }}>
            <ChevronDown size={10} strokeWidth={2.4} />
            <ChevronDown size={10} strokeWidth={2.4} style={{ transform: "rotate(180deg)" }} />
          </div>,
          "insertHTML",
          "&nbsp;",
          "Line spacing"
        )}
      </div>
    </motion.div>
  );
};

export default FsFormattingToolbar;
