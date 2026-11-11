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
  kop = true,
  rijen = 4,
  onBewaard,
}: {
  leadId: number;
  begin: string;
  kop?: boolean;
  rijen?: number;
  onBewaard?: (tekst: string) => void;
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
        if (res.ok) onBewaard?.(tekst);
      } catch {
        setStaat("fout");
      }
    }, 1000);
    return () => clearTimeout(t);
    // onBewaard bewust niet in de lijst, anders loopt hij elke render opnieuw
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tekst, leadId]);

  return (
    <div className={kop ? "mt-4" : ""}>
      <div className="mb-1 flex items-center gap-2">
        {kop && <label className="label mb-0">Opmerkingen</label>}
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
        rows={rijen}
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        placeholder="Gebeld op 12 nov, wil terugkoppeling na overleg met compagnon"
      />
    </div>
  );
}
