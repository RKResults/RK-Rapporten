import { NextResponse } from "next/server";
import { vraagEen } from "@/lib/db";
import { vereisGebruiker, foutAntwoord } from "@/lib/api";
import { haalLeads, zorgVoorRapport, type Lead } from "@/lib/rapporten";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await vereisGebruiker();
    return NextResponse.json({ leads: await haalLeads() });
  } catch (e) {
    return foutAntwoord(e);
  }
}

export async function POST(req: Request) {
  try {
    await vereisGebruiker();
    const body = await req.json();
    const bedrijfsnaam = String(body.bedrijfsnaam || "").trim();
    if (!bedrijfsnaam) {
      return NextResponse.json(
        { fout: "Vul een bedrijfsnaam in" },
        { status: 400 }
      );
    }
    const lead = await vraagEen<Lead>(
      `insert into leads (bedrijfsnaam, plaats, contactpersoon, email, telefoon, website, zoekterm, bron, notitie)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
      [
        bedrijfsnaam,
        String(body.plaats || "").trim(),
        String(body.contactpersoon || "").trim(),
        String(body.email || "").trim(),
        String(body.telefoon || "").trim(),
        String(body.website || "").trim(),
        String(body.zoekterm || "").trim(),
        String(body.bron || "").trim(),
        String(body.notitie || "").trim(),
      ]
    );
    const rapport = await zorgVoorRapport(lead!);
    return NextResponse.json({ lead, rapportId: rapport.id });
  } catch (e) {
    return foutAntwoord(e);
  }
}
