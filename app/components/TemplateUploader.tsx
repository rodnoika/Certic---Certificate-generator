import React, { useState } from "react";

export type TemplateMeta = {
  templateId: string;
  url: string;
  hash?: string;
};

export default function TemplateUploader({
  onLocalImage,
  onUploaded,
}: {
  onLocalImage: (file: File) => void;
  onUploaded: (meta: TemplateMeta) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/template", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data: TemplateMeta = await res.json();
      onUploaded(data);
    } catch (e: any) {
      alert(e?.message || "Upload error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm">
      <h2 className="font-semibold mb-2">1) Загрузка шаблона (PNG/JPG)</h2>
      <p className="text-sm text-gray-600 mb-3">Выбери файл шаблона сертификата.</p>
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
  );
}
