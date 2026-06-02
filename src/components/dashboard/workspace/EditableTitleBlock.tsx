import { useState, useRef, useEffect, useCallback } from "react";
import CoverPageToolbar, { CoverPageFormatting, defaultFormatting } from "./CoverPageToolbar";

interface EditableTitleBlockProps {
  isEditMode?: boolean;
  onContentChanged?: (hasChanges: boolean) => void;
  entityName?: string;
  pageName?: string;
  dateLabel?: string;
}

type FieldKey = "entityName" | "pageName" | "dateLabel";

const fieldDefaults: Record<FieldKey, CoverPageFormatting> = {
  entityName: { ...defaultFormatting, fontSize: 18, fontWeight: 700, align: "left" },
  pageName: { ...defaultFormatting, fontSize: 18, fontWeight: 700, align: "left" },
  dateLabel: { ...defaultFormatting, fontSize: 18, fontWeight: 700, align: "left" },
};

const EditableTitleBlock = ({
  isEditMode = false,
  onContentChanged,
  entityName: initialEntity = "Cash Flow qa3",
  pageName: initialPage = "Balance Sheet",
  dateLabel: initialDate = "As at December 31, 2024",
}: EditableTitleBlockProps) => {
  const [entityName, setEntityName] = useState(initialEntity);
  const [pageName, setPageName] = useState(initialPage);
  const [dateLabel, setDateLabel] = useState(initialDate);
  const [isHovered, setIsHovered] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [activeField, setActiveField] = useState<FieldKey | null>(null);

  const [fieldFormatting, setFieldFormatting] = useState<Record<FieldKey, CoverPageFormatting>>({
    entityName: { ...fieldDefaults.entityName },
    pageName: { ...fieldDefaults.pageName },
    dateLabel: { ...fieldDefaults.dateLabel },
  });

  const interactiveRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const initialValues = useRef({ entityName: initialEntity, pageName: initialPage, dateLabel: initialDate });

  const getToolbarFormatting = useCallback((): CoverPageFormatting => {
    if (activeField) return fieldFormatting[activeField];
    return fieldFormatting.entityName;
  }, [activeField, fieldFormatting]);

  const handleFormattingChange = useCallback((f: CoverPageFormatting) => {
    if (activeField) {
      setFieldFormatting(prev => ({ ...prev, [activeField]: f }));
    } else {
      setFieldFormatting(prev => {
        const updated: Record<FieldKey, CoverPageFormatting> = { ...prev };
        (Object.keys(prev) as FieldKey[]).forEach(key => {
          updated[key] = {
            ...f,
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
        entityName !== initialValues.current.entityName ||
        pageName !== initialValues.current.pageName ||
        dateLabel !== initialValues.current.dateLabel;
      onContentChanged(hasChanges);
    }
  }, [entityName, pageName, dateLabel, isEditMode, onContentChanged]);

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

  const applyText = (text: string, key: FieldKey) => fieldFormatting[key].uppercase ? text.toUpperCase() : text;

  const handleFieldClick = (e: React.MouseEvent, key: FieldKey) => {
    e.stopPropagation();
    setActiveField(key);
    setToolbarVisible(true);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-field]') === null) {
      setActiveField(null);
      if (!toolbarVisible) setToolbarVisible(true);
    }
  };

  const fieldLabels: Record<FieldKey, string> = {
    entityName: "Entity Name",
    pageName: "Page Name",
    dateLabel: "Date",
  };

  const renderField = (
    fieldKey: FieldKey,
    value: string,
    setValue: (v: string) => void,
  ) => {
    const isEditing = editingField === fieldKey;
    const isActive = activeField === fieldKey;
    const fmt = fieldFormatting[fieldKey];
    const fieldStyles = getFieldStyles(fieldKey);

    const fieldStyle: React.CSSProperties = {
      fontSize: fmt.fontSize || 18,
      fontWeight: fieldStyles.fontWeight,
      fontStyle: fieldStyles.fontStyle,
      textDecoration: fieldStyles.textDecoration,
      textTransform: fieldStyles.textTransform as any,
      color: "#1a1a1a",
      display: "block",
      lineHeight: fmt.lineSpacing,
    };

    const activeHighlight: React.CSSProperties = isActive && toolbarVisible
      ? { outline: "1.5px solid hsl(215 55% 65%)", outlineOffset: 2, borderRadius: 4 }
      : {};

    // Grey background for entityName and dateLabel in edit mode (like Cover Page clientName/periodEnd)
    const hasBg = isEditMode && (fieldKey === "entityName" || fieldKey === "dateLabel");
    const bgStyle: React.CSSProperties = hasBg
      ? { borderRadius: 6, background: "hsl(220 20% 93%)", padding: "2px 8px", display: "inline-block" }
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
          <span style={fieldStyle}>{applyText(value, fieldKey)}</span>
        </div>
      );
    }
    return (
      <div
        data-field={fieldKey}
        style={{
          borderRadius: 6, background: "hsl(220 20% 93%)", padding: "2px 8px", display: "inline-block",
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

  if (!isEditMode) {
    return (
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 18, ...getFieldStyles("entityName") }}>{applyText(entityName, "entityName")}</div>
        <div style={{ fontWeight: 700, fontSize: 18, ...getFieldStyles("pageName") }}>{applyText(pageName, "pageName")}</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginTop: 2, ...getFieldStyles("dateLabel") }}>{applyText(dateLabel, "dateLabel")}</div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 4, position: "relative" }}>
      {toolbarVisible && (
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
        ref={interactiveRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { if (!toolbarVisible) setIsHovered(false); }}
        onClick={handleContainerClick}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          borderRadius: 8,
          border: `1.5px solid ${toolbarVisible && !activeField ? "hsl(215 55% 65%)" : showOutline ? "hsl(220 35% 72%)" : "transparent"}`,
          padding: "8px 12px",
          gap: 2,
          transition: "border-color 0.25s ease, box-shadow 0.25s ease",
          boxShadow: toolbarVisible && !activeField
            ? "0 2px 16px hsl(215 50% 50% / 0.12)"
            : showOutline ? "0 2px 16px hsl(220 30% 50% / 0.08)" : "none",
          cursor: "pointer",
        }}
      >
        {renderField("entityName", entityName, setEntityName)}
        {renderField("pageName", pageName, setPageName)}
        <div style={{ height: 2 }} />
        {renderField("dateLabel", dateLabel, setDateLabel)}
      </div>
    </div>
  );
};

export default EditableTitleBlock;
