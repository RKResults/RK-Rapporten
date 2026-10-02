import { NextResponse } from "next/server";
import { vereisAdmin, foutAntwoord } from "@/lib/api";
import { controleerMail } from "@/lib/mail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Open /api/mailtest in de browser om te zien of de mailserver bereikbaar is.
 * Handig om het los van een rapport te kunnen controleren.
 */
export async function GET() {
  try {
    await vereisAdmin();
    const uitslag = await controleerMail();
    return NextResponse.json(uitslag, { status: uitslag.ok ? 200 : 503 });
  } catch (e) {
    return foutAntwoord(e);
  }
}
