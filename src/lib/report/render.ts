import type { RapportData, Blok, Impact } from "./types";

const NAVY = "#0E1A2F";
const GOLD = "#F2B705";
const GOLD_LIGHT = "#FFF4CC";
const GREY = "#F3F5F8";
const TEXT = "#1F2937";
const MUTED = "#5B6676";
const LINE = "#E2E6EC";

const IMPACT_KLEUR: Record<Impact, string> = {
  hoog: "#C0392B",
  middel: "#B7791F",
  laag: "#4B7A3F",
};

/** HTML-escape, daarna **vet** omzetten naar <strong>. */
export function inline(raw: string): string {
  const esc = (raw ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/** Losse alinea's op lege regel splitsen. */
function alineas(raw: string): string {
  return (raw ?? "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `<p>${inline(s.replace(/\n/g, " "))}</p>`)
    .join("");
}

function blokHtml(b: Blok): string {
  if (b.type === "p") return alineas(b.tekst);
  const items = (b.items ?? [])
    .filter((i) => (i.tekst ?? "").trim() || (i.lead ?? "").trim())
    .map(
      (i) =>
        `<li>${i.lead ? `<strong>${inline(i.lead)}</strong> ` : ""}${inline(
          i.tekst
        )}</li>`
    )
    .join("");
  return items ? `<ul>${items}</ul>` : "";
}

export interface RenderOpties {
  /** absolute of relatieve url naar het logo */
  logoUrl?: string;
  /** true als het voor de schermpreview is in plaats van de pdf */
  preview?: boolean;
}

export function renderRapport(d: RapportData, opt: RenderOpties = {}): string {
  const logo = opt.logoUrl ?? "/logo-wit.png";

  const statBlokken = [
    {
      groot: d.positie || "–",
      klein: `plek in Google Maps<br>bij "${d.zoekterm}"`,
    },
    {
      groot: d.volume || "–",
      klein: `keer per maand gezocht<br>naar "${d.zoekterm}"`,
    },
    { groot: "Top 3", klein: "krijgt de meeste<br>aanvragen" },
  ];

  const kaarten = (d.klantkaarten ?? [])
    .filter((k) => k.titel?.trim())
    .map(
      (k) => `<div class="kaart">
        <div class="kaart-titel">${inline(k.titel)}</div>
        <div class="kaart-tekst">${inline(k.tekst)}</div>
      </div>`
    )
    .join("");

  const rijen = [...(d.concurrenten ?? []), d.eigenRij]
    .filter(Boolean)
    .map((r, i, arr) => {
      const eigen = i === arr.length - 1;
      return `<tr class="${eigen ? "eigen" : i % 2 === 1 ? "zebra" : ""}">
        <td class="naam">${inline(r.naam)}</td>
        <td>${inline(r.reviews)}</td>
        <td>${inline(r.score)}</td>
        <td>${inline(r.extra)}</td>
      </tr>`;
    })
    .join("");

  const punten = (d.verbeterpunten ?? [])
    .filter((p) => p.titel?.trim())
    .map((p, i) => {
      const kleur = IMPACT_KLEUR[p.impact] ?? IMPACT_KLEUR.middel;
      const toel = p.impactToelichting?.trim()
        ? `, ${inline(p.impactToelichting)}`
        : "";
      return `<section class="punt">
        <div class="punt-nr">${i + 1}</div>
        <div class="punt-body">
          <h3>${inline(p.titel)}</h3>
          <div class="impact" style="color:${kleur}">
            <span class="dot">&#9679;</span> IMPACT: ${p.impact.toUpperCase()}${toel}
          </div>
          ${(p.blokken ?? []).map(blokHtml).join("")}
          ${
            p.todo?.trim()
              ? `<div class="todo"><strong>Wat u zelf kunt doen:</strong> ${inline(
                  p.todo
                )}</div>`
              : ""
          }
        </div>
      </section>`;
    })
    .join("");

  const extra = d.extraBlok?.titel?.trim()
    ? `<div class="infoblok">
         <div class="infoblok-titel">${inline(d.extraBlok.titel)}</div>
         ${alineas(d.extraBlok.tekst)}
       </div>`
    : "";

  const subtitel = [d.bedrijfsnaam, d.plaats].filter(Boolean).join(", ");
  const metaRegel = [
    d.aanhef ? `Vrijblijvend opgesteld voor ${d.aanhef}` : "Vrijblijvend opgesteld",
    d.datum,
  ]
    .filter(Boolean)
    .join("&nbsp;&nbsp;|&nbsp;&nbsp;");

  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<title>Vindbaarheidsrapport ${inline(d.bedrijfsnaam)}</title>
<style>
  @page { size: A4; margin: 12mm 17mm 13mm 17mm; }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Carlito, Calibri, "Segoe UI", Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.42;
    color: ${TEXT};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  p { margin: 0 0 6pt; }
  p:last-child { margin-bottom: 0; }
  strong { font-weight: 700; }

  ul { margin: 2pt 0 6pt; padding-left: 14pt; }
  li { margin-bottom: 2.5pt; }
  li::marker { color: ${NAVY}; }

  /* ---------- kop ---------- */
  .banner {
    background: ${NAVY};
    border-bottom: 4pt solid ${GOLD};
    padding: 13pt 16pt 13pt 18pt;
    display: flex;
    align-items: center;
    gap: 14pt;
  }
  .banner-tekst { flex: 1; min-width: 0; }
  .banner h1 {
    margin: 0;
    font-size: 25pt;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.3pt;
  }
  .banner .sub {
    margin-top: 1pt;
    font-size: 13.5pt;
    color: ${GOLD};
  }
  .banner .meta {
    margin-top: 4pt;
    font-size: 8pt;
    font-style: italic;
    color: #AEB8C8;
  }
  .banner img { width: 112pt; display: block; }

  /* ---------- koppen ---------- */
  h2 {
    margin: 12pt 0 5pt;
    padding-left: 9pt;
    border-left: 4pt solid ${GOLD};
    font-size: 14.5pt;
    font-weight: 700;
    color: ${NAVY};
    break-after: avoid;
    page-break-after: avoid;
  }
  h2:first-of-type { margin-top: 11pt; }

  /* ---------- cijferblokken ---------- */
  .stats { display: flex; gap: 2pt; margin: 6pt 0 7pt; break-inside: avoid; }
  .stat {
    flex: 1;
    background: ${NAVY};
    padding: 8pt 6pt 9pt;
    text-align: center;
  }
  .stat .groot {
    font-size: 24pt;
    font-weight: 700;
    color: ${GOLD};
    line-height: 1.1;
  }
  .stat .klein {
    margin-top: 2pt;
    font-size: 8.5pt;
    color: #DDE3EC;
    line-height: 1.3;
  }

  /* ---------- kaart ---------- */
  .kaart-wrap { text-align: center; margin: 0 0 5pt; break-inside: avoid; }
  .kaart-wrap img { max-width: 100%; display: inline-block; }

  /* ---------- infoblok ---------- */
  .infoblok {
    background: ${GREY};
    border-left: 4pt solid ${NAVY};
    padding: 7pt 11pt 8pt 12pt;
    margin: 8pt 0 0;
    font-size: 9.5pt;
    break-inside: avoid;
  }
  .infoblok-titel { font-weight: 700; font-size: 11pt; color: ${NAVY}; margin-bottom: 2pt; }

  /* ---------- klantkaarten ---------- */
  .kaarten {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2pt;
    margin-top: 6pt;
    break-inside: avoid;
  }
  .kaart {
    background: ${GOLD_LIGHT};
    border-left: 3pt solid ${GOLD};
    padding: 7pt 10pt 8pt 11pt;
  }
  .kaart-titel { font-weight: 700; font-size: 10.5pt; color: ${NAVY}; }
  .kaart-tekst { font-size: 9.5pt; margin-top: 1pt; }

  /* ---------- tabel ---------- */
  table { width: 100%; border-collapse: collapse; margin-top: 2pt; break-inside: avoid; page-break-inside: avoid; }
  thead { display: table-header-group; }
  th, td {
    padding: 4.5pt 7pt;
    font-size: 10pt;
    text-align: center;
    vertical-align: middle;
  }
  th {
    background: ${NAVY};
    color: #fff;
    font-size: 9.5pt;
    font-weight: 700;
  }
  th.naam, td.naam { text-align: left; }
  tbody tr { border-bottom: 0.5pt solid ${LINE}; }
  tbody tr.zebra { background: ${GREY}; }
  tbody tr.eigen { background: ${GOLD}; border-bottom: none; }
  tbody tr.eigen td { font-weight: 700; color: ${NAVY}; }
  .na-tabel { margin-top: 7pt; }

  /* ---------- verbeterpunten ---------- */
  .punt {
    display: flex;
    margin-bottom: 6pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .punt-nr {
    width: 30pt;
    flex: none;
    background: ${NAVY};
    color: ${GOLD};
    font-size: 26pt;
    font-weight: 700;
    text-align: center;
    padding-top: 6pt;
    line-height: 1.1;
  }
  .punt-body {
    flex: 1;
    background: ${GREY};
    padding: 7pt 12pt 8pt 13pt;
    min-width: 0;
  }
  .punt-body h3 {
    margin: 0;
    font-size: 12pt;
    font-weight: 700;
    color: ${NAVY};
  }
  .impact {
    font-size: 8.5pt;
    font-weight: 700;
    letter-spacing: 0.2pt;
    margin: 1pt 0 5pt;
  }
  .impact .dot { font-size: 7pt; }
  .todo {
    background: ${GOLD_LIGHT};
    border-left: 3pt solid ${GOLD};
    padding: 5pt 9pt 6pt 10pt;
    margin-top: 4pt;
  }
  .todo strong { color: ${NAVY}; }

  /* ---------- slot ---------- */
  .cta {
    background: ${NAVY};
    border-left: 5pt solid ${GOLD};
    color: #fff;
    padding: 10pt 15pt 11pt 16pt;
    margin-top: 9pt;
    font-size: 11.5pt;
    font-weight: 700;
    line-height: 1.35;
    break-inside: avoid;
  }
  .cta .label { color: ${GOLD}; }
  .groet { margin-top: 12pt; }
  .naamregel { margin-top: 9pt; font-weight: 700; color: ${NAVY}; }

  .voet {
    margin-top: 12pt;
    padding-top: 5pt;
    border-top: 0.5pt solid ${LINE};
    font-size: 8pt;
    color: ${MUTED};
    text-align: center;
  }

  .blad { zoom: ${Number(d.zoom) > 0 ? Number(d.zoom) : 1}; }
</style>
</head>
<body>
<div class="blad">

<div class="banner">
  <div class="banner-tekst">
    <h1>Vindbaarheidsrapport</h1>
    ${subtitel ? `<div class="sub">${inline(subtitel)}</div>` : ""}
    <div class="meta">${metaRegel}</div>
  </div>
  <img src="${logo}" alt="RK Results">
</div>

<h2>Waar staat u nu?</h2>
<p>Bij de zoekopdracht "${inline(d.zoekterm)}" staat ${inline(
    d.bedrijfsnaam
  )} op plek ${inline(d.positie)} in Google Maps.</p>

<div class="stats">
  ${statBlokken
    .map(
      (s) =>
        `<div class="stat"><div class="groot">${inline(
          s.groot
        )}</div><div class="klein">${s.klein}</div></div>`
    )
    .join("")}
</div>

${
  d.heatmapUrl
    ? `<div class="kaart-wrap"><img src="${d.heatmapUrl}" style="width:${
        d.heatmapBreedte || 115
      }mm" alt="Heatmap"></div>`
    : ""
}

${alineas(d.tekstOnderKaart)}
${extra}

<h2>Wat krijgen de top 3 bedrijven?</h2>
${alineas(d.top3Intro)}
<p>Dit zijn de klanten waar de top 3 de meeste aanvragen van krijgt:</p>
<div class="kaarten">${kaarten}</div>

<h2>${inline(d.tabelTitel)}</h2>
<table>
  <thead>
    <tr>
      <th class="naam">Bedrijf</th>
      <th>Google-reviews</th>
      <th>Gemiddelde score</th>
      <th>${inline(d.kolomExtra)}</th>
    </tr>
  </thead>
  <tbody>${rijen}</tbody>
</table>
<div class="na-tabel">${alineas(d.tekstOnderTabel)}</div>

<h2>${inline(d.verbeterpuntenTitel)}</h2>
${punten}

<h2>${inline(d.slotTitel)}</h2>
${
  d.slotBasis?.trim()
    ? `<p>U heeft de belangrijkste basis al: ${inline(
        d.slotBasis
      )}. Met de bovenstaande verbeterpunten komt u al hoger te staan dan nu, en dit kunt u zelf (laten) uitvoeren.</p>`
    : ""
}
${alineas(d.slotMidden)}
${alineas(d.slotExclusiviteit)}

<div class="cta"><span class="label">Volgende stap:</span> ${inline(
    d.volgendeStap
  )}</div>

<p class="groet">Met vriendelijke groet,</p>
<p class="naamregel">${inline(d.ondertekening)}</p>

<div class="voet">RK Results&nbsp;&nbsp;|&nbsp;&nbsp;Online marketing&nbsp;&nbsp;|&nbsp;&nbsp;rkresults.com</div>

</div>
</body>
</html>`;
}
