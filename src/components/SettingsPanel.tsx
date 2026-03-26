// Stub — settings panel for working-papers portal (not yet implemented)
export function SettingsPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => onOpenChange(false)}>
      <div className="bg-card border border-border rounded-xl p-6 shadow-elevation-3 min-w-[320px]">
        <h2 className="font-semibold text-foreground mb-2">Settings</h2>
        <p className="text-sm text-foreground">Settings panel coming soon.</p>
      </div>
    </div>
  );
}
