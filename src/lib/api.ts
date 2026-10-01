import { NextResponse } from "next/server";
import { huidigeGebruiker, type Gebruiker } from "./auth";

export class ApiFout extends Error {
  status: number;
  constructor(bericht: string, status = 400) {
    super(bericht);
    this.status = status;
  }
}

export async function vereisGebruiker(): Promise<Gebruiker> {
  const gebruiker = await huidigeGebruiker();
  if (!gebruiker) throw new ApiFout("Niet ingelogd", 401);
  return gebruiker;
}

export async function vereisAdmin(): Promise<Gebruiker> {
  const gebruiker = await vereisGebruiker();
  if (gebruiker.rol !== "admin") {
    throw new ApiFout("Alleen Kishan mag dit doen", 403);
  }
  return gebruiker;
}

export function foutAntwoord(e: unknown): NextResponse {
  if (e instanceof ApiFout) {
    return NextResponse.json({ fout: e.message }, { status: e.status });
  }
  const bericht = e instanceof Error ? e.message : "Onbekende fout";
  console.error(e);
  return NextResponse.json({ fout: bericht }, { status: 500 });
}
