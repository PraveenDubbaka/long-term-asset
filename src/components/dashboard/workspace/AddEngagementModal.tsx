import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Building2, Plus } from "lucide-react";
import quickbooksLogo from "@/assets/quickbooks-intuit-logo.png";
import xeroLogo from "@/assets/xero-logo.png";

export interface EngagementOption {
  id: string;
  name: string;
  code: string;
  source: "quickbooks" | "xero";
}

const ENGAGEMENTS: EngagementOption[] = [
  { id: "e1", name: "MapleLeaf Consulting", code: "COM-ALP-Dec312024", source: "quickbooks" },
  { id: "e2", name: "Tried and Tested", code: "COM-TRI-Dec312024", source: "xero" },
  { id: "e3", name: "Beta Solutions", code: "COM-BET-Dec312024", source: "xero" },
  { id: "e4", name: "Simpsons & Co.", code: "COM-SIM-Dec312024", source: "quickbooks" },
  { id: "e5", name: "Simpsons & Co.", code: "COM-SIM-Dec312024", source: "quickbooks" },
  { id: "e6", name: "Beta Solutions", code: "COM-BET-Dec312024", source: "xero" },
];

interface AddEngagementModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (engagement: EngagementOption) => void;
}

const SourceBadge = ({ source }: { source: EngagementOption["source"] }) => (
  <img
    src={source === "quickbooks" ? quickbooksLogo : xeroLogo}
    alt={source}
    className="h-6 w-auto object-contain shrink-0"
  />
);

const AddEngagementModal = ({ open, onClose, onSelect }: AddEngagementModalProps) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return ENGAGEMENTS;
    return ENGAGEMENTS.filter(
      (e) =>
        e.name.toLowerCase().includes(term) ||
        e.code.toLowerCase().includes(term)
    );
  }, [search]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[120]"
            style={{ background: "hsl(222 35% 14% / 0.45)", backdropFilter: "blur(4px)" }}
          />
          <div className="fixed inset-0 z-[121] flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="pointer-events-auto w-full max-w-2xl rounded-2xl bg-white flex flex-col overflow-hidden"
              style={{
                border: "1px solid hsl(220 20% 92%)",
                boxShadow: "0 30px 60px -20px hsl(222 50% 20% / 0.35), 0 12px 24px -12px hsl(222 30% 30% / 0.18)",
                maxHeight: "min(86vh, 820px)",
              }}
            >
              {/* Header */}
              <div className="px-7 pt-7 pb-5 relative">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-5 right-5 w-8 h-8 rounded-md flex items-center justify-center hover:bg-[hsl(220_20%_94%)] transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "hsl(207 71% 81%)" }}
                >
                  <Building2 size={22} style={{ color: "hsl(220 80% 35%)" }} />
                </div>
                <h2 className="text-xl font-bold leading-tight" style={{ color: "hsl(222 35% 16%)" }}>
                  Add Engagement to Workspace
                </h2>
                <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "hsl(222 15% 52%)" }}>
                  Select from the below source connected engagements to add to your workspace for automation
                </p>
              </div>

              {/* Search */}
              <div className="px-7 pb-4">
                <div
                  className="relative flex items-center rounded-xl"
                  style={{ border: "1.5px solid hsl(220 35% 28%)", background: "hsl(0 0% 100%)" }}
                >
                  <Search size={18} className="absolute left-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Clients"
                    className="w-full bg-transparent pl-12 pr-4 py-3 text-sm outline-none"
                    style={{ color: "hsl(222 30% 18%)" }}
                  />
                </div>
              </div>

              {/* List */}
              <div className="px-7 pb-7 pt-2 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-3">
                  {filtered.map((eng) => (
                    <div
                      key={eng.id}
                      className="group relative flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer bg-white"
                      style={{ border: "1px solid hsl(220 25% 90%)" }}
                      onClick={() => onSelect(eng)}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ border: "1.5px solid hsl(213 75% 19%)", background: "hsl(0 0% 100%)" }}
                      >
                        <Building2 size={18} style={{ color: "hsl(213 75% 19%)" }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold truncate" style={{ color: "hsl(222 35% 16%)" }}>
                          {eng.name}
                        </div>
                        <div className="text-sm mt-0.5" style={{ color: "hsl(222 15% 52%)" }}>
                          {eng.code}
                        </div>
                      </div>

                      <SourceBadge source={eng.source} />

                      {/* Inline + add icon (reserves space to avoid layout shift) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(eng);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:brightness-110 shrink-0"
                        style={{
                          background: "linear-gradient(135deg, #6C2FF2 0%, #1C68A6 100%)",
                        }}
                        aria-label={`Add ${eng.name}`}
                      >
                        <Plus size={15} strokeWidth={2.6} />
                      </button>
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No engagements match "{search}"
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddEngagementModal;
