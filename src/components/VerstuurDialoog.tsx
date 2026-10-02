"use client";

import { useState } from "react";
import type { RapportData } from "@/lib/report/types";
import { standaardOnderwerp, standaardTekst } from "@/lib/mailtekst";

/**
 * Versturen gaat via Gmail in plaats van via de server, omdat Railway
 * uitgaande mail blokkeert. De app vult de hele mail voor en zet de pdf
 * klaar in de downloads. Daarna sleep je de pdf erin en klik je op
 * Verzenden. Terug in de app markeer je het rapport als verstuurd.
 */
export default function VerstuurDialoog({
  rapportId,
  data,
  standaardNaar,
  standaardKopie,
  leadNaam,
  sluit,
  klaar,
}: {
  rapportId: number;
  data: RapportData;
  standaardNaar: string;
  standaardKopie: string;
  leadNaam: string;
  sluit: () => void;
  klaar: () => void;
}) {
  const sjabloon = {
    bedrijfsnaam: data.bedrijfsnaam || leadNaam,
    aanhef: data.aanhef,
    zoekterm: data.zoekterm,
    positie: data.positie,
    ondertekening: data.ondertekening,
  };

  const [naar, setNaar] = useState(standaardNaar);
  const [kopieNaar, setKopieNaar] = useState(standaardKopie || "");
  const [onderwerp, setOnderwerp] = useState(standaardOnderwerp(sjabloon));
  const [tekst, setTekst] = useState(standaardTekst(sjabloon));
  const [geopend, setGeopend] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const pdfUrl = `/api/rapport/${rapportId}/pdf`;

  function gmailUrl() {
    const p = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: naar,
      su: onderwerp,
      body: tekst,
    });
    if (kopieNaar) p.set("cc", kopieNaar);
    return `https://mail.google.com/mail/?${p.toString()}`;
  }

  function openenInGmail() {
    /* de pdf halen we op met een gewone download, niet met een tweede
       venster, anders houdt de pop-upblokkering er een tegen */
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.open(gmailUrl(), "_blank", "noopener");
    setGeopend(true);
  }

  async function markeerVerstuurd() {
    setBezig(true);
    setFout("");
    try {
      const res = await fetch(`/api/rapport/${rapportId}/gemaild`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naar }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setFout(json.fout || "Opslaan lukte niet");
        return;
      }
      klaar();
    } catch {
      setFout("Opslaan lukte niet");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border-l-4 border-gold bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-bold text-navy">Rapport versturen</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            De mail gaat vanuit je eigen Gmail. De pdf wordt gedownload, die
            sleep je er zelf in.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Naar</label>
              <input
                type="email"
                className="invoer"
                value={naar}
                onChange={(e) => setNaar(e.target.value)}
                placeholder="naam@bedrijf.nl"
              />
            </div>
            <div>
              <label className="label">Kopie naar</label>
              <input
                type="email"
                className="invoer"
                value={kopieNaar}
                onChange={(e) => setKopieNaar(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Onderwerp</label>
            <input
              className="invoer"
              value={onderwerp}
              onChange={(e) => setOnderwerp(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Bericht</label>
            <textarea
              className="invoer leading-relaxed"
              rows={14}
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
            />
          </div>

          {geopend && (
            <div className="rounded-md border border-gold bg-gold-light px-4 py-3 text-sm text-navy">
              <p className="font-semibold">Gmail staat open in een nieuw tabblad</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Sleep de zojuist gedownloade pdf in de mail</li>
                <li>Klik in Gmail op Verzenden</li>
                <li>Kom hier terug en klik op Verstuurd</li>
              </ol>
              <p className="mt-2 text-xs text-slate-600">
                Geen pdf in je downloads?{" "}
                <a className="underline" href={pdfUrl} target="_blank" rel="noreferrer">
                  Opnieuw downloaden
                </a>
              </p>
            </div>
          )}

          {fout && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {fout}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button className="knop-rand" onClick={sluit} disabled={bezig}>
            Annuleren
          </button>
          {!geopend ? (
            <button
              className="knop-goud"
              onClick={openenInGmail}
              disabled={!naar.includes("@")}
            >
              Openen in Gmail
            </button>
          ) : (
            <button
              className="knop-goud"
              onClick={markeerVerstuurd}
              disabled={bezig}
            >
              {bezig ? "Bezig..." : "Verstuurd"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
