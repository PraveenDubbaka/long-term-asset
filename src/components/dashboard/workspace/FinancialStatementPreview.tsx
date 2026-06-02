import { motion, AnimatePresence } from "framer-motion";
import { PanelLeftClose } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import EditMenuDropdown from "./EditMenuDropdown";
import FsFormattingToolbar from "./FsFormattingToolbar";
import TellLukaVoiceOverlay from "./TellLukaVoiceOverlay";


const FONT = "'DM Sans', system-ui, sans-serif";
const HEAD_NAVY = "hsl(215 75% 22%)";
const SUBTLE = "hsl(222 15% 55%)";
const BODY = "hsl(222 35% 16%)";
const EDIT_BORDER = "hsl(215 75% 22%)";
const EDIT_HOVER_BG = "hsl(215 80% 96%)";

interface Props {
  section: string;
  onBack: () => void;
}

/* ---------------- Editable block wrapper ---------------- */
const EditableBlock = ({
  isEditing,
  isActive,
  onActivate,
  children,
  style,
}: {
  isEditing: boolean;
  isActive: boolean;
  onActivate: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  if (!isEditing) return <div style={style}>{children}</div>;
  return (
    <div
      onMouseDown={onActivate}
      style={{
        ...style,
        position: "relative",
        borderRadius: 10,
        padding: 14,
        border: `1.5px solid ${isActive ? EDIT_BORDER : "transparent"}`,
        cursor: "text",
        transition: "border-color 120ms ease, background 120ms ease",
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = EDIT_HOVER_BG;
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {children}
    </div>
  );
};

const Editable = ({
  isEditing,
  initialHtml,
  onChange,
  style,
}: {
  isEditing: boolean;
  initialHtml: string;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  // Only set innerHTML on mount / when editing toggles; never on every render
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== initialHtml) {
      ref.current.innerHTML = initialHtml;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);
  return (
    <div
      ref={ref}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
      style={{ outline: "none", ...style }}
      dangerouslySetInnerHTML={{ __html: initialHtml }}
    />
  );
};

/* ---------------- Brand chrome ---------------- */
const BrandHeader = () => (
  <div
    className="rounded-md mx-auto"
    style={{
      width: "92%",
      padding: "26px 24px",
      background: "linear-gradient(180deg, hsl(220 18% 96%) 0%, hsl(220 18% 92%) 100%)",
      border: "1px solid hsl(220 20% 88%)",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 6 }}>🐆</div>
    <div
      style={{
        fontFamily: FONT,
        fontSize: 22,
        fontWeight: 800,
        color: HEAD_NAVY,
        letterSpacing: "0.02em",
      }}
    >
      WILDCAT ACCOUNTING
    </div>
    <div
      style={{
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 700,
        color: BODY,
        marginTop: 4,
        letterSpacing: "0.08em",
      }}
    >
      PROFESSIONAL CORPORATION
    </div>
    <div
      style={{
        fontFamily: FONT,
        fontSize: 10,
        fontWeight: 600,
        color: SUBTLE,
        marginTop: 2,
        letterSpacing: "0.1em",
      }}
    >
      CHARTERED PROFESSIONAL ACCOUNTANT
    </div>
  </div>
);

const BrandFooter = () => (
  <div
    className="rounded-md mx-auto"
    style={{
      width: "92%",
      padding: "18px 24px",
      background: "linear-gradient(180deg, hsl(220 18% 95%) 0%, hsl(220 18% 90%) 100%)",
      border: "1px solid hsl(220 20% 88%)",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontFamily: FONT,
        fontSize: 16,
        fontWeight: 800,
        color: HEAD_NAVY,
        letterSpacing: "0.02em",
      }}
    >
      WILDCAT ACCOUNTING FOOTER
    </div>
    <div
      style={{
        fontFamily: FONT,
        fontSize: 10,
        fontWeight: 600,
        color: SUBTLE,
        marginTop: 4,
        letterSpacing: "0.12em",
      }}
    >
      PROFESSIONAL CORPORATION · CHARTERED PROFESSIONAL ACCOUNTANT
    </div>
  </div>
);

/* ---------------- Page wrapper (A4-ish) ---------------- */
const Page = ({ children }: { children: React.ReactNode }) => (
  <div
    className="mx-auto rounded-[14px]"
    style={{
      background: "white",
      width: "min(820px, 100%)",
      minHeight: 1080,
      boxShadow: "0 8px 32px hsl(220 30% 30% / 0.08), 0 2px 8px hsl(220 30% 30% / 0.04)",
      border: "1px solid hsl(220 20% 90%)",
      padding: "24px 0",
      display: "flex",
      flexDirection: "column",
      fontFamily: FONT,
    }}
  >
    <BrandHeader />
    <div className="flex-1 px-12 py-10" style={{ color: BODY }}>
      {children}
    </div>
    <BrandFooter />
  </div>
);

/* ---------------- Common building blocks ---------------- */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 18,
      fontWeight: 800,
      color: HEAD_NAVY,
      textAlign: "center",
      letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const SubMeta = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 12,
      color: SUBTLE,
      textAlign: "center",
      marginTop: 4,
    }}
  >
    {children}
  </div>
);

