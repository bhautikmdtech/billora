import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import * as XLSX from "xlsx";
import type { ReactElement } from "react";

export function createWorkbookBuffer(
  sheetName: string,
  rows: Record<string, unknown>[]
) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;
}

export async function renderPdfBuffer(
  document: ReactElement<DocumentProps>
) {
  return renderToBuffer(document);
}
