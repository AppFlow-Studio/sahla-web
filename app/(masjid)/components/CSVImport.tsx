"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type CSVImportProps = {
  type: "program" | "event";
  mosqueId: string;
  dbFields: { key: string; label: string }[];
  onImported: (count: number) => void;
  onClose: () => void;
};

type ImportStep = "upload" | "map" | "preview" | "importing";

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = parseCsvLine(lines[0], delimiter);
  const rows = lines.slice(1).map((line) => parseCsvLine(line, delimiter));
  return { headers, rows };
}

export default function CSVImport({ type, mosqueId, dbFields, onImported, onClose }: CSVImportProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) {
        setError("Could not parse CSV file");
        return;
      }
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-map matching headers
      const autoMap: Record<string, string> = {};
      for (const field of dbFields) {
        const match = headers.find(
          (h) => h.toLowerCase() === field.key.toLowerCase() || h.toLowerCase() === field.label.toLowerCase()
        );
        if (match) autoMap[field.key] = match;
      }
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
  }

  function getMappedRows(): Record<string, string>[] {
    return csvRows.map((row) => {
      const mapped: Record<string, string> = {};
      for (const [dbKey, csvHeader] of Object.entries(mapping)) {
        const idx = csvHeaders.indexOf(csvHeader);
        if (idx >= 0) mapped[dbKey] = row[idx] || "";
      }
      return mapped;
    }).filter((row) => row.name?.trim());
  }

  async function handleImport() {
    const rows = getMappedRows();
    if (rows.length === 0) {
      setError("No valid rows to import");
      return;
    }

    setImporting(true);
    setStep("importing");
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/content/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, rows }),
      });
      if (!res.ok) throw new Error("Import failed");
      const data = await res.json();
      onImported(data.imported);
    } catch {
      setError("Import failed. Please try again.");
      setStep("preview");
    } finally {
      setImporting(false);
    }
  }

  const previewRows = getMappedRows().slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-xl border border-stone-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-stone-900">
            Import {type === "program" ? "Programs" : "Events"} from CSV
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Upload Step */}
          {step === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rounded-xl border-2 border-dashed border-stone-200 p-12 text-center">
                <p className="text-[14px] text-stone-500">Drop a CSV or TSV file, or click to browse</p>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-emerald-700">
                  Choose File
                  <input type="file" accept=".csv,.tsv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </motion.div>
          )}

          {/* Map Step */}
          {step === "map" && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="mb-3 text-[12px] text-stone-500">
                Map your CSV columns to the database fields. {csvRows.length} rows found.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {dbFields.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <span className="w-32 text-[12px] font-medium text-stone-700">{field.label}</span>
                    <select
                      value={mapping[field.key] || ""}
                      onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="flex-1 rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-[12px] text-stone-700 focus:outline-none"
                    >
                      <option value="">— skip —</option>
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between">
                <button onClick={() => setStep("upload")} className="rounded-lg border border-stone-300 px-4 py-2 text-[12px] text-stone-600 hover:bg-stone-50">Back</button>
                <button
                  onClick={() => setStep("preview")}
                  disabled={!mapping.name}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  Preview
                </button>
              </div>
            </motion.div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="mb-3 text-[12px] text-stone-500">
                Preview (first 5 of {getMappedRows().length} rows):
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-stone-200">
                      {dbFields.filter((f) => mapping[f.key]).map((f) => (
                        <th key={f.key} className="px-2 py-1.5 text-left font-medium text-stone-500">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-stone-100">
                        {dbFields.filter((f) => mapping[f.key]).map((f) => (
                          <td key={f.key} className="px-2 py-1.5 text-stone-700 max-w-[150px] truncate">{row[f.key] || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-between">
                <button onClick={() => setStep("map")} className="rounded-lg border border-stone-300 px-4 py-2 text-[12px] text-stone-600 hover:bg-stone-50">Back</button>
                <button
                  onClick={handleImport}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-[12px] font-medium text-white hover:bg-emerald-700"
                >
                  Import {getMappedRows().length} rows
                </button>
              </div>
            </motion.div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
              <p className="text-[14px] text-stone-600">Importing...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
