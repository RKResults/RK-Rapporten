import { vraagEen } from "@/lib/db";
import { vereisGebruiker, foutAntwoord, ApiFout } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await vereisGebruiker();
    const bestand = await vraagEen<{ mime: string; data: string }>(
      "select mime, data from bestanden where id = $1",
      [params.id]
    );
    if (!bestand) throw new ApiFout("Bestand niet gevonden", 404);
    return new Response(new Uint8Array(Buffer.from(bestand.data, "base64")), {
      headers: {
        "Content-Type": bestand.mime,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (e) {
    return foutAntwoord(e);
  }
}
