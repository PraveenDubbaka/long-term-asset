import quickbooksLogo from "@/assets/quickbooks-logo.png";
import xeroLogo from "@/assets/xero-logo.png";

type IntegrationType = "quickbooks" | "xero" | "none";

interface IntegrationBadgeProps {
  type: IntegrationType;
}

const IntegrationBadge = ({ type }: IntegrationBadgeProps) => {
  if (type === "none") {
    return <span className="text-muted-foreground block text-center">-</span>;
  }

  if (type === "quickbooks") {
    return (
      <img
        src={quickbooksLogo}
        alt="Intuit QuickBooks"
        className="w-auto object-contain mx-auto"
        style={{ height: "calc(1.75rem * 1.32)" }}
      />
    );
  }

  // Xero
  return (
    <img
      src={xeroLogo}
      alt="Xero"
      className="w-auto object-contain mx-auto"
      style={{ height: "calc(1.75rem * 1.32)" }}
    />
  );
};

export default IntegrationBadge;
