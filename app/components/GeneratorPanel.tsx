import React from "react";

type FieldName = "fio" | "course" | "id";

export default function GeneratorPanel({
  template,
  fio,
  setFio,
  courses,
  setCourses,
  prefix,
  setPrefix,
  csvFile,
  setCsvFile,
  generating,
  onGenerateSingle,
  onGenerateBatch,
  archiveDownload,
  generated,
  onBack,
}: {
  template: { templateId: string; url: string } | null;
  fio: string;
  setFio: (v: string) => void;
  courses: string;
  setCourses: (v: string) => void;
  prefix: string;
  setPrefix: (v: string) => void;
  csvFile: File | null;
  setCsvFile: (f: File | null) => void;
  generating: boolean;
  onGenerateSingle: () => Promise<void>;
  onGenerateBatch: () => Promise<void>;
  archiveDownload: { href: string; file: string } | null;
  generated: { url: string; file: string; downloadUrl: string }[];
  onBack: () => void;
}) {
  return (
    <section className="grid md:grid-cols-[1fr_1fr] gap-6 items-start">
      <div className="border rounded-2xl p-4 bg-white shadow-sm">
        <h2 className="font-semibold mb-3">3) Generate Certificates</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <input className="w-full px-3 py-2 border rounded-lg" placeholder="Full Name" value={fio} onChange={(e) => setFio(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Courses</label>
            <input className="w-full px-3 py-2 border rounded-lg" placeholder="JavaScript, Node.js, React" value={courses} onChange={(e) => setCourses(e.target.value)} />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm w-28">ID Prefix</label>
            <input className="flex-1 px-3 py-2 border rounded-lg" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50" onClick={onGenerateSingle} disabled={generating}>
              {generating ? "Generating..." : "Generate (single)"}
            </button>
            <span className="text-xs text-gray-500">or</span>
            <label className="text-sm flex items-center gap-2">
              <input type="file" accept="text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
              <span className="text-gray-600">CSV file for batch generation</span>
            </label>
            <button className="px-3 py-2 rounded-lg bg-gray-900/80 text-white text-sm disabled:opacity-50" onClick={onGenerateBatch} disabled={generating || !csvFile}>
              Generate batch (CSV)
            </button>
            <button className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={onBack}>
              Back to fields
            </button>
          </div>

          {archiveDownload && (
            <div className="text-sm mt-2">
              Archive ready: <a className="text-blue-600 underline" href={archiveDownload.href} download={archiveDownload.file}>Download ZIP</a>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-2xl p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-2">Generated files</h3>
        {generated.length === 0 ? (
          <div className="text-sm text-gray-600">Nothing generated yet</div>
        ) : (
          <ul className="space-y-2">
            {generated.map((f, idx) => (
              <li key={idx} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{f.file}</span>
                <a href={f.downloadUrl} download={f.file} className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
