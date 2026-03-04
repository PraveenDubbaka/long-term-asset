// Stub — Ask Luka AI overlay for working-papers portal (not yet implemented)
export function AskLukaOverlay({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => onOpenChange(false)}>
      <div className="bg-card border border-border rounded-xl p-6 shadow-elevation-3 min-w-[400px]">
        <h2 className="font-semibold text-foreground mb-2">Ask Luka</h2>
        <p className="text-sm text-muted-foreground">AI assistant coming soon.</p>
      </div>
    </div>
  );
}
