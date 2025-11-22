"use client";

import { WorkspaceDocument } from "@/lib/types";
import { PDFViewer } from "./PDFViewer";
import { ImageViewer } from "./ImageViewer";
import { ExcelViewer } from "./ExcelViewer";
import { TextViewer } from "./TextViewer";

interface DocumentViewerProps {
  document: WorkspaceDocument;
  teamId: string;
  accessToken: string;
}

export function DocumentViewer({
  document,
  teamId,
  accessToken,
}: DocumentViewerProps) {
  const fileType = document.fileType || "";

  // PDF
  if (fileType === "application/pdf") {
    return (
      <PDFViewer
        document={document}
        teamId={teamId}
        accessToken={accessToken}
      />
    );
  }

  // Images
  if (fileType.startsWith("image/")) {
    return (
      <ImageViewer
        document={document}
        teamId={teamId}
        accessToken={accessToken}
      />
    );
  }

  // Excel/CSV
  if (
    fileType.includes("spreadsheet") ||
    fileType === "text/csv" ||
    fileType.includes("excel")
  ) {
    return (
      <ExcelViewer
        document={document}
        teamId={teamId}
        accessToken={accessToken}
      />
    );
  }

  // Text files and fallback
  return (
    <TextViewer
      document={document}
      teamId={teamId}
      accessToken={accessToken}
    />
  );
}
