import React, { useEffect, useRef, useState } from "react";

type FieldName = "fio" | "course" | "id";
type Align = "left" | "center" | "right";
export type FieldBox = { name: FieldName; x: number; y: number; w: number; h: number; align: Align };

export default function DrawingCanvas({
  imageEl,
  imageNatural,
  boxes,
  onBoxesChange,
  activeField,
  align,
}: {
  imageEl: HTMLImageElement | null;
  imageNatural: { w: number; h: number } | null;
  boxes: FieldBox[];
  onBoxesChange: React.Dispatch<React.SetStateAction<FieldBox[]>>;
  activeField: FieldName;
  align: Align;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerW, setContainerW] = useState(0);
  const [scale, setScale] = useState(1);
  const [viewW, setViewW] = useState(0);
  const [viewH, setViewH] = useState(0);

  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerW(el.clientWidth));
    setContainerW(el.clientWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!imageNatural || !containerW) return;
    const maxW = Math.min(1200, containerW);
    const maxH = 700;
    const s = Math.min(maxW / imageNatural.w, maxH / imageNatural.h);
    setScale(s);
    setViewW(Math.max(1, Math.round(imageNatural.w * s)));
    setViewH(Math.max(1, Math.round(imageNatural.h * s)));
  }, [imageNatural, containerW]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = viewW;
    canvas.height = viewH;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imageEl && imageNatural && viewW && viewH) {
      ctx.drawImage(imageEl, 0, 0, viewW, viewH);
    }

    boxes.forEach((b) => {
      ctx.fillStyle = b.name === "fio" ? "rgba(59,130,246,0.35)" : b.name === "course" ? "rgba(34,197,94,0.35)" : "rgba(234,88,12,0.35)";
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
      const label = b.name === "fio" ? "Full Name" : b.name === "course" ? "Course" : "ID";
      ctx.fillText(`${label} (${b.align})`, x + 6, y + 16);
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
      const label = `${draft.w}x${draft.h}px`;
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
    onBoxesChange((prev) => {
      const filtered = prev.filter((b) => b.name !== activeField);
      return [...filtered, { name: activeField, x, y, w, h, align }];
    });
  };

  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm" ref={containerRef}>
      <h2 className="font-semibold mb-3">2) Define fields</h2>

      {!imageNatural ? (
        <div className="text-sm text-gray-600">No image yet. Go back to step 1.</div>
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
  );
}


