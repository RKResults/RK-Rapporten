import nodemailer from "nodemailer";

export interface MailInput {
  naar: string;
  onderwerp: string;
  tekst: string;
  bijlage?: { naam: string; inhoud: Buffer; mime?: string };
  kopieNaar?: string;
}

function transport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error(
      "SMTP_HOST, SMTP_USER of SMTP_PASS ontbreekt. Zonder die gegevens kan de app geen mail versturen."
    );
  }
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    /* zonder deze grenzen blijft hij eindeloos hangen als de poort dicht is */
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });
}

/** Maakt van een technische smtp-fout een zin waar je iets mee kunt. */
function leesbareFout(e: unknown): Error {
  const code = (e as { code?: string })?.code ?? "";
  const ruw = e instanceof Error ? e.message : String(e);
  const host = process.env.SMTP_HOST ?? "de mailserver";
  const port = process.env.SMTP_PORT || "465";

  if (code === "ETIMEDOUT" || code === "ESOCKET" || code === "ECONNECTION") {
    return new Error(
      `Geen verbinding met ${host} op poort ${port}. Waarschijnlijk blokkeert ` +
        `de server uitgaande mail op die poort. Probeer SMTP_PORT op 587 te ` +
        `zetten. Werkt dat ook niet, dan moeten we overstappen op een ` +
        `mailkoppeling via de api in plaats van smtp.`
    );
  }
  if (code === "EAUTH") {
    return new Error(
      "Gmail weigert de inloggegevens. Gebruik een app-wachtwoord bij " +
        "SMTP_PASS, niet je gewone wachtwoord."
    );
  }
  if (code === "EENVELOPE") {
    return new Error(`Een van de e-mailadressen klopt niet: ${ruw}`);
  }
  return new Error(`Versturen mislukt: ${ruw}`);
}

/** Kijkt alleen of we de mailserver kunnen bereiken en of het wachtwoord klopt. */
export async function controleerMail(): Promise<{
  ok: boolean;
  host: string;
  poort: string;
  bericht: string;
}> {
  const host = process.env.SMTP_HOST ?? "(niet ingesteld)";
  const poort = process.env.SMTP_PORT || "465";
  try {
    await transport().verify();
    return { ok: true, host, poort, bericht: "Verbinding met de mailserver is goed." };
  } catch (e) {
    return { ok: false, host, poort, bericht: leesbareFout(e).message };
  }
}

/** Zet platte tekst met lege regels om naar eenvoudige html. */
function naarHtml(tekst: string): string {
  const esc = tekst
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const alineas = esc
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="font-family:Calibri,Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.5;color:#1F2937">${alineas}</div>`;
}

export async function verstuurMail(input: MailInput): Promise<string> {
  const van =
    process.env.MAIL_VAN || `RK Results <${process.env.SMTP_USER ?? ""}>`;
  const bericht = {
    from: van,
    to: input.naar,
    cc: input.kopieNaar || undefined,
    replyTo: process.env.MAIL_ANTWOORD_NAAR || undefined,
    subject: input.onderwerp,
    text: input.tekst,
    html: naarHtml(input.tekst),
    attachments: input.bijlage
      ? [
          {
            filename: input.bijlage.naam,
            content: input.bijlage.inhoud,
            contentType: input.bijlage.mime || "application/pdf",
          },
        ]
      : [],
  };

  try {
    const info = await transport().sendMail(bericht);
    return info.messageId;
  } catch (e) {
    console.error("smtp", e);
    throw leesbareFout(e);
  }
}

export {
  standaardOnderwerp,
  standaardTekst,
  type MailTemplateInput,
} from "./mailtekst";
