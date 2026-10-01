import { NextResponse } from "next/server";
import { controleerLogin, maakSessie, zorgVoorStartAccounts } from "@/lib/auth";
import { zorgVoorSchema } from "@/lib/db";
import { foutAntwoord } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await zorgVoorSchema();
    await zorgVoorStartAccounts();
    const { email, wachtwoord } = await req.json();
    if (!email || !wachtwoord) {
      return NextResponse.json(
        { fout: "Vul je e-mailadres en wachtwoord in" },
        { status: 400 }
      );
    }
    const gebruiker = await controleerLogin(String(email), String(wachtwoord));
    if (!gebruiker) {
      return NextResponse.json(
        { fout: "E-mailadres of wachtwoord klopt niet" },
        { status: 401 }
      );
    }
    await maakSessie(gebruiker);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return foutAntwoord(e);
  }
}
