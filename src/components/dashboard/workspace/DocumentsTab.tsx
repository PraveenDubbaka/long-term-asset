import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MoreVertical, Download, Save, Trash2, FileText, Table2, Image } from "lucide-react";

type FileKind = "PDF" | "XLSX" | "DOCX" | "JPEG";

interface DocItem {
  name: string;
  kind: FileKind;
  size: string;
  date: string;
}

const USER_UPLOADS: DocItem[] = [
  { name: "Rental Agreements.pdf", kind: "PDF", size: "2.4 MB", date: "May 18, 2026" },
  { name: "Trial Balance_2024.xlsx", kind: "XLSX", size: "812 KB", date: "May 15, 2026" },
  { name: "Knowledge of business_2024.docx", kind: "DOCX", size: "184 KB", date: "May 12, 2026" },
  { name: "Shareholders agreement.pdf", kind: "PDF", size: "3.6 MB", date: "May 09, 2026" },
  { name: "Office Floor Plan.jpeg", kind: "JPEG", size: "1.2 MB", date: "May 07, 2026" },
  { name: "Certificate of Incorporation.pdf", kind: "PDF", size: "1.8 MB", date: "May 02, 2026" },
  { name: "Bylaws (Restated).docx", kind: "DOCX", size: "248 KB", date: "Apr 28, 2026" },
  { name: "Operating Account Terms.pdf", kind: "PDF", size: "924 KB", date: "Apr 22, 2026" },
];

const LUKA_DOCS: DocItem[] = [
  { name: "Rental Agreements.pdf", kind: "PDF", size: "2.4 MB", date: "May 18, 2026" },
  { name: "Trial Balance_2024.xlsx", kind: "XLSX", size: "812 KB", date: "May 15, 2026" },
  { name: "Knowledge of business_2024.docx", kind: "DOCX", size: "184 KB", date: "May 12, 2026" },
  { name: "Shareholders agreement.pdf", kind: "PDF", size: "3.6 MB", date: "May 09, 2026" },
];

const KIND_COLOR: Record<FileKind, string> = {
  PDF: "hsl(0 75% 55%)",
  XLSX: "hsl(145 60% 38%)",
  DOCX: "hsl(215 80% 50%)",
  JPEG: "hsl(265 70% 58%)",
};

const KIND_ICON: Record<FileKind, React.ElementType> = {
  PDF: FileText,
  XLSX: Table2,
  DOCX: FileText,
  JPEG: Image,
};

const FONT = "'DM Sans', system-ui, sans-serif";

const DocRow = ({ doc, canDelete = false, onDelete }: { doc: DocItem; canDelete?: boolean; onDelete?: () => void }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  return (
    <div
      ref={ref}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-[8px] hover:bg-[hsl(220_20%_94%)] transition-colors group"
    >
      {(() => {
        const Icon = KIND_ICON[doc.kind];
        return (
          <Icon
            size={15}
            className="shrink-0"
            style={{ color: KIND_COLOR[doc.kind] }}
          />
        );
      })()}
      <span
        className="flex-1 truncate text-[12.5px]"
        style={{ color: "hsl(222 25% 28%)", fontFamily: FONT }}
        title={doc.name}
      >
        {doc.name}
      </span>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
        style={{ color: "hsl(222 25% 35%)" }}
        aria-label="More actions"
      >
        <MoreVertical size={13} strokeWidth={2.2} />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="absolute right-2 top-full mt-1 z-30 min-w-[180px] py-1 rounded-[10px]"
            style={{
              background: "hsl(0 0% 100%)",
              border: "1px solid hsl(220 20% 88%)",
              boxShadow: "0 8px 24px hsl(222 30% 20% / 0.12)",
              fontFamily: FONT,
            }}
          >
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] hover:bg-[hsl(220_20%_96%)]"
              style={{ color: "hsl(222 25% 25%)" }}
            >
              <Download size={13} strokeWidth={2.2} />
              Download
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] hover:bg-[hsl(220_20%_96%)]"
              style={{ color: "hsl(222 25% 25%)" }}
            >
              <Save size={13} strokeWidth={2.2} />
              Save to engagement
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] hover:bg-[hsl(0_75%_96%)]"
                style={{ color: "hsl(0 70% 45%)" }}
              >
                <Trash2 size={13} strokeWidth={2.2} />
                Delete
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Section = ({
  title,
  docs,
  defaultOpen = true,
  canDelete = false,
  onDelete,
}: {
  title: string;
  docs: DocItem[];
  defaultOpen?: boolean;
  canDelete?: boolean;
  onDelete?: (index: number) => void;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2"
        style={{ borderTop: "1px solid hsl(220 20% 92%)" }}
      >
        <span
          className="text-[11px] font-bold tracking-wider"
          style={{ color: "hsl(222 30% 22%)", fontFamily: FONT }}
        >
          {title.toUpperCase()}
        </span>
        <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={13} style={{ color: "hsl(222 15% 55%)" }} />
        </motion.span>
      </button>
      {open && (
        <div className="flex flex-col">
          {docs.map((d, i) => (
            <DocRow
              key={`${d.name}-${i}`}
              doc={d}
              canDelete={canDelete}
              onDelete={() => onDelete?.(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DocumentsTab = () => {
  const [userUploads, setUserUploads] = useState<DocItem[]>(USER_UPLOADS);
  return (
    <div className="px-3 pb-6">
      <Section
        title="User Uploads"
        docs={userUploads}
        canDelete
        onDelete={(i) => setUserUploads((prev) => prev.filter((_, idx) => idx !== i))}
      />
      <Section title="Luka AI Preparer Documents" docs={LUKA_DOCS} />
    </div>
  );
};

export default DocumentsTab;
