import type { FieldBox } from "./render";

type TemplateEntry = {
  buffer: Buffer;
  mime: "image/png" | "image/jpeg";
  fields?: FieldBox[];
  updatedAt: number;
};

const templates = new Map<string, TemplateEntry>();

export function storeTemplate(templateId: string, buffer: Buffer, ext: "png" | "jpg") {
  const mime: "image/png" | "image/jpeg" = ext === "png" ? "image/png" : "image/jpeg";
  templates.set(templateId, {
    buffer,
    mime,
    fields: templates.get(templateId)?.fields,
    updatedAt: Date.now(),
  });
}

export function getTemplateBuffer(templateId: string) {
  const entry = templates.get(templateId);
  if (!entry) throw new Error("template not found");
  return { buffer: entry.buffer, mime: entry.mime };
}

export function storeFields(templateId: string, fields: FieldBox[]) {
  const entry = templates.get(templateId);
  if (!entry) throw new Error("template not found");
  entry.fields = fields;
  entry.updatedAt = Date.now();
}

export function getFields(templateId: string): FieldBox[] {
  const entry = templates.get(templateId);
  if (!entry?.fields) throw new Error("fields not found");
  return entry.fields;
}

export function hasTemplate(templateId: string) {
  return templates.has(templateId);
}
