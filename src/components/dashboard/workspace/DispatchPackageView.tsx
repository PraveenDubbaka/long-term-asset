import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Download,
  Eye,
  Sparkles,
  Check,
  RefreshCw,
  Share2,
} from "lucide-react";
import lukaIdle from "@/assets/luka-idle.gif";
import BottomPrompter from "./BottomPrompter";

const FONT = "'DM Sans', system-ui, sans-serif";

interface CategoryItem {
  id: string;
  label: string;
}
interface Category {
  id: string;
  title: string;
  items: CategoryItem[];
}

const CATEGORIES: Category[] = [
  {
    id: "checklists",
    title: "Checklists",
    items: [
      { id: "cl-1", label: "Client acceptance and continuance" },
      { id: "cl-2", label: "Independence" },
      { id: "cl-3", label: "Knowledge of client business" },
      { id: "cl-4", label: "Planning" },
      { id: "cl-5", label: "Inspection completion" },
    ],
  },
  {
    id: "letters",
    title: "Letters",
    items: [
      { id: "lt-1", label: "Engagement Letter" },
      { id: "lt-2", label: "Management Responsibility Letter" },
      { id: "lt-3", label: "Communication of Significant Matters Letter" },
      { id: "lt-4", label: "Independence Disclosure Letter" },
    ],
  },
  {
    id: "tb",
    title: "Trial Balance & Adj. Entries",
    items: [
      { id: "tb-1", label: "Trial Balance" },
      { id: "tb-2", label: "Adjusting Entries" },
    ],
  },
  {
    id: "proc",
    title: "Procedures",
    items: [
      { id: "pr-1", label: "Capital Asset Amortization" },
      { id: "pr-2", label: "Long Term Debt" },
    ],
  },
  {
    id: "fs",
    title: "Financial Statements",
    items: [{ id: "fs-1", label: "Financial Statements" }],
  },
];

const TOTAL_ITEMS = CATEGORIES.reduce((s, c) => s + c.items.length, 0);

const CircleCheck = ({ checked }: { checked: boolean }) => (
  <span
    className="shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all"
    style={{
      border: checked ? "1.5px solid hsl(265 70% 55%)" : "1.5px solid hsl(220 15% 78%)",
      background: checked ? "hsl(265 70% 55%)" : "hsl(0 0% 100%)",
    }}
  >
    {checked && <Check size={11} strokeWidth={3} color="white" />}
  </span>
);

