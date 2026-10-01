/**
 * Rendert een voorbeeldrapport naar proef.pdf, zodat je de opmaak kunt
 * controleren zonder de hele app te starten.
 *
 *   npm run proef
 */
import fs from "node:fs";
import path from "node:path";
import { renderRapport } from "../src/lib/report/render";
import { htmlNaarPdf, sluitBrowser } from "../src/lib/pdf";
import type { RapportData } from "../src/lib/report/types";
import {
  STANDAARD_KLANTKAARTEN,
  TOP3_INTRO,
  SLOT_MIDDEN,
  BEWIJS,
  INVESTERING,
} from "../src/lib/report/defaults";

function dataUrl(bestand: string): string {
  const buf = fs.readFileSync(bestand);
  const ext = path.extname(bestand).slice(1).toLowerCase();
  const mime = ext === "jpg" ? "jpeg" : ext;
  return `data:image/${mime};base64,${buf.toString("base64")}`;
}

const data: RapportData = {
  zoom: 0.95,
  bedrijfsnaam: "Meric Autorijschool",
  plaats: "Drachten",
  aanhef: "de heer O. Meric",
  niche: "rijschool",
  datum: "1 oktober 2026",

  zoekterm: "rijschool Drachten",
  positie: "31",
  volume: "50 – 150",
  heatmapUrl: dataUrl(process.env.HEATMAP || "/tmp/heatmap-test.png"),
  heatmapBreedte: 112,
  tekstOnderKaart:
    'Er wordt maandelijks zo\'n 50 tot 150 keer gezocht naar "rijschool Drachten". De meeste mensen kiezen een van de eerste drie rijscholen. Op plek 31 krijgt u aanzienlijk minder (kwalitatieve) aanvragen.',

  extraBlok: null,

  top3Intro: TOP3_INTRO,
  klantkaarten: STANDAARD_KLANTKAARTEN,

  tabelTitel: "Concurrenten die momenteel de meest hoogwaardige klanten krijgen",
  kolomExtra: '"Rijschool Drachten" in paginatitel',
  concurrenten: [
    { naam: "1. Parel", reviews: "168", score: "5,0", extra: "Ja" },
    { naam: "2. Rijschool Damas", reviews: "96", score: "4,8", extra: "Ja" },
    { naam: "3. Rijschool Smile Drachten", reviews: "29", score: "4,8", extra: "Ja" },
  ],
  eigenRij: { naam: "31. Meric Autorijschool", reviews: "4", score: "5,0", extra: "Nee" },
  tekstOnderTabel:
    "Uw leerlingen zijn enthousiast: uw Google-reviews zijn allemaal 5 sterren. Met meer dan 200 geslaagden heeft u veel meer tevreden leerlingen dan Google nu laat zien. Die basis is er dus al. Google moet alleen nog ontdekken hoe goed u bent.",

  verbeterpuntenTitel: "Drie verbeterpunten om hogerop te komen",
  verbeterpunten: [
    {
      titel: "Uw 200+ geslaagden zijn onzichtbaar op Google",
      impact: "hoog",
      blokken: [
        {
          type: "p",
          tekst:
            "Op Google heeft u 4 reviews. De rijscholen bovenaan hebben er 29 tot 168. Google kijkt goed naar hoeveel reviews u heeft, en nieuwe leerlingen doen dat ook. U heeft al meer dan 200 geslaagden. Als een deel van hen een review schrijft, maakt dat een groot verschil.",
        },
      ],
      todo: "vraag elke leerling direct na het slagen om een Google-review, met een korte link via WhatsApp. Benader ook oud-leerlingen met wie u nog contact heeft.",
    },
    {
      titel: "De titel van uw website zegt niet wat u doet",
      impact: "hoog",
      blokken: [
        {
          type: "p",
          tekst:
            'Elke website heeft een titel. Dat is de tekst die Google als eerste leest en bovenaan in de zoekresultaten laat zien. Bij u is dat nu "meric-autorijschool.nl". Daaruit kan Google niet opmaken dat u een rijschool in Drachten bent.',
        },
      ],
      todo: 'verander de titel in bijvoorbeeld "Rijschool Drachten | Meric Autorijschool". Dit kunt u zelf aanpassen in de instellingen van JouwWeb.',
    },
    {
      titel: "Uw website noemt veel plaatsen tegelijk",
      impact: "middel",
      blokken: [
        {
          type: "p",
          tekst:
            "Uw website noemt zes plaatsen tegelijk: Drachten, Heerenveen, Leeuwarden, Oosterwolde, Gorredijk en Burgum. Google weet daardoor niet waar u echt zit, en kiest u in geen enkele plaats. Uw Google-profiel staat in Drachten, dus daar liggen uw beste kansen.",
        },
        {
          type: "bullets",
          items: [
            { lead: "Voorbeeld:", tekst: "een testregel om de bullets te controleren." },
            { tekst: "Nog een regel zonder vetgedrukte aanhef." },
          ],
        },
      ],
      todo: "maak van uw homepage een pagina over rijles in Drachten. Wilt u ook andere plaatsen noemen? Geef elke plaats dan een eigen pagina.",
    },
  ],

  bewijs: BEWIJS,
  investering: INVESTERING,
  slotTitel: "Hoe komt uw bedrijf in de top 3?",
  slotBasis: "tevreden leerlingen en een hoog slagingspercentage",
  slotMidden: SLOT_MIDDEN,
  slotExclusiviteit:
    "Wij kunnen per locatie met maar één [niche] werken. Alleen zo kunnen we ook echt een bedrijf in de top 3 zetten. Als we gaan samenwerken, doen we dit dus niet voor uw concurrenten.",
  volgendeStap:
    "reageer op deze mail. Dan plannen we een kort gesprek van 15 minuten in en laten we zien hoe we [bedrijfsnaam] naar de top 3 brengen.",
  ondertekening: "Kishan & Dylan",
};

async function main() {
  const html = renderRapport(data, {
    logoUrl: dataUrl("public/logo-wit.png"),
    bewijsVoor: dataUrl("public/atlas-voor.png"),
    bewijsNa: dataUrl("public/atlas-na.png"),
    bewijsBalk: dataUrl("public/atlas-balk.png"),
  });
  fs.writeFileSync("/tmp/proef.html", html);
  const pdf = await htmlNaarPdf(html);
  fs.writeFileSync("/tmp/proef.pdf", pdf);
  await sluitBrowser();
  console.log("klaar:", pdf.length, "bytes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
