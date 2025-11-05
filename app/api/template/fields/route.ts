import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { templateId, fields } = body || {};
  if (!templateId || !Array.isArray(fields)) {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }
  const { put } = await import("@vercel/blob");
  const key = `${templateId}/fields.json`;
  await put(key, Buffer.from(JSON.stringify({ fields }, null, 2)), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true
  });
  return NextResponse.json({ ok: true });
}
