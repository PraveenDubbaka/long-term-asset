import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, MoreHorizontal, Zap, HelpCircle, Layers, Sparkles, Clock, CheckCircle2, Archive } from "lucide-react";
import StatusBadge from "./StatusBadge";
import IntegrationBadge from "./IntegrationBadge";
import ActionIcons from "./ActionIcons";

type StatusType = "New" | "In Progress" | "Completed";
type FilterType = "all" | "new" | "in-progress" | "completed" | "archived";
type IntegrationType = "quickbooks" | "xero" | "none";

const metricCards: { key: FilterType; label: string; value: number; icon: React.ElementType }[] = [
  { key: "all", label: "Total Engagements", value: 1764, icon: Layers },
  { key: "new", label: "New Engagements", value: 482, icon: Sparkles },
  { key: "in-progress", label: "In Progress", value: 1037, icon: Clock },
  { key: "completed", label: "Completed", value: 168, icon: CheckCircle2 },
  { key: "archived", label: "Archived", value: 77, icon: Archive },
];

interface Engagement {
  id: string;
  entityName: string;
  yearEnd: string;
  createdOn: string;
  integration: IntegrationType;
  status: StatusType;
  showRF?: boolean;
  commentCount?: number;
  chatCount?: number;
}

const engagements: Engagement[] = [
  { id: "COM-GRN-Dec312024", entityName: "Grant Thornton LLP", yearEnd: "Dec31,2024", createdOn: "Jan 27, 2026 08:22 AM", integration: "quickbooks", status: "New", commentCount: 1, chatCount: 1 },
  { id: "COM-BDO-Dec312024", entityName: "BDO Canada LLP", yearEnd: "Dec31,2024", createdOn: "Jan 25, 2026 11:54 PM", integration: "none", status: "New", chatCount: 1 },
  { id: "COM-MNP-Apr302024", entityName: "MNP LLP", yearEnd: "Apr30,2024", createdOn: "Dec 30, 2025 06:26 AM", integration: "xero", status: "In Progress", commentCount: 2 },
  { id: "COM-RSM-Dec312024", entityName: "RSM Canada LLP", yearEnd: "Dec31,2024", createdOn: "Jan 13, 2026 01:36 AM", integration: "quickbooks", status: "In Progress" },
  { id: "COM-BWR-Mar312024", entityName: "Baker Tilly WM LLP", yearEnd: "Mar31,2024", createdOn: "Jan 16, 2026 02:38 AM", integration: "xero", status: "New", commentCount: 5 },
  { id: "COM-CRW-Dec312024", entityName: "Crowe Soberman LLP", yearEnd: "Dec31,2024", createdOn: "Jan 13, 2026 09:21 AM", integration: "none", status: "Completed", commentCount: 2, chatCount: 3 },
  { id: "COM-DFF-Mar312024", entityName: "Deloitte Canada LLP", yearEnd: "Mar31,2024", createdOn: "Dec 31, 2025 04:36 AM", integration: "xero", status: "Completed", chatCount: 1 },
  { id: "COM-WLG-Dec312024", entityName: "Richter LLP", yearEnd: "Dec31,2024", createdOn: "Jan 01, 2026 01:34 AM", integration: "quickbooks", status: "In Progress", showRF: true },
  { id: "COM-CBR-Dec312024", entityName: "KPMG Canada LLP", yearEnd: "Dec31,2024", createdOn: "Dec 30, 2025 10:08 AM", integration: "none", status: "Completed", commentCount: 1 },
];

