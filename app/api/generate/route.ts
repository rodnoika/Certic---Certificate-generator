import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 15;

import crypto from "node:crypto";
import { renderCertificate, buildFilename, type FieldBox } from "../../lib/render";
import { getFields, getTemplateBuffer } from "../../lib/templateStore";

function todayId(prefix = "CERT") {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const rand = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${y}${m}${day}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "invalid JSON" }, { status: 400 });

    const { templateId, fio, courses, prefix } = body as {
      templateId?: string;
      fio?: string;
      courses?: string[];
      prefix?: string;
    };

    if (!templateId || !fio || !Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json({ error: "bad payload: templateId,fio,courses[] required" }, { status: 400 });
    }

    let fields: FieldBox[];
    let templateBuf: Buffer;
    let mime: "image/png" | "image/jpeg";
    try {
      fields = getFields(templateId);
      const tpl = getTemplateBuffer(templateId);
      templateBuf = tpl.buffer;
      mime = tpl.mime;
    } catch (err: any) {
      console.error("template assets missing", err?.message || err);
      return NextResponse.json({ error: "template or fields missing" }, { status: 400 });
    }

    const id = todayId(prefix || "CERT");
    const outExt = "png" as const;

    const files: { url: string; file: string }[] = [];

    for (const course of courses) {
      try {
        const out = await renderCertificate({
          templateBuffer: templateBuf,
          mime,
          fields,
          data: { fio, course, id },
          outFormat: outExt,
        });

        const name = buildFilename(id, course, fio, outExt);
        const dataUrl = `data:image/${outExt};base64,${out.toString("base64")}`;
        files.push({ url: dataUrl, file: name });
      } catch (e: any) {
        console.error("certificate render failed", e?.message);
        return NextResponse.json({ error: "render failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ files });
  } catch (e: any) {
    console.error("generate error", e?.stack || e);
    return NextResponse.json({ error: e?.message || "internal" }, { status: 500 });
  }
}
