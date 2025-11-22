"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { WorkspaceDocument } from "@/lib/types";

interface ExcelViewerProps {
  document: WorkspaceDocument;
  teamId: string;
  accessToken: string;
}

interface TableData {
  headers: string[];
  rows: (string | number | boolean | null)[][];
}

export function ExcelViewer({ document, teamId, accessToken }: ExcelViewerProps) {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Load and parse Excel/CSV
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/teams/${teamId}/workspace/documents/${document.id}/content`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.statusText}`);
        }

        const blob = await response.blob();
        const fileType = document.fileType || "";

        // Check if it's an Excel file
        if (fileType.includes("spreadsheet") || fileType.includes("excel") || document.originalName?.endsWith(".xlsx") || document.originalName?.endsWith(".xls")) {
          // Parse XLSX file
          const arrayBuffer = await blob.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });

          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            setError("No sheets found in Excel file");
            setLoading(false);
            return;
          }

          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | boolean | null)[][];

          if (data && data.length > 0) {
            const headers = data[0].map((h) => String(h || "Column"));
            const rows = data.slice(1);

            setTableData({
              headers,
              rows,
            });
          } else {
            setError("No data found in the Excel file");
          }
        } else {
          // Parse as CSV
          const text = await blob.text();

          Papa.parse(text, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.data && results.data.length > 0) {
                const data = results.data as (string | number | boolean | null)[][];
                const headers = data[0].map((h) => String(h || "Column"));
                const rows = data.slice(1);

                setTableData({
                  headers,
                  rows,
                });
              } else {
                setError("No data found in the file");
              }
            },
            error: (error) => {
              setError(`Failed to parse file: ${error.message}`);
            },
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [document.id, teamId, accessToken, document.originalName, document.fileType]);

  const handleSort = (columnIndex: number) => {
    if (!tableData) return;

    let newDirection: "asc" | "desc" = "asc";
    if (sortColumn === columnIndex && sortDirection === "asc") {
      newDirection = "desc";
    }

    const sortedRows = [...tableData.rows].sort((a, b) => {
      const aVal = a[columnIndex];
      const bVal = b[columnIndex];

      // Handle null/undefined
      if (aVal === null || aVal === undefined) return newDirection === "asc" ? 1 : -1;
      if (bVal === null || bVal === undefined) return newDirection === "asc" ? -1 : 1;

      // Compare values
      if (typeof aVal === "number" && typeof bVal === "number") {
        return newDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (newDirection === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    setSortColumn(columnIndex);
    setSortDirection(newDirection);
    setTableData({
      ...tableData,
      rows: sortedRows,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading spreadsheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium">Failed to load spreadsheet</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <p className="text-gray-600">No data to display</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {tableData.rows.length} rows × {tableData.headers.length} columns
        </div>
        <div className="text-xs text-gray-500">{document.originalName}</div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse bg-white">
          {/* Header */}
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
            <tr>
              {tableData.headers.map((header, index) => (
                <th
                  key={index}
                  onClick={() => handleSort(index)}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{header}</span>
                    {sortColumn === index && (
                      <svg
                        className={`w-4 h-4 flex-shrink-0 text-blue-600 transition ${
                          sortDirection === "desc" ? "transform rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V4m0 0L3 8m4-4l4 4"
                        />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {tableData.headers.map((_, colIndex) => (
                  <td
                    key={`${rowIndex}-${colIndex}`}
                    className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 border-b border-gray-200 max-w-xs truncate"
                    title={String(row[colIndex] || "")}
                  >
                    {row[colIndex] !== null && row[colIndex] !== undefined
                      ? String(row[colIndex])
                      : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {tableData.rows.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No data to display
          </div>
        )}
      </div>
    </div>
  );
}
