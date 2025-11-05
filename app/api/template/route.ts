import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 15;

import crypto from "node:crypto";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  const hash = crypto.createHash("sha256").update(buf).digest("hex");
  const ext = file.type === "image/png" ? "png" : "jpg";
  const templateId = `tpl_${hash.slice(0,12)}`;
  const key = `${templateId}/template.${ext}`;

  const { url } = await put(key, buf, { access: "public", contentType: file.type, allowOverwrite: true });
  return NextResponse.json({ templateId, url, hash });
}