const IconBtn = ({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className="shrink-0 w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)]"
    style={{
      border: "1px solid hsl(220 20% 88%)",
      background: "hsl(0 0% 100%)",
      color: "hsl(207 71% 38%)",
    }}
  >
    {children}
  </button>
);

const DispatchPackageView = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.id, true]))
  );
  const [packageOpen, setPackageOpen] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (cat: Category) => {
    const allIds = cat.items.map((i) => i.id);
    const allSelected = allIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) allIds.forEach((id) => next.delete(id));
      else allIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const packageItems = useMemo(() => {
    const list: { catTitle: string; label: string; id: string }[] = [];
    CATEGORIES.forEach((c) =>
      c.items.forEach((i) => {
        if (selected.has(i.id)) list.push({ catTitle: c.title, label: i.label, id: i.id });
      })
    );
    return list;
  }, [selected]);

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 w-full max-w-full md:max-w-[92%] lg:max-w-[960px] mx-auto px-6 py-8">
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center">
            <img src={lukaIdle} alt="Luka" className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
            >
              I've generated all the documents for sending to the client. Select and add the
              documents you'd like to include in this engagement package, then send it to the
              client.
            </p>

            {/* Advisory note */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-3 flex items-start gap-3 px-3.5 py-2.5 rounded-[12px]"
              style={{
                background: "hsl(265 60% 98%)",
                border: "1px dashed hsl(265 50% 85%)",
              }}
            >
              <div
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: "hsl(265 70% 94%)" }}
              >
                <Sparkles size={12} strokeWidth={2} color="hsl(265 70% 50%)" />
              </div>
              <p
                className="text-[12.5px] leading-relaxed"
                style={{ color: "hsl(222 25% 28%)", fontFamily: FONT }}
              >
                Your files will be saved on the date added in the package. If there is a change to
                your files post the added date, please create the package again before you send it
                to the client to prevent discrepancies.
              </p>
            </motion.div>

            {/* Categories */}
            <div className="mt-4 flex flex-col gap-3">
              {CATEGORIES.map((cat, ci) => {
                const allIds = cat.items.map((i) => i.id);
                const count = allIds.filter((id) => selected.has(id)).length;
                const allSelected = count === allIds.length;
                const open = openCats[cat.id];
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: ci * 0.04 }}
                    className="rounded-[14px] overflow-hidden"
                    style={{
                      background: "hsl(0 0% 100%)",
                      border: "1px solid hsl(220 20% 92%)",
                    }}
                  >
                    {/* Header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ background: "hsl(220 25% 98%)" }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className="shrink-0"
                        aria-label={`Toggle all ${cat.title}`}
                      >
                        <CircleCheck checked={allSelected} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenCats((p) => ({ ...p, [cat.id]: !p[cat.id] }))
                        }
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <span
                          className="text-[14px] font-semibold"
                          style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
                        >
                          {cat.title}
                        </span>
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: "hsl(220 60% 95%)",
                            color: "hsl(222 50% 35%)",
                            fontFamily: FONT,
                          }}
                        >
                          {count}/{allIds.length}
                        </span>
                      </button>
                      <motion.div
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} color="hsl(222 25% 35%)" />
                      </motion.div>
                    </div>

                    {/* Items */}
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          {cat.items.map((it, ii) => (
                            <div
                              key={it.id}
                              className="flex items-center gap-3 px-4 py-2.5"
                              style={{
                                borderTop:
                                  ii === 0
                                    ? "1px solid hsl(220 20% 94%)"
                                    : "1px solid hsl(220 20% 96%)",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => toggle(it.id)}
                                className="shrink-0"
                                aria-label={`Select ${it.label}`}
                              >
                                <CircleCheck checked={selected.has(it.id)} />
                              </button>
                              <span
                                className="flex-1 text-[13.5px] truncate"
                                style={{
                                  color: "hsl(222 30% 22%)",
                                  fontFamily: FONT,
                                }}
                              >
                                {it.label}
                              </span>
                              <IconBtn title="Download">
                                <Download size={13} strokeWidth={2} />
                              </IconBtn>
                              <IconBtn title="Preview">
                                <Eye size={13} strokeWidth={2} />
                              </IconBtn>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Your Package */}
              <motion.div
                layout
                className="rounded-[14px] overflow-hidden"
                style={{
                  background: "hsl(0 0% 100%)",
                  border: "1px solid hsl(220 20% 92%)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setPackageOpen((v) => !v)}
                  className="w-full flex items-center gap-3 px-4 py-3"
                  style={{ background: "hsl(220 25% 99%)" }}
                >
                  <span
                    className="text-[14px] font-semibold flex-1 text-left"
                    style={{ color: "hsl(222 35% 16%)", fontFamily: FONT }}
                  >
                    Your Package
                  </span>
                  <motion.span
                    key={packageItems.length}
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        packageItems.length > 0 ? "hsl(145 60% 92%)" : "hsl(145 40% 94%)",
                      color: "hsl(145 70% 28%)",
                      fontFamily: FONT,
                    }}
                  >
                    {packageItems.length}/{TOTAL_ITEMS}
                  </motion.span>
                  <motion.div
                    animate={{ rotate: packageOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} color="hsl(222 25% 35%)" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {packageOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      {packageItems.length === 0 ? (
                        <div
                          className="px-4 py-6 text-center text-[12.5px]"
                          style={{
                            color: "hsl(222 15% 55%)",
                            fontFamily: FONT,
                            borderTop: "1px solid hsl(220 20% 94%)",
                          }}
                        >
                          No documents added yet. Select items above to build the package.
                        </div>
                      ) : (
                        <div>
                          <AnimatePresence initial={false}>
                            {packageItems.map((p, ii) => (
                              <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-3 px-4 py-2.5"
                                style={{
                                  borderTop:
                                    ii === 0
                                      ? "1px solid hsl(220 20% 94%)"
                                      : "1px solid hsl(220 20% 96%)",
                                }}
                              >
                                <span
                                  className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                                  style={{
                                    background: "hsl(220 30% 96%)",
                                    color: "hsl(222 35% 35%)",
                                    fontFamily: FONT,
                                  }}
                                >
                                  {p.catTitle}
                                </span>
                                <span
                                  className="flex-1 text-[13px] truncate"
                                  style={{
                                    color: "hsl(222 30% 22%)",
                                    fontFamily: FONT,
                                  }}
                                >
                                  {p.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggle(p.id)}
                                  className="text-[11.5px] font-semibold px-2 py-1 rounded-[6px] transition-colors"
                                  style={{
                                    color: "hsl(0 70% 45%)",
                                    background: "hsl(0 70% 97%)",
                                    fontFamily: FONT,
                                  }}
                                >
                                  Remove
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Footer toolbar */}
            <div className="mt-4 flex items-center gap-2">
              <IconBtn title="Regenerate">
                <RefreshCw size={13} strokeWidth={2.2} />
              </IconBtn>
              <IconBtn title="Share">
                <Share2 size={13} strokeWidth={2.2} />
              </IconBtn>
            </div>

            <p
              className="mt-3 text-[11px]"
              style={{ color: "hsl(222 15% 55%)", fontFamily: FONT }}
            >
              9:02 AM
            </p>
          </div>
        </div>
      </div>
      <BottomPrompter placeholder="Ask Luka about the engagement package..." />
    </div>
  );
};

export default DispatchPackageView;
