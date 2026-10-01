"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LEAD_STATUS_LABEL,
  type Lead,
  type LeadStatus,
} from "@/lib/statussen";

const KLEUR: Record<LeadStatus, string> = {
  nieuw: "bg-slate-200 text-slate-700",
  in_behandeling: "bg-blue-100 text-blue-800",
  wacht_op_akkoord: "bg-gold text-navy",
  verstuurd: "bg-emerald-100 text-emerald-800",
  gereageerd: "bg-violet-100 text-violet-800",
  klant: "bg-navy text-white",
  afgehaakt: "bg-slate-100 text-slate-500",
};

const STATUSSEN = Object.keys(LEAD_STATUS_LABEL) as LeadStatus[];

export default function Leadlijst({
  leads,
  rapporten,
  rol,
}: {
  leads: Lead[];
  rapporten: Record<number, { id: number; status: string }>;
  rol: string;
}) {
  const router = useRouter();
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState<LeadStatus | "alle">("alle");
  const [nieuwOpen, setNieuwOpen] = useState(false);
  const [verwijderId, setVerwijderId] = useState<number | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [nieuw, setNieuw] = useState({
    bedrijfsnaam: "",
    plaats: "",
    contactpersoon: "",
    email: "",
    website: "",
    zoekterm: "",
  });

  const zichtbaar = useMemo(() => {
    const t = zoek.trim().toLowerCase();
    return leads.filter((l) => {
      if (filter !== "alle" && l.status !== filter) return false;
      if (!t) return true;
      return [l.bedrijfsnaam, l.plaats, l.contactpersoon, l.email, l.zoekterm]
        .join(" ")
        .toLowerCase()
        .includes(t);
    });
  }, [leads, zoek, filter]);

  const tellers = useMemo(() => {
    const t: Record<string, number> = {};
    for (const l of leads) t[l.status] = (t[l.status] ?? 0) + 1;
    return t;
  }, [leads]);

  async function maakLead(e: React.FormEvent) {
    e.preventDefault();
    if (!nieuw.bedrijfsnaam.trim()) return;
    setBezig(true);
    setFout("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nieuw),
      });
      const json = await res.json();
      if (!res.ok) {
        setFout(json.fout || "Opslaan lukte niet");
        return;
      }
      router.push(`/rapport/${json.rapportId}`);
    } finally {
      setBezig(false);
    }
  }

  async function verwijderLead(id: number) {
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setFout(json.fout || "Verwijderen lukte niet");
    }
    setVerwijderId(null);
    router.refresh();
  }

  async function wijzigStatus(id: number, status: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-navy">Leads</h1>
        <span className="text-sm text-slate-500">
          {leads.length} totaal
          {tellers.wacht_op_akkoord
            ? `, ${tellers.wacht_op_akkoord} wacht op akkoord`
            : ""}
        </span>
        <div className="ml-auto flex gap-2">
          <input
            placeholder="Zoeken..."
            className="invoer w-48"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
          />
          <button
            className="knop-goud whitespace-nowrap"
            onClick={() => setNieuwOpen(true)}
          >
            + Nieuwe lead
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("alle")}
          className={`chip border ${
            filter === "alle"
              ? "border-navy bg-navy text-white"
              : "border-slate-300 bg-white text-slate-600"
          }`}
        >
          Alle
        </button>
        {STATUSSEN.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`chip border ${
              filter === s
                ? "border-navy bg-navy text-white"
                : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            {LEAD_STATUS_LABEL[s]}
            {tellers[s] ? ` (${tellers[s]})` : ""}
          </button>
        ))}
      </div>

      {fout && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {fout}
        </p>
      )}

      <div className="kaart overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy text-left text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3">Bedrijf</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Zoekterm</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Rapport</th>
            </tr>
          </thead>
          <tbody>
            {zichtbaar.map((l) => (
              <tr
                key={l.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-navy">{l.bedrijfsnaam}</div>
                  {l.plaats && (
                    <div className="text-xs text-slate-500">{l.plaats}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>{l.contactpersoon || "–"}</div>
                  {l.email && (
                    <div className="text-xs text-slate-500">{l.email}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {l.zoekterm || "–"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={l.status}
                    onChange={(e) => wijzigStatus(l.id, e.target.value)}
                    className={`chip cursor-pointer border-0 ${
                      KLEUR[l.status] ?? "bg-slate-200"
                    }`}
                  >
                    {STATUSSEN.map((s) => (
                      <option key={s} value={s}>
                        {LEAD_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  {verwijderId === l.id ? (
                    <span className="inline-flex items-center gap-2 text-xs">
                      <span className="text-slate-600">Zeker weten?</span>
                      <button
                        onClick={() => verwijderLead(l.id)}
                        className="font-semibold text-red-600 hover:underline"
                      >
                        Ja, verwijderen
                      </button>
                      <button
                        onClick={() => setVerwijderId(null)}
                        className="text-slate-500 hover:underline"
                      >
                        Nee
                      </button>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-3">
                      {rapporten[l.id] ? (
                        <a
                          href={`/rapport/${rapporten[l.id].id}`}
                          className="font-semibold text-navy underline-offset-2 hover:underline"
                        >
                          Openen
                        </a>
                      ) : (
                        <span className="text-slate-400">–</span>
                      )}
                      {rol === "admin" && (
                        <button
                          onClick={() => setVerwijderId(l.id)}
                          title="Lead en rapport verwijderen"
                          className="text-slate-300 transition hover:text-red-600"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!zichtbaar.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Nog niets om te laten zien
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {nieuwOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy/60 p-4">
          <form
            onSubmit={maakLead}
            className="w-full max-w-lg rounded-lg border-l-4 border-gold bg-white p-6 shadow-2xl"
          >
            <h2 className="mb-4 text-lg font-bold text-navy">Nieuwe lead</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Bedrijfsnaam</label>
                <input
                  className="invoer"
                  autoFocus
                  value={nieuw.bedrijfsnaam}
                  onChange={(e) =>
                    setNieuw({ ...nieuw, bedrijfsnaam: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Plaats</label>
                <input
                  className="invoer"
                  value={nieuw.plaats}
                  onChange={(e) =>
                    setNieuw({ ...nieuw, plaats: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Zoekterm</label>
                <input
                  className="invoer"
                  placeholder="hovenier Sneek"
                  value={nieuw.zoekterm}
                  onChange={(e) =>
                    setNieuw({ ...nieuw, zoekterm: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Contactpersoon</label>
                <input
                  className="invoer"
                  placeholder="de heer J. Jansen"
                  value={nieuw.contactpersoon}
                  onChange={(e) =>
                    setNieuw({ ...nieuw, contactpersoon: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">E-mailadres</label>
                <input
                  type="email"
                  className="invoer"
                  value={nieuw.email}
                  onChange={(e) => setNieuw({ ...nieuw, email: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Website</label>
                <input
                  className="invoer"
                  value={nieuw.website}
                  onChange={(e) =>
                    setNieuw({ ...nieuw, website: e.target.value })
                  }
                />
              </div>
            </div>

            {fout && (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {fout}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="knop-rand"
                onClick={() => setNieuwOpen(false)}
              >
                Annuleren
              </button>
              <button type="submit" disabled={bezig} className="knop-primair">
                {bezig ? "Bezig..." : "Aanmaken en rapport openen"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
