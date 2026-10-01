"use client";

import { useEffect, useRef, useState } from "react";
import type { RapportData } from "@/lib/report/types";

export default function Preview({
  rapportId,
  data,
  vernieuwer,
}: {
  rapportId: number;
  data: RapportData;
  /** verandert deze waarde, dan wordt de preview opnieuw opgehaald */
  vernieuwer: number;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [bezig, setBezig] = useState(true);
  const [fout, setFout] = useState("");
  const [paginas, setPaginas] = useState<number | null>(null);
  const vorigeUrl = useRef<string | null>(null);
  const teller = useRef(0);

  useEffect(() => {
    const dezeRonde = ++teller.current;
    const timer = setTimeout(async () => {
      setBezig(true);
      setFout("");
      try {
        const res = await fetch(`/api/rapport/${rapportId}/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.fout || "Preview maken lukte niet");
        }
        const aantal = res.headers.get("X-Paginas");
        const blob = await res.blob();
        if (dezeRonde !== teller.current) return;
        const nieuw = URL.createObjectURL(blob);
        if (vorigeUrl.current) URL.revokeObjectURL(vorigeUrl.current);
        vorigeUrl.current = nieuw;
        setPaginas(aantal ? Number(aantal) : null);
        setUrl(nieuw);
      } catch (e) {
        if (dezeRonde === teller.current) {
          setFout(e instanceof Error ? e.message : "Preview maken lukte niet");
        }
      } finally {
        if (dezeRonde === teller.current) setBezig(false);
      }
    }, 900);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vernieuwer, rapportId]);

  useEffect(() => {
    return () => {
      if (vorigeUrl.current) URL.revokeObjectURL(vorigeUrl.current);
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold uppercase tracking-wide">Preview</span>
        {paginas !== null && (
          <span className="chip bg-slate-200 text-slate-700">
            {paginas} pagina{paginas === 1 ? "" : "'s"}
          </span>
        )}
        {bezig && <span className="text-gold-dark">bijwerken...</span>}
        {fout && <span className="text-red-600">{fout}</span>}
        <div className="ml-auto flex gap-3">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-navy hover:underline"
            >
              In nieuw tabblad
            </a>
          )}
          <a
            href={`/api/rapport/${rapportId}/pdf`}
            className="font-semibold text-navy hover:underline"
          >
            PDF downloaden
          </a>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-lg border border-slate-300 bg-slate-200">
        {url ? (
          <iframe
            src={`${url}#toolbar=0&navpanes=0&view=FitH`}
            className="h-full w-full"
            title="Preview van het rapport"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            {fout ? "Preview niet beschikbaar" : "Preview wordt gemaakt..."}
          </div>
        )}
      </div>
    </div>
  );
}
