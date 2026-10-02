"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Preview from "./Preview";
import { Tekst, Gebied, Blok } from "./Velden";
import VerstuurDialoog from "./VerstuurDialoog";
import type {
  RapportData,
  Verbeterpunt,
  Impact,
  Blok as Blokje,
} from "@/lib/report/types";
import {
  RAPPORT_STATUS_LABEL,
  type RapportStatus,
  type Lead,
} from "@/lib/statussen";
import { BEWIJS, INVESTERING } from "@/lib/report/defaults";

const STATUS_KLEUR: Record<RapportStatus, string> = {
  concept: "bg-slate-200 text-slate-700",
  wacht_op_akkoord: "bg-gold text-navy",
  goedgekeurd: "bg-emerald-100 text-emerald-800",
  verstuurd: "bg-navy text-white",
};

export default function Editor({
  rapportId,
  beginData,
  beginStatus,
  rol,
  leadEmail,
  leadNaam,
  lead,
  standaardKopie,
}: {
  rapportId: number;
  beginData: RapportData;
  beginStatus: RapportStatus;
  rol: string;
  leadEmail: string;
  leadNaam: string;
  lead: Lead | null;
  standaardKopie: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<RapportData>(beginData);
  const [status, setStatus] = useState<RapportStatus>(beginStatus);
  const [tik, setTik] = useState(0);
  const [opslagStand, setOpslagStand] = useState<"rust" | "bezig" | "fout">(
    "rust"
  );
  const [melding, setMelding] = useState("");
  const [geavanceerd, setGeavanceerd] = useState(false);
  const [verstuurOpen, setVerstuurOpen] = useState(false);
  const eersteKeer = useRef(true);

  const vergrendeld = status === "verstuurd";

  const zet = useCallback((patch: Partial<RapportData>) => {
    setData((d) => ({ ...d, ...patch }));
    setTik((t) => t + 1);
  }, []);

  /* automatisch opslaan */
  useEffect(() => {
    if (eersteKeer.current) {
      eersteKeer.current = false;
      return;
    }
    if (vergrendeld) return;
    setOpslagStand("bezig");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/rapport/${rapportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
        setOpslagStand(res.ok ? "rust" : "fout");
      } catch {
        setOpslagStand("fout");
      }
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tik]);

  async function wijzigStatus(nieuw: RapportStatus) {
    const res = await fetch(`/api/rapport/${rapportId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nieuw, data }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMelding(json.fout || "Dat lukte niet");
      return;
    }
    setStatus(nieuw);
    setMelding(
      nieuw === "wacht_op_akkoord"
        ? "Doorgestuurd naar Kishan"
        : nieuw === "goedgekeurd"
        ? "Goedgekeurd, klaar om te versturen"
        : "Teruggezet naar concept"
    );
    router.refresh();
  }

  /* ---------- verbeterpunten ---------- */
  function zetPunt(i: number, patch: Partial<Verbeterpunt>) {
    const punten = data.verbeterpunten.map((p, j) =>
      j === i ? { ...p, ...patch } : p
    );
    zet({ verbeterpunten: punten });
  }

  function zetPuntTekst(i: number, tekst: string) {
    const punt = data.verbeterpunten[i];
    const blokken: Blokje[] = [...punt.blokken];
    const idx = blokken.findIndex((b) => b.type === "p");
    if (idx >= 0) blokken[idx] = { type: "p", tekst };
    else blokken.unshift({ type: "p", tekst });
    zetPunt(i, { blokken });
  }

  function puntTekst(p: Verbeterpunt): string {
    const blok = p.blokken.find((b) => b.type === "p");
    return blok && blok.type === "p" ? blok.tekst : "";
  }

  function puntBullets(p: Verbeterpunt): string {
    const blok = p.blokken.find((b) => b.type === "bullets");
    if (!blok || blok.type !== "bullets") return "";
    return blok.items
      .map((i) => (i.lead ? `${i.lead} | ${i.tekst}` : i.tekst))
      .join("\n");
  }

  function zetPuntBullets(i: number, ruw: string) {
    const items = ruw
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r) => {
        const deel = r.split("|");
        return deel.length > 1
          ? { lead: deel[0].trim(), tekst: deel.slice(1).join("|").trim() }
          : { tekst: r };
      });
    const punt = data.verbeterpunten[i];
    const blokken: Blokje[] = punt.blokken.filter((b) => b.type !== "bullets");
    if (items.length) blokken.push({ type: "bullets", items });
    zetPunt(i, { blokken });
  }

  function voegPuntToe() {
    zet({
      verbeterpunten: [
        ...data.verbeterpunten,
        { titel: "", impact: "middel", blokken: [{ type: "p", tekst: "" }], todo: "" },
      ],
    });
  }

  function verwijderPunt(i: number) {
    zet({ verbeterpunten: data.verbeterpunten.filter((_, j) => j !== i) });
  }

  /* ---------- heatmap ---------- */
  async function uploadHeatmap(bestand: File) {
    const form = new FormData();
    form.append("bestand", bestand);
    form.append("rapportId", String(rapportId));
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) {
      setMelding(json.fout || "Uploaden lukte niet");
      return;
    }
    zet({ heatmapUrl: json.url });
  }

  return (
    <div className="mx-auto grid max-w-[1600px] gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,620px)]">
      {/* ---------------- formulier ---------------- */}
      <div className="space-y-5">
        {/* statusbalk */}
        <div className="kaart sticky top-16 z-20 flex flex-wrap items-center gap-3 p-4">
          <span className={`chip ${STATUS_KLEUR[status]}`}>
            {RAPPORT_STATUS_LABEL[status]}
          </span>
          <span className="text-xs text-slate-400">
            {opslagStand === "bezig"
              ? "opslaan..."
              : opslagStand === "fout"
              ? "opslaan mislukt"
              : "opgeslagen"}
          </span>

          <div className="ml-auto flex flex-wrap gap-2">
            {!vergrendeld && status === "concept" && (
              <button
                className="knop-primair"
                onClick={() => wijzigStatus("wacht_op_akkoord")}
              >
                Naar Kishan sturen
              </button>
            )}
            {status === "wacht_op_akkoord" && rol === "admin" && (
              <>
                <button
                  className="knop-rand"
                  onClick={() => wijzigStatus("concept")}
                >
                  Terug naar Dylan
                </button>
                <button
                  className="knop-goud"
                  onClick={() => wijzigStatus("goedgekeurd")}
                >
                  Goedkeuren
                </button>
              </>
            )}
            {status === "goedgekeurd" && rol === "admin" && (
              <button
                className="knop-goud"
                onClick={() => setVerstuurOpen(true)}
              >
                Versturen naar klant
              </button>
            )}
            {status === "verstuurd" && (
              <span className="text-sm font-semibold text-emerald-700">
                Verstuurd
              </span>
            )}
          </div>

          {melding && (
            <p className="w-full rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
              {melding}
            </p>
          )}
        </div>

        {/* gegevens van de lead, zoals ze binnenkwamen */}
        {lead && (lead.email || lead.website || lead.notitie) && (
          <section className="kaart border-l-4 border-l-navy p-5">
            <h2 className="mb-3 font-bold text-navy">Zoals de lead binnenkwam</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {lead.email && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    E-mail
                  </dt>
                  <dd>{lead.email}</dd>
                </div>
              )}
              {lead.website && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Website
                  </dt>
                  <dd className="truncate">
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-navy underline-offset-2 hover:underline"
                    >
                      {lead.website}
                    </a>
                  </dd>
                </div>
              )}
              {lead.telefoon && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Telefoon
                  </dt>
                  <dd>{lead.telefoon}</dd>
                </div>
              )}
              {lead.bron && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Bron
                  </dt>
                  <dd>{lead.bron}</dd>
                </div>
              )}
            </dl>
            {lead.notitie && (
              <div className="mt-4 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                {lead.notitie}
              </div>
            )}
          </section>
        )}

        <fieldset disabled={vergrendeld} className="space-y-5">
          {/* bedrijf */}
          <Blok titel="Bedrijf" beschrijving="Komt in de blauwe kopbalk te staan">
            <div className="grid grid-cols-2 gap-4">
              <Tekst
                label="Bedrijfsnaam"
                waarde={data.bedrijfsnaam}
                zet={(v) => zet({ bedrijfsnaam: v })}
              />
              <Tekst
                label="Plaats"
                waarde={data.plaats}
                zet={(v) => zet({ plaats: v })}
              />
              <Tekst
                label="Aanhef"
                waarde={data.aanhef}
                zet={(v) => zet({ aanhef: v })}
                placeholder="de heer J. Jansen"
                hint="Komt achter 'Vrijblijvend opgesteld voor'"
              />
              <Tekst
                label="Datum"
                waarde={data.datum}
                zet={(v) => zet({ datum: v })}
              />
              <Tekst
                label="Niche"
                waarde={data.niche}
                zet={(v) => zet({ niche: v })}
                placeholder="hovenier"
                hint="Enkelvoud. Vult overal waar [niche] staat."
                breed
              />
            </div>
          </Blok>

          {/* positie */}
          <Blok
            titel="Waar staat u nu?"
            beschrijving="De drie cijferblokken en de heatmap"
          >
            <div className="grid grid-cols-2 gap-4">
              <Tekst
                label="Zoekterm"
                waarde={data.zoekterm}
                zet={(v) => zet({ zoekterm: v })}
                placeholder="hovenier Sneek"
              />
              <div className="grid grid-cols-2 gap-4">
                <Tekst
                  label="Positie"
                  waarde={data.positie}
                  zet={(v) => zet({ positie: v })}
                  placeholder="20"
                />
                <Tekst
                  label="Zoekvolume"
                  waarde={data.volume}
                  zet={(v) => zet({ volume: v })}
                  placeholder="20 – 60"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-4">
              <div>
                <label className="label">Heatmap</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="invoer file:mr-3 file:rounded file:border-0 file:bg-navy file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadHeatmap(f);
                  }}
                />
              </div>
              <div className="w-40">
                <label className="label">Breedte (mm)</label>
                <input
                  type="range"
                  min={70}
                  max={170}
                  value={data.heatmapBreedte}
                  onChange={(e) =>
                    zet({ heatmapBreedte: Number(e.target.value) })
                  }
                  className="w-full accent-gold"
                />
              </div>
            </div>

            <div className="mt-4">
              <Gebied
                label="Tekst onder de kaart"
                waarde={data.tekstOnderKaart}
                zet={(v) => zet({ tekstOnderKaart: v })}
                rijen={3}
              />
            </div>

            <div className="mt-4 rounded-md bg-slate-50 p-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-navy">
                <input
                  type="checkbox"
                  className="accent-gold"
                  checked={!!data.extraBlok}
                  onChange={(e) =>
                    zet({
                      extraBlok: e.target.checked
                        ? {
                            titel: "Hoe hebben wij dit gemeten?",
                            tekst: "",
                          }
                        : null,
                    })
                  }
                />
                Extra uitlegblok onder de kaart
              </label>
              {data.extraBlok && (
                <div className="mt-3 space-y-3">
                  <Tekst
                    label="Titel"
                    waarde={data.extraBlok.titel}
                    zet={(v) =>
                      zet({ extraBlok: { ...data.extraBlok!, titel: v } })
                    }
                  />
                  <Gebied
                    label="Tekst"
                    waarde={data.extraBlok.tekst}
                    zet={(v) =>
                      zet({ extraBlok: { ...data.extraBlok!, tekst: v } })
                    }
                    rijen={3}
                  />
                </div>
              )}
            </div>
          </Blok>

          {/* tabel */}
          <Blok
            titel="Concurrententabel"
            beschrijving="De onderste rij is het bedrijf zelf en wordt geel uitgelicht"
          >
            <Tekst
              label="Naam van de vierde kolom"
              waarde={data.kolomExtra}
              zet={(v) => zet({ kolomExtra: v })}
              placeholder='"Loodgieter" + "Roden" op website'
            />

            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-[1fr_90px_90px_1fr_32px] gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Bedrijf</span>
                <span>Reviews</span>
                <span>Score</span>
                <span>Vierde kolom</span>
                <span />
              </div>

              {data.concurrenten.map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_90px_90px_1fr_32px] items-center gap-2"
                >
                  <input
                    className="invoer"
                    value={r.naam}
                    onChange={(e) => {
                      const c = [...data.concurrenten];
                      c[i] = { ...c[i], naam: e.target.value };
                      zet({ concurrenten: c });
                    }}
                  />
                  <input
                    className="invoer"
                    value={r.reviews}
                    onChange={(e) => {
                      const c = [...data.concurrenten];
                      c[i] = { ...c[i], reviews: e.target.value };
                      zet({ concurrenten: c });
                    }}
                  />
                  <input
                    className="invoer"
                    value={r.score}
                    onChange={(e) => {
                      const c = [...data.concurrenten];
                      c[i] = { ...c[i], score: e.target.value };
                      zet({ concurrenten: c });
                    }}
                  />
                  <input
                    className="invoer"
                    value={r.extra}
                    onChange={(e) => {
                      const c = [...data.concurrenten];
                      c[i] = { ...c[i], extra: e.target.value };
                      zet({ concurrenten: c });
                    }}
                  />
                  <button
                    type="button"
                    className="text-slate-400 hover:text-red-600"
                    onClick={() =>
                      zet({
                        concurrenten: data.concurrenten.filter(
                          (_, j) => j !== i
                        ),
                      })
                    }
                    title="Rij verwijderen"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="text-sm font-semibold text-navy hover:underline"
                onClick={() =>
                  zet({
                    concurrenten: [
                      ...data.concurrenten,
                      { naam: "", reviews: "", score: "", extra: "" },
                    ],
                  })
                }
              >
                + Rij toevoegen
              </button>

              <div className="mt-3 rounded-md bg-gold-light p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy">
                  Eigen rij
                </p>
                <div className="grid grid-cols-[1fr_90px_90px_1fr] gap-2">
                  <input
                    className="invoer"
                    placeholder="20. Tuinservice Friesland"
                    value={data.eigenRij.naam}
                    onChange={(e) =>
                      zet({
                        eigenRij: { ...data.eigenRij, naam: e.target.value },
                      })
                    }
                  />
                  <input
                    className="invoer"
                    value={data.eigenRij.reviews}
                    onChange={(e) =>
                      zet({
                        eigenRij: { ...data.eigenRij, reviews: e.target.value },
                      })
                    }
                  />
                  <input
                    className="invoer"
                    value={data.eigenRij.score}
                    onChange={(e) =>
                      zet({
                        eigenRij: { ...data.eigenRij, score: e.target.value },
                      })
                    }
                  />
                  <input
                    className="invoer"
                    value={data.eigenRij.extra}
                    onChange={(e) =>
                      zet({
                        eigenRij: { ...data.eigenRij, extra: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Gebied
                label="Tekst onder de tabel"
                waarde={data.tekstOnderTabel}
                zet={(v) => zet({ tekstOnderTabel: v })}
                rijen={3}
                hint="Hier benoem je wat er al goed gaat bij het bedrijf"
              />
            </div>
          </Blok>

          {/* verbeterpunten */}
          <Blok
            titel="Verbeterpunten"
            beschrijving="Gebruik **tekst** om iets vet te maken"
            rechts={
              <button
                type="button"
                className="knop-rand"
                onClick={voegPuntToe}
              >
                + Punt
              </button>
            }
          >
            <div className="space-y-5">
              {data.verbeterpunten.map((p, i) => (
                <div
                  key={i}
                  className="rounded-md border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded bg-navy text-sm font-bold text-gold">
                      {i + 1}
                    </span>
                    <input
                      className="invoer flex-1"
                      placeholder="Titel van het verbeterpunt"
                      value={p.titel}
                      onChange={(e) => zetPunt(i, { titel: e.target.value })}
                    />
                    <select
                      className="invoer w-28"
                      value={p.impact}
                      onChange={(e) =>
                        zetPunt(i, { impact: e.target.value as Impact })
                      }
                    >
                      <option value="hoog">Hoog</option>
                      <option value="middel">Middel</option>
                      <option value="laag">Laag</option>
                    </select>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-red-600"
                      onClick={() => verwijderPunt(i)}
                      title="Punt verwijderen"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3">
                    <Gebied
                      label="Uitleg"
                      waarde={puntTekst(p)}
                      zet={(v) => zetPuntTekst(i, v)}
                      rijen={4}
                      hint="Lege regel ertussen maakt een nieuwe alinea"
                    />
                    <Gebied
                      label="Opsomming (optioneel)"
                      waarde={puntBullets(p)}
                      zet={(v) => zetPuntBullets(i, v)}
                      rijen={2}
                      placeholder={"Adres: | er staat nergens een straat"}
                      hint="Eén punt per regel. Tekst voor het streepje wordt vetgedrukt."
                    />
                    <Gebied
                      label="Wat u zelf kunt doen"
                      waarde={p.todo}
                      zet={(v) => zetPunt(i, { todo: v })}
                      rijen={2}
                    />
                    <Tekst
                      label="Toelichting bij impact (optioneel)"
                      waarde={p.impactToelichting ?? ""}
                      zet={(v) => zetPunt(i, { impactToelichting: v })}
                      placeholder="versterkt punt 1 en 2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Blok>

          {/* bewijs */}
          <Blok
            titel="Resultaat bij Atlas Coaching"
            beschrijving="De twee kaarten en de balk met de gemiddelde positie"
            rechts={
              <label className="flex items-center gap-2 text-sm font-semibold text-navy">
                <input
                  type="checkbox"
                  className="accent-gold"
                  checked={!!data.bewijs}
                  onChange={(e) =>
                    zet({ bewijs: e.target.checked ? { ...BEWIJS } : null })
                  }
                />
                In het rapport
              </label>
            }
          >
            {data.bewijs ? (
              <div className="space-y-4">
                <Tekst
                  label="Kop"
                  waarde={data.bewijs.titel}
                  zet={(v) => zet({ bewijs: { ...data.bewijs!, titel: v } })}
                />
                <Gebied
                  label="Tekst"
                  waarde={data.bewijs.tekst}
                  zet={(v) => zet({ bewijs: { ...data.bewijs!, tekst: v } })}
                  rijen={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Tekst
                    label="Label linkerkaart"
                    waarde={data.bewijs.labelVoor}
                    zet={(v) =>
                      zet({ bewijs: { ...data.bewijs!, labelVoor: v } })
                    }
                  />
                  <Tekst
                    label="Label rechterkaart"
                    waarde={data.bewijs.labelNa}
                    zet={(v) => zet({ bewijs: { ...data.bewijs!, labelNa: v } })}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  De afbeeldingen zijn vast en horen bij Atlas Coaching.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Dit blok staat nu niet in het rapport.
              </p>
            )}
          </Blok>

          {/* investering */}
          <Blok
            titel="Investering en garantie"
            beschrijving="De prijzen en de garantie"
            rechts={
              <label className="flex items-center gap-2 text-sm font-semibold text-navy">
                <input
                  type="checkbox"
                  className="accent-gold"
                  checked={!!data.investering}
                  onChange={(e) =>
                    zet({
                      investering: e.target.checked
                        ? { ...INVESTERING, punten: [...INVESTERING.punten] }
                        : null,
                    })
                  }
                />
                In het rapport
              </label>
            }
          >
            {data.investering ? (
              <div className="space-y-4">
                <Tekst
                  label="Kop"
                  waarde={data.investering.titel}
                  zet={(v) =>
                    zet({ investering: { ...data.investering!, titel: v } })
                  }
                />
                <Tekst
                  label="Eenmalige prijs"
                  waarde={data.investering.eenmaligRegel}
                  zet={(v) =>
                    zet({
                      investering: { ...data.investering!, eenmaligRegel: v },
                    })
                  }
                />
                <Gebied
                  label="Wat erbij zit"
                  waarde={data.investering.punten.join("\n")}
                  zet={(v) =>
                    zet({
                      investering: {
                        ...data.investering!,
                        punten: v.split("\n").map((r) => r.trim()).filter(Boolean),
                      },
                    })
                  }
                  rijen={4}
                  hint="Eén punt per regel"
                />
                <Tekst
                  label="Maandprijs"
                  waarde={data.investering.maandRegel}
                  zet={(v) =>
                    zet({ investering: { ...data.investering!, maandRegel: v } })
                  }
                />
                <Gebied
                  label="Tekst onder de maandprijs"
                  waarde={data.investering.maandTekst}
                  zet={(v) =>
                    zet({ investering: { ...data.investering!, maandTekst: v } })
                  }
                  rijen={2}
                />
                <Gebied
                  label="Garantie"
                  waarde={data.investering.garantie}
                  zet={(v) =>
                    zet({ investering: { ...data.investering!, garantie: v } })
                  }
                  rijen={3}
                />
                <Tekst
                  label="Voorwaarde"
                  waarde={data.investering.voorwaarde}
                  zet={(v) =>
                    zet({ investering: { ...data.investering!, voorwaarde: v } })
                  }
                />
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Dit blok staat nu niet in het rapport.
              </p>
            )}
          </Blok>

          {/* slot */}
          <Blok titel="Slot" beschrijving="De afsluiting en de call to action">
            <div className="space-y-4">
              <Tekst
                label="U heeft de belangrijkste basis al:"
                waarde={data.slotBasis}
                zet={(v) => zet({ slotBasis: v })}
                placeholder="tevreden klanten en een website met goede inhoud"
                hint="Alleen dit stukje, de rest van de zin staat al vast"
              />
              <Gebied
                label="Exclusiviteit"
                waarde={data.slotExclusiviteit}
                zet={(v) => zet({ slotExclusiviteit: v })}
                rijen={2}
              />
              <Gebied
                label="Volgende stap"
                waarde={data.volgendeStap}
                zet={(v) => zet({ volgendeStap: v })}
                rijen={2}
                hint="Komt achter het vetgedrukte 'Volgende stap:'"
              />
              <Tekst
                label="Ondertekening"
                waarde={data.ondertekening}
                zet={(v) => zet({ ondertekening: v })}
              />
            </div>
          </Blok>

          {/* opmaak */}
          <Blok
            titel="Opmaak"
            beschrijving="Druk het rapport op minder pagina's als de laatste pagina bijna leeg is"
          >
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={80}
                max={100}
                step={1}
                value={Math.round((data.zoom ?? 1) * 100)}
                onChange={(e) => zet({ zoom: Number(e.target.value) / 100 })}
                className="flex-1 accent-gold"
              />
              <span className="w-16 text-right text-sm font-semibold text-navy">
                {Math.round((data.zoom ?? 1) * 100)}%
              </span>
              <button
                type="button"
                className="knop-rand"
                onClick={() => zet({ zoom: 1 })}
              >
                Standaard
              </button>
            </div>
          </Blok>

          {/* geavanceerd */}
          <div>
            <button
              type="button"
              className="text-sm font-semibold text-slate-500 hover:text-navy"
              onClick={() => setGeavanceerd((g) => !g)}
            >
              {geavanceerd ? "▾" : "▸"} Vaste teksten aanpassen
            </button>

            {geavanceerd && (
              <div className="mt-3 space-y-5">
                <Blok
                  titel="Vaste teksten"
                  beschrijving="Deze zijn voor elk rapport hetzelfde, pas ze alleen aan als het nodig is"
                >
                  <div className="space-y-4">
                    <Gebied
                      label="Intro bij 'Wat krijgen de top 3 bedrijven?'"
                      waarde={data.top3Intro}
                      zet={(v) => zet({ top3Intro: v })}
                      rijen={3}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      {data.klantkaarten.map((k, i) => (
                        <div
                          key={i}
                          className="rounded border border-gold/40 bg-gold-light p-3"
                        >
                          <input
                            className="invoer mb-2 font-semibold"
                            value={k.titel}
                            onChange={(e) => {
                              const kk = [...data.klantkaarten];
                              kk[i] = { ...kk[i], titel: e.target.value };
                              zet({ klantkaarten: kk });
                            }}
                          />
                          <textarea
                            className="invoer resize-none"
                            rows={2}
                            value={k.tekst}
                            onChange={(e) => {
                              const kk = [...data.klantkaarten];
                              kk[i] = { ...kk[i], tekst: e.target.value };
                              zet({ klantkaarten: kk });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <Gebied
                      label="Middenstuk van het slot"
                      waarde={data.slotMidden}
                      zet={(v) => zet({ slotMidden: v })}
                      rijen={4}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Tekst
                        label="Kop boven de tabel"
                        waarde={data.tabelTitel}
                        zet={(v) => zet({ tabelTitel: v })}
                      />
                      <Tekst
                        label="Kop boven de verbeterpunten"
                        waarde={data.verbeterpuntenTitel}
                        zet={(v) => zet({ verbeterpuntenTitel: v })}
                      />
                      <Tekst
                        label="Kop boven het slot"
                        waarde={data.slotTitel}
                        zet={(v) => zet({ slotTitel: v })}
                      />
                    </div>
                  </div>
                </Blok>
              </div>
            )}
          </div>
        </fieldset>
      </div>

      {/* ---------------- preview ---------------- */}
      <div className="lg:sticky lg:top-16 lg:h-[calc(100vh-5.5rem)]">
        <Preview rapportId={rapportId} data={data} vernieuwer={tik} />
      </div>

      {verstuurOpen && (
        <VerstuurDialoog
          rapportId={rapportId}
          data={data}
          standaardNaar={leadEmail}
          standaardKopie={standaardKopie}
          leadNaam={leadNaam}
          sluit={() => setVerstuurOpen(false)}
          klaar={() => {
            setVerstuurOpen(false);
            setStatus("verstuurd");
            setMelding("Rapport verstuurd");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
