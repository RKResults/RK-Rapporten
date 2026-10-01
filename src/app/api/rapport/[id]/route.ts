import { NextResponse } from "next/server";
import { vereisGebruiker, foutAntwoord, ApiFout } from "@/lib/api";
import { haalRapport, slaRapportOp } from "@/lib/rapporten";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await vereisGebruiker();
    const rapport = await haalRapport(Number(params.id));
    if (!rapport) throw new ApiFout("Rapport niet gevonden", 404);
    return NextResponse.json({ rapport });
  } catch (e) {
    return foutAntwoord(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await vereisGebruiker();
    const rapport = await haalRapport(Number(params.id));
    if (!rapport) throw new ApiFout("Rapport niet gevonden", 404);
    if (rapport.status === "verstuurd") {
      throw new ApiFout(
        "Dit rapport is al verstuurd en kan niet meer aangepast worden",
        409
      );
    }
    const body = await req.json();
    if (!body?.data) throw new ApiFout("Geen rapportgegevens meegestuurd");
    await slaRapportOp(rapport.id, body.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return foutAntwoord(e);
  }
}
