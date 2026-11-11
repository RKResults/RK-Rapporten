import { NextResponse } from "next/server";
import { vraag, zorgVoorSchema } from "@/lib/db";
import { vereisAdmin, foutAntwoord } from "@/lib/api";
import { slaRapportOp, type Rapport } from "@/lib/rapporten";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Eenmalige opschoning: rapporten die al in de app stonden hebben hun eigen
 * teksten opgeslagen en die zeggen nog "top 3". Hier zetten we die om naar
 * "top 5". Verstuurde rapporten laten we met rust, dat is verzonden post.
 *
 * Open /api/onderhoud/top5 om te zien wat er zou veranderen.
 * Open /api/onderhoud/top5?doen=1 om het echt op te slaan.
 */

function herschrijf(waarde: unknown): unknown {
  if (typeof waarde === "string") {
    return waarde
      .replace(/top 3/g, "top 5")
      .replace(/Top 3/g, "Top 5")
      .replace(/de eerste drie/g, "de eerste vijf")
      .replace(
        /niet in de top 5 voor/g,
        "niet in de top 5 (gemeten in Google Maps) voor"
      );
  }
  if (Array.isArray(waarde)) return waarde.map(herschrijf);
  if (waarde && typeof waarde === "object") {
    const uit: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(waarde)) uit[k] = herschrijf(v);
    return uit;
  }
  return waarde;
}

/** Vult de concurrententabel aan tot vijf rijen. Bestaande rijen blijven staan. */
function vulAanTotVijf(data: Record<string, unknown>): Record<string, unknown> {
  const rijen = Array.isArray(data.concurrenten) ? [...data.concurrenten] : [];
  if (rijen.length >= 5) return data;
  const uit = [...rijen];
  for (let i = rijen.length; i < 5; i++) {
    uit.push({ naam: `${i + 1}. `, reviews: "", score: "", extra: "" });
  }
  return { ...data, concurrenten: uit };
}

export async function GET(req: Request) {
  try {
    await vereisAdmin();
    await zorgVoorSchema();

    const doen = new URL(req.url).searchParams.get("doen") === "1";

    const rapporten = await vraag<Rapport>(
      "select * from rapporten where status <> 'verstuurd' order by id"
    );

    const gewijzigd: { id: number; velden: string[] }[] = [];

    for (const r of rapporten) {
      const oud = r.data as unknown as Record<string, unknown>;
      const nieuw = vulAanTotVijf(
        herschrijf(oud) as Record<string, unknown>
      );

      const velden = Object.keys(oud).filter(
        (k) => JSON.stringify(oud[k]) !== JSON.stringify(nieuw[k])
      );
      if (!velden.length) continue;

      gewijzigd.push({ id: r.id, velden });
      if (doen) await slaRapportOp(r.id, nieuw as never);
    }

    return NextResponse.json({
      ok: true,
      opgeslagen: doen,
      bekeken: rapporten.length,
      aangepast: gewijzigd.length,
      rapporten: gewijzigd,
      volgende: doen
        ? "Klaar. Je kunt deze pagina nu vergeten."
        : "Er is nog niets opgeslagen. Zet ?doen=1 achter het adres om het door te voeren.",
    });
  } catch (e) {
    return foutAntwoord(e);
  }
}
