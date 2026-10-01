import { NextResponse } from "next/server";
import { vraag } from "@/lib/db";
import { vereisAdmin, foutAntwoord, ApiFout } from "@/lib/api";
import {
  haalRapport,
  haalLead,
  rapportHtml,
  pdfBestandsnaam,
} from "@/lib/rapporten";
import { htmlNaarPdf } from "@/lib/pdf";
import { verstuurMail, standaardOnderwerp, standaardTekst } from "@/lib/mail";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await vereisAdmin();
    const rapport = await haalRapport(Number(params.id));
    if (!rapport) throw new ApiFout("Rapport niet gevonden", 404);
    if (rapport.status === "verstuurd") {
      throw new ApiFout("Dit rapport is al verstuurd", 409);
    }

    const lead = await haalLead(rapport.lead_id);
    const body = await req.json().catch(() => ({}));

    const naar = String(body.naar || lead?.email || "").trim();
    if (!naar || !naar.includes("@")) {
      throw new ApiFout("Vul een geldig e-mailadres in om naar te versturen");
    }

    const sjabloon = {
      bedrijfsnaam: rapport.data.bedrijfsnaam,
      aanhef: rapport.data.aanhef,
      zoekterm: rapport.data.zoekterm,
      positie: rapport.data.positie,
      ondertekening: rapport.data.ondertekening,
    };

    const onderwerp = String(body.onderwerp || standaardOnderwerp(sjabloon));
    const tekst = String(body.tekst || standaardTekst(sjabloon));

    const pdf = await htmlNaarPdf(await rapportHtml(rapport.data));

    await verstuurMail({
      naar,
      onderwerp,
      tekst,
      kopieNaar: body.kopieNaar ? String(body.kopieNaar) : undefined,
      bijlage: {
        naam: pdfBestandsnaam(rapport.data),
        inhoud: pdf,
        mime: "application/pdf",
      },
    });

    await vraag(
      `update rapporten set status = 'verstuurd', verstuurd_op = now(),
         verstuurd_naar = $2, bijgewerkt = now() where id = $1`,
      [rapport.id, naar]
    );
    await vraag(
      "update leads set status = 'verstuurd', bijgewerkt = now() where id = $1",
      [rapport.lead_id]
    );

    return NextResponse.json({ ok: true, naar });
  } catch (e) {
    return foutAntwoord(e);
  }
}
