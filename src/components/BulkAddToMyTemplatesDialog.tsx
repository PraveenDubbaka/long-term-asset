// Stub — BulkAddToMyTemplatesDialog has complex dependencies (Label, RadioGroup, Select, sonner)
// that are not needed in the Loan Debt portal. The Sidebar only renders this dialog
// on the My Templates tab, which is not a primary use case here.

interface BulkAddToMyTemplatesDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export function BulkAddToMyTemplatesDialog(_props: BulkAddToMyTemplatesDialogProps) {
  return null;
}
