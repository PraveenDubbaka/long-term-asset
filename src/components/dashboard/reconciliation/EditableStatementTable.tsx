import React, { useState, useCallback } from "react";

export interface StmtRow {
  /** Unique key for the row */
  id: string;
  /** Row type determines rendering behavior */
  type: "section-header" | "data" | "data-colSpan" | "subtotal" | "label-only" | "adjusted-balance" | "difference";
  /** For section-header rows */
  sectionLabel?: string;
  /** For data rows: individual cell values */
  date?: string;
  description?: string;
  transactionType?: string;
  amount?: string;
  total?: string;
  /** For data-colSpan: description spans date+desc+type columns */
  /** For subtotal rows: just a total value */
  subtotalValue?: string;
  /** For adjusted-balance rows */
  balanceLabel?: string;
  balanceValue?: string;
  /** For difference rows */
  differenceValue?: string;
  /** Indent the description (e.g. sub-items under "Outstanding checks") */
  indented?: boolean;
  /** Is this row editable? Default true for data rows */
  editable?: boolean;
}

interface EditableStatementTableProps {
  title: string;
  subtitle: string;
  rows: StmtRow[];
  onRowsChange: (rows: StmtRow[]) => void;
}

const inputStyle: React.CSSProperties = {
  background: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 4,
  padding: "4px 6px",
  color: "hsl(var(--foreground))",
  fontSize: 16,
  fontFamily: "inherit",
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const inputMonoStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  textAlign: "right" as const,
};

const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "hsl(var(--primary))";
  e.currentTarget.style.boxShadow = "0 0 0 2px hsl(var(--primary) / 0.1)";
};

const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "hsl(var(--border))";
  e.currentTarget.style.boxShadow = "none";
};

