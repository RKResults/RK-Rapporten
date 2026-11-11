"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vrij tekstveld per lead. Slaat vanzelf op, een seconde nadat je stopt
 * met typen. Staat los van de notitie die uit Instantly meekomt, zodat
 * een volgende binnenkomende lead jullie eigen tekst niet overschrijft.
 */
export default function Opmerkingen({
  leadId,
  begin,
}: {
  leadId: number;
  begin: string;
}) {
  const [tekst, setTekst] = useState(begin);
  const [staat, setStaat] = useState<"rust" | "bezig" | "klaar" | "fout">(
    "rust"
  );
  const eerste = useRef(true);

  useEffect(() => {
    if (eerste.current) {
      eerste.current = false;
      return;
    }
    setStaat("bezig");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/leads/${leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opmerkingen: tekst }),
        });
        setStaat(res.ok ? "klaar" : "fout");
      } catch {
        setStaat("fout");
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [tekst, leadId]);

  return (
    <div className="mt-4">
      <div className="mb-1 flex items-center gap-2">
        <label className="label mb-0">Opmerkingen</label>
        <span className="text-xs text-slate-400">
          {staat === "bezig"
            ? "opslaan..."
            : staat === "klaar"
              ? "opgeslagen"
              : staat === "fout"
                ? "opslaan lukte niet"
                : "alleen voor jullie, komt niet in het rapport"}
        </span>
      </div>
      <textarea
        className="invoer leading-relaxed"
        rows={4}
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        placeholder="Gebeld op 12 nov, wil terugkoppeling na overleg met compagnon"
      />
    </div>
  );
}