const FsRow = ({
  label,
  v1,
  v2,
  bold,
  total,
  indent = 0,
}: {
  label: string;
  v1?: string;
  v2?: string;
  bold?: boolean;
  total?: boolean;
  indent?: number;
}) => (
  <tr style={{ borderBottom: total ? `2px solid ${HEAD_NAVY}` : "none" }}>
    <td
      style={{
        padding: "6px 0",
        paddingLeft: indent * 16,
        fontWeight: bold ? 700 : 400,
        fontSize: 13,
        color: bold ? HEAD_NAVY : BODY,
      }}
    >
      {label}
    </td>
    <td
      style={{
        padding: "6px 0",
        textAlign: "right",
        fontWeight: bold ? 700 : 500,
        fontSize: 13,
        color: bold ? HEAD_NAVY : BODY,
        fontVariantNumeric: "tabular-nums",
        width: 130,
      }}
    >
      {v1}
    </td>
    <td
      style={{
        padding: "6px 0",
        textAlign: "right",
        fontSize: 13,
        color: SUBTLE,
        fontVariantNumeric: "tabular-nums",
        width: 130,
      }}
    >
      {v2}
    </td>
  </tr>
);

const YearHeader = () => (
  <thead>
    <tr style={{ borderBottom: `1px solid hsl(220 20% 80%)` }}>
      <th />
      <th
        style={{
          textAlign: "right",
          fontSize: 11,
          fontWeight: 700,
          color: HEAD_NAVY,
          padding: "6px 0",
          letterSpacing: "0.05em",
        }}
      >
        2024
      </th>
      <th
        style={{
          textAlign: "right",
          fontSize: 11,
          fontWeight: 700,
          color: SUBTLE,
          padding: "6px 0",
          letterSpacing: "0.05em",
        }}
      >
        2023
      </th>
    </tr>
  </thead>
);

/* ---------------- Section content ---------------- */
const CoverPage = ({
  isEditing,
  values,
  activeKey,
  setActiveKey,
  onFieldChange,
  toolbarSlot,
}: {
  isEditing: boolean;
  values: { title: string; date: string; subtitle: string };
  activeKey: string | null;
  setActiveKey: (k: string | null) => void;
  onFieldChange: (k: "title" | "date" | "subtitle", v: string) => void;
  toolbarSlot?: React.ReactNode;
}) => (
  <div className="h-full flex flex-col">
    <div className="flex-1" />
    <div style={{ position: "relative" }}>
      {isEditing && activeKey === "cover" && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -120,
            transform: "translateX(-50%)",
            zIndex: 20,
          }}
        >
          {toolbarSlot}
        </div>
      )}
      <EditableBlock
        isEditing={isEditing}
        isActive={activeKey === "cover"}
        onActivate={() => setActiveKey("cover")}
        style={{ textAlign: "right", paddingRight: 8 }}
      >
        <Editable
          isEditing={isEditing}
          initialHtml={values.title}
          onChange={(v) => onFieldChange("title", v)}
          style={{ fontSize: 38, fontWeight: 800, color: HEAD_NAVY }}
        />
        <Editable
          isEditing={isEditing}
          initialHtml={values.date}
          onChange={(v) => onFieldChange("date", v)}
          style={{ fontSize: 15, fontWeight: 700, color: BODY, marginTop: 12 }}
        />
        <Editable
          isEditing={isEditing}
          initialHtml={values.subtitle}
          onChange={(v) => onFieldChange("subtitle", v)}
          style={{ fontSize: 14, color: BODY, marginTop: 6 }}
        />
      </EditableBlock>
    </div>
    <div className="flex-1" />
  </div>
);

