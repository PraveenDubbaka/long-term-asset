import { useRef, useCallback } from "react";
import DraggableImageOverlay from "./DraggableImageOverlay";
import { useLayoutSettings, ImageOverlay } from "./LayoutSettingsContext";

interface StatementImageOverlaysProps {
  isEditMode: boolean;
  layer: "background" | "foreground";
  containerRef: React.RefObject<HTMLDivElement>;
}

const StatementImageOverlays = ({ isEditMode, layer, containerRef }: StatementImageOverlaysProps) => {
  const { settings, applySettings } = useLayoutSettings();

  const handleUpdate = useCallback((id: string, updates: Partial<ImageOverlay>) => {
    applySettings({
      ...settings,
      firmBranding: {
        overlays: settings.firmBranding.overlays.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      },
    });
  }, [settings, applySettings]);

  const handleDelete = useCallback((id: string) => {
    applySettings({
      ...settings,
      firmBranding: {
        overlays: settings.firmBranding.overlays.filter((o) => o.id !== id),
      },
    });
  }, [settings, applySettings]);

  const overlays = settings.firmBranding.overlays.filter((o) => o.layer === layer);

  if (overlays.length === 0) return null;

  return (
    <>
      {overlays.map((overlay) => (
        <DraggableImageOverlay
          key={overlay.id}
          overlay={overlay}
          containerRef={containerRef}
          isEditMode={isEditMode}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}
    </>
  );
};

export default StatementImageOverlays;

/**
 * Hook that provides a containerRef and the overlay rendering functions.
 * Usage:
 *   const { pageRef, renderOverlays } = useStatementOverlays(isEditMode);
 *   // In JSX: <div ref={pageRef}> {renderOverlays("background")} ... content ... {renderOverlays("foreground")} </div>
 */
export const useStatementOverlays = (isEditMode: boolean) => {
  const pageRef = useRef<HTMLDivElement>(null);

  const renderOverlays = useCallback((layer: "background" | "foreground") => {
    return (
      <StatementImageOverlays
        isEditMode={isEditMode}
        layer={layer}
        containerRef={pageRef as React.RefObject<HTMLDivElement>}
      />
    );
  }, [isEditMode]);

  return { pageRef, renderOverlays };
};
