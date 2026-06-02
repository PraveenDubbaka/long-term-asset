import { motion } from "framer-motion";
import { Plus, Zap } from "lucide-react";

interface WorkspaceEmptyStateProps {
  onAddEngagement: () => void;
}

const WorkspaceEmptyState = ({ onAddEngagement }: WorkspaceEmptyStateProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden">
      {/* Animated graphic */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative mb-8"
        style={{ width: 260, height: 220 }}
      >
        {/* Soft purple blob behind */}
        <motion.div
          aria-hidden
          className="absolute"
          style={{
            left: "8%",
            top: "18%",
            width: "84%",
            height: "70%",
            background: "radial-gradient(closest-side, hsl(265 80% 75% / 0.32), hsl(220 80% 75% / 0.08) 70%, transparent)",
            filter: "blur(2px)",
            borderRadius: "60% 40% 55% 45% / 55% 60% 40% 45%",
          }}
          animate={{
            borderRadius: [
              "60% 40% 55% 45% / 55% 60% 40% 45%",
              "55% 45% 60% 40% / 50% 55% 45% 50%",
              "60% 40% 55% 45% / 55% 60% 40% 45%",
            ],
            scale: [1, 1.04, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Sparkle pluses */}
        {[
          { x: 110, y: 8, size: 12, delay: 0 },
          { x: 220, y: 16, size: 6, delay: 0.6 },
          { x: 232, y: 168, size: 10, delay: 1.2 },
          { x: 18, y: 120, size: 7, delay: 0.3 },
          { x: 96, y: 198, size: 6, delay: 0.9 },
        ].map((s, i) => (
          <motion.svg
            key={i}
            width={s.size}
            height={s.size}
            viewBox="0 0 12 12"
            className="absolute"
            style={{ left: s.x, top: s.y, color: "hsl(225 25% 55%)" }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85], rotate: [0, 90, 180] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
          >
            <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </motion.svg>
        ))}

        {/* Floating card + magnifier group */}
        <motion.div
          className="absolute inset-0"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Document card */}
          <div
            className="absolute"
            style={{
              left: 56,
              top: 44,
              width: 130,
              height: 140,
              background: "hsl(0 0% 100%)",
              borderRadius: 14,
              border: "1.5px solid hsl(225 35% 28%)",
              boxShadow: "0 12px 28px -16px hsl(250 40% 30% / 0.35)",
            }}
          >
            {/* Folded corner */}
            <div
              className="absolute top-0 right-0"
              style={{
                width: 22,
                height: 22,
                background: "hsl(225 35% 96%)",
                borderLeft: "1.5px solid hsl(225 35% 28%)",
                borderBottom: "1.5px solid hsl(225 35% 28%)",
                borderBottomLeftRadius: 6,
              }}
            />
            {/* Rows of dots */}
            {[0, 1, 2].map((row) => (
              <motion.div
                key={row}
                className="absolute flex items-center gap-1.5"
                style={{ left: 16, top: 38 + row * 30 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + row * 0.15, duration: 0.4 }}
              >
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="block rounded-full"
                    style={{ width: 8, height: 8, background: "hsl(265 75% 65%)" }}
                    animate={{ opacity: [0.45, 1, 0.45] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: row * 0.25 + d * 0.18,
                    }}
                  />
                ))}
              </motion.div>
            ))}
          </div>

          {/* Magnifier with lightning */}
          <motion.div
            className="absolute"
            style={{ left: 150, top: 70 }}
            animate={{ rotate: [-4, 4, -4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                background: "hsl(0 0% 100%)",
                border: "2px solid hsl(225 35% 28%)",
                boxShadow: "0 10px 24px -14px hsl(265 60% 35% / 0.4)",
              }}
            >
              <Zap size={32} className="text-[hsl(265_75%_60%)]" fill="currentColor" strokeWidth={1.2} />
            </div>
            {/* Handle */}
            <div
              className="absolute"
              style={{
                left: 64,
                top: 64,
                width: 28,
                height: 6,
                background: "hsl(225 35% 28%)",
                borderRadius: 4,
                transform: "rotate(40deg)",
                transformOrigin: "left center",
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="text-xl font-bold text-foreground text-center"
        style={{ fontFamily: "var(--font-display, 'Orbitron'), system-ui" }}
      >
        Your engagement automation starts here
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.45 }}
        className="text-sm text-muted-foreground text-center mt-2 max-w-sm leading-relaxed"
      >
        Add your first engagement to the workspace and start automation
      </motion.p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.45 }}
        whileHover={{ y: -1, boxShadow: "0 14px 28px -10px hsl(207 71% 38% / 0.45)" }}
        whileTap={{ scale: 0.98 }}
        onClick={onAddEngagement}
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-[12px] text-sm font-semibold text-white"
        style={{
          background: "#1C68A6",
          boxShadow: "0 8px 20px -10px hsl(207 71% 38% / 0.45)",
        }}
      >
        <Plus size={16} strokeWidth={2.4} />
        Engagement
      </motion.button>
    </div>
  );
};

export default WorkspaceEmptyState;
