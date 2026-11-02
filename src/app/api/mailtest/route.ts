import { NextResponse } from "next/server";
import { vereisAdmin, foutAntwoord } from "@/lib/api";
import { controleerMail } from "@/lib/mail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Normaal verstuur je vanuit Gmail en mailt de server zelf niet. Deze pagina
 * is dan ook alleen nog nuttig als je later Resend of smtp aanzet.
 */
export async function GET() {
  try {
    await vereisAdmin();

    const serverMailt =
      Boolean(process.env.RESEND_API_KEY) || Boolean(process.env.SMTP_PASS);

    if (!serverMailt) {
      return NextResponse.json({
        ok: true,
        via: "gmail",
        bericht:
          "Versturen gaat via je eigen Gmail. De server mailt zelf niet, " +
          "dus hier valt niets te testen.",
      });
    }

    const uitslag = await controleerMail();
    return NextResponse.json(
      {
        ...uitslag,
        let_op:
          "De app verstuurt op dit moment via Gmail. Deze uitslag telt pas " +
          "mee als je in de app weer automatisch wilt versturen.",
      },
      { status: uitslag.ok ? 200 : 503 }
    );
  } catch (e) {
    return foutAntwoord(e);
  }
}
