interface TocDoc {
  id: number;
  label: string;
  hidden?: boolean;
}

interface TemplateTableOfContentsPreviewProps {
  docs: TocDoc[];
}

const TemplateTableOfContentsPreview = ({ docs }: TemplateTableOfContentsPreviewProps) => {
  // Filter visible docs excluding cover page and TOC itself
  const tocEntries = docs
    .filter((d) => !d.hidden && d.id > 2)
    .map((d) => ({ title: d.label, page: "#" }));

  return (
    <div className="flex-1 flex items-start justify-center overflow-y-auto py-10 bg-muted/30">
      <div
        className="bg-white shadow-lg border border-border"
        style={{
          width: 842,
          minHeight: 1191,
          fontFamily: "'Arial', 'Helvetica', sans-serif",
          fontSize: 15,
          color: "#1a1a2e",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "hsl(220 15% 96%)",
            padding: "32px 48px",
            textAlign: "center",
            fontSize: 14,
            color: "#5a5a6e",
          }}
        >
          Header will come here
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "60px 48px 32px" }}>
          <div style={{ borderTop: "2.5px solid #1a1a2e", marginBottom: 16 }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>
              Table of Contents
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>
              Page No.
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {tocEntries.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span style={{ fontSize: 15, color: "#1a1a2e" }}>{item.title}</span>
                <span style={{ fontSize: 15, color: "#1a1a2e" }}>{item.page}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            background: "hsl(220 15% 96%)",
            padding: "32px 48px",
            textAlign: "center",
            fontSize: 14,
            color: "#5a5a6e",
          }}
        >
          Footer will come here
        </div>
      </div>
    </div>
  );
};

export default TemplateTableOfContentsPreview;
