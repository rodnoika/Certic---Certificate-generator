  "use client";
  import React, { useEffect, useMemo, useRef, useState } from "react";
  import TemplateUploader, { TemplateMeta as UploaderTemplateMeta } from "./components/TemplateUploader";
  import StepBadge from "./components/ui/StepBadge";
  import StepDivider from "./components/ui/StepDivider";
  import DrawingCanvas from "./components/DrawingCanvas";
  import FieldEditor from "./components/FieldEditor";
  import GeneratorPanel from "./components/GeneratorPanel";
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
      setContainerW(el.clientWidth);
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
          <section className="gap-6 items-start">
            <div>
              <TemplateUploader
                onLocalImage={onLocalImage}
                onUploaded={(data: UploaderTemplateMeta) => {
                  setTemplate(data as TemplateMeta);
                  setStep(2);
                }}
              />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="grid md:grid-cols-[2fr_1fr] gap-6 items-start">
            <DrawingCanvas
              imageEl={imageEl}
              imageNatural={imageNatural}
              boxes={boxes}
              onBoxesChange={setBoxes}
              activeField={activeField}
              align={align}
            />

            <FieldEditor
              boxes={boxes}
              setBoxes={setBoxes}
              activeField={activeField}
              setActiveField={setActiveField}
              align={align}
              setAlign={setAlign}
              onSave={handleSaveFields}
              onBack={() => setStep(1)}
            />
          </section>
        )}

        {step === 3 && (
          <GeneratorPanel
            template={template}
            fio={fio}
            setFio={setFio}
            courses={courses}
            setCourses={setCourses}
            prefix={prefix}
            setPrefix={setPrefix}
            csvFile={csvFile}
            setCsvFile={setCsvFile}
            generating={generating}
            onGenerateSingle={handleGenerateSingle}
            onGenerateBatch={handleGenerateBatch}
            archiveUrl={archiveUrl}
            generated={generated}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    );
  }