const EngagementsTable = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filtered = engagements.filter((e) => {
    const matchesSearch =
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === "all") return true;
    if (activeFilter === "new") return e.status === "New";
    if (activeFilter === "in-progress") return e.status === "In Progress";
    if (activeFilter === "completed") return e.status === "Completed";
    return false; // archived — no data for now
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4"
    >
      {/* Metric cards */}
      <div className="grid grid-cols-5 gap-3">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const isActive = activeFilter === card.key;
          return (
            <motion.button
              key={card.key}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveFilter(card.key)}
              className="relative bg-card rounded-xl border px-4 py-4 text-left transition-all cursor-pointer overflow-hidden"
              style={{
                borderColor: isActive ? "hsl(270 70% 55% / 0.5)" : "hsl(var(--border))",
                boxShadow: isActive
                  ? "0 2px 12px hsla(270, 70%, 55%, 0.15)"
                  : "var(--shadow-sm)",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="metric-active"
                  className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full"
                  style={{
                    background: "hsl(270 70% 55%)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, hsl(270 70% 55% / 0.15), hsl(220 80% 55% / 0.1))"
                      : "hsl(var(--muted) / 0.6)",
                  }}
                >
                  <Icon size={18} style={{ color: isActive ? "hsl(270 70% 55%)" : "hsl(var(--muted-foreground))" }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground leading-none">{card.value.toLocaleString()}</p>
                  <p className="text-[14px] text-muted-foreground mt-1 font-medium">{card.label}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Table Card */}
      <div
        className="bg-card rounded-xl border overflow-hidden"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">All Engagements</h2>
            <p className="text-[14px] text-muted-foreground mt-0.5">Showing active engagements from last 6 months</p>
          </div>
          <div className="relative w-56 group">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-[12px] border text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              style={{ borderColor: "hsl(var(--border))" }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: "hsl(var(--table-header-bg))" }}>
              {[
                { label: "Engagement ID", sortable: false },
                { label: "Entity Name", sortable: true },
                { label: "Year End", sortable: true },
                { label: "Created On", sortable: true },
                { label: "Integrations", sortable: false, info: true, center: true },
                { label: "Status", sortable: true, center: true },
                { label: "Actions", sortable: false, center: true },
              ].map((col) => (
                <th
                  key={col.label}
                  className={`px-5 py-3 font-semibold text-foreground ${col.center ? "text-center" : "text-left"}`}
                  style={{ fontSize: "15px" }}
                >
                  <div className={`flex items-center gap-1.5 ${col.center ? "justify-center" : ""}`}>
                    {col.label}
                    {col.sortable && (
                      <motion.button whileHover={{ scale: 1.2 }} className="opacity-30 hover:opacity-80 transition-opacity">
                        <ArrowUpDown size={12} />
                      </motion.button>
                    )}
                    {col.info && (
                      <motion.span whileHover={{ scale: 1.2 }} className="opacity-30 hover:opacity-80 cursor-help">
                        <HelpCircle size={12} />
                      </motion.span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((engagement, index) => (
                <motion.tr
                  key={engagement.id + index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="table-row-interactive"
                  style={{ borderBottom: "1px solid hsl(var(--table-border))" }}
                >
                  <td className="px-5 py-3.5">
                    <motion.button
                      className="engagement-link font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
                      style={{ color: "#006AAB", fontSize: "16px" }}
                      whileHover={{ x: 2 }}
                      onClick={() => navigate(`/engagements/${engagement.id}`)}
                    >
                      {engagement.id}
                    </motion.button>
                  </td>
                  <td className="px-5 py-3.5 text-foreground font-medium" style={{ fontSize: "16px" }}>{engagement.entityName}</td>
                  <td className="px-5 py-3.5 text-foreground font-medium" style={{ fontSize: "16px" }}>{engagement.yearEnd}</td>
                  <td className="px-5 py-3.5 text-foreground font-medium" style={{ fontSize: "16px" }}>{engagement.createdOn}</td>
                  <td className="px-5 py-3.5 text-center">
                    <IntegrationBadge type={engagement.integration} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <StatusBadge status={engagement.status} showRF={engagement.showRF} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-center">
                      <ActionIcons commentCount={engagement.commentCount} chatCount={engagement.chatCount} showAI aiDisabled={engagement.status === "Completed"} />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 flex items-center justify-between border-t" style={{ borderColor: "hsl(var(--table-border))" }}>
        <span className="text-sm text-muted-foreground">Showing page 1-8</span>
        <div className="flex items-center gap-1.5">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="pagination-btn opacity-40">
            <ChevronLeft size={14} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} className={`pagination-btn ${currentPage === 1 ? "active" : ""}`}>
            1
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} className="pagination-btn">
            2
          </motion.button>
          <span className="px-1 text-muted-foreground">
            <MoreHorizontal size={14} />
          </span>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="pagination-btn">
            <ChevronRight size={14} />
          </motion.button>
        </div>
      </div>
      </div>
    </motion.div>
  );
};

export default EngagementsTable;