const TableOfContents = () => (
  <div>
    <SectionTitle>Table of Contents</SectionTitle>
    <div style={{ marginTop: 32 }}>
      {[
        ["Compilation Engagement Report", "1"],
        ["Balance Sheet", "2"],
        ["Statement of Income and Loss", "3"],
        ["Statement of Cashflows", "4"],
        ["Notes to Financial Information", "5"],
        ["Schedules", "8"],
      ].map(([label, page]) => (
        <div
          key={label}
          className="flex items-baseline"
          style={{
            fontSize: 13,
            padding: "10px 0",
            borderBottom: "1px dotted hsl(220 20% 80%)",
          }}
        >
          <span style={{ fontWeight: 600 }}>{label}</span>
          <span
            style={{
              flex: 1,
              borderBottom: "1px dotted hsl(220 20% 75%)",
              margin: "0 8px",
              transform: "translateY(-4px)",
            }}
          />
          <span style={{ fontWeight: 700, color: HEAD_NAVY }}>{page}</span>
        </div>
      ))}
    </div>
  </div>
);

const BalanceSheet = () => (
  <div>
    <SectionTitle>ABC Pvt. Ltd.</SectionTitle>
    <SubMeta>Balance Sheet</SubMeta>
    <SubMeta>As at December 31, 2024</SubMeta>

    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 28 }}>
      <YearHeader />
      <tbody>
        <FsRow label="ASSETS" bold />
        <FsRow label="Current Assets" bold indent={0} />
        <FsRow label="Cash and cash equivalents" v1="$  245,300" v2="$  198,420" indent={1} />
        <FsRow label="Accounts receivable" v1="412,800" v2="385,100" indent={1} />
        <FsRow label="Inventory" v1="186,500" v2="172,900" indent={1} />
        <FsRow label="Prepaid expenses" v1="22,400" v2="19,800" indent={1} />
        <FsRow label="Total Current Assets" v1="867,000" v2="776,220" bold total indent={1} />
        <FsRow label="Property, plant & equipment, net" v1="1,245,600" v2="1,312,400" indent={1} />
        <FsRow label="Intangible assets" v1="78,900" v2="92,500" indent={1} />
        <FsRow label="TOTAL ASSETS" v1="$ 2,191,500" v2="$ 2,181,120" bold total />

        <tr><td style={{ height: 18 }} /></tr>

        <FsRow label="LIABILITIES & EQUITY" bold />
        <FsRow label="Current Liabilities" bold indent={0} />
        <FsRow label="Accounts payable" v1="$  198,400" v2="$  214,600" indent={1} />
        <FsRow label="Accrued liabilities" v1="76,200" v2="68,900" indent={1} />
        <FsRow label="Current portion of long-term debt" v1="45,000" v2="45,000" indent={1} />
        <FsRow label="Total Current Liabilities" v1="319,600" v2="328,500" bold total indent={1} />
        <FsRow label="Long-term debt" v1="385,000" v2="430,000" indent={1} />
        <FsRow label="Shareholders' equity" v1="1,486,900" v2="1,422,620" indent={1} />
        <FsRow label="TOTAL LIABILITIES & EQUITY" v1="$ 2,191,500" v2="$ 2,181,120" bold total />
      </tbody>
    </table>
  </div>
);

const IncomeStatement = () => (
  <div>
    <SectionTitle>ABC Pvt. Ltd.</SectionTitle>
    <SubMeta>Statement of Income and Loss</SubMeta>
    <SubMeta>For the year ended December 31, 2024</SubMeta>

    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 28 }}>
      <YearHeader />
      <tbody>
        <FsRow label="Revenue" v1="$ 3,248,500" v2="$ 2,915,800" bold />
        <FsRow label="Cost of goods sold" v1="(1,842,300)" v2="(1,684,200)" indent={1} />
        <FsRow label="Gross Profit" v1="1,406,200" v2="1,231,600" bold total />

        <tr><td style={{ height: 14 }} /></tr>

        <FsRow label="Operating Expenses" bold />
        <FsRow label="Salaries and benefits" v1="586,400" v2="524,300" indent={1} />
        <FsRow label="Rent and utilities" v1="142,800" v2="138,400" indent={1} />
        <FsRow label="Marketing" v1="98,200" v2="76,500" indent={1} />
        <FsRow label="Depreciation & amortization" v1="124,600" v2="119,800" indent={1} />
        <FsRow label="Office and administrative" v1="68,400" v2="62,100" indent={1} />
        <FsRow label="Professional fees" v1="34,200" v2="29,800" indent={1} />
        <FsRow label="Total Operating Expenses" v1="1,054,600" v2="950,900" bold total indent={1} />

        <tr><td style={{ height: 14 }} /></tr>

        <FsRow label="Income before tax" v1="351,600" v2="280,700" bold />
        <FsRow label="Income tax expense" v1="(87,300)" v2="(69,800)" indent={1} />
        <FsRow label="NET INCOME" v1="$  264,300" v2="$  210,900" bold total />
      </tbody>
    </table>
  </div>
);

