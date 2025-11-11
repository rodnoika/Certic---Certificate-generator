import { NextRequest, NextResponse } from "next/server";
import { storeFields } from "../../../lib/templateStore";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { templateId, fields } = body || {};
  if (!templateId || !Array.isArray(fields)) {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }
  try {
    storeFields(templateId, fields);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("failed to save fields", err?.message || err);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}
