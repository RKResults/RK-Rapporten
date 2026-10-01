export type Impact = "hoog" | "middel" | "laag";

export type Blok =
  | { type: "p"; tekst: string }
  | { type: "bullets"; items: { lead?: string; tekst: string }[] };

export interface Verbeterpunt {
  titel: string;
  impact: Impact;
  impactToelichting?: string;
  blokken: Blok[];
  todo: string;
}

export interface ConcurrentRij {
  naam: string;
  reviews: string;
  score: string;
  extra: string;
}

export interface ExtraBlok {
  titel: string;
  tekst: string;
}

export interface Klantkaart {
  titel: string;
  tekst: string;
}

export interface RapportData {
  /** compactheid, 1 = normaal. Lager drukt het rapport op minder pagina's. */
  zoom: number;

  /* kop */
  bedrijfsnaam: string;
  plaats: string;
  aanhef: string;
  datum: string;

  /* positie */
  zoekterm: string;
  positie: string;
  volume: string;
  heatmapUrl: string | null;
  heatmapBreedte: number;
  tekstOnderKaart: string;

  /* optioneel blok direct onder de kaart */
  extraBlok: ExtraBlok | null;

  /* vaste blokken, wel aanpasbaar */
  top3Intro: string;
  klantkaarten: Klantkaart[];

  /* tabel */
  tabelTitel: string;
  kolomExtra: string;
  concurrenten: ConcurrentRij[];
  eigenRij: ConcurrentRij;
  tekstOnderTabel: string;

  /* verbeterpunten */
  verbeterpuntenTitel: string;
  verbeterpunten: Verbeterpunt[];

  /* slot */
  slotTitel: string;
  slotBasis: string;
  slotMidden: string;
  slotExclusiviteit: string;
  volgendeStap: string;
  ondertekening: string;
}