const CashFlows = () => (
  <div>
    <SectionTitle>ABC Pvt. Ltd.</SectionTitle>
    <SubMeta>Statement of Cash Flows</SubMeta>
    <SubMeta>For the year ended December 31, 2024</SubMeta>

    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 28 }}>
      <YearHeader />
      <tbody>
        <FsRow label="Operating Activities" bold />
        <FsRow label="Net income" v1="$  264,300" v2="$  210,900" indent={1} />
        <FsRow label="Depreciation & amortization" v1="124,600" v2="119,800" indent={1} />
        <FsRow label="Changes in working capital" v1="(38,400)" v2="(22,100)" indent={1} />
        <FsRow label="Cash from Operations" v1="350,500" v2="308,600" bold total indent={1} />

        <tr><td style={{ height: 14 }} /></tr>

        <FsRow label="Investing Activities" bold />
        <FsRow label="Purchase of equipment" v1="(57,800)" v2="(42,300)" indent={1} />
        <FsRow label="Cash used in Investing" v1="(57,800)" v2="(42,300)" bold total indent={1} />

        <tr><td style={{ height: 14 }} /></tr>

        <FsRow label="Financing Activities" bold />
        <FsRow label="Repayment of long-term debt" v1="(45,000)" v2="(45,000)" indent={1} />
        <FsRow label="Dividends paid" v1="(200,820)" v2="(180,000)" indent={1} />
        <FsRow label="Cash used in Financing" v1="(245,820)" v2="(225,000)" bold total indent={1} />

        <tr><td style={{ height: 14 }} /></tr>

        <FsRow label="Net change in cash" v1="46,880" v2="41,300" bold />
        <FsRow label="Cash, beginning of year" v1="198,420" v2="157,120" indent={1} />
        <FsRow label="Cash, end of year" v1="$  245,300" v2="$  198,420" bold total />
      </tbody>
    </table>
  </div>
);

const NotesToFS = () => (
  <div style={{ fontSize: 12.5, lineHeight: 1.65 }}>
    <SectionTitle>Notes to Financial Information</SectionTitle>
    <SubMeta>December 31, 2024</SubMeta>

    <div style={{ marginTop: 24 }}>
      <div style={{ fontWeight: 700, color: HEAD_NAVY, fontSize: 13, marginTop: 18 }}>
        1. Nature of Operations
      </div>
      <p style={{ marginTop: 6 }}>
        ABC Pvt. Ltd. (the "Company") was incorporated under the Canada Business Corporations Act
        and operates in the wholesale distribution sector. The Company's principal place of
        business is located in Toronto, Ontario.
      </p>

      <div style={{ fontWeight: 700, color: HEAD_NAVY, fontSize: 13, marginTop: 18 }}>
        2. Basis of Accounting
      </div>
      <p style={{ marginTop: 6 }}>
        These financial statements are prepared in accordance with the basis of accounting
        described in Note 3 and are intended for use by management and the shareholders. The
        compilation engagement was performed in accordance with Canadian Standard on Related
        Services (CSRS) 4200, Compilation Engagements.
      </p>

      <div style={{ fontWeight: 700, color: HEAD_NAVY, fontSize: 13, marginTop: 18 }}>
        3. Significant Accounting Policies
      </div>
      <p style={{ marginTop: 6 }}>
        <strong>Revenue recognition:</strong> Revenue is recognized when control of goods is
        transferred to the customer, typically upon shipment.
        <br />
        <strong>Inventory:</strong> Stated at the lower of cost (first-in, first-out) and net
        realizable value.
        <br />
        <strong>Property, plant & equipment:</strong> Recorded at cost less accumulated
        depreciation, calculated on a straight-line basis over estimated useful lives (3–25
        years).
      </p>

      <div style={{ fontWeight: 700, color: HEAD_NAVY, fontSize: 13, marginTop: 18 }}>
        4. Long-term Debt
      </div>
      <p style={{ marginTop: 6 }}>
        Long-term debt comprises a term loan with a Canadian chartered bank, bearing interest at
        prime plus 1.25%, repayable in monthly instalments of $3,750 maturing in 2032. The loan
        is secured by a general security agreement over the Company's assets.
      </p>

      <div style={{ fontWeight: 700, color: HEAD_NAVY, fontSize: 13, marginTop: 18 }}>
        5. Related Party Transactions
      </div>
      <p style={{ marginTop: 6 }}>
        During the year, the Company paid management fees of $48,000 (2023: $42,000) to a company
        controlled by a shareholder. These transactions were measured at the exchange amount.
      </p>
    </div>
  </div>
);

