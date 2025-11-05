import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 15;

import crypto from "node:crypto";
import { put } from "@vercel/blob";
import { renderCertificate, buildFilename, type FieldBox } from "../../lib/render";

function todayId(prefix = "CERT"){
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const rand = crypto.randomUUID().slice(0,8);
  return `${prefix}-${y}${m}${day}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "invalid JSON" }, { status: 400 });

    const { templateId, fio, courses, prefix } = body;
    if (!templateId || !fio || !Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json({ error: "bad payload: templateId,fio,courses[] required" }, { status: 400 });
    }

    const base = process.env.BLOB_PUBLIC_BASE_URL;
    if (!base) {
      console.error("BLOB_PUBLIC_BASE_URL missing");
      return NextResponse.json({ error: "server misconfigured: BLOB_PUBLIC_BASE_URL missing" }, { status: 500 });
    }
    const fieldsUrl = `${base}/${templateId}/fields.json`;
    const fieldsRes = await fetch(fieldsUrl);
    if (!fieldsRes.ok) {
      console.error("fields.json not found", fieldsUrl, fieldsRes.status);
      return NextResponse.json({ error: "fields not found (save fields first)" }, { status: 400 });
    }
    const { fields } = (await fieldsRes.json()) as { fields: FieldBox[] };
    if (!Array.isArray(fields) || fields.length === 0) {
      console.error("fields.json empty or invalid");
      return NextResponse.json({ error: "fields invalid or empty" }, { status: 400 });
    }
    let mime: "image/png" | "image/jpeg" = "image/png";
    let imgRes = await fetch(`${base}/${templateId}/template.png`);
    if (!imgRes.ok) {
      imgRes = await fetch(`${base}/${templateId}/template.jpg`);
      if (!imgRes.ok) {
        console.error("template not found as png or jpg");
        return NextResponse.json({ error: "template not found (upload template)" }, { status: 400 });
      }
      mime = "image/jpeg";
    }
    const templateBuf = Buffer.from(await imgRes.arrayBuffer());
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
        const key = `${templateId}/out/${name}`;
        const { url } = await put(
          key,
          out,
          {
            access: "public",
            contentType: `image/${outExt}`,
            allowOverwrite: true,
          }
        );
        files.push({ url, file: name });
      } catch (e: any) {
        console.error("upload result failed", e?.message);
        return NextResponse.json({ error: "upload to blob failed (check token/permissions)" }, { status: 500 });
      }
    }

    return NextResponse.json({ files });
  } catch (e: any) {
    console.error("generate error", e?.stack || e);
    return NextResponse.json({ error: e?.message || "internal" }, { status: 500 });
  }
}
