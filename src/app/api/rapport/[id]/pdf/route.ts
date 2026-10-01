import { vereisGebruiker, foutAntwoord, ApiFout } from "@/lib/api";
import { haalRapport, rapportHtml, pdfBestandsnaam } from "@/lib/rapporten";
import { htmlNaarPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await vereisGebruiker();
    const rapport = await haalRapport(Number(params.id));
    if (!rapport) throw new ApiFout("Rapport niet gevonden", 404);

    const pdf = await htmlNaarPdf(await rapportHtml(rapport.data));
    const naam = pdfBestandsnaam(rapport.data);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${naam}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return foutAntwoord(e);
  }
}
