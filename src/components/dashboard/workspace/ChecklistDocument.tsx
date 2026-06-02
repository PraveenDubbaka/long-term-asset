import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, CheckCircle2, Edit3, Save, CheckSquare } from "lucide-react";

/* ── Types ── */
type Response = "yes" | "no" | "na" | null;

interface ChecklistItem {
  id: string;
  text: string;
  response: Response;
  explanation: string;
  hasNote?: boolean;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

interface ChecklistData {
  title: string;
  autoPopulated: number;
  total: number;
  sections: ChecklistSection[];
}

/* ── CSRS 4200 Checklist Data ── */

const clientAcceptanceData: ChecklistData = {
  title: "Client Acceptance & Continuance",
  autoPopulated: 15,
  total: 22,
  sections: [
    {
      title: "Quality Management",
      items: [
        { id: "qm-1", text: "Determine whether accepting this engagement would contravene any of the firm's quality management policies.", response: "yes", explanation: "Reviewed firm QM policies — no conflicts identified. Alpha Industries is within accepted risk tolerance." },
        { id: "qm-2", text: "Confirm the firm has the competence, capabilities, and resources to perform the engagement.", response: "yes", explanation: "Engagement team has CSRS 4200 experience. Two CPAs assigned with compilation specialization." },
      ],
    },
    {
      title: "Engagement Risk Factors",
      items: [
        { id: "er-1", text: "New Clients — Indicate who in the firm has knowledge about the prospective client and whether they recommend that this entity be accepted as a new client.", response: "na", explanation: "Returning client — engaged since January 2021. Previous engagement completed without issues." },
        { id: "er-2", text: "New Clients — Contact the predecessor practitioner to inquire about any reasons the engagement should not be accepted. If no response is received, explain what alternative procedures were performed.", response: "no", explanation: "Not applicable — continuing engagement with existing client.", hasNote: true },
        { id: "er-3", text: "All Clients — Make inquiries and perform web searches for any new or emerging engagement risks that would impact the decision to accept or continue with this engagement.", response: "na", explanation: "Web search completed. No adverse findings for Alpha Industries Inc. or its directors." },
        { id: "er-4", text: "All Clients — Consider any risk factors identified from external sources.", response: "no", explanation: "No external risk factors identified from regulatory databases or news sources.", hasNote: true },
        { id: "er-5", text: "All Clients — Based on preliminary understanding, is there any indication that the financial information will be misleading?", response: "no", explanation: "Prior year financial statements were materially consistent. No indicators of misleading information.", hasNote: true },
        { id: "er-6", text: "All Clients — Does management understand the limited nature of the engagement?", response: "yes", explanation: "Management confirmed understanding of CSRS 4200 scope and limitations in engagement letter." },
      ],
    },
    {
      title: "Intended Use of Financial Information",
      items: [
        { id: "iu-1", text: "Inquire of management about the intended use and distribution of the financial information to be compiled.", response: "yes", explanation: "Financial statements for internal management use and annual CRA filing. No third-party distribution." },
        { id: "iu-2", text: "Assess whether the applicable financial reporting framework is acceptable given the intended use.", response: "yes", explanation: "ASPE framework confirmed appropriate for private enterprise reporting requirements." },
        { id: "iu-3", text: "If financial information is to be used by third parties, obtain details of intended users and purpose.", response: "na", explanation: "No third-party use anticipated. Internal and tax filing purposes only." },
      ],
    },
    {
      title: "Preconditions for Engagement",
      items: [
        { id: "pc-1", text: "Obtain agreement from management that it acknowledges its responsibility for the financial information.", response: "yes", explanation: "Management responsibility letter signed by John Smith, Director, dated January 15, 2025." },
        { id: "pc-2", text: "Obtain agreement on the applicable financial reporting framework.", response: "yes", explanation: "ASPE confirmed as applicable framework. Consistent with prior year engagement." },
        { id: "pc-3", text: "Management has agreed to provide access to all information relevant to the preparation of financial statements.", response: "yes", explanation: "Full access to QuickBooks Online, bank statements, and supporting documentation confirmed." },
        { id: "pc-4", text: "Assess whether the engagement letter needs to be updated from the prior period.", response: "yes", explanation: "Engagement letter updated for FY2024 with revised fee schedule. Client accepted terms." },
      ],
    },
    {
      title: "Anti-Money Laundering",
      items: [
        { id: "aml-1", text: "Verify client identity in accordance with FINTRAC requirements and firm AML policies.", response: "yes", explanation: "Client identity verified. Corporate registration confirmed with Ontario Business Registry." },
        { id: "aml-2", text: "Assess whether there are any indicators of money laundering or terrorist financing.", response: "no", explanation: "No indicators identified. Standard business operations in manufacturing sector." },
        { id: "aml-3", text: "Document the results of client identification and verification procedures.", response: null, explanation: "" },
      ],
    },
    {
      title: "Independence & Ethics",
      items: [
        { id: "ie-1", text: "Confirm that the engagement team has reviewed applicable independence requirements.", response: "yes", explanation: "Independence declarations completed by all team members. No conflicts identified." },
        { id: "ie-2", text: "Document any threats to independence and safeguards applied.", response: null, explanation: "" },
        { id: "ie-3", text: "Confirm compliance with relevant ethical requirements including the CPA Code of Professional Conduct.", response: "yes", explanation: "Annual ethics compliance confirmed. All team members current on CPD requirements." },
        { id: "ie-4", text: "Assess whether any self-review threat exists from the compilation of financial statements.", response: null, explanation: "" },
      ],
    },
  ],
};

const independenceData: ChecklistData = {
  title: "Independence",
  autoPopulated: 12,
  total: 16,
  sections: [
    {
      title: "General Independence Requirements",
      items: [
        { id: "gi-1", text: "Has each member of the engagement team confirmed their independence from the client entity?", response: "yes", explanation: "All team members (AP, TJ, PT) have submitted signed independence declarations." },
        { id: "gi-2", text: "Are there any financial interests held by the firm or engagement team in the client?", response: "no", explanation: "No financial interests identified. Confirmed through annual independence survey." },
        { id: "gi-3", text: "Are there any business relationships between the firm and the client beyond the engagement?", response: "no", explanation: "No business relationships exist outside of professional services engagement." },
        { id: "gi-4", text: "Has any member of the engagement team been employed by the client in the past two years?", response: "no", explanation: "No prior employment relationships identified for any team member." },
      ],
    },
    {
      title: "Threats to Independence",
      items: [
        { id: "ti-1", text: "Self-interest threat — Does the firm have any direct or indirect financial interest in the client?", response: "no", explanation: "No direct or indirect financial interest. Fee dependency below 10% threshold." },
        { id: "ti-2", text: "Self-review threat — Is the firm compiling financial statements that it will also review or audit?", response: "na", explanation: "Compilation engagement only. No review or audit services provided to this client." },
        { id: "ti-3", text: "Advocacy threat — Is the firm acting as an advocate for the client in any dispute or litigation?", response: "no", explanation: "No advocacy role. Firm provides only compilation and tax compliance services." },
        { id: "ti-4", text: "Familiarity threat — Has the same partner been assigned to this client for more than five consecutive years?", response: "no", explanation: "Partner rotation schedule reviewed. Current assignment is year 4 of 7-year maximum." },
        { id: "ti-5", text: "Intimidation threat — Has management or those charged with governance attempted to influence the engagement?", response: "no", explanation: "No intimidation factors identified. Professional relationship maintained appropriately." },
      ],
    },
    {
      title: "Safeguards Applied",
      items: [
        { id: "sa-1", text: "If threats were identified, document the safeguards applied to reduce threats to an acceptable level.", response: "na", explanation: "No significant threats identified requiring additional safeguards." },
        { id: "sa-2", text: "Has the firm's independence policies been reviewed and updated for the current period?", response: "yes", explanation: "Firm independence policies reviewed and updated effective January 1, 2025." },
        { id: "sa-3", text: "Document overall conclusion on independence for this engagement.", response: "yes", explanation: "Concluded that the firm and all engagement team members are independent of Alpha Industries Inc." },
      ],
    },
    {
      title: "Documentation",
      items: [
        { id: "do-1", text: "Ensure independence documentation is included in the engagement file.", response: "yes", explanation: "Independence file assembled with all declarations and threat assessments." },
        { id: "do-2", text: "Obtain written confirmation of independence from the engagement partner.", response: null, explanation: "" },
        { id: "do-3", text: "Review independence confirmation for completeness before engagement commencement.", response: null, explanation: "" },
        { id: "do-4", text: "File all independence-related correspondence and declarations.", response: null, explanation: "" },
      ],
    },
  ],
};

const knowledgeData: ChecklistData = {
  title: "Knowledge of Client Business",
  autoPopulated: 14,
  total: 18,
  sections: [
    {
      title: "Industry & Business Understanding",
      items: [
        { id: "ib-1", text: "Document the nature of the client's business, including principal activities and revenue sources.", response: "yes", explanation: "Alpha Industries Inc. — Manufacturing of precision components. Primary revenue from industrial contracts." },
        { id: "ib-2", text: "Identify the industry in which the client operates and any industry-specific accounting considerations.", response: "yes", explanation: "Manufacturing sector. Key considerations: inventory valuation, capital asset depreciation, warranty provisions." },
        { id: "ib-3", text: "Document the ownership structure and governance of the entity.", response: "yes", explanation: "Privately held corporation. John Smith (60%) and Sarah Smith (40%). Board consists of both shareholders." },
        { id: "ib-4", text: "Identify key management personnel and their roles.", response: "yes", explanation: "John Smith — Director & CEO. Sarah Smith — Director & CFO. Mike Chen — Controller." },
      ],
    },
    {
      title: "Accounting Policies & Framework",
      items: [
        { id: "ap-1", text: "Document the applicable financial reporting framework (e.g., ASPE, IFRS).", response: "yes", explanation: "ASPE (Accounting Standards for Private Enterprises). Consistent with prior years." },
        { id: "ap-2", text: "Identify significant accounting policies adopted by the entity.", response: "yes", explanation: "Revenue recognition on delivery. Inventory at lower of cost/NRV (FIFO). Straight-line depreciation." },
        { id: "ap-3", text: "Note any changes in accounting policies from the prior period.", response: "no", explanation: "No changes in accounting policies from FY2023. All policies applied consistently." },
        { id: "ap-4", text: "Document the entity's year-end date and any changes to the reporting period.", response: "yes", explanation: "December 31 year-end. No change to reporting period. 12-month fiscal year." },
      ],
    },
    {
      title: "Financial Information Sources",
      items: [
        { id: "fi-1", text: "Identify the accounting system and records maintained by the client.", response: "yes", explanation: "QuickBooks Online — connected via Bolts. 247 line items in trial balance imported automatically." },
        { id: "fi-2", text: "Document the source of financial data provided for the compilation.", response: "yes", explanation: "Trial balance from QuickBooks. Bank statements from TD Canada Trust. Supporting invoices on Google Drive." },
        { id: "fi-3", text: "Assess the reliability of the accounting records for compilation purposes.", response: "yes", explanation: "Records maintained by qualified controller. Monthly bank reconciliations performed. Prior year clean." },
        { id: "fi-4", text: "Identify any related party transactions that may affect the financial statements.", response: "yes", explanation: "Management salaries to shareholders ($180,000 combined). Shareholder loan balance of $45,000." },
      ],
    },
    {
      title: "Significant Matters",
      items: [
        { id: "sm-1", text: "Document any significant events or transactions during the period.", response: "yes", explanation: "Capital equipment purchase of $125,000 in Q3. New 5-year lease agreement for warehouse space." },
        { id: "sm-2", text: "Identify any going concern indicators.", response: "no", explanation: "No going concern indicators. Positive cash flow, adequate working capital, stable revenue growth." },
        { id: "sm-3", text: "Note any litigation, claims, or contingencies affecting the entity.", response: null, explanation: "" },
        { id: "sm-4", text: "Document any subsequent events that may require disclosure.", response: null, explanation: "" },
        { id: "sm-5", text: "Identify any regulatory or compliance requirements specific to the entity.", response: null, explanation: "" },
        { id: "sm-6", text: "Document tax considerations relevant to the engagement.", response: null, explanation: "" },
      ],
    },
  ],
};

const planningData: ChecklistData = {
  title: "Planning",
  autoPopulated: 13,
  total: 17,
  sections: [
    {
      title: "Engagement Scope & Objectives",
      items: [
        { id: "es-1", text: "Define the scope of the compilation engagement in accordance with CSRS 4200.", response: "yes", explanation: "Compilation of annual financial statements for FY ending December 31, 2024 under ASPE framework." },
        { id: "es-2", text: "Confirm the type of financial statements to be compiled (e.g., complete set, specific statements).", response: "yes", explanation: "Complete set: Balance Sheet, Income Statement, Statement of Retained Earnings, Notes to FS." },
        { id: "es-3", text: "Determine whether a Notice to Reader will accompany the compiled financial statements.", response: "yes", explanation: "Notice to Reader to be included as per CSRS 4200 requirements for compilation engagements." },
        { id: "es-4", text: "Identify any supplementary information to be compiled alongside the financial statements.", response: "yes", explanation: "Schedule of capital assets and amortization. Shareholder loan continuity schedule." },
      ],
    },
    {
      title: "Engagement Team & Timeline",
      items: [
        { id: "et-1", text: "Assign engagement team members with appropriate competence and capabilities.", response: "yes", explanation: "Team: AP (Senior Accountant, lead), TJ (Staff Accountant), PT (Engagement Partner, review)." },
        { id: "et-2", text: "Establish key dates and milestones for the engagement.", response: "yes", explanation: "Draft FS: March 15, 2025. Partner review: March 22. Final delivery: March 31, 2025." },
        { id: "et-3", text: "Determine estimated engagement hours and fees.", response: "yes", explanation: "Estimated 32 hours. Fee: $5,150 as per engagement letter. Consistent with prior year." },
        { id: "et-4", text: "Identify any specialists or experts needed for the engagement.", response: "no", explanation: "No specialists required. Standard compilation procedures applicable." },
      ],
    },
    {
      title: "Information Requirements",
      items: [
        { id: "ir-1", text: "Prepare a list of documents and information required from the client.", response: "yes", explanation: "Document request list sent to client. 14 of 16 items received. Outstanding: final bank statement, insurance schedule." },
        { id: "ir-2", text: "Confirm access to the client's accounting system and records.", response: "yes", explanation: "QuickBooks Online access granted via Bolts integration. Real-time data sync active." },
        { id: "ir-3", text: "Obtain prior year financial statements and working papers for reference.", response: "yes", explanation: "FY2023 financial statements and working papers retrieved from firm archive. PY trial balance imported." },
        { id: "ir-4", text: "Request management representations as required by the engagement.", response: "yes", explanation: "Management representation letter template prepared. To be signed upon completion of fieldwork." },
      ],
    },
    {
      title: "Risk Assessment & Materiality",
      items: [
        { id: "ra-1", text: "Determine planning materiality for the engagement.", response: "yes", explanation: "Planning materiality set at $15,000 based on 2% of estimated total revenue ($750,000)." },
        { id: "ra-2", text: "Identify areas of higher risk of material misstatement.", response: null, explanation: "" },
        { id: "ra-3", text: "Document any fraud risk factors relevant to the engagement.", response: null, explanation: "" },
        { id: "ra-4", text: "Plan the nature and extent of compilation procedures to be performed.", response: null, explanation: "" },
        { id: "ra-5", text: "Document the overall engagement strategy and plan.", response: null, explanation: "" },
      ],
    },
  ],
};

const checklistDataMap: Record<string, ChecklistData> = {
  "Client Acceptance & Continuance": clientAcceptanceData,
  "Independence": independenceData,
  "Knowledge of Client Business": knowledgeData,
  "Planning": planningData,
};

/* ── Response Button ── */
const ResponseButton = ({
  value,
  selected,
  onClick,
}: {
  value: "yes" | "no" | "na";
  selected: boolean;
  onClick: () => void;
}) => {
  const label = value === "na" ? "NA" : value === "yes" ? "Yes" : "No";
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="w-10 h-8 rounded-lg text-[12px] font-semibold cursor-pointer transition-all duration-200"
      style={{
        background: selected ? "hsl(207 71% 38% / 0.1)" : "hsl(var(--card))",
        border: selected
          ? "1.5px solid hsl(207 71% 38% / 0.4)"
          : "1px solid hsl(var(--border))",
        color: selected ? "hsl(207 71% 28%)" : "hsl(var(--muted-foreground))",
      }}
    >
      {label}
    </motion.button>
  );
};

