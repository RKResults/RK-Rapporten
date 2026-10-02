import { NextResponse } from "next/server";
import { vraag } from "@/lib/db";
import { vereisAdmin, foutAntwoord, ApiFout } from "@/lib/api";
import { haalRapport } from "@/lib/rapporten";

export const dynamic = "force-dynamic";

/**
 * Markeert een rapport als verstuurd zonder dat de app zelf mailt.
 * Gebruiken we nadat het rapport vanuit Gmail de deur uit is gegaan.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await vereisAdmin();
    const rapport = await haalRapport(Number(params.id));
    if (!rapport) throw new ApiFout("Rapport niet gevonden", 404);

    const body = await req.json().catch(() => ({}));
    const naar = String(body.naar || "").trim();

    await vraag(
      `update rapporten set status = 'verstuurd', verstuurd_op = now(),
         verstuurd_naar = $2, bijgewerkt = now() where id = $1`,
      [rapport.id, naar]
    );
    await vraag(
      "update leads set status = 'verstuurd', bijgewerkt = now() where id = $1",
      [rapport.lead_id]
    );

    return NextResponse.json({ ok: true, naar });
  } catch (e) {
    return foutAntwoord(e);
  }
}
