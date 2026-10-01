import { NextResponse } from "next/server";
import { vraag, vraagEen } from "@/lib/db";
import { vereisGebruiker, vereisAdmin, foutAntwoord } from "@/lib/api";
import type { Lead } from "@/lib/rapporten";

export const dynamic = "force-dynamic";

const VELDEN = [
  "bedrijfsnaam",
  "plaats",
  "contactpersoon",
  "email",
  "telefoon",
  "website",
  "zoekterm",
  "bron",
  "status",
  "notitie",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await vereisGebruiker();
    const body = await req.json();
    const zetten: string[] = [];
    const waarden: unknown[] = [Number(params.id)];
    for (const veld of VELDEN) {
      if (veld in body) {
        waarden.push(String(body[veld] ?? ""));
        zetten.push(`${veld} = $${waarden.length}`);
      }
    }
    if (!zetten.length) return NextResponse.json({ ok: true });
    const lead = await vraagEen<Lead>(
      `update leads set ${zetten.join(", ")}, bijgewerkt = now() where id = $1 returning *`,
      waarden
    );
    return NextResponse.json({ lead });
  } catch (e) {
    return foutAntwoord(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await vereisAdmin();
    await vraag("delete from leads where id = $1", [Number(params.id)]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return foutAntwoord(e);
  }
}
