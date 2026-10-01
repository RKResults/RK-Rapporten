import { NextResponse } from "next/server";
import { vraag, vraagEen, zorgVoorSchema } from "@/lib/db";
import { zorgVoorRapport, slaRapportOp, haalRapport, type Lead } from "@/lib/rapporten";
import { ApiFout, foutAntwoord } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Hier komen leads binnen vanuit het Google Apps Script, op het moment dat
 * Kishan ze goedkeurt. De lead en een voorgevuld rapport worden aangemaakt,
 * of bijgewerkt als het e-mailadres al bestaat.
 */

function tekst(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

/** "schilder Hoogezand" -> { niche: "schilder", plaats: "Hoogezand" } */
function splitsZoekterm(zoekterm: string): { niche: string; plaats: string } {
  const delen = zoekterm.trim().split(/\s+/);
  if (delen.length < 2) return { niche: delen[0] ?? "", plaats: "" };
  return { niche: delen[0], plaats: delen.slice(1).join(" ") };
}

function controleerSleutel(req: Request) {
  const verwacht = process.env.INKOMEND_SLEUTEL;
  if (!verwacht) {
    throw new ApiFout(
      "INKOMEND_SLEUTEL is niet ingesteld op de server",
      500
    );
  }
  const url = new URL(req.url);
  const gegeven =
    req.headers.get("x-rk-sleutel") ||
    url.searchParams.get("sleutel") ||
    "";
  if (gegeven !== verwacht) throw new ApiFout("Ongeldige sleutel", 401);
}

export async function POST(req: Request) {
  try {
    controleerSleutel(req);
    await zorgVoorSchema();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      throw new ApiFout("Geen geldige gegevens meegestuurd");
    }

    const bedrijfsnaam = tekst(body.bedrijfsnaam);
    const email = tekst(body.email).toLowerCase();
    if (!bedrijfsnaam && !email) {
      throw new ApiFout("Vul minstens een bedrijfsnaam of een e-mailadres in");
    }

    const zoekterm = tekst(body.zoekterm);
    const afgeleid = splitsZoekterm(zoekterm);
    const plaats = tekst(body.plaats) || afgeleid.plaats;
    const niche = tekst(body.niche) || afgeleid.niche;

    /* bestaat deze lead al? dan bijwerken in plaats van dubbel aanmaken */
    const bestaand = email
      ? await vraagEen<Lead>(
          "select * from leads where lower(email) = $1 order by id limit 1",
          [email]
        )
      : null;

    let lead: Lead;
    if (bestaand) {
      lead = (await vraagEen<Lead>(
        `update leads set
           bedrijfsnaam = coalesce(nullif($2,''), bedrijfsnaam),
           plaats       = coalesce(nullif($3,''), plaats),
           contactpersoon = coalesce(nullif($4,''), contactpersoon),
           telefoon     = coalesce(nullif($5,''), telefoon),
           website      = coalesce(nullif($6,''), website),
           zoekterm     = coalesce(nullif($7,''), zoekterm),
           bron         = coalesce(nullif($8,''), bron),
           notitie      = coalesce(nullif($9,''), notitie),
           status       = case when status = 'afgehaakt' then 'nieuw' else status end,
           bijgewerkt   = now()
         where id = $1 returning *`,
        [
          bestaand.id,
          bedrijfsnaam,
          plaats,
          tekst(body.contactpersoon),
          tekst(body.telefoon),
          tekst(body.website),
          zoekterm,
          tekst(body.bron),
          tekst(body.notitie),
        ]
      ))!;
    } else {
      lead = (await vraagEen<Lead>(
        `insert into leads
           (bedrijfsnaam, plaats, contactpersoon, email, telefoon, website, zoekterm, bron, notitie, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'nieuw') returning *`,
        [
          bedrijfsnaam || email,
          plaats,
          tekst(body.contactpersoon),
          email,
          tekst(body.telefoon),
          tekst(body.website),
          zoekterm,
          tekst(body.bron) || "Outreach",
          tekst(body.notitie),
        ]
      ))!;
    }

    /* rapport aanmaken en vullen met wat we al weten */
    const rapport = await zorgVoorRapport(lead);
    const versDoc = (await haalRapport(rapport.id))!;
    const data = { ...versDoc.data };

    if (versDoc.status === "concept") {
      if (bedrijfsnaam) {
        data.bedrijfsnaam = bedrijfsnaam;
        data.eigenRij = { ...data.eigenRij, naam: bedrijfsnaam };
      }
      if (plaats) data.plaats = plaats;
      if (niche) data.niche = niche;
      if (zoekterm) data.zoekterm = zoekterm;
      if (tekst(body.positie)) data.positie = tekst(body.positie);
      if (tekst(body.volume)) data.volume = tekst(body.volume);
      if (tekst(body.contactpersoon)) data.aanhef = tekst(body.contactpersoon);
      await slaRapportOp(rapport.id, data);
    }

    const basis = (process.env.APP_URL || "").replace(/\/+$/, "");

    return NextResponse.json({
      ok: true,
      nieuw: !bestaand,
      leadId: lead.id,
      rapportId: rapport.id,
      url: basis ? `${basis}/rapport/${rapport.id}` : `/rapport/${rapport.id}`,
    });
  } catch (e) {
    return foutAntwoord(e);
  }
}

/** Handig om vanuit de browser te controleren of het adres bereikbaar is. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    bericht: "Stuur hier een POST naartoe met de koptekst x-rk-sleutel.",
  });
}
