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
  });
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
  const info = await transport().sendMail({
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
  });
  return info.messageId;
}

export {
  standaardOnderwerp,
  standaardTekst,
  type MailTemplateInput,
} from "./mailtekst";
