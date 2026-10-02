"use client";

import { useState } from "react";
import type { RapportData } from "@/lib/report/types";
import { standaardOnderwerp, standaardTekst } from "@/lib/mailtekst";

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
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  async function versturen() {
    setBezig(true);
    setFout("");
    try {
      const res = await fetch(`/api/rapport/${rapportId}/versturen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naar, kopieNaar, onderwerp, tekst }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFout(json.fout || "Versturen lukte niet");
        return;
      }
      klaar();
    } catch {
      setFout("Versturen lukte niet");
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
            De pdf wordt als bijlage meegestuurd vanaf je eigen mailadres
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
          <button
            className="knop-goud"
            onClick={versturen}
            disabled={bezig || !naar.includes("@")}
          >
            {bezig ? "Versturen..." : "Versturen"}
          </button>
        </div>
      </div>
    </div>
  );
}
