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

/** Het blok met het resultaat bij Atlas Coaching. */
export interface BewijsBlok {
  titel: string;
  tekst: string;
  labelVoor: string;
  labelNa: string;
}

/** Het blok met de prijzen en de garantie. */
export interface InvesteringBlok {
  titel: string;
  eenmaligRegel: string;
  punten: string[];
  maandRegel: string;
  maandTekst: string;
  garantie: string;
  voorwaarde: string;
}

export interface RapportData {
  /** compactheid, 1 = normaal. Lager drukt het rapport op minder pagina's. */
  zoom: number;

  /* kop */
  bedrijfsnaam: string;
  plaats: string;
  aanhef: string;
  datum: string;
  /** enkelvoud, bijvoorbeeld "hovenier". Vult [niche] in de teksten. */
  niche: string;

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
  bewijs: BewijsBlok | null;
  investering: InvesteringBlok | null;
  slotTitel: string;
  slotBasis: string;
  slotMidden: string;
  slotExclusiviteit: string;
  volgendeStap: string;
  ondertekening: string;
}
