import nodemailer from "nodemailer";
import { promises as dns } from "node:dns";

/**
 * Railway heeft geen uitgaande ipv6, maar smtp.gmail.com wijst wel naar een
 * ipv6-adres. Node pakt die dan als eerste en loopt vast op ENETUNREACH.
 * Daarom zoeken we het ipv4-adres zelf op. De oorspronkelijke naam geven we
 * mee als servername, anders klopt het certificaat niet meer.
 */
async function viaIpv4(
  host: string
): Promise<{ host: string; servername?: string }> {
  if (/^[\d.]+$/.test(host)) return { host };
  try {
    const adressen = await dns.resolve4(host);
    if (adressen.length) return { host: adressen[0], servername: host };
  } catch {
    /* lukt het opzoeken niet, dan proberen we het gewoon met de naam */
  }
  return { host };
}

export interface MailInput {
  naar: string;
  onderwerp: string;
  tekst: string;
  bijlage?: { naam: string; inhoud: Buffer; mime?: string };
  kopieNaar?: string;
}

async function transport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error(
      "SMTP_HOST, SMTP_USER of SMTP_PASS ontbreekt. Zonder die gegevens kan de app geen mail versturen."
    );
  }
  const port = Number(process.env.SMTP_PORT || 465);
  const adres = await viaIpv4(host);
  return nodemailer.createTransport({
    host: adres.host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: adres.servername ? { servername: adres.servername } : undefined,
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

  if (code === "ENETUNREACH" || /ENETUNREACH/.test(ruw)) {
    return new Error(
      `Kan ${host} niet bereiken. De server probeerde het over ipv6 en dat ` +
        "werkt daar niet. Dit hoort met de laatste versie opgelost te zijn, " +
        "dus staat deze melding er nog, laat het me dan weten."
    );
  }
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

/* ------------------------------------------------------------------ *
 * Resend
 *
 * Railway blokkeert uitgaand smtp, dus versturen we over gewoon https.
 * Staat RESEND_API_KEY ingevuld, dan gaat alles via Resend. Zo niet, dan
 * valt de app terug op smtp, zodat het lokaal ook blijft werken.
 * ------------------------------------------------------------------ */

function viaResend(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

async function resendVerstuur(
  input: MailInput,
  van: string
): Promise<string> {
  const lijf: Record<string, unknown> = {
    from: van,
    to: [input.naar],
    subject: input.onderwerp,
    text: input.tekst,
    html: naarHtml(input.tekst),
  };
  if (input.kopieNaar) lijf.cc = [input.kopieNaar];
  const antwoordNaar = process.env.MAIL_ANTWOORD_NAAR;
  if (antwoordNaar) lijf.reply_to = [antwoordNaar];
  if (process.env.MAIL_BLIND_KOPIE) lijf.bcc = [process.env.MAIL_BLIND_KOPIE];
  if (input.bijlage) {
    lijf.attachments = [
      {
        filename: input.bijlage.naam,
        content: input.bijlage.inhoud.toString("base64"),
      },
    ];
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lijf),
  });

  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    name?: string;
  };

  if (!res.ok) {
    const uitleg = json.message || `Resend gaf foutcode ${res.status}`;
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `Resend weigert de sleutel: ${uitleg}. Controleer RESEND_API_KEY.`
      );
    }
    if (/domain/i.test(uitleg)) {
      throw new Error(
        `${uitleg} Het afzenderadres in MAIL_VAN moet op een domein staan ` +
          "dat je bij Resend hebt geverifieerd."
      );
    }
    throw new Error(`Versturen mislukt: ${uitleg}`);
  }

  return json.id ?? "verstuurd";
}

/** Kijkt of we kunnen versturen, zonder dat er een rapport de deur uit gaat. */
export async function controleerMail(): Promise<{
  ok: boolean;
  via: string;
  afzender: string;
  bericht: string;
}> {
  const afzender = process.env.MAIL_VAN || "(MAIL_VAN niet ingesteld)";

  if (viaResend()) {
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          via: "resend",
          afzender,
          bericht: "Resend weigert de sleutel. Controleer RESEND_API_KEY.",
        };
      }
      if (!res.ok) {
        return {
          ok: false,
          via: "resend",
          afzender,
          bericht: `Resend antwoordde met foutcode ${res.status}.`,
        };
      }
      const json = (await res.json()) as {
        data?: { name: string; status: string }[];
      };
      const domeinen = json.data ?? [];
      const klaar = domeinen.filter((d) => d.status === "verified");
      return {
        ok: klaar.length > 0,
        via: "resend",
        afzender,
        bericht: klaar.length
          ? `Verbinding is goed. Geverifieerde domeinen: ${klaar
              .map((d) => d.name)
              .join(", ")}.`
          : "De sleutel werkt, maar er is nog geen geverifieerd domein. " +
            "Zet de dns-records bij rkresults.com en klik in Resend op Verify.",
      };
    } catch (e) {
      return {
        ok: false,
        via: "resend",
        afzender,
        bericht: e instanceof Error ? e.message : "Onbekende fout",
      };
    }
  }

  const via = `smtp ${process.env.SMTP_HOST ?? "?"}:${
    process.env.SMTP_PORT || "465"
  }`;
  try {
    await (await transport()).verify();
    return {
      ok: true,
      via,
      afzender,
      bericht: "Verbinding met de mailserver is goed.",
    };
  } catch (e) {
    return { ok: false, via, afzender, bericht: leesbareFout(e).message };
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

  if (viaResend()) return resendVerstuur(input, van);

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
    const info = await (await transport()).sendMail(bericht);
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
