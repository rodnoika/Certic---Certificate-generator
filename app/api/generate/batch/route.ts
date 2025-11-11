import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 60;

import crypto from "node:crypto";
import { parse } from "csv-parse/sync";
import JSZip from "jszip";
import { renderCertificate, buildFilename, type FieldBox } from "../../../lib/render";
import { getFields, getTemplateBuffer } from "../../../lib/templateStore";

type CsvRow = Record<string, string>;

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
    const form = await req.formData();
    const file = form.get("file");
    const templateId = String(form.get("templateId") || "");
    const prefix = String(form.get("prefix") || "CERT");

    if (!(file instanceof File) || !templateId) {
      return NextResponse.json({ error: "bad payload" }, { status: 400 });
    }

    const csvText = await file.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvRow[];

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "empty csv" }, { status: 400 });
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

    const zip = new JSZip();
    const outExt = "png" as const;

    let produced = 0;
    for (const row of records) {
      const fio = String(row.fio ?? row.FIO ?? "").trim();
      const rawCourses = String(
        row.courses ?? row.course ?? row.COURSES ?? row.COURSE ?? ""
      );
      const courses = rawCourses
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (!fio || courses.length === 0) continue;

      const id = todayId(prefix);
      for (const course of courses) {
        const out = await renderCertificate({
          templateBuffer: templateBuf,
          mime,
          fields,
          data: { fio, course, id },
          outFormat: outExt,
        });
        const name = buildFilename(id, course, fio, outExt);

        zip.file(name, out);

        produced++;
      }
    }

    if (produced === 0) {
      return NextResponse.json(
        { error: "no valid rows in csv" },
        { status: 400 }
      );
    }

    const zipBuf = await zip.generateAsync({ type: "nodebuffer" });
    const archiveUrl = `data:application/zip;base64,${zipBuf.toString("base64")}`;

    return NextResponse.json({ count: produced, archiveUrl });
  } catch (e: any) {
    console.error("batch error:", e?.stack || e);
    return NextResponse.json(
      { error: e?.message || "internal" },
      { status: 500 }
    );
  }
}
