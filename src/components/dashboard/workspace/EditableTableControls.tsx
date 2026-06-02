import { useState, useRef, useEffect, useCallback } from "react";
import CoverPageToolbar, { CoverPageFormatting, defaultFormatting } from "./CoverPageToolbar";

interface EditableTableControlsProps {
  isEditMode: boolean;
  children: React.ReactNode;
}

export interface TableFormatting {
  header: CoverPageFormatting;
  totals: CoverPageFormatting;
}

const headerDefault: CoverPageFormatting = {
  ...defaultFormatting,
  fontSize: 16,
  fontWeight: 700,
  bold: true,
  align: "right",
  lineSpacing: "1.0",
};

const totalsDefault: CoverPageFormatting = {
  ...defaultFormatting,
  fontSize: 16,
  fontWeight: 700,
  bold: true,
  align: "right",
  lineSpacing: "1.0",
};

type SectionKey = "header" | "totals";

const EditableTableControls = ({ isEditMode, children }: EditableTableControlsProps) => {
  const [hoveredSection, setHoveredSection] = useState<SectionKey | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [formatting, setFormatting] = useState<Record<SectionKey, CoverPageFormatting>>({
    header: { ...headerDefault },
    totals: { ...totalsDefault },
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLElement | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);

  const updateToolbarPosition = useCallback(() => {
    if (!activeRowRef.current || !wrapperRef.current) return;
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const rowRect = activeRowRef.current.getBoundingClientRect();
    setToolbarPos({
      top: rowRect.top - wrapperRect.top - 48,
      left: (rowRect.left - wrapperRect.left) + rowRect.width / 2,
    });
  }, []);

  const handleMouseOver = useCallback((e: React.MouseEvent) => {
    if (!isEditMode || toolbarVisible) return;
    const target = e.target as HTMLElement;
    const thead = target.closest("thead");
    const totalRow = target.closest("[data-editable-total]");
    if (thead) setHoveredSection("header");
    else if (totalRow) setHoveredSection("totals");
    else setHoveredSection(null);
  }, [isEditMode, toolbarVisible]);

  const handleMouseLeave = useCallback(() => {
    if (!toolbarVisible) setHoveredSection(null);
  }, [toolbarVisible]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isEditMode) return;
    const target = e.target as HTMLElement;
    const thead = target.closest("thead");
    const totalRow = target.closest("[data-editable-total]");
    
    if (thead) {
      activeRowRef.current = thead as HTMLElement;
      setActiveSection("header");
      setToolbarVisible(true);
      setTimeout(updateToolbarPosition, 0);
    } else if (totalRow) {
      activeRowRef.current = totalRow as HTMLElement;
      setActiveSection("totals");
      setToolbarVisible(true);
      setTimeout(updateToolbarPosition, 0);
    }
  }, [isEditMode, updateToolbarPosition]);

  // Close toolbar on outside click
  useEffect(() => {
    if (!toolbarVisible) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inWrapper = wrapperRef.current?.contains(target);
      const inToolbar = toolbarRef.current?.contains(target);
      if (!inWrapper && !inToolbar) {
        setToolbarVisible(false);
        setActiveSection(null);
        setHoveredSection(null);
        activeRowRef.current = null;
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [toolbarVisible]);

  useEffect(() => {
    if (!isEditMode) {
      setToolbarVisible(false);
      setActiveSection(null);
      setHoveredSection(null);
    }
  }, [isEditMode]);

  const handleFormattingChange = useCallback((f: CoverPageFormatting) => {
    if (activeSection) {
      setFormatting(prev => ({ ...prev, [activeSection]: f }));
    }
  }, [activeSection]);

  // Apply CSS classes for hover/active highlights
  const getHighlightClass = (section: SectionKey) => {
    if (activeSection === section && toolbarVisible) return "editable-table-active";
    if (hoveredSection === section && isEditMode) return "editable-table-hover";
    return "";
  };

  const sectionLabels: Record<SectionKey, string> = {
    header: "Table Header",
    totals: "Total Row",
  };

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative" }}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={[
        isEditMode ? "editable-table-wrapper" : "",
        getHighlightClass("header") ? `header-${getHighlightClass("header")}` : "",
        getHighlightClass("totals") ? `totals-${getHighlightClass("totals")}` : "",
      ].join(" ")}
    >
      {/* Toolbar */}
      {toolbarVisible && activeSection && toolbarPos && (
        <div
          ref={toolbarRef}
          style={{
            position: "absolute",
            top: toolbarPos.top,
            left: toolbarPos.left,
            transform: "translateX(-50%)",
            zIndex: 50,
          }}
        >
          <CoverPageToolbar
            visible={toolbarVisible}
            formatting={formatting[activeSection]}
            onFormattingChange={handleFormattingChange}
            activeField={activeSection}
            onActiveFieldChange={(field) => {
              if (field === null || field === "header" || field === "totals") {
                setActiveSection(field as SectionKey | null);
              }
            }}
          />
        </div>
      )}

      {/* Inject styles for hover/active highlights */}
      <style>{`
        .editable-table-wrapper thead {
          transition: outline 0.2s ease, box-shadow 0.2s ease;
          outline: 1.5px solid transparent;
          outline-offset: 2px;
          border-radius: 4px;
          cursor: pointer;
        }
        .editable-table-wrapper [data-editable-total] {
          transition: outline 0.2s ease, box-shadow 0.2s ease;
          outline: 1.5px solid transparent;
          outline-offset: 2px;
          cursor: pointer;
        }
        .header-editable-table-hover thead {
          outline: 1.5px solid hsl(220 35% 72%);
          box-shadow: 0 2px 16px hsl(220 30% 50% / 0.08);
        }
        .header-editable-table-active thead {
          outline: 1.5px solid hsl(215 55% 65%);
          box-shadow: 0 2px 16px hsl(215 50% 50% / 0.12);
        }
        .totals-editable-table-hover [data-editable-total]:hover {
          outline: 1.5px solid hsl(220 35% 72%);
          box-shadow: 0 2px 16px hsl(220 30% 50% / 0.08);
        }
        .totals-editable-table-active [data-editable-total] {
          outline: 1.5px solid hsl(215 55% 65%);
          box-shadow: 0 2px 16px hsl(215 50% 50% / 0.12);
        }
      `}</style>

      {children}
    </div>
  );
};

export default EditableTableControls;
