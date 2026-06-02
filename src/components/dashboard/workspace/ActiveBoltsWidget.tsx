import { motion } from "framer-motion";
import { Zap, CheckCircle2, Circle, BarChart3, FolderOpen, MessageSquare, Cloud, Mail } from "lucide-react";
import quickbooksLogo from "@/assets/quickbooks-logo.png";
import xeroLogo from "@/assets/xero-logo.png";

interface BoltItem {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  iconBg: string;
  connected: boolean;
  lastSynced?: string;
}

const boltItems: BoltItem[] = [
  { id: "quickbooks", name: "QuickBooks Online", category: "Accounting Software", icon: <img src={quickbooksLogo} alt="QuickBooks" className="w-4 h-4 object-contain" />, iconBg: "hsl(145 55% 92%)", connected: true, lastSynced: "2m ago" },
  { id: "google-drive", name: "Google Drive", category: "Cloud Storage", icon: <FolderOpen size={15} />, iconBg: "hsl(40 80% 92%)", connected: true, lastSynced: "8m ago" },
  { id: "slack", name: "Slack", category: "Communication", icon: <MessageSquare size={15} />, iconBg: "hsl(280 50% 93%)", connected: true, lastSynced: "1m ago" },
  { id: "xero", name: "Xero", category: "Accounting Software", icon: <img src={xeroLogo} alt="Xero" className="w-4 h-4 object-contain" />, iconBg: "hsl(200 70% 92%)", connected: false },
  { id: "onedrive", name: "OneDrive", category: "Cloud Storage", icon: <Cloud size={15} />, iconBg: "hsl(210 60% 92%)", connected: false },
  { id: "email", name: "Email", category: "Correspondence", icon: <Mail size={15} />, iconBg: "hsl(0 50% 93%)", connected: false },
];

const ActiveBoltsWidget = () => {
  const connectedCount = boltItems.filter((b) => b.connected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(270 60% 55% / 0.12), hsl(207 71% 38% / 0.1))" }}
          >
            <Zap size={17} style={{ color: "hsl(270 60% 50%)" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: "hsl(220 20% 16%)" }}>Active Bolts</h3>
            <p className="text-xs" style={{ color: "hsl(220 15% 55%)" }}>Connected data sources</p>
          </div>
        </div>
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={{
            background: "hsl(145 50% 95%)",
            color: "hsl(145 63% 35%)",
            border: "1px solid hsl(145 50% 70% / 0.3)",
          }}
        >
          {connectedCount}/{boltItems.length} active
        </span>
      </div>

      {/* Bolts list */}
      <div className="flex flex-col gap-2.5">
        {boltItems.map((bolt, i) => (
          <motion.div
            key={bolt.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="flex items-center gap-3 rounded-xl border p-3 transition-all"
            style={{
              borderColor: bolt.connected ? "hsl(145 50% 75% / 0.5)" : "hsl(var(--border))",
              background: bolt.connected ? "hsl(145 50% 98%)" : "hsl(var(--card))",
              boxShadow: bolt.connected
                ? "0 1px 6px hsl(145 50% 40% / 0.05)"
                : "0 1px 3px hsl(220 20% 50% / 0.03)",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: bolt.iconBg, color: "hsl(220 15% 35%)" }}
            >
              {bolt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-semibold block truncate" style={{ color: "hsl(220 20% 16%)" }}>
                {bolt.name}
              </span>
              <span className="text-[10px]" style={{ color: "hsl(220 15% 55%)" }}>
                {bolt.category}
              </span>
              {bolt.connected && bolt.lastSynced && (
                <span className="text-[10px] block" style={{ color: "hsl(145 63% 42%)" }}>
                  Last synced {bolt.lastSynced}
                </span>
              )}
            </div>
            {bolt.connected ? (
              <CheckCircle2 size={15} style={{ color: "hsl(145 63% 42%)" }} />
            ) : (
              <Circle size={15} style={{ color: "hsl(220 15% 75%)" }} />
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 p-3 rounded-xl text-center"
        style={{
          background: "hsl(var(--muted) / 0.4)",
          border: "1px dashed hsl(var(--border))",
        }}
      >
        <p className="text-[11px] font-medium" style={{ color: "hsl(220 15% 50%)" }}>
          Manage connections in My Bolts
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ActiveBoltsWidget;
