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
  archiveUrl,
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
  archiveUrl: string | null;
  generated: { url: string; file: string }[];
  onBack: () => void;
}) {
  return (
    <section className="grid md:grid-cols-[1fr_1fr] gap-6 items-start">
      <div className="border rounded-2xl p-4 bg-white shadow-sm">
        <h2 className="font-semibold mb-3">3) Генерация</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">ФИО</label>
            <input className="w-full px-3 py-2 border rounded-lg" placeholder="Иван Иванов" value={fio} onChange={(e) => setFio(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Курсы (через запятую)</label>
            <input className="w-full px-3 py-2 border rounded-lg" placeholder="JavaScript, Node.js, React" value={courses} onChange={(e) => setCourses(e.target.value)} />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm w-28">Префикс ID</label>
            <input className="flex-1 px-3 py-2 border rounded-lg" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50" onClick={onGenerateSingle} disabled={generating}>
              {generating ? "Генерация..." : "Сгенерировать (1 запись)"}
            </button>
            <span className="text-xs text-gray-500">или</span>
            <label className="text-sm flex items-center gap-2">
              <input type="file" accept="text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
              <span className="text-gray-600">CSV для пакетной генерации</span>
            </label>
            <button className="px-3 py-2 rounded-lg bg-gray-900/80 text-white text-sm disabled:opacity-50" onClick={onGenerateBatch} disabled={generating || !csvFile}>
              Пакетно (CSV)
            </button>
            <button className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={onBack}>
              ← Назад
            </button>
          </div>

          {archiveUrl && (
            <div className="text-sm mt-2">
              Архив: <a className="text-blue-600 underline" href={archiveUrl} target="_blank" rel="noreferrer">скачать ZIP</a>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-2xl p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-2">Результаты</h3>
        {generated.length === 0 ? (
          <div className="text-sm text-gray-600">Пока нет файлов</div>
        ) : (
          <ul className="space-y-2">
            {generated.map((f, idx) => (
              <li key={idx} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{f.file}</span>
                <a href={f.url} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                  Открыть
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
