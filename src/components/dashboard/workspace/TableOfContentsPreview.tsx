const tocItems = [
  { title: "Compilation Engagement Report", page: 1 },
  { title: "Balance Sheet", page: 2 },
  { title: "Statement of Income (Loss) & Retained Earnings (Deficit)", page: 3 },
  { title: "Statement of Cash Flows", page: 4 },
  { title: "Notes to Financial Information", page: 5 },
];

const TableOfContentsPreview = () => {
  return (
    <div className="flex-1 flex items-start justify-center overflow-y-auto py-10 bg-muted/30">
      <div
        data-fs-page
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
          {/* Top rule */}
          <div
            style={{
              borderTop: "2.5px solid #1a1a2e",
              marginBottom: 16,
            }}
          />

          {/* Header row */}
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

          {/* TOC entries */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {tocItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span style={{ fontSize: 15, color: "#1a1a2e" }}>
                  {item.title}
                </span>
                <span style={{ fontSize: 15, color: "#1a1a2e" }}>
                  {item.page}
                </span>
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

        {/* Watermark */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: 64,
            fontWeight: 700,
            color: "rgba(0,0,0,0.07)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
            letterSpacing: 6,
          }}
        >
          DRAFT UNDER DISCUSSION
        </div>
      </div>
    </div>
  );
};

export default TableOfContentsPreview;
