import type { RapportData } from "./report/types";

export type RapportStatus =
  | "concept"
  | "wacht_op_akkoord"
  | "goedgekeurd"
  | "verstuurd";

export type LeadStatus =
  | "nieuw"
  | "in_behandeling"
  | "wacht_op_akkoord"
  | "verstuurd"
  | "gereageerd"
  | "klant"
  | "afgehaakt";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  nieuw: "Nieuw",
  in_behandeling: "Rapport in bewerking",
  wacht_op_akkoord: "Wacht op akkoord",
  verstuurd: "Rapport verstuurd",
  gereageerd: "Gereageerd",
  klant: "Klant",
  afgehaakt: "Afgehaakt",
};

export const RAPPORT_STATUS_LABEL: Record<RapportStatus, string> = {
  concept: "Concept",
  wacht_op_akkoord: "Wacht op akkoord",
  goedgekeurd: "Goedgekeurd",
  verstuurd: "Verstuurd",
};

export interface Lead {
  id: number;
  bedrijfsnaam: string;
  plaats: string;
  contactpersoon: string;
  email: string;
  telefoon: string;
  website: string;
  zoekterm: string;
  bron: string;
  status: LeadStatus;
  notitie: string;
  aangemaakt: string;
  bijgewerkt: string;
}

export interface Rapport {
  id: number;
  lead_id: number;
  status: RapportStatus;
  data: RapportData;
  aangemaakt: string;
  bijgewerkt: string;
  goedgekeurd_op: string | null;
  verstuurd_op: string | null;
  verstuurd_naar: string | null;
}
