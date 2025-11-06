import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 60;

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import JSZip from "jszip";
import { put } from "@vercel/blob";
import { renderCertificate, buildFilename, type FieldBox } from "../../../lib/render";

type CsvRow = Record<string, string>;

function todayId(prefix = "CERT") {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const rand = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${y}${m}${day}-${rand}`;
}

function isAbsoluteUrl(s: string) {
  return /^https?:\/\//i.test(s);
}

function makeTemplateUrlBuilder(templateId: string) {
  const ENV_BASE =
    process.env.BLOB_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_BLOB_BASE_URL ||
    process.env.BLOB_BASE_URL ||
    "";

  if (!isAbsoluteUrl(templateId) && !ENV_BASE) {
    throw new Error("server misconfigured: BLOB_PUBLIC_BASE_URL is missing");
  }

  const base = isAbsoluteUrl(templateId)
    ? templateId.replace(/\/+$/, "")
    : String(ENV_BASE).replace(/\/+$/, "") +
      "/" +
      templateId.replace(/^\/+|\/+$/g, "");

  return (path: string) =>
    new URL(path.replace(/^\/+/, ""), base + "/").toString();
}

function appendLocalJsonl(lines: string) {
  try {
    const localDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
    const localPath = path.join(localDir, "certificates.jsonl");
    fs.appendFileSync(localPath, lines, "utf8");
  } catch (err) {
    console.error("local log write failed:", (err as any)?.message || err);
  }
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

    const urlOf = makeTemplateUrlBuilder(templateId);

    const fieldsRes = await fetch(urlOf("fields.json"), { cache: "no-store" });
    if (!fieldsRes.ok) {
      return NextResponse.json({ error: "fields not found" }, { status: 400 });
    }
    const { fields } = (await fieldsRes.json()) as { fields: FieldBox[] };
    if (!Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: "fields invalid or empty" },
        { status: 400 }
      );
    }

    let mime: "image/png" | "image/jpeg" = "image/png";
    let imgRes = await fetch(urlOf("template.png"), { cache: "no-store" });
    if (!imgRes.ok) {
      imgRes = await fetch(urlOf("template.jpg"), { cache: "no-store" });
      if (!imgRes.ok) {
        return NextResponse.json({ error: "template not found" }, { status: 400 });
      }
      mime = "image/jpeg";
    }
    const templateBuf = Buffer.from(await imgRes.arrayBuffer());

    const templateHash = crypto
      .createHash("sha256")
      .update(templateBuf)
      .digest("hex")
      .slice(0, 12);

    const zip = new JSZip();
    const outExt = "png" as const;

    const logLines: string[] = [];
    const nowISO = new Date().toISOString();

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

        logLines.push(
          JSON.stringify({
            datetime: nowISO,
            id,
            fio,
            course,
            filename: name,
            templateVersion: templateHash,
          })
        );

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
    const keyBase = isAbsoluteUrl(templateId)
      ? templateId.replace(/^https?:\/\/[^/]+\/?/, "").replace(/^\/+|\/+$/g, "")
      : templateId.replace(/^\/+|\/+$/g, "");

    const { url: archiveUrl } = await put(
      `${keyBase}/out/batch_${Date.now()}.zip`,
      zipBuf,
      {
        access: "public",
        contentType: "application/zip",
        allowOverwrite: true,
      }
    );

    try {
      const logKey = `${keyBase}/logs/certificates.jsonl`;
      const logUrl = urlOf("logs/certificates.jsonl");

      let existing = "";
      const existingRes = await fetch(logUrl, { cache: "no-store" });
      if (existingRes.ok) {
        existing = await existingRes.text();
      }

      const payload = (existing ? existing : "") + logLines.join("\n") + "\n";

      await put(logKey, payload, {
        access: "public",
        contentType: "application/json; charset=utf-8",
        allowOverwrite: true,
      });
    } catch (err) {
      console.error("blob log append failed:", (err as any)?.message || err);
    }

    appendLocalJsonl(logLines.join("\n") + "\n");

    return NextResponse.json({ archiveUrl, count: produced });
  } catch (e: any) {
    console.error("batch error:", e?.stack || e);
    return NextResponse.json(
      { error: e?.message || "internal" },
      { status: 500 }
    );
  }
}
