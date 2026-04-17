// src/components/PDFReportWrapper.tsx
import React from 'react';
export default function PDFReportWrapper({ children }: { children: React.ReactNode }) {
  return <div className="pdf-report-wrapper">{children}</div>;
}