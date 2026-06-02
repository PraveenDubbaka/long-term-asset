import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Plus, Paperclip, Layers, Minimize2, ArrowUpDown, MoreHorizontal, List } from "lucide-react";

interface ChecklistQuestion {
  id: string;
  number: string;
  question: string;
  response: "Yes" | "No" | "NA" | null;
  explanation: string;
}

const defaultQuestions: ChecklistQuestion[] = [
  { id: "1", number: "1.1", question: "5. Independence", response: null, explanation: "" },
  { id: "2", number: "1.2", question: "6. Engagement quality review Are there any circumstances that would require this engagement to be subject to an engagement quality review? If so, has a reviewer been appointed?", response: null, explanation: "" },
  { id: "3", number: "1.3", question: "7. Anti-money laundering procedures", response: null, explanation: "" },
  { id: "4", number: "1.4", question: "8. Engagement letter Has an engagement letter been signed by both parties?", response: null, explanation: "" },
];

const ChecklistView = () => {
  const [objectiveOpen, setObjectiveOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(true);
  const [questions, setQuestions] = useState<ChecklistQuestion[]>(defaultQuestions);

  const handleResponse = (id: string, value: "Yes" | "No" | "NA") => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, response: q.response === value ? null : value } : q))
    );
  };

  const ResponseButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <motion.button
      type="button"
      onClick={onClick}
      className="px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors"
      style={{
        background: active ? "hsl(var(--primary))" : "hsl(var(--muted))",
        color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
        border: active ? "1px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {label}
    </motion.button>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
      <div className="space-y-4">
        {/* Objective Accordion */}
        <motion.div
          className="rounded-xl border border-border bg-card overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            onClick={() => setObjectiveOpen(!objectiveOpen)}
            className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-foreground cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <ChevronDown
              size={16}
              className="text-muted-foreground transition-transform"
              style={{ transform: objectiveOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
            />
            Objective
          </button>
          {objectiveOpen && (
            <div className="px-5 pb-4 text-sm text-muted-foreground">
              Define the objective of this engagement checklist section.
            </div>
          )}
        </motion.div>

        {/* Client acceptance and continuance Section */}
        <motion.div
          className="rounded-xl border border-border bg-card overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          {/* Section Header */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2">
              <div
                className="w-1 h-6 rounded-full"
                style={{ background: "hsl(var(--primary))" }}
              />
              <button
                type="button"
                onClick={() => setSectionOpen(!sectionOpen)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <ChevronDown
                  size={16}
                  className="text-muted-foreground transition-transform"
                  style={{ transform: sectionOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                />
                <span className="text-sm font-semibold text-foreground">
                  1. Client acceptance and continuance
                </span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{questions.length} Questions</span>
              <button type="button" className="text-muted-foreground hover:text-foreground cursor-pointer">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>

          {/* Table */}
          {sectionOpen && (
            <div>
              {/* Table Header */}
              <div
                className="grid border-t border-border px-5 py-2.5"
                style={{ gridTemplateColumns: "40px 56px 1fr 200px 200px 140px" }}
              >
                <div className="flex items-center justify-center">
                  <List size={14} className="text-muted-foreground" />
                </div>
                <div></div>
                <div className="text-xs font-medium text-muted-foreground">Questions</div>
                <div className="text-xs font-medium text-muted-foreground">Response</div>
                <div className="text-xs font-medium text-muted-foreground">Explanation</div>
                <div className="text-xs font-medium text-muted-foreground">Reference</div>
              </div>

              {/* Rows */}
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="grid border-t border-border px-5 py-4 hover:bg-accent/30 transition-colors"
                  style={{ gridTemplateColumns: "40px 56px 1fr 200px 200px 140px", alignItems: "center" }}
                >
                  {/* Checkbox */}
                  <div className="flex items-center justify-center">
                    <div
                      className="w-4 h-4 rounded border border-border cursor-pointer hover:border-primary transition-colors"
                    />
                  </div>

                  {/* Number */}
                  <div className="text-sm text-muted-foreground font-medium">{q.number}</div>

                  {/* Question */}
                  <div className="text-sm text-foreground pr-4">{q.question}</div>

                  {/* Response */}
                  <div className="flex items-center gap-1.5">
                    {(["Yes", "No", "NA"] as const).map((val) => (
                      <ResponseButton
                        key={val}
                        label={val}
                        active={q.response === val}
                        onClick={() => handleResponse(q.id, val)}
                      />
                    ))}
                  </div>

                  {/* Explanation */}
                  <div className="text-sm text-muted-foreground italic">Additional Explanation</div>

                  {/* Reference */}
                  <div>
                    <motion.button
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer"
                      style={{
                        color: "hsl(var(--primary))",
                        border: "1.5px dashed hsl(var(--primary) / 0.4)",
                        background: "transparent",
                      }}
                      whileHover={{
                        background: "hsl(var(--primary) / 0.06)",
                        borderColor: "hsl(var(--primary) / 0.6)",
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Paperclip size={12} />
                      + Ref
                    </motion.button>
                  </div>
                </div>
              ))}

              {/* Add item */}
              <div className="border-t border-border px-5 py-3">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  Add item
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-8 flex flex-col gap-2">
        {[Layers, Minimize2, ArrowUpDown].map((Icon, i) => (
          <motion.button
            key={i}
            type="button"
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--muted-foreground))",
              boxShadow: "0 2px 8px hsl(220 20% 10% / 0.08)",
            }}
            whileHover={{ scale: 1.1, borderColor: "hsl(var(--primary) / 0.3)" }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon size={16} />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ChecklistView;
