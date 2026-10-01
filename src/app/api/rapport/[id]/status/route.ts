import { NextResponse } from "next/server";
import { vereisGebruiker, foutAntwoord, ApiFout } from "@/lib/api";
import {
  haalRapport,
  zetRapportStatus,
  slaRapportOp,
  type RapportStatus,
} from "@/lib/rapporten";

export const dynamic = "force-dynamic";

const TOEGESTAAN: RapportStatus[] = [
  "concept",
  "wacht_op_akkoord",
  "goedgekeurd",
];

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const gebruiker = await vereisGebruiker();
    const rapport = await haalRapport(Number(params.id));
    if (!rapport) throw new ApiFout("Rapport niet gevonden", 404);

    const body = await req.json();
    const status = String(body.status) as RapportStatus;
    if (!TOEGESTAAN.includes(status)) {
      throw new ApiFout("Onbekende status");
    }
    if (status === "goedgekeurd" && gebruiker.rol !== "admin") {
      throw new ApiFout("Alleen Kishan kan een rapport goedkeuren", 403);
    }
    if (body.data) await slaRapportOp(rapport.id, body.data);
    await zetRapportStatus(rapport.id, status);
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    return foutAntwoord(e);
  }
}
