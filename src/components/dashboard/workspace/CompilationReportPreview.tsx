const CompilationReportPreview = () => {
  const clientName = "Trucking LLC";
  const periodEnd = "December 31, 2025";

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
        <div style={{ flex: 1, padding: "40px 48px 32px" }}>
          {/* Title */}
          <h1
            style={{
              textAlign: "center",
              fontSize: 20,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 32,
              color: "#1a1a2e",
            }}
          >
            Compilation Engagement Report
          </h1>

          {/* Addressee */}
          <p style={{ marginBottom: 24, lineHeight: 1.7 }}>
            To Management of {clientName}
          </p>

          {/* Paragraphs */}
          <p style={{ marginBottom: 20, lineHeight: 1.7, textAlign: "justify" }}>
            On the basis of information provided by management, we have compiled the balance sheet of {clientName} as at {periodEnd}, the statement of income and retained earnings for the year then ended, and Note X, which describes the basis of accounting applied in the preparation of the compiled financial information ("financial information").
          </p>

          <p style={{ marginBottom: 20, lineHeight: 1.7, textAlign: "justify" }}>
            Management is responsible for the accompanying financial information, including the accuracy and completeness of the underlying information used to compile it and the selection of the basis of accounting.
          </p>

          <p style={{ marginBottom: 20, lineHeight: 1.7, textAlign: "justify" }}>
            We performed this engagement in accordance with Canadian Standard on Related Services (CSRS) 4200,{" "}
            <em>Compilation Engagements</em>, which requires us to comply with relevant ethical requirements. Our responsibility is to assist management in the preparation of the financial information.
          </p>

          <p style={{ marginBottom: 20, lineHeight: 1.7, textAlign: "justify" }}>
            We did not perform an audit engagement or a review engagement, nor were we required to perform procedures to verify the accuracy or completeness of the information provided by management. Accordingly, we do not express an audit opinion or a review conclusion, or provide any form of assurance on the financial information.
          </p>

          <p style={{ marginBottom: 32, lineHeight: 1.7, textAlign: "justify" }}>
            Readers are cautioned that the financial information may not be appropriate for their purposes.
          </p>

          {/* Firm signature */}
          <div style={{ marginTop: 24, lineHeight: 1.7 }}>
            <p style={{ fontWeight: 500 }}>33 Acres Brewing Company</p>
            <p>Vancouver, British Columbia V5Y 1M8, CANADA</p>
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

export default CompilationReportPreview;
