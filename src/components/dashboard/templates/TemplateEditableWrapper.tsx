import { useState, useRef, useCallback, useEffect } from "react";
import CoverPageToolbar, { CoverPageFormatting, defaultFormatting } from "@/components/dashboard/workspace/CoverPageToolbar";

interface TemplateEditableWrapperProps {
  isEditMode: boolean;
  onContentChanged?: (hasChanges: boolean) => void;
  children: React.ReactNode;
}

type SectionKey = "title" | "header" | "body" | "totals";

const sectionDefaults: Record<SectionKey, CoverPageFormatting> = {
  title: { ...defaultFormatting, fontSize: 18, fontWeight: 700, bold: true, align: "left", lineSpacing: "1.0" },
  header: { ...defaultFormatting, fontSize: 16, fontWeight: 700, bold: true, align: "right", lineSpacing: "1.0" },
  body: { ...defaultFormatting, fontSize: 16, fontWeight: 400, bold: false, align: "left", lineSpacing: "1.0" },
  totals: { ...defaultFormatting, fontSize: 16, fontWeight: 700, bold: true, align: "right", lineSpacing: "1.0" },
};

const TemplateEditableWrapper = ({ isEditMode, onContentChanged, children }: TemplateEditableWrapperProps) => {
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [formatting, setFormatting] = useState<Record<SectionKey, CoverPageFormatting>>({
    title: { ...sectionDefaults.title },
    header: { ...sectionDefaults.header },
    body: { ...sectionDefaults.body },
    totals: { ...sectionDefaults.totals },
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLElement | null>(null);
  const hoveredElRef = useRef<HTMLElement | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ top: number } | null>(null);

  const updateToolbarPosition = useCallback(() => {
    if (!activeRowRef.current) return;
    const rowRect = activeRowRef.current.getBoundingClientRect();
    setToolbarPos({
      top: rowRect.top - 52,
    });
  }, []);

  const detectSectionAndElement = (target: HTMLElement): { section: SectionKey; el: HTMLElement } | null => {
    // Title block
    const titleBlock = target.closest("[style*='marginBottom']") as HTMLElement;
    if (titleBlock && !target.closest("table")) return { section: "title", el: titleBlock };

    const thead = target.closest("thead") as HTMLElement;
    if (thead) return { section: "header", el: thead };

    const totalRow = target.closest("tr") as HTMLElement;
    if (totalRow) {
      const cells = totalRow.querySelectorAll("td, th");
      const hasBoldTotal = Array.from(cells).some(
        (c) => (c as HTMLElement).style.fontWeight === "700" || c.classList.contains("font-bold")
      );
      const hasBorderTop = totalRow.querySelector("[class*='border-t-2'], [class*='border-b-2']");
      if (hasBoldTotal && hasBorderTop) return { section: "totals", el: totalRow };
    }

    const tbody = target.closest("tbody") as HTMLElement;
    if (tbody) {
      const row = target.closest("tr") as HTMLElement;
      return { section: "body", el: row || tbody };
    }

    return null;
  };

  const clearHover = useCallback(() => {
    if (hoveredElRef.current) {
      hoveredElRef.current.removeAttribute("data-section-hover");
      hoveredElRef.current = null;
    }
  }, []);

  const clearActive = useCallback(() => {
    if (activeRowRef.current) {
      activeRowRef.current.removeAttribute("data-section-active");
    }
  }, []);

  const handleMouseOver = useCallback((e: React.MouseEvent) => {
    if (!isEditMode || toolbarVisible) return;
    const result = detectSectionAndElement(e.target as HTMLElement);
    if (result) {
      if (hoveredElRef.current !== result.el) {
        clearHover();
        hoveredElRef.current = result.el;
        result.el.setAttribute("data-section-hover", "true");
      }
    } else {
      clearHover();
    }
  }, [isEditMode, toolbarVisible, clearHover]);

  const handleMouseLeave = useCallback(() => {
    if (!toolbarVisible) clearHover();
  }, [toolbarVisible, clearHover]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isEditMode) return;
    const target = e.target as HTMLElement;

    // If clicking inside the toolbar, do nothing
    if (toolbarRef.current && toolbarRef.current.contains(target)) return;

    const result = detectSectionAndElement(target);

    if (result) {
      clearActive();
      clearHover();
      setActiveSection(result.section);
      activeRowRef.current = result.el;
      result.el.setAttribute("data-section-active", "true");
      setToolbarVisible(true);
      setTimeout(updateToolbarPosition, 0);
      if (onContentChanged) onContentChanged(true);
    } else {
      // Clicked on empty area — dismiss
      clearActive();
      clearHover();
      setToolbarVisible(false);
      setActiveSection(null);
      activeRowRef.current = null;
    }
  }, [isEditMode, updateToolbarPosition, onContentChanged, clearActive, clearHover]);

  // Close toolbar on outside click
  useEffect(() => {
    if (!toolbarVisible) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideWrapper = wrapperRef.current?.contains(target);
      const insideToolbar = toolbarRef.current?.contains(target);
      if (!insideWrapper && !insideToolbar) {
        clearActive();
        clearHover();
        setToolbarVisible(false);
        setActiveSection(null);
        activeRowRef.current = null;
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [toolbarVisible, clearActive, clearHover]);

  useEffect(() => {
    if (!isEditMode) {
      clearActive();
      clearHover();
      setToolbarVisible(false);
      setActiveSection(null);
      activeRowRef.current = null;
    }
  }, [isEditMode, clearActive, clearHover]);

  const handleFormattingChange = useCallback((f: CoverPageFormatting) => {
    if (activeSection) {
      setFormatting(prev => ({ ...prev, [activeSection]: f }));
      if (onContentChanged) onContentChanged(true);
    }
  }, [activeSection, onContentChanged]);

  if (!isEditMode) return <>{children}</>;

  return (
    <div
      ref={wrapperRef}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="editable-table-wrapper relative"
      style={{ cursor: isEditMode ? "pointer" : "default" }}
    >
      {children}

      {/* Floating toolbar - fixed to viewport center */}
      {toolbarVisible && toolbarPos && activeSection && (
        <div
          ref={toolbarRef}
          style={{
            position: "fixed",
            top: toolbarPos.top,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
          }}
        >
          <CoverPageToolbar
            visible={true}
            formatting={formatting[activeSection]}
            onFormattingChange={handleFormattingChange}
          />
        </div>
      )}
    </div>
  );
};

export default TemplateEditableWrapper;