const Schedules = () => (
  <div>
    <SectionTitle>Schedules</SectionTitle>
    <SubMeta>For the year ended December 31, 2024</SubMeta>

    <div style={{ marginTop: 28 }}>
      <div style={{ fontWeight: 700, color: HEAD_NAVY, fontSize: 13, marginBottom: 8 }}>
        Schedule 1 — Property, Plant & Equipment
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid hsl(220 20% 80%)` }}>
            <th style={{ textAlign: "left", fontSize: 11, padding: "6px 0", color: HEAD_NAVY }}>
              Asset Class
            </th>
            <th style={{ textAlign: "right", fontSize: 11, padding: "6px 0", color: HEAD_NAVY }}>
              Cost
            </th>
            <th style={{ textAlign: "right", fontSize: 11, padding: "6px 0", color: HEAD_NAVY }}>
              Accum. Dep.
            </th>
            <th style={{ textAlign: "right", fontSize: 11, padding: "6px 0", color: HEAD_NAVY }}>
              Net Book Value
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Buildings", "$ 980,000", "$ 218,400", "$ 761,600"],
            ["Equipment", "412,500", "186,200", "226,300"],
            ["Vehicles", "148,200", "94,800", "53,400"],
            ["Furniture & fixtures", "62,800", "38,500", "24,300"],
            ["TOTAL", "$ 1,603,500", "$ 537,900", "$ 1,065,600"],
          ].map(([a, b, c, d], i, arr) => (
            <tr
              key={a}
              style={{
                borderBottom:
                  i === arr.length - 1 ? `2px solid ${HEAD_NAVY}` : "1px solid hsl(220 20% 92%)",
                fontWeight: i === arr.length - 1 ? 700 : 400,
              }}
            >
              <td style={{ padding: "6px 0", fontSize: 12.5 }}>{a}</td>
              <td style={{ padding: "6px 0", fontSize: 12.5, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{b}</td>
              <td style={{ padding: "6px 0", fontSize: 12.5, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{c}</td>
              <td style={{ padding: "6px 0", fontSize: 12.5, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontWeight: 700, color: HEAD_NAVY, fontSize: 13, marginTop: 28, marginBottom: 8 }}>
        Schedule 2 — Operating Expenses Detail
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {[
            ["Wages and salaries", "$ 486,400"],
            ["Employee benefits", "100,000"],
            ["Rent", "108,000"],
            ["Utilities", "34,800"],
            ["Insurance", "22,400"],
            ["Telephone & internet", "11,800"],
            ["Bank charges", "6,200"],
            ["Travel & meals", "18,600"],
          ].map(([a, b]) => (
            <tr key={a} style={{ borderBottom: "1px solid hsl(220 20% 92%)" }}>
              <td style={{ padding: "6px 0", fontSize: 12.5 }}>{a}</td>
              <td style={{ padding: "6px 0", fontSize: 12.5, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ---------------- Main preview shell ---------------- */
const COVER_DEFAULTS = {
  title: "ABC Pvt. Ltd.",
  date: "December 31, 20XX",
  subtitle: "Compiled Financial Information",
};

const FinancialStatementPreview = ({ section, onBack }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [coverDraft, setCoverDraft] = useState(COVER_DEFAULTS);
  const [coverSaved, setCoverSaved] = useState(COVER_DEFAULTS);
  const dirty =
    coverDraft.title !== coverSaved.title ||
    coverDraft.date !== coverSaved.date ||
    coverDraft.subtitle !== coverSaved.subtitle;

  const enterEdit = () => {
    setCoverDraft(coverSaved);
    setIsEditing(true);
    setActiveKey(null);
  };
  const cancelEdit = () => {
    setCoverDraft(coverSaved);
    setIsEditing(false);
    setActiveKey(null);
  };
  const saveEdit = () => {
    setCoverSaved(coverDraft);
    setIsEditing(false);
    setActiveKey(null);
  };

  useEffect(() => {
    setIsEditing(false);
    setActiveKey(null);
  }, [section]);

  const handleToolbarCommand = (cmd: string, value?: string) => {
    try {
      document.execCommand(cmd, false, value);
    } catch {
      /* noop */
    }
  };

  const coverProps = {
    isEditing,
    values: coverDraft,
    activeKey,
    setActiveKey,
    onFieldChange: (k: "title" | "date" | "subtitle", v: string) =>
      setCoverDraft((d) => ({ ...d, [k]: v })),
    toolbarSlot: <FsFormattingToolbar onCommand={handleToolbarCommand} />,
  };

  const renderSection = () => {
    switch (section) {
      case "Cover Page":
        return <CoverPage {...coverProps} />;
      case "Table of Contents":
        return <TableOfContents />;
      case "Balance Sheet":
        return <BalanceSheet />;
      case "Statement of Income and Loss":
        return <IncomeStatement />;
      case "Statement of Cashflows":
        return <CashFlows />;
      case "Notes to Financial Information":
        return <NotesToFS />;
      case "Schedules":
        return <Schedules />;
      default:
        return <CoverPage {...coverProps} />;
    }
  };

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 640, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{
        width: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
        opacity: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
      }}
      className="shrink-0 h-full flex flex-col overflow-hidden"
      style={{
        background: "hsl(0 0% 100%)",
        borderLeft: "1px solid hsl(220 20% 90%)",
        maxWidth: 640,
        contain: "layout paint size",
        willChange: "width",
      }}
    >
      <div
        className="h-full flex flex-col overflow-hidden relative"
        style={{ width: 640, minWidth: 640, maxWidth: 640, flexShrink: 0, background: "hsl(220 30% 97%)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: "1px solid hsl(220 20% 90%)",
            background: "hsl(0 0% 100% / 0.7)",
            backdropFilter: "blur(10px)",
          }}
        >
        <div className="flex items-center gap-3 min-w-0">
          {!isEditing && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[hsl(220_20%_94%)]"
              style={{
                border: "1px solid hsl(220 20% 88%)",
                background: "white",
                color: HEAD_NAVY,
              }}
              title="Back"
            >
              <PanelLeftClose size={14} strokeWidth={2.2} />
            </button>
          )}
          <span
            className="text-[15px] font-semibold truncate"
            style={{ color: BODY, fontFamily: FONT }}
          >
            {section}
          </span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {isEditing ? (
            <motion.div
              key="edit-actions"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.16 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={cancelEdit}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-colors hover:bg-[hsl(220_20%_96%)]"
                style={{
                  border: "1px solid hsl(220 20% 60%)",
                  background: "white",
                  color: BODY,
                  fontFamily: FONT,
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={!dirty}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-colors"
                style={{
                  border: `1px solid ${dirty ? HEAD_NAVY : "hsl(220 20% 85%)"}`,
                  background: dirty ? HEAD_NAVY : "hsl(220 20% 92%)",
                  color: dirty ? "white" : "hsl(220 15% 60%)",
                  cursor: dirty ? "pointer" : "not-allowed",
                  fontFamily: FONT,
                }}
              >
                Save
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="edit-menu"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.16 }}
            >
              <EditMenuDropdown
                onEditManually={enterEdit}
                onTellLuka={() => setVoiceOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

        <div className="flex-1 overflow-auto px-6 py-8">
          <motion.div
            key={`${section}-${reloadKey}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Page>{renderSection()}</Page>
          </motion.div>
        </div>

        <TellLukaVoiceOverlay
          open={voiceOpen}
          onClose={() => setVoiceOpen(false)}
          onSend={() => {
            setVoiceOpen(false);
            toast.success("Luka is applying your edits…");
            setTimeout(() => {
              setReloadKey((k) => k + 1);
              toast.success("Preview updated with Luka's changes");
            }, 900);
          }}
        />
      </div>
    </motion.aside>
  );
};

export default FinancialStatementPreview;
