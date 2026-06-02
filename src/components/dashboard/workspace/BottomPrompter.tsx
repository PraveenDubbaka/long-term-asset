import { motion } from "framer-motion";
import { Plus, FolderOpen, Mic, Send, Sparkles, Bot, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  placeholder?: string;
}

const BottomPrompter = ({
  placeholder = `Try: "Explain the variance in revenue" or "Run bank reconciliation"`,
}: Props) => {
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  const canSend = value.trim().length > 0 && !isSending;

  const handleSend = () => {
    if (!canSend) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setValue("");
    }, 1500);
  };

  return (
    <div
      className="sticky bottom-0 left-0 right-0 z-20 px-6 pb-4 pt-3"
      style={{
        background:
          "linear-gradient(180deg, hsl(0 0% 100% / 0) 0%, hsl(0 0% 100% / 0.85) 30%, hsl(0 0% 100%) 100%)",
      }}
    >
      <div className="w-full max-w-full md:max-w-[92%] lg:max-w-[960px] mx-auto transition-all duration-500 ease-out">
        <div className="luka-workspace-prompter rounded-[16px]">
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Bot size={16} style={{ color: "hsl(207 71% 38%)" }} />
            </motion.div>
            <span
              className="text-xs font-medium"
              style={{ color: "hsl(220 15% 55%)" }}
            >
              Ask Luka anything about this workspace
            </span>
          </div>
          <div className="luka-workspace-prompt-input-wrap">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="luka-workspace-prompt-input"
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.94 }}
                  className="luka-workspace-prompt-action"
                  title="Add"
                >
                  <Plus size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.94 }}
                  className="luka-workspace-prompt-action"
                  title="Attach files"
                >
                  <FolderOpen size={14} />
                </motion.button>
                <div className="luka-workspace-model-tag">
                  <Sparkles size={10} style={{ color: "hsl(40 90% 50%)" }} />
                  <span>Gemini 3 Flash</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.94 }}
                  className="luka-workspace-prompt-action"
                  title="Voice"
                >
                  <Mic size={14} />
                </motion.button>
                <motion.button
                  whileHover={canSend ? { scale: 1.1 } : {}}
                  whileTap={canSend ? { scale: 0.9 } : {}}
                  className={`luka-send-btn ${canSend ? "enabled" : ""}`}
                  disabled={!canSend}
                  onClick={handleSend}
                  title="Send"
                >
                  {isSending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 size={14} strokeWidth={2.2} />
                    </motion.div>
                  ) : (
                    <Send size={14} strokeWidth={2.2} />
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomPrompter;