/* ── Main Component ── */
interface ChecklistDocumentProps {
  checklistName: string;
}

const ChecklistDocument = ({ checklistName }: ChecklistDocumentProps) => {
  const data = checklistDataMap[checklistName];
  const [sections, setSections] = useState<ChecklistSection[]>(data?.sections || []);
  const [saved, setSaved] = useState(false);

  if (!data) return null;

  const answered = sections.reduce(
    (acc, s) => acc + s.items.filter((i) => i.response !== null).length,
    0
  );
  const total = sections.reduce((acc, s) => acc + s.items.length, 0);

  const handleResponse = (sectionIdx: number, itemIdx: number, value: Response) => {
    setSections((prev) => {
      const next = prev.map((s, si) =>
        si === sectionIdx
          ? {
              ...s,
              items: s.items.map((it, ii) =>
                ii === itemIdx ? { ...it, response: it.response === value ? null : value } : it
              ),
            }
          : s
      );
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto pb-8"
    >
      {/* Luka status banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
        style={{
          background: "linear-gradient(135deg, hsl(207 71% 38% / 0.06), hsl(260 70% 60% / 0.04))",
          border: "1px solid hsl(207 71% 38% / 0.12)",
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, hsl(207 71% 38% / 0.15), hsl(260 70% 60% / 0.12))",
            border: "1.5px solid hsl(207 71% 38% / 0.25)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="cl-bolt" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9747FF" />
                <stop offset="100%" stopColor="#115697" />
              </linearGradient>
            </defs>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#cl-bolt)" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[13px] leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
            <span className="font-bold" style={{ background: "linear-gradient(135deg, #9747FF, #115697)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Luka
            </span>
            {" "}identified the checklist requirements and auto-populated{" "}
            <span className="font-bold" style={{ color: "hsl(207 71% 28%)" }}>
              {data.autoPopulated}/{data.total}
            </span>{" "}
            responses from uploaded files and connected data sources. Review, modify, and save to the engagement.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: answered === total ? "hsl(145 50% 95%)" : "hsl(207 71% 38% / 0.08)",
              color: answered === total ? "hsl(145 55% 32%)" : "hsl(210 80% 40%)",
              border: answered === total
                ? "1px solid hsl(145 50% 70% / 0.3)"
                : "1px solid hsl(207 71% 38% / 0.15)",
            }}
          >
            {answered}/{total} completed
          </span>
        </div>
      </motion.div>

      {/* Checklist sections */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: "1px solid hsl(var(--border))",
          background: "hsl(var(--card))",
          boxShadow: "0 2px 16px hsl(220 30% 50% / 0.06)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-3.5"
          style={{
            background: "hsl(var(--muted) / 0.3)",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          <CheckSquare size={16} style={{ color: "hsl(207 71% 28%)" }} />
          <h2 className="text-[15px] font-bold" style={{ color: "hsl(var(--foreground))" }}>
            {data.title}
          </h2>
          <span className="text-[11px] ml-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
            CSRS 4200 — Compilation Engagements
          </span>
        </div>

        {/* Column headers */}
        <div
          className="grid items-center px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "28px 1fr 160px 1fr",
            gap: "0 12px",
            background: "hsl(var(--muted) / 0.15)",
            borderBottom: "1px solid hsl(var(--border))",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          <span />
          <span>Procedure</span>
          <span className="text-center">Response</span>
          <span>Explanation / Details</span>
        </div>

        {/* Sections */}
        {sections.map((section, si) => (
          <div key={section.title}>
            {/* Section header */}
            <div
              className="grid items-center px-5 py-2.5"
              style={{
                gridTemplateColumns: "28px 1fr",
                background: "hsl(var(--muted) / 0.2)",
                borderBottom: "1px solid hsl(var(--border) / 0.5)",
                borderTop: si > 0 ? "1px solid hsl(var(--border) / 0.5)" : undefined,
              }}
            >
              <div
                className="w-4 h-4 rounded border flex items-center justify-center"
                style={{
                  borderColor: "hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
              <span className="text-[13px] font-bold" style={{ color: "hsl(var(--foreground))" }}>
                {section.title}
              </span>
            </div>

            {/* Items */}
            {section.items.map((item, ii) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.02 * (si * 4 + ii) }}
                className="grid items-start px-5 py-3.5"
                style={{
                  gridTemplateColumns: "28px 1fr 160px 1fr",
                  gap: "0 12px",
                  borderBottom: "1px solid hsl(var(--border) / 0.3)",
                  background: item.response !== null
                    ? "hsl(var(--card))"
                    : "hsl(var(--muted) / 0.08)",
                }}
              >
                {/* Checkbox */}
                <div className="pt-0.5">
                  <div
                    className="w-4 h-4 rounded border flex items-center justify-center"
                    style={{
                      borderColor: item.response !== null
                        ? "hsl(207 71% 38% / 0.4)"
                        : "hsl(var(--border))",
                      background: item.response !== null
                        ? "hsl(207 71% 38% / 0.08)"
                        : "hsl(var(--card))",
                    }}
                  >
                    {item.response !== null && (
                      <CheckCircle2 size={10} style={{ color: "hsl(207 71% 38%)" }} />
                    )}
                  </div>
                </div>

                {/* Procedure text */}
                <p className="text-[13px] leading-relaxed pr-4" style={{ color: "hsl(var(--foreground) / 0.85)" }}>
                  {item.text}
                </p>

                {/* Response buttons */}
                <div className="flex items-center justify-center gap-1.5">
                  <ResponseButton
                    value="yes"
                    selected={item.response === "yes"}
                    onClick={() => handleResponse(si, ii, "yes")}
                  />
                  <ResponseButton
                    value="no"
                    selected={item.response === "no"}
                    onClick={() => handleResponse(si, ii, "no")}
                  />
                  <ResponseButton
                    value="na"
                    selected={item.response === "na"}
                    onClick={() => handleResponse(si, ii, "na")}
                  />
                  {item.hasNote && (
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                      style={{
                        color: "hsl(var(--muted-foreground))",
                        background: "hsl(var(--muted) / 0.3)",
                      }}
                    >
                      <Edit3 size={12} />
                    </motion.button>
                  )}
                </div>

                {/* Explanation */}
                <p
                  className="text-[12px] leading-relaxed italic"
                  style={{
                    color: item.explanation
                      ? "hsl(var(--foreground) / 0.6)"
                      : "hsl(var(--muted-foreground) / 0.4)",
                  }}
                >
                  {item.explanation || "Explanation will come here"}
                </p>
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {/* Save bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between mt-4 px-4 py-3 rounded-xl"
        style={{
          background: "hsl(var(--muted) / 0.25)",
          border: "1px solid hsl(var(--border) / 0.5)",
        }}
      >
        <div className="flex items-center gap-2">
          <Bot size={13} style={{ color: "hsl(207 71% 38%)" }} />
          <span className="text-[11px] font-medium" style={{ color: "hsl(210 80% 40%)" }}>
            Generated by Luka AI — Review and customize before saving
          </span>
          <Sparkles size={11} style={{ color: "hsl(40 90% 50%)" }} />
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold cursor-pointer"
          style={{
            background: saved
              ? "hsl(145 60% 42%)"
              : "linear-gradient(135deg, hsl(207 71% 38%), hsl(260 70% 58%))",
            color: "white",
            boxShadow: saved
              ? "0 2px 8px hsl(145 60% 42% / 0.3)"
              : "0 2px 8px hsl(207 71% 38% / 0.25)",
          }}
        >
          {saved ? (
            <>
              <CheckCircle2 size={13} />
              Saved
            </>
          ) : (
            <>
              <Save size={13} />
              Save to Engagement
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default ChecklistDocument;
