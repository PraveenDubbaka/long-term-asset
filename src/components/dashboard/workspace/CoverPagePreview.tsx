import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import CoverPageToolbar, { CoverPageFormatting, defaultFormatting } from "./CoverPageToolbar";

interface CoverPagePreviewProps {
  isEditMode?: boolean;
  onContentChanged?: (hasChanges: boolean) => void;
  templateType?: "compilation" | "review" | "tax" | null;
}

type FieldKey = "clientName" | "periodEnd" | "title";

const fieldDefaults: Record<FieldKey, CoverPageFormatting> = {
  clientName: { ...defaultFormatting, fontSize: 36 },
  periodEnd: { ...defaultFormatting, fontSize: 18, fontWeight: 600 },
  title: { ...defaultFormatting, fontSize: 18, fontWeight: 600 },
};

const CoverPagePreview = ({ isEditMode = false, onContentChanged, templateType = null }: CoverPagePreviewProps) => {
  // Determine default title based on template type
  const getDefaultTitle = () => {
    if (templateType === "review") return "Reviewed Financial Statements";
    if (templateType === "tax") return "Income Tax Basis - Financial Statements";
    return "Compiled Financial Information";
  };

  const defaultTitle = useMemo(() => getDefaultTitle(), [templateType]);

  const [clientName, setClientName] = useState("ABC Pvt. Ltd.");
  const [periodEnd, setPeriodEnd] = useState("December 31, 2024");
  const [title, setTitle] = useState(defaultTitle);

  // Sync title when templateType changes
  useEffect(() => {
    setTitle(getDefaultTitle());
  }, [templateType]);
  const [isHovered, setIsHovered] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  // null = global, otherwise per-field
  const [activeField, setActiveField] = useState<FieldKey | null>(null);

  const [fieldFormatting, setFieldFormatting] = useState<Record<FieldKey, CoverPageFormatting>>({
    clientName: { ...fieldDefaults.clientName },
    periodEnd: { ...fieldDefaults.periodEnd },
    title: { ...fieldDefaults.title },
  });

  const interactiveRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const initialValues = useRef({ clientName: "ABC Pvt. Ltd.", periodEnd: "December 31, 2024", title: getDefaultTitle() });

  // Get the formatting shown in toolbar: if a field is active, show its formatting; otherwise show a merged/global view
  const getToolbarFormatting = useCallback((): CoverPageFormatting => {
    if (activeField) return fieldFormatting[activeField];
    // Global: show clientName formatting as representative
    return fieldFormatting.clientName;
  }, [activeField, fieldFormatting]);

  const handleFormattingChange = useCallback((f: CoverPageFormatting) => {
    if (activeField) {
      // Apply to single field
      setFieldFormatting(prev => ({ ...prev, [activeField]: f }));
    } else {
      // Apply globally to all fields, preserving each field's base font size if fontSize hasn't changed
      setFieldFormatting(prev => {
        const updated: Record<FieldKey, CoverPageFormatting> = { ...prev };
        (Object.keys(prev) as FieldKey[]).forEach(key => {
          updated[key] = {
            ...f,
            // Keep field's own fontSize unless toolbar fontSize was explicitly changed
            fontSize: f.fontSize !== getToolbarFormatting().fontSize ? f.fontSize : prev[key].fontSize,
          };
        });
        return updated;
      });
    }
  }, [activeField, getToolbarFormatting]);

  useEffect(() => {
    if (isEditMode && onContentChanged) {
      const hasChanges =
        clientName !== initialValues.current.clientName ||
        periodEnd !== initialValues.current.periodEnd ||
        title !== initialValues.current.title;
      onContentChanged(hasChanges);
    }
  }, [clientName, periodEnd, title, isEditMode, onContentChanged]);

  useEffect(() => {
    if (!isEditMode || !toolbarVisible) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inContent = interactiveRef.current?.contains(target);
      const inToolbar = toolbarRef.current?.contains(target);
      if (!inContent && !inToolbar) {
        setToolbarVisible(false);
        setEditingField(null);
        setIsHovered(false);
        setActiveField(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isEditMode, toolbarVisible]);

  useEffect(() => {
    if (!isEditMode) { setToolbarVisible(false); setEditingField(null); setIsHovered(false); setActiveField(null); }
  }, [isEditMode]);

  const getFieldStyles = (key: FieldKey): React.CSSProperties => {
    const fmt = fieldFormatting[key];
    return {
      fontWeight: fmt.bold ? 700 : (fmt.fontWeight || 400),
      fontStyle: fmt.italic ? "italic" : "normal",
      textDecoration: fmt.underline ? "underline" : "none",
      textTransform: fmt.uppercase ? "uppercase" : "none",
      lineHeight: fmt.lineSpacing,
    };
  };

  // Use the first field's align for container alignment (global)
  const globalAlign = fieldFormatting.clientName.align;
  const alignItems = globalAlign === "left" ? "flex-start" : globalAlign === "center" ? "center" : "flex-end";

  const applyText = (text: string, key: FieldKey) => fieldFormatting[key].uppercase ? text.toUpperCase() : text;

  const showFieldBg = (fieldKey: string) =>
    isEditMode && (fieldKey === "clientName" || fieldKey === "periodEnd");

  const handleFieldClick = (e: React.MouseEvent, key: FieldKey) => {
    e.stopPropagation();
    setActiveField(key);
    setToolbarVisible(true);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only set global if clicking the container background, not a field
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-field]') === null) {
      setActiveField(null);
      if (!toolbarVisible) setToolbarVisible(true);
    }
  };

  const renderField = (
    fieldKey: FieldKey,
    value: string,
    setValue: (v: string) => void,
    baseFontSize: number,
    extraStyle?: React.CSSProperties
  ) => {
    const isEditing = editingField === fieldKey;
    const isActive = activeField === fieldKey;
    const hasBg = showFieldBg(fieldKey);
    const fmt = fieldFormatting[fieldKey];
    const fieldStyles = getFieldStyles(fieldKey);

    const bgStyle: React.CSSProperties = hasBg
      ? { borderRadius: 6, background: "hsl(220 20% 93%)", padding: "4px 10px", display: "inline-block" }
      : {};

    const fieldStyle: React.CSSProperties = {
      fontSize: fmt.fontSize || baseFontSize,
      fontWeight: fieldStyles.fontWeight,
      fontStyle: fieldStyles.fontStyle,
      textDecoration: fieldStyles.textDecoration,
      textTransform: fieldStyles.textTransform as any,
      color: "#000000",
      display: "block",
      lineHeight: fmt.lineSpacing,
      ...extraStyle,
    };

    // Active field highlight
    const activeHighlight: React.CSSProperties = isActive && toolbarVisible
      ? { outline: "1.5px solid hsl(215 55% 65%)", outlineOffset: 2, borderRadius: 4 }
      : {};

    if (!isEditMode || !isEditing) {
      return (
        <div
          data-field={fieldKey}
          style={{ ...bgStyle, ...activeHighlight, cursor: isEditMode ? "pointer" : "default" }}
          onClick={(e) => {
            if (isEditMode) {
              handleFieldClick(e, fieldKey);
              setEditingField(fieldKey);
            }
          }}
        >
          <span style={fieldStyle}>
            {applyText(value, fieldKey)}
          </span>
        </div>
      );
    }
    return (
      <div
        data-field={fieldKey}
        style={{
          borderRadius: 6, background: "hsl(220 20% 93%)", padding: "4px 10px", display: "inline-block",
          ...activeHighlight,
        }}
        onClick={(e) => { e.stopPropagation(); handleFieldClick(e, fieldKey); }}
      >
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => { if (e.key === "Enter") setEditingField(null); }}
          style={{
            ...fieldStyle, border: "none", outline: "none", background: "transparent",
            width: "100%", padding: 0, margin: 0, fontFamily: "inherit",
          }}
        />
      </div>
    );
  };

  const showOutline = toolbarVisible || isHovered || !!editingField;

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-muted/30 relative">
      <div
        data-fs-page
        className="bg-white rounded-sm border border-border"
        style={{
          width: "842px",
          height: "1191px",
          boxShadow: "0 4px 24px hsl(220 20% 10% / 0.08), 0 1px 4px hsl(220 20% 10% / 0.04)",
          position: "relative",
          overflow: "visible",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Arial', 'Helvetica', sans-serif",
          flexShrink: 0,
        }}
      >
        {/* Header */}
        <div style={{ background: "hsl(220 15% 96%)", padding: "32px 48px", textAlign: "center", fontSize: 14, color: "#5a5a6e" }}>
          Header will come here
        </div>

        {/* Body */}
        <div style={{ flex: 1, position: "relative", overflow: "visible" }}>
          <div
            className="absolute"
            style={{
              left: "48px", right: "48px",
              top: "50%", transform: "translateY(-10%)",
            }}
          >
            {isEditMode && toolbarVisible && (
              <div
                ref={toolbarRef}
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  marginBottom: 10,
                  zIndex: 50,
                }}
              >
                <CoverPageToolbar
                  visible={toolbarVisible}
                  formatting={getToolbarFormatting()}
                  onFormattingChange={handleFormattingChange}
                  activeField={activeField}
                  onActiveFieldChange={(field) => setActiveField(field as FieldKey | null)}
                />
              </div>
            )}

            <div
              ref={isEditMode ? interactiveRef : undefined}
              onMouseEnter={isEditMode ? () => setIsHovered(true) : undefined}
              onMouseLeave={isEditMode ? () => { if (!toolbarVisible) setIsHovered(false); } : undefined}
              onClick={isEditMode ? handleContainerClick : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: alignItems,
                width: "100%",
                borderRadius: 12,
                border: `1.5px solid ${isEditMode ? (toolbarVisible && !activeField ? "hsl(215 55% 65%)" : showOutline ? "hsl(220 35% 72%)" : "transparent") : "transparent"}`,
                padding: "14px 20px",
                gap: 2,
                transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                boxShadow: isEditMode
                  ? (toolbarVisible && !activeField
                    ? "0 2px 16px hsl(215 50% 50% / 0.12)"
                    : showOutline ? "0 2px 16px hsl(220 30% 50% / 0.08)" : "none")
                  : "none",
                cursor: isEditMode ? "pointer" : "default",
              }}
            >
              {isEditMode ? (
                <>
                  {renderField("clientName", clientName, setClientName, 36, { marginBottom: "6px" })}
                  {renderField("periodEnd", periodEnd, setPeriodEnd, 18, { marginBottom: "10px" })}
                  {renderField("title", title, setTitle, 18)}
                </>
              ) : (
                <>
                  <span style={{ fontSize: fieldFormatting.clientName.fontSize, color: "#000000", marginBottom: "6px", ...getFieldStyles("clientName") }}>{applyText(clientName, "clientName")}</span>
                  <span style={{ fontSize: fieldFormatting.periodEnd.fontSize, color: "#000000", marginBottom: "10px", ...getFieldStyles("periodEnd") }}>{applyText(periodEnd, "periodEnd")}</span>
                  <span style={{ fontSize: fieldFormatting.title.fontSize, color: "#000000", ...getFieldStyles("title") }}>{applyText(title, "title")}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "hsl(220 15% 96%)", padding: "32px 48px", textAlign: "center", fontSize: 14, color: "#5a5a6e" }}>
          Footer will come here
        </div>

        {/* Watermark */}
        <div
          style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: 64, fontWeight: 700, color: "rgba(0,0,0,0.07)",
            whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none", letterSpacing: 6,
          }}
        >
          DRAFT UNDER DISCUSSION
        </div>
      </div>
    </div>
  );
};

export default CoverPagePreview;
