import type {
  RapportData,
  Klantkaart,
  BewijsBlok,
  InvesteringBlok,
} from "./types";

export const STANDAARD_KLANTKAARTEN: Klantkaart[] = [
  { titel: "Snelle beslissers", tekst: "Ze zoeken nú een oplossing." },
  {
    titel: "Makkelijke klanten",
    tekst: "Ze nemen geen tijd om andere bedrijven te vergelijken.",
  },
  {
    titel: "Klanten die kunnen betalen",
    tekst:
      "Geen krenterige klanten die een vijfgangenmenu verwachten voor een snackbarprijs.",
  },
  {
    titel: "Klanten die vertrouwen",
    tekst: "Ze gaan ervan uit dat u betrouwbaar bent als u bovenaan staat.",
  },
];

export const TOP3_INTRO =
  "Kort en simpel gezegd: hoogwaardige klanten die snel beslissen en geld kunnen uitgeven. Ze hebben namelijk geen tijd of zin om tientallen bedrijven met elkaar te vergelijken.";

export const SLOT_MIDDEN =
  "Maar de top 3 vraagt meer dan alleen dit. Naast deze punten zijn er nog een aantal (technische) zaken die verbeterd moeten worden om uw bedrijf in de top 3 te krijgen en die plek te behouden. **Als u dat wilt, nemen wij het volledige traject over: u geeft alleen toegang en ontvangt wekelijks een update van ons.**";

export const BEWIJS: BewijsBlok = {
  titel: "Zo zag dat eruit bij Atlas Coaching",
  tekst:
    "Binnen drie maanden na de start van de samenwerking stond het bedrijf al in de top 3. De kaarten hieronder laten het verschil zien, samen met de gemiddelde positie.",
  labelVoor: "Bij de start",
  labelNa: "Na drie maanden",
};

export const INVESTERING: InvesteringBlok = {
  titel: "Investering en garantie",
  eenmaligRegel: "Het traject naar de top 3: eenmalig € 1.500 excl. btw",
  punten: [
    "Optimalisatie van uw Google-profiel",
    "Optimalisatie van uw website voor lokale zoektermen",
    "Consistente bedrijfsgegevens op de belangrijkste platforms",
    "Wekelijkse update over uw positie",
  ],
  maandRegel: "Daarna bovenaan blijven: € 500 per maand excl. btw",
  maandTekst:
    "Zodra u in de top 3 staat, zorgen wij dat u daar blijft en dat concurrenten u niet inhalen.",
  garantie:
    "Onze garantie: staat u binnen 90 dagen niet in de top 3 voor \"[zoekopdracht]\"? Dan werken wij kosteloos door totdat u daar wel staat.",
  voorwaarde: "Voorwaarde: wij krijgen toegang tot uw Google-profiel en website.",
};

export function nederlandseDatum(d = new Date()): string {
  const maanden = [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december",
  ];
  return `${d.getDate()} ${maanden[d.getMonth()]} ${d.getFullYear()}`;
}

export interface NieuwRapportInput {
  bedrijfsnaam?: string;
  plaats?: string;
  aanhef?: string;
  zoekterm?: string;
  /** meervoud, bijvoorbeeld "bedrijven", "rijscholen", "hoveniers" */
  brancheMeervoud?: string;
  /** enkelvoud, bijvoorbeeld "garage", "rijschool", "hovenier" */
  brancheEnkelvoud?: string;
}

export function leegRapport(input: NieuwRapportInput = {}): RapportData {
  const bedrijfsnaam = input.bedrijfsnaam ?? "";
  const plaats = input.plaats ?? "";
  const zoekterm = input.zoekterm ?? "";
  const meervoud = input.brancheMeervoud || "bedrijven";
  const enkelvoud = input.brancheEnkelvoud || "bedrijf";

  return {
    zoom: 0.95,
    bedrijfsnaam,
    plaats,
    aanhef: input.aanhef ?? "",
    datum: nederlandseDatum(),
    niche: enkelvoud === "bedrijf" ? "" : enkelvoud,

    zoekterm,
    positie: "",
    volume: "",
    heatmapUrl: null,
    heatmapBreedte: 115,
    tekstOnderKaart: `Er wordt maandelijks zo'n [volume] keer gezocht naar "[zoekopdracht]". De meeste mensen kiezen een van de eerste drie ${meervoud}. Op plek [positie] krijgt u aanzienlijk minder (kwalitatieve) aanvragen.`,

    extraBlok: null,

    top3Intro: TOP3_INTRO,
    klantkaarten: STANDAARD_KLANTKAARTEN.map((k) => ({ ...k })),

    tabelTitel:
      "Concurrenten die momenteel de meest hoogwaardige klanten krijgen",
    kolomExtra: "",
    concurrenten: [
      { naam: "1. ", reviews: "", score: "", extra: "" },
      { naam: "2. ", reviews: "", score: "", extra: "" },
      { naam: "3. ", reviews: "", score: "", extra: "" },
    ],
    eigenRij: { naam: bedrijfsnaam, reviews: "", score: "", extra: "" },
    tekstOnderTabel: "",

    verbeterpuntenTitel: "Drie verbeterpunten om hogerop te komen",
    verbeterpunten: [
      { titel: "", impact: "hoog", blokken: [{ type: "p", tekst: "" }], todo: "" },
      { titel: "", impact: "hoog", blokken: [{ type: "p", tekst: "" }], todo: "" },
      {
        titel: "",
        impact: "middel",
        blokken: [{ type: "p", tekst: "" }],
        todo: "",
      },
    ],

    bewijs: { ...BEWIJS },
    investering: { ...INVESTERING, punten: [...INVESTERING.punten] },
    slotTitel: "Hoe komt uw bedrijf in de top 3?",
    slotBasis: "",
    slotMidden: SLOT_MIDDEN,
    slotExclusiviteit:
      "Wij kunnen per locatie met maar één [niche] werken. Alleen zo kunnen we ook echt een bedrijf in de top 3 zetten. Als we gaan samenwerken, doen we dit dus niet voor uw concurrenten.",
    volgendeStap:
      "reageer op deze mail. Dan plannen we een kort gesprek van 15 minuten in en laten we zien hoe we [bedrijfsnaam] naar de top 3 brengen.",
    ondertekening: "Kishan & Dylan",
  };
}
