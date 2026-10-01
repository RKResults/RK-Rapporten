import type { RapportData, Klantkaart } from "./types";

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
    zoom: 1,
    bedrijfsnaam,
    plaats,
    aanhef: input.aanhef ?? "",
    datum: nederlandseDatum(),

    zoekterm,
    positie: "",
    volume: "",
    heatmapUrl: null,
    heatmapBreedte: 115,
    tekstOnderKaart: `Er wordt maandelijks zo'n [volume] keer gezocht naar "${zoekterm}". De meeste mensen kiezen een van de eerste drie ${meervoud}. Op plek [positie] krijgt u aanzienlijk minder (kwalitatieve) aanvragen.`,

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

    verbeterpuntenTitel: "De drie belangrijkste verbeterpunten",
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

    slotTitel: "Hoe komt uw bedrijf in de top 3?",
    slotBasis: "",
    slotMidden: SLOT_MIDDEN,
    slotExclusiviteit: `Wij kunnen per locatie met maar één ${enkelvoud} werken. Alleen zo kunnen we ook echt een bedrijf in de top 3 zetten. Als we gaan samenwerken, doen we dit dus niet voor uw concurrenten.`,
    volgendeStap: `reageer op deze mail. Dan plannen we een kort gesprek van 15 minuten in en laten we zien hoe we ${bedrijfsnaam} naar de top 3 brengen.`,
    ondertekening: "Kishan & Dylan",
  };
}
