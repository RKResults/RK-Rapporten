import fs from "node:fs";
import path from "node:path";
import { vraag, vraagEen } from "./db";
import { renderRapport } from "./report/render";
import { leegRapport } from "./report/defaults";
import type { RapportData } from "./report/types";

export type {
  RapportStatus,
  LeadStatus,
  Lead,
  Rapport,
} from "./statussen";
export { LEAD_STATUS_LABEL, RAPPORT_STATUS_LABEL } from "./statussen";

import type {
  RapportStatus,
  LeadStatus,
  Lead,
  Rapport,
} from "./statussen";

const afbeeldingCache = new Map<string, string>();

/** Leest een bestand uit public/ en geeft het terug als data-url. */
export function publicDataUrl(naam: string): string {
  const bestaand = afbeeldingCache.get(naam);
  if (bestaand !== undefined) return bestaand;

  const kandidaten = [
    path.join(process.cwd(), "public", naam),
    path.join(process.cwd(), "..", "public", naam),
  ];
  for (const k of kandidaten) {
    try {
      const buf = fs.readFileSync(k);
      const url = `data:image/png;base64,${buf.toString("base64")}`;
      afbeeldingCache.set(naam, url);
      return url;
    } catch {
      /* volgende proberen */
    }
  }
  afbeeldingCache.set(naam, "");
  return "";
}

export function logoDataUrl(): string {
  return publicDataUrl("logo-wit.png");
}

export async function haalLeads(): Promise<Lead[]> {
  return vraag<Lead>(
    `select * from leads order by
       case status
         when 'wacht_op_akkoord' then 0
         when 'nieuw' then 1
         when 'in_behandeling' then 2
         when 'gereageerd' then 3
         when 'verstuurd' then 4
         when 'klant' then 5
         else 6
       end, bijgewerkt desc`
  );
}

export async function haalLead(id: number): Promise<Lead | null> {
  return vraagEen<Lead>("select * from leads where id = $1", [id]);
}

export async function haalRapportVanLead(
  leadId: number
): Promise<Rapport | null> {
  return vraagEen<Rapport>(
    "select * from rapporten where lead_id = $1 order by id desc limit 1",
    [leadId]
  );
}

export async function haalRapport(id: number): Promise<Rapport | null> {
  return vraagEen<Rapport>("select * from rapporten where id = $1", [id]);
}

/** Maakt een rapport aan op basis van de leadgegevens, of geeft het bestaande terug. */
export async function zorgVoorRapport(lead: Lead): Promise<Rapport> {
  const bestaand = await haalRapportVanLead(lead.id);
  if (bestaand) return bestaand;

  const data = leegRapport({
    bedrijfsnaam: lead.bedrijfsnaam,
    plaats: lead.plaats,
    aanhef: lead.contactpersoon,
    zoekterm: lead.zoekterm,
  });

  const rij = await vraagEen<Rapport>(
    `insert into rapporten (lead_id, status, data) values ($1, 'concept', $2) returning *`,
    [lead.id, JSON.stringify(data)]
  );
  await vraag(
    `update leads set status = case when status = 'nieuw' then 'in_behandeling' else status end,
       bijgewerkt = now() where id = $1`,
    [lead.id]
  );
  return rij!;
}

export async function slaRapportOp(
  id: number,
  data: RapportData
): Promise<void> {
  await vraag(
    "update rapporten set data = $2, bijgewerkt = now() where id = $1",
    [id, JSON.stringify(data)]
  );
}

export async function zetRapportStatus(
  id: number,
  status: RapportStatus
): Promise<void> {
  const extra =
    status === "goedgekeurd"
      ? ", goedgekeurd_op = now()"
      : status === "concept"
      ? ", goedgekeurd_op = null"
      : "";
  await vraag(
    `update rapporten set status = $2, bijgewerkt = now()${extra} where id = $1`,
    [id, status]
  );
  const koppeling: Record<RapportStatus, LeadStatus | null> = {
    concept: "in_behandeling",
    wacht_op_akkoord: "wacht_op_akkoord",
    goedgekeurd: "wacht_op_akkoord",
    verstuurd: "verstuurd",
  };
  const leadStatus = koppeling[status];
  if (leadStatus) {
    await vraag(
      `update leads set status = $2, bijgewerkt = now()
       where id = (select lead_id from rapporten where id = $1)`,
      [id, leadStatus]
    );
  }
}

/** Haalt de heatmap op en zet hem als data-url in de rapportdata. */
export async function dataMetAfbeeldingen(
  data: RapportData
): Promise<RapportData> {
  if (!data.heatmapUrl || data.heatmapUrl.startsWith("data:")) return data;
  const id = data.heatmapUrl.replace(/^\/api\/bestand\//, "");
  const bestand = await vraagEen<{ mime: string; data: string }>(
    "select mime, data from bestanden where id = $1",
    [id]
  );
  if (!bestand) return { ...data, heatmapUrl: null };
  return {
    ...data,
    heatmapUrl: `data:${bestand.mime};base64,${bestand.data}`,
  };
}

export async function rapportHtml(data: RapportData): Promise<string> {
  const compleet = await dataMetAfbeeldingen(data);
  return renderRapport(compleet, {
    logoUrl: logoDataUrl(),
    bewijsVoor: publicDataUrl("atlas-voor.png"),
    bewijsNa: publicDataUrl("atlas-na.png"),
    bewijsBalk: publicDataUrl("atlas-balk.png"),
  });
}

export function pdfBestandsnaam(data: RapportData): string {
  const naam = (data.bedrijfsnaam || "rapport")
    .replace(/[^\p{L}\p{N} .&-]/gu, "")
    .trim();
  return `Vindbaarheidsrapport - ${naam}.pdf`;
}
