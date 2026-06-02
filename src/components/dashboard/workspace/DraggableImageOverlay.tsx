import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Lock, Unlock, Move, Maximize2 } from "lucide-react";
import { ImageOverlay } from "./LayoutSettingsContext";

interface DraggableImageOverlayProps {
  overlay: ImageOverlay;
  containerRef: React.RefObject<HTMLDivElement>;
  isEditMode: boolean;
  onUpdate: (id: string, updates: Partial<ImageOverlay>) => void;
  onDelete: (id: string) => void;
}

const DraggableImageOverlay = ({
  overlay,
  containerRef,
  isEditMode,
  onUpdate,
  onDelete,
}: DraggableImageOverlayProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const startSize = useRef({ w: 0, mx: 0 });

  const toPercent = useCallback(
    (px: number, dimension: "x" | "y") => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      return dimension === "x"
        ? (px / rect.width) * 100
        : (px / rect.height) * 100;
    },
    [containerRef]
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (overlay.locked || !isEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      startPos.current = {
        x: e.clientX,
        y: e.clientY,
        ox: overlay.x,
        oy: overlay.y,
      };
    },
    [overlay.locked, overlay.x, overlay.y, isEditMode]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (overlay.locked || !isEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      startSize.current = { w: overlay.width, mx: e.clientX };
    },
    [overlay.locked, overlay.width, isEditMode]
  );

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        const newX = startPos.current.ox + toPercent(dx, "x");
        const newY = startPos.current.oy + toPercent(dy, "y");
        onUpdate(overlay.id, {
          x: Math.max(-20, Math.min(100, newX)),
          y: Math.max(-20, Math.min(100, newY)),
        });
      }
      if (isResizing) {
        const dx = e.clientX - startSize.current.mx;
        const newW = startSize.current.w + toPercent(dx, "x");
        onUpdate(overlay.id, {
          width: Math.max(5, Math.min(100, newW)),
        });
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, isResizing, overlay.id, onUpdate, toPercent]);

  // Deselect on outside click
  useEffect(() => {
    if (!isSelected) return;
    const handler = (e: MouseEvent) => {
      if (imgRef.current && !imgRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSelected]);

  const showControls = isEditMode && (isHovered || isSelected || isDragging);

  return (
    <div
      ref={imgRef}
      style={{
        position: "absolute",
        left: `${overlay.x}%`,
        top: `${overlay.y}%`,
        width: `${overlay.width}%`,
        zIndex: overlay.layer === "foreground" ? 50 : 1,
        opacity: overlay.opacity,
        pointerEvents: isEditMode ? "auto" : (overlay.layer === "foreground" ? "none" : "none"),
        cursor: isEditMode && !overlay.locked ? "move" : "default",
      }}
      onMouseEnter={() => isEditMode && setIsHovered(true)}
      onMouseLeave={() => isEditMode && setIsHovered(false)}
      onClick={(e) => {
        if (isEditMode) {
          e.stopPropagation();
          setIsSelected(true);
        }
      }}
      onMouseDown={handleDragStart}
    >
      {/* Selection outline */}
      {showControls && (
        <div
          style={{
            position: "absolute",
            inset: -2,
            border: "2px dashed hsl(215 70% 55%)",
            borderRadius: 4,
            pointerEvents: "none",
            zIndex: 60,
          }}
        />
      )}

      {/* Image */}
      <img
        src={overlay.src}
        alt={overlay.fileName}
        draggable={false}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          borderRadius: 2,
          userSelect: "none",
        }}
      />

      {/* Controls toolbar */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "absolute",
            top: -36,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 2,
            padding: "3px 4px",
            borderRadius: 8,
            background: "linear-gradient(135deg, hsl(270 70% 55%), hsl(220 80% 55%))",
            boxShadow: "0 4px 16px hsla(250 70% 50% / 0.3)",
            zIndex: 70,
          }}
        >
          <OverlayButton
            icon={<Move size={13} />}
            label="Drag to move"
            onMouseDown={handleDragStart}
          />
          <OverlayButton
            icon={overlay.locked ? <Lock size={13} /> : <Unlock size={13} />}
            label={overlay.locked ? "Unlock" : "Lock"}
            onClick={() => onUpdate(overlay.id, { locked: !overlay.locked })}
            active={overlay.locked}
          />
          <OverlayButton
            icon={
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>
                {overlay.layer === "foreground" ? "FG" : "BG"}
              </span>
            }
            label="Toggle layer"
            onClick={() =>
              onUpdate(overlay.id, {
                layer: overlay.layer === "foreground" ? "background" : "foreground",
              })
            }
          />
          <div style={{ width: 1, background: "hsla(0 0% 100% / 0.25)", margin: "2px 1px" }} />
          <OverlayButton
            icon={<Trash2 size={13} />}
            label="Delete"
            onClick={() => onDelete(overlay.id)}
            danger
          />
        </motion.div>
      )}

      {/* Resize handle */}
      {showControls && !overlay.locked && (
        <div
          onMouseDown={handleResizeStart}
          style={{
            position: "absolute",
            bottom: -4,
            right: -4,
            width: 14,
            height: 14,
            borderRadius: "0 0 4px 0",
            background: "hsl(215 70% 55%)",
            cursor: "nwse-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 70,
          }}
        >
          <Maximize2 size={8} style={{ color: "white", transform: "rotate(90deg)" }} />
        </div>
      )}
    </div>
  );
};

const OverlayButton = ({
  icon,
  label,
  onClick,
  onMouseDown,
  active,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  active?: boolean;
  danger?: boolean;
}) => (
  <motion.button
    type="button"
    title={label}
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    onMouseDown={(e) => {
      e.stopPropagation();
      onMouseDown?.(e);
    }}
    className="flex items-center justify-center rounded-[4px] cursor-pointer"
    style={{
      width: 26,
      height: 26,
      background: active ? "hsla(0 0% 100% / 0.25)" : "transparent",
      color: danger ? "hsl(0 80% 80%)" : "hsla(0 0% 100% / 0.9)",
      border: "1px solid transparent",
    }}
    whileHover={{
      background: danger ? "hsla(0 70% 50% / 0.3)" : "hsla(0 0% 100% / 0.2)",
      scale: 1.08,
    }}
    whileTap={{ scale: 0.92 }}
  >
    {icon}
  </motion.button>
);

export default DraggableImageOverlay;
