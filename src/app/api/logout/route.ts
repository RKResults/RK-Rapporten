import { NextResponse } from "next/server";
import { wisSessie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  wisSessie();
  return NextResponse.json({ ok: true });
}