const EditableStatementTable: React.FC<EditableStatementTableProps> = ({
  title,
  subtitle,
  rows,
  onRowsChange,
}) => {
  const updateRow = useCallback((id: string, field: keyof StmtRow, value: string) => {
    onRowsChange(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, [rows, onRowsChange]);

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <td colSpan={5} className="px-4 py-3">
              <input
                value={title}
                onChange={() => {}}
                style={{ ...inputStyle, border: "none", background: "transparent", fontSize: 16, fontWeight: 700 }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                readOnly
              />
              <input
                value={subtitle}
                onChange={() => {}}
                style={{ ...inputStyle, border: "none", background: "transparent", fontSize: 14, color: "hsl(var(--muted-foreground))" }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                readOnly
              />
            </td>
          </tr>
          <tr style={{ background: "hsl(var(--table-header-bg))", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
            <th className="text-left px-4 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 110, fontSize: 15 }}>Date</th>
            <th className="text-left px-4 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", fontSize: 15 }}>Description</th>
            <th className="text-left px-4 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 130, fontSize: 15 }}>Transaction Type</th>
            <th className="text-right px-4 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 110, fontSize: 15 }}>Amount</th>
            <th className="text-right px-4 py-2.5 font-semibold" style={{ color: "hsl(var(--foreground))", width: 110, fontSize: 15 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.type === "section-header") {
              return (
                <tr key={row.id} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)", background: "hsl(var(--muted) / 0.3)" }}>
                  <td colSpan={5} className="px-4 py-2 font-bold" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>
                    <input
                      value={row.sectionLabel || ""}
                      onChange={(e) => updateRow(row.id, "sectionLabel", e.target.value)}
                      style={{ ...inputStyle, fontWeight: 700, border: "none", background: "transparent" }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                </tr>
              );
            }

            if (row.type === "data-colSpan") {
              return (
                <tr key={row.id} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                  <td className="px-4 py-2.5">
                    <input
                      value={row.date || ""}
                      onChange={(e) => updateRow(row.id, "date", e.target.value)}
                      style={{ ...inputMonoStyle, width: 100 }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                  <td colSpan={2} className="px-4 py-2.5">
                    <input
                      value={row.description || ""}
                      onChange={(e) => updateRow(row.id, "description", e.target.value)}
                      style={{ ...inputStyle, border: "none", background: "transparent" }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                  <td className="px-4 py-2.5"></td>
                  <td className="px-4 py-2.5 text-right">
                    <input
                      value={row.total || ""}
                      onChange={(e) => updateRow(row.id, "total", e.target.value)}
                      style={{ ...inputMonoStyle, width: 100 }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                </tr>
              );
            }

            if (row.type === "data") {
              return (
                <tr key={row.id} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                  <td className="px-4 py-2.5">
                    <input
                      value={row.date || ""}
                      onChange={(e) => updateRow(row.id, "date", e.target.value)}
                      style={{ ...inputMonoStyle, width: 100 }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                  <td className={row.indented ? "pl-8 pr-4 py-2.5" : "px-4 py-2.5"}>
                    <input
                      value={row.description || ""}
                      onChange={(e) => updateRow(row.id, "description", e.target.value)}
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      value={row.transactionType || ""}
                      onChange={(e) => updateRow(row.id, "transactionType", e.target.value)}
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <input
                      value={row.amount || ""}
                      onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                      style={{ ...inputMonoStyle, width: 100 }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <input
                      value={row.total || ""}
                      onChange={(e) => updateRow(row.id, "total", e.target.value)}
                      style={{ ...inputMonoStyle, width: 100 }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                </tr>
              );
            }

            if (row.type === "subtotal") {
              return (
                <tr key={row.id} style={{ borderTop: "2px solid hsl(var(--foreground))", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                  <td className="px-4 py-2.5" colSpan={3}></td>
                  <td className="px-4 py-2.5"></td>
                  <td className="px-4 py-2.5 text-right">
                    <input
                      value={row.subtotalValue || ""}
                      onChange={(e) => updateRow(row.id, "subtotalValue", e.target.value)}
                      style={{ ...inputMonoStyle, fontWeight: 500, width: 100 }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                </tr>
              );
            }

            if (row.type === "label-only") {
              return (
                <tr key={row.id} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                  <td className="px-4 py-2.5"></td>
                  <td className="px-4 py-2.5" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>
                    <input
                      value={row.description || ""}
                      onChange={(e) => updateRow(row.id, "description", e.target.value)}
                      style={{ ...inputStyle, border: "none", background: "transparent" }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                  <td className="px-4 py-2.5"></td>
                  <td className="px-4 py-2.5"></td>
                  <td className="px-4 py-2.5"></td>
                </tr>
              );
            }

            if (row.type === "adjusted-balance") {
              return (
                <tr key={row.id} style={{ borderTop: "2px solid hsl(var(--foreground))", borderBottom: "2px solid hsl(var(--foreground))", background: "hsl(var(--muted) / 0.2)" }}>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3">
                    <input
                      value={row.balanceLabel || ""}
                      onChange={(e) => updateRow(row.id, "balanceLabel", e.target.value)}
                      style={{ ...inputStyle, fontWeight: 700, border: "none", background: "transparent" }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right">
                    <input
                      value={row.balanceValue || ""}
                      onChange={(e) => updateRow(row.id, "balanceValue", e.target.value)}
                      style={{ ...inputMonoStyle, fontWeight: 700, width: 100 }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                </tr>
              );
            }

            if (row.type === "difference") {
              return (
                <tr key={row.id} style={{ borderTop: "2px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.1)" }}>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 font-bold" style={{ color: "hsl(var(--foreground))", fontSize: 16 }}>Difference</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right">
                    <input
                      value={row.differenceValue || ""}
                      onChange={(e) => updateRow(row.id, "differenceValue", e.target.value)}
                      style={{ ...inputMonoStyle, fontWeight: 700, width: 100 }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </td>
                </tr>
              );
            }

            return null;
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EditableStatementTable;