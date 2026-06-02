import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Circle, Zap, Cloud, MessageSquare, Mail, FolderOpen, BarChart3, RefreshCw } from "lucide-react";
import quickbooksLogo from "@/assets/quickbooks-logo.png";
import xeroLogo from "@/assets/xero-logo.png";

interface Bolt {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  iconBg: string;
  connected: boolean;
  statusLabel?: string;
  statusDot: string;
}

const bolts: Bolt[] = [
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    category: "Accounting Software",
    icon: <img src={quickbooksLogo} alt="QuickBooks" className="w-5 h-5 object-contain" />,
    iconBg: "hsl(145 55% 92%)",
    connected: true,
    statusLabel: "Connected · Synced",
    statusDot: "hsl(145 63% 42%)",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    category: "Cloud Storage",
    icon: <FolderOpen size={18} />,
    iconBg: "hsl(40 80% 92%)",
    connected: false,
    statusDot: "hsl(220 15% 75%)",
  },
  {
    id: "slack",
    name: "Slack",
    category: "Communication",
    icon: <MessageSquare size={18} />,
    iconBg: "hsl(280 50% 93%)",
    connected: false,
    statusDot: "hsl(220 15% 75%)",
  },
  {
    id: "xero",
    name: "Xero",
    category: "Accounting Software",
    icon: <img src={xeroLogo} alt="Xero" className="w-5 h-5 object-contain" />,
    iconBg: "hsl(200 70% 92%)",
    connected: false,
    statusDot: "hsl(220 15% 75%)",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    category: "Cloud Storage",
    icon: <Cloud size={18} />,
    iconBg: "hsl(210 60% 92%)",
    connected: false,
    statusDot: "hsl(220 15% 75%)",
  },
  {
    id: "email",
    name: "Email",
    category: "Correspondence",
    icon: <Mail size={18} />,
    iconBg: "hsl(0 50% 93%)",
    connected: false,
    statusDot: "hsl(220 15% 75%)",
  },
];

interface MyBoltsTrayProps {
  open: boolean;
  onClose: () => void;
}

const MyBoltsTray = ({ open, onClose }: MyBoltsTrayProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/15"
            onClick={onClose}
          />

          {/* Tray */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed top-0 right-0 z-50 h-full flex flex-col"
            style={{
              width: "min(460px, 95vw)",
              background: "hsl(var(--background))",
              borderLeft: "1px solid hsl(var(--border))",
              borderRadius: "12px 0 0 12px",
              boxShadow: "-8px 0 40px hsl(220 30% 20% / 0.08)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between px-6 py-5 shrink-0"
              style={{ borderBottom: "1px solid hsl(var(--border))" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #9747FF, #115697)",
                  }}
                >
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold" style={{ color: "hsl(220 20% 16%)" }}>
                      My Bolts
                    </h2>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: "#F2F9FF",
                        color: "#006AAB",
                        border: "1px solid hsl(207 56% 32% / 0.15)",
                      }}
                    >
                      {bolts.filter((b) => b.connected).length}/{bolts.length} connected
                    </span>
                  </div>
                  <p className="text-[13px] mt-1 max-w-[300px] leading-relaxed" style={{ color: "hsl(220 15% 55%)" }}>
                    Connect your data sources to pull prior year data directly from systems, Luka will autodetect and classify the engagement files during automation.
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  color: "hsl(220 15% 45%)",
                  background: "hsl(var(--muted) / 0.5)",
                }}
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Bolts Grid */}
            <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: "none" }}>
              <div className="flex flex-col gap-3">
                {bolts.map((bolt, i) => (
                  <motion.div
                    key={bolt.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative rounded-2xl border p-4 flex flex-col transition-all"
                    style={{
                      borderColor: bolt.connected
                        ? "hsl(145 50% 70%)"
                        : "hsl(var(--border))",
                      background: bolt.connected
                        ? "hsl(145 50% 98%)"
                        : "hsl(var(--card))",
                      boxShadow: bolt.connected
                        ? "0 0 0 1px hsl(145 50% 70% / 0.3), 0 2px 8px hsl(145 50% 40% / 0.06)"
                        : "0 1px 4px hsl(220 20% 50% / 0.04)",
                    }}
                  >
                    {/* Status dot */}
                    <div
                      className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full"
                      style={{ background: bolt.statusDot }}
                    />

                    {/* Icon + Info */}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: bolt.iconBg,
                          color: "hsl(220 15% 35%)",
                        }}
                      >
                        {bolt.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate" style={{ color: "hsl(220 20% 16%)" }}>
                          {bolt.name}
                        </h3>
                        <p className="text-[11px]" style={{ color: "hsl(220 15% 55%)" }}>
                          {bolt.category}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mt-auto flex items-center justify-between">
                      {bolt.connected ? (
                        <motion.div
                          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold"
                          style={{
                            background: "hsl(145 45% 32%)",
                            color: "white",
                          }}
                        >
                          <CheckCircle2 size={13} />
                          <span>{bolt.statusLabel}</span>
                        </motion.div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                          style={{
                            background: "hsl(var(--card))",
                            color: "#006AAB",
                            border: "1.5px solid #006AAB",
                          }}
                        >
                          <span>Connect</span>
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={bolt.connected ? { scale: 1.12, rotate: 180, boxShadow: "0 4px 14px hsl(207 56% 32% / 0.2)" } : {}}
                        whileTap={bolt.connected ? { scale: 0.88 } : {}}
                        disabled={!bolt.connected}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                        style={{
                          color: bolt.connected ? "#006AAB" : "hsl(220 15% 65%)",
                          background: bolt.connected ? "#F2F9FF" : "hsl(220 15% 95%)",
                          border: bolt.connected ? "1.5px solid hsl(207 56% 32% / 0.15)" : "1.5px solid hsl(220 15% 85%)",
                          cursor: bolt.connected ? "pointer" : "not-allowed",
                          opacity: 1,
                        }}
                      >
                        <RefreshCw size={15} strokeWidth={bolt.connected ? 2.5 : 2} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-5 p-3.5 rounded-xl text-center"
                style={{
                  background: "hsl(var(--muted) / 0.4)",
                  border: "1px dashed hsl(var(--border))",
                }}
              >
                <p className="text-[11px] font-medium" style={{ color: "hsl(220 15% 50%)" }}>
                  Connect your tools to let Luka pull data automatically during engagements
                </p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MyBoltsTray;
