"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
type FieldName = "fio" | "course" | "id";
type Align = "left" | "center" | "right";
type FieldBox = {
  name: FieldName;
  x: number;
  y: number;
  w: number;
  h: number;
  align: Align;
};

type TemplateMeta = {
  templateId: string;
  url: string;
  hash?: string;
};
const FIELD_LABEL: Record<FieldName, string> = {
  fio: "ФИО",
  course: "Курс",
  id: "ID",
};
const FIELD_COLOR: Record<FieldName, string> = {
  fio: "rgba(59,130,246,0.35)", 
  course: "rgba(34,197,94,0.35)",
  id: "rgba(234,88,12,0.35)",
};

export default function CertificateStudio() {
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploading, setUploading] = useState(false);
  const [template, setTemplate] = useState<TemplateMeta | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [imageNatural, setImageNatural] = useState<{ w: number; h: number } | null>(null);

  const [activeField, setActiveField] = useState<FieldName>("fio");
  const [align, setAlign] = useState<Align>("center");
  const [boxes, setBoxes] = useState<FieldBox[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [containerW, setContainerW] = useState(0);
  const [fio, setFio] = useState("");
  const [courses, setCourses] = useState("");
  const [prefix, setPrefix] = useState("CERT");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ url: string; file: string }[]>([]);
  const [archiveUrl, setArchiveUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { scale, viewW, viewH } = useMemo(() => {
    if (!imageNatural || !containerW) return { scale: 1, viewW: 0, viewH: 0 };
    const maxW = Math.min(1200, containerW);
    const maxH = 700;
    const s = Math.min(maxW / imageNatural.w, maxH / imageNatural.h);
    return { scale: s, viewW: Math.max(1, Math.round(imageNatural.w * s)), viewH: Math.max(1, Math.round(imageNatural.h * s)) };
  }, [imageNatural, containerW]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerW(el.clientWidth));
    setContainerW(el.clientWidth); // первичный замер
    ro.observe(el);
    return () => ro.disconnect();
  }, [step]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imageEl && imageNatural && viewW && viewH) {
      ctx.drawImage(imageEl, 0, 0, viewW, viewH);
    }

    boxes.forEach((b) => {
      ctx.fillStyle = FIELD_COLOR[b.name];
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 1;
      const x = Math.round(b.x * scale);
      const y = Math.round(b.y * scale);
      const w = Math.round(b.w * scale);
      const h = Math.round(b.h * scale);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#111";
      ctx.fillText(`${FIELD_LABEL[b.name]} (${b.align})`, x + 6, y + 16);
    });
  }, [boxes, imageEl, imageNatural, viewW, viewH, scale]);

  const onLocalImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageEl(img);
      setImageNatural({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = url;
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imageEl && imageNatural && viewW && viewH) {
      ctx.drawImage(imageEl, 0, 0, viewW, viewH);
    }

    boxes.forEach((b) => {
      ctx.fillStyle = FIELD_COLOR[b.name];
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 1;
      const x = Math.round(b.x * scale);
      const y = Math.round(b.y * scale);
      const w = Math.round(b.w * scale);
      const h = Math.round(b.h * scale);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#111";
      ctx.fillText(`${FIELD_LABEL[b.name]} (${b.align})`, x + 6, y + 16);
    });
    if (draft) {
      const dx = Math.round(draft.x * scale);
      const dy = Math.round(draft.y * scale);
      const dw = Math.round(draft.w * scale);
      const dh = Math.round(draft.h * scale);
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "#2563eb"; 
      ctx.lineWidth = 1.5;
      ctx.strokeRect(dx, dy, dw, dh);
      ctx.restore();
      ctx.fillStyle = "rgba(37, 99, 235, 0.08)";
      ctx.fillRect(dx, dy, dw, dh);
      const label = `${draft.w}×${draft.h}px`;
      ctx.font = "12px sans-serif";
      const tw = Math.ceil(ctx.measureText(label).width);
      const boxW = tw + 10;
      const boxH = 18;
      let lx = dx;
      let ly = dy - (boxH + 6);
      if (ly < 0) ly = dy + dh + 6;
      if (lx + boxW > viewW) lx = Math.max(0, viewW - boxW);
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(lx, ly, boxW, boxH);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, lx + 5, ly + 12);
    }
  }, [boxes, draft, imageEl, imageNatural, viewW, viewH, scale]);

  const canvasPointToImage = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, viewW));
    const y = Math.max(0, Math.min(clientY - rect.top, viewH));
    return { x: x / scale, y: y / scale };
  };

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (!imageNatural) return;
    setIsDrawing(true);
    const start = canvasPointToImage(e.clientX, e.clientY);
    setDrawStart(start);
    setDraft({ x: start.x, y: start.y, w: 0, h: 0 });
  };
  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !imageNatural) return;
    const end = canvasPointToImage(e.clientX, e.clientY);
    const x = Math.round(Math.min(drawStart.x, end.x));
    const y = Math.round(Math.min(drawStart.y, end.y));
    const w = Math.round(Math.abs(end.x - drawStart.x));
    const h = Math.round(Math.abs(end.y - drawStart.y));
    setDraft({ x, y, w, h }); 
  };

  const onCanvasMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !imageNatural) return;
    const end = canvasPointToImage(e.clientX, e.clientY);
    const x = Math.round(Math.min(drawStart.x, end.x));
    const y = Math.round(Math.min(drawStart.y, end.y));
    const w = Math.round(Math.abs(end.x - drawStart.x));
    const h = Math.round(Math.abs(end.y - drawStart.y));
    setIsDrawing(false);
    setDrawStart(null);
    setDraft(null); 
    if (w < 5 || h < 5) return;
    setBoxes((prev) => {
      const filtered = prev.filter((b) => b.name !== activeField);
      return [...filtered, { name: activeField, x, y, w, h, align }];
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/template", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data: TemplateMeta = await res.json();
      setTemplate(data);
      setStep(2);
    } catch (e: any) {
      alert(e.message || "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveFields = async () => {
    if (!template) return alert("Нет шаблона");
    if (!boxes.length) return alert("Сначала выдели зоны");
    const payload = { templateId: template.templateId, fields: boxes };
    const res = await fetch("/api/template/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return alert("Не удалось сохранить поля");
    alert("Поля сохранены");
    setStep(3);
  };

  const handleGenerateSingle = async () => {
    if (!template) return alert("Нет шаблона");
    if (!fio.trim()) return alert("Введи ФИО");
    const list = courses
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) return alert("Нужен хотя бы один курс");

    setGenerating(true);
    setGenerated([]);
    setArchiveUrl(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.templateId, fio, courses: list, prefix }),
      });
      if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
      const data = (await res.json()) as { files: { url: string; file: string }[] };
      setGenerated(data.files || []);
    } catch (e: any) {
      alert(e.message || "Generate error");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateBatch = async () => {
    if (!template) return alert("Нет шаблона");
    if (!csvFile) return alert("Загрузи CSV");
    const fd = new FormData();
    fd.append("file", csvFile);
    fd.append("templateId", template.templateId);
    fd.append("prefix", prefix);

    setGenerating(true);
    setGenerated([]);
    setArchiveUrl(null);
    try {
      const res = await fetch("/api/generate/batch", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Batch failed: ${res.status}`);
      const data = (await res.json()) as {
        archiveUrl?: string;
        files?: { url: string; file: string }[];
      };
      if (data.archiveUrl) setArchiveUrl(data.archiveUrl);
      if (data.files) setGenerated(data.files);
    } catch (e: any) {
      alert(e.message || "Batch error");
    } finally {
      setGenerating(false);
    }
  };

  const setBoxNumeric = (name: FieldName, key: keyof Omit<FieldBox, "name" | "align">, value: number) => {
    setBoxes((prev) => prev.map((b) => (b.name === name ? { ...b, [key]: Math.max(0, Math.round(value)) } : b)));
  };
  const setBoxAlign = (name: FieldName, value: Align) => {
    setBoxes((prev) => prev.map((b) => (b.name === name ? { ...b, align: value } : b)));
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold mb-4">Certificate Studio</h1>

      <div className="mb-6 flex items-center gap-2 text-sm">
        <StepBadge n={1} current={step} label="Загрузка шаблона" />
        <StepDivider />
        <StepBadge n={2} current={step} label="Разметка зон" />
        <StepDivider />
        <StepBadge n={3} current={step} label="Генерация" />
      </div>

      {step === 1 && (
        <section className="grid md:grid-cols-2 gap-6 items-start">
          <div className="border rounded-2xl p-4 bg-white shadow-sm">
            <h2 className="font-semibold mb-2">1) Загрузка шаблона (PNG/JPG)</h2>
            <p className="text-sm text-gray-600 mb-3">
              Выбери файл сертификата. Он загрузится на сервер и отобразится здесь для разметки.
            </p>
            <label className="block">
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  onLocalImage(f);
                  handleUpload(f);
                }}
              />
              <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50">
                <div className="font-medium">Кликни, чтобы выбрать PNG/JPG</div>
                <div className="text-xs text-gray-500 mt-1">или перетащи сюда</div>
              </div>
            </label>
            {uploading && <div className="mt-3 text-sm">Загрузка...</div>}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="grid md:grid-cols-[2fr_1fr] gap-6 items-start">
          <div className="border rounded-2xl p-4 bg-white shadow-sm" ref={containerRef}>
            <h2 className="font-semibold mb-3">2) Разметка зон</h2>
            {!imageNatural ? (
              <div className="text-sm text-gray-600">Нет изображения. Вернись на шаг 1.</div>
            ) : (
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={viewW}
                  height={viewH}
                  className="border rounded-xl w-full h-auto select-none"
                  onMouseDown={onCanvasMouseDown}
                  onMouseUp={onCanvasMouseUp}
                  onMouseMove={onCanvasMouseMove}
                />
              </div>
            )}
          </div>

          <div className="border rounded-2xl p-4 bg-white shadow-sm">
            <h3 className="font-semibold mb-2">Инструменты</h3>
            <div className="space-y-4">
              <div className="flex gap-2 items-center">
                <label className="text-sm w-24">Поле</label>
                <select
                  value={activeField}
                  onChange={(e) => setActiveField(e.target.value as FieldName)}
                  className="px-2 py-1 border rounded-md"
                >
                  <option value="fio">ФИО</option>
                  <option value="course">Курс</option>
                  <option value="id">ID</option>
                </select>
              </div>

              <div className="flex gap-2 items-center">
                <label className="text-sm w-24">Выравнивание</label>
                <select
                  value={align}
                  onChange={(e) => setAlign(e.target.value as Align)}
                  className="px-2 py-1 border rounded-md"
                >
                  <option value="left">Слева</option>
                  <option value="center">По центру</option>
                  <option value="right">Справа</option>
                </select>
              </div>

              {(["fio", "course", "id"] as FieldName[]).map((key) => {
                const b = boxes.find((x) => x.name === key);
                return (
                  <div key={key} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-16 font-medium">{FIELD_LABEL[key]}</div>
                      <div className="ml-auto text-xs text-gray-500">пиксели в координатах исходного изображения</div>
                    </div>
                    {b ? (
                      <div className="text-sm">
                        <label className="flex items-center gap-2">
                          <span className="w-6">x</span>
                          <input
                            type="number"
                            className="flex-1 px-2 py-1 border rounded"
                            value={b.x}
                            onChange={(e) => setBoxNumeric(key, "x", Number(e.target.value))}
                          />
                        </label>
                        <label className="flex items-center gap-2">
                          <span className="w-6">y</span>
                          <input
                            type="number"
                            className="flex-1 px-2 py-1 border rounded"
                            value={b.y}
                            onChange={(e) => setBoxNumeric(key, "y", Number(e.target.value))}
                          />
                        </label>
                        <label className="flex items-center gap-2">
                          <span className="w-6">w</span>
                          <input
                            type="number"
                            className="flex-1 px-2 py-1 border rounded"
                            value={b.w}
                            onChange={(e) => setBoxNumeric(key, "w", Number(e.target.value))}
                          />
                        </label>
                        <label className="flex items-center gap-2">
                          <span className="w-6">h</span>
                          <input
                            type="number"
                            className="flex-1 px-2 py-1 border rounded"
                            value={b.h}
                            onChange={(e) => setBoxNumeric(key, "h", Number(e.target.value))}
                          />
                        </label>
                        <label className="flex items-center gap-2 col-span-2">
                          <span className="w-20">align</span>
                          <select
                            className="px-2 py-1 border rounded"
                            value={b.align}
                            onChange={(e) => setBoxAlign(key, e.target.value as Align)}
                          >
                            <option value="left">left</option>
                            <option value="center">center</option>
                            <option value="right">right</option>
                          </select>
                        </label>
                        <div className="col-span-2 flex justify-end">
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => setBoxes((prev) => prev.filter((p) => p.name !== key))}
                          >
                            Удалить зону
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">не задано — нарисуй на холсте или введи координаты (после первого рисования появятся поля)</div>
                    )}
                  </div>
                );
              })}

              <div className="pt-2 flex gap-2">
                <button className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={() => setStep(1)}>
                  ← Назад
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50"
                  onClick={handleSaveFields}
                  disabled={!template || boxes.length === 0}
                >
                  Сохранить поля
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="grid md:grid-cols-[1fr_1fr] gap-6 items-start">
          <div className="border rounded-2xl p-4 bg-white shadow-sm">
            <h2 className="font-semibold mb-3">3) Генерация</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">ФИО</label>
                <input
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Иван Иванов"
                  value={fio}
                  onChange={(e) => setFio(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Курсы (через запятую)</label>
                <input
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="JavaScript, Node.js, React"
                  value={courses}
                  onChange={(e) => setCourses(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-sm w-28">Префикс ID</label>
                <input className="flex-1 px-3 py-2 border rounded-lg" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50"
                  onClick={handleGenerateSingle}
                  disabled={generating}
                >
                  {generating ? "Генерация..." : "Сгенерировать (1 запись)"}
                </button>
                <span className="text-xs text-gray-500">или</span>
                <label className="text-sm flex items-center gap-2">
                  <input type="file" accept="text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                  <span className="text-gray-600">CSV для пакетной генерации</span>
                </label>
                <button
                  className="px-3 py-2 rounded-lg bg-gray-900/80 text-white text-sm disabled:opacity-50"
                  onClick={handleGenerateBatch}
                  disabled={generating || !csvFile}
                >
                  Пакетно (CSV)
                </button>
                <button className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={() => setStep(2)}>
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
      )}
    </div>
  );
}

function StepBadge({ n, current, label }: { n: number; current: number; label: string }) {
  const active = current === n;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
      active ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-300"
    }`}>
      <span className="text-xs font-semibold">{n}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}

function StepDivider() {
  return <div className="h-px flex-1 bg-gray-200" />;
}
