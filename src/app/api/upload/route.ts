import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { vraag } from "@/lib/db";
import { vereisGebruiker, foutAntwoord, ApiFout } from "@/lib/api";

export const dynamic = "force-dynamic";

const MAX = 8 * 1024 * 1024;
const TOEGESTAAN = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: Request) {
  try {
    await vereisGebruiker();
    const form = await req.formData();
    const bestand = form.get("bestand");
    const rapportId = Number(form.get("rapportId") || 0) || null;

    if (!(bestand instanceof File)) {
      throw new ApiFout("Geen bestand meegestuurd");
    }
    if (!TOEGESTAAN.includes(bestand.type)) {
      throw new ApiFout("Alleen png, jpg of webp");
    }
    if (bestand.size > MAX) {
      throw new ApiFout("De afbeelding mag maximaal 8 MB zijn");
    }

    const buf = Buffer.from(await bestand.arrayBuffer());
    const id = crypto.randomUUID();
    await vraag(
      "insert into bestanden (id, rapport_id, mime, naam, data) values ($1,$2,$3,$4,$5)",
      [id, rapportId, bestand.type, bestand.name || "afbeelding", buf.toString("base64")]
    );

    return NextResponse.json({ url: `/api/bestand/${id}`, id });
  } catch (e) {
    return foutAntwoord(e);
  }
}
