import { vereisGebruiker, foutAntwoord, ApiFout } from "@/lib/api";
import { haalRapport, rapportHtml } from "@/lib/rapporten";
import { htmlNaarPdf, telPaginas } from "@/lib/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Rendert de meegestuurde (nog niet opgeslagen) gegevens naar pdf, zodat de
 * preview in de editor exact hetzelfde is als wat de klant krijgt.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await vereisGebruiker();
    const rapport = await haalRapport(Number(params.id));
    if (!rapport) throw new ApiFout("Rapport niet gevonden", 404);

    const body = await req.json().catch(() => ({}));
    const data = body?.data ?? rapport.data;
    const html = await rapportHtml(data);
    const pdf = await htmlNaarPdf(html);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
        "X-Paginas": String(telPaginas(pdf)),
      },
    });
  } catch (e) {
    return foutAntwoord(e);
  }
}
