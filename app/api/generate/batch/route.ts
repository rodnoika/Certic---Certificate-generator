import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 60;

import { parse } from "csv-parse/sync";
import JSZip from "jszip";
import { put } from "@vercel/blob";
import { renderCertificate, buildFilename, type FieldBox } from "../../../lib/render";

function todayId(prefix = "CERT"){
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const rand = crypto.randomUUID().slice(0,8);
  return `${prefix}-${y}${m}${day}-${rand}`;
}
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const templateId = String(form.get("templateId") || "");
    const prefix = String(form.get("prefix") || "CERT");
    if (!(file instanceof File) || !templateId) {
      return NextResponse.json({ error: "bad payload" }, { status: 400 });
    }

    const csvText = await file.text();
    const records = parse(csvText, { columns: true, skip_empty_lines: true });

    const fieldsRes = await fetch(`${process.env.BLOB_BASE_URL ?? ""}/${templateId}/fields.json`);
    if (!fieldsRes.ok) return NextResponse.json({ error: "fields not found" }, { status: 400 });
    const { fields } = (await fieldsRes.json()) as { fields: FieldBox[] };

    const pngRes = await fetch(`${process.env.BLOB_BASE_URL ?? ""}/${templateId}/template.png`);
    const jpgRes = pngRes.ok ? null : await fetch(`${process.env.BLOB_BASE_URL ?? ""}/${templateId}/template.jpg`);
    const imgRes = pngRes.ok ? pngRes : (jpgRes && jpgRes.ok ? jpgRes : null);
    if (!imgRes) return NextResponse.json({ error: "template not found" }, { status: 400 });
    const mime = pngRes.ok ? "image/png" : ("image/jpeg" as const);
    const templateBuf = Buffer.from(await imgRes.arrayBuffer());

    const zip = new JSZip();
    const outExt = "png" as const;

    for (const row of records) {
      const fio: string = String(row.fio || row.FIO || "").trim();
      const raw = String(row.courses || row.COURSES || "");
      const courses = raw.split(/[|,]/).map((s: string) => s.trim()).filter(Boolean);
      if (!fio || courses.length === 0) continue;

      const id = todayId(prefix);
      for (const course of courses) {
        const out = await renderCertificate({
          templateBuffer: templateBuf, mime, fields,
          data: { fio, course, id }, outFormat: outExt
        });
        const name = buildFilename(id, course, fio, outExt);
        zip.file(name, out);
      }
    }

    const zipBuf = await zip.generateAsync({ type: "nodebuffer" });
    const { url } = await put(`${templateId}/out/batch_${Date.now()}.zip`, zipBuf, {
      access: "public",
      contentType: "application/zip",
      allowOverwrite: true,
    });

    return NextResponse.json({ archiveUrl: url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "internal" }, { status: 500 });
  }
}
