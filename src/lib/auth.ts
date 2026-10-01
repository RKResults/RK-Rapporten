import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { vraagEen } from "./db";

const COOKIE = "rk_sessie";
const DAGEN = 30;

export interface Gebruiker {
  id: number;
  email: string;
  naam: string;
  rol: "admin" | "editor";
}

function sleutel(): Uint8Array {
  const geheim = process.env.SESSION_SECRET;
  if (!geheim || geheim.length < 16) {
    throw new Error(
      "SESSION_SECRET ontbreekt of is te kort. Zet een willekeurige string van minstens 32 tekens."
    );
  }
  return new TextEncoder().encode(geheim);
}

export async function hashWachtwoord(wachtwoord: string): Promise<string> {
  return bcrypt.hash(wachtwoord, 10);
}

export async function maakSessie(gebruiker: Gebruiker): Promise<void> {
  const token = await new SignJWT({
    id: gebruiker.id,
    email: gebruiker.email,
    naam: gebruiker.naam,
    rol: gebruiker.rol,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DAGEN}d`)
    .sign(sleutel());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DAGEN * 24 * 60 * 60,
  });
}

export function wisSessie(): void {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
}

export async function huidigeGebruiker(): Promise<Gebruiker | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sleutel());
    return {
      id: Number(payload.id),
      email: String(payload.email),
      naam: String(payload.naam),
      rol: payload.rol === "admin" ? "admin" : "editor",
    };
  } catch {
    return null;
  }
}

export async function controleerLogin(
  email: string,
  wachtwoord: string
): Promise<Gebruiker | null> {
  const rij = await vraagEen<{
    id: number;
    email: string;
    naam: string;
    rol: string;
    wachtwoord_hash: string;
  }>("select * from gebruikers where lower(email) = lower($1)", [email.trim()]);
  if (!rij) return null;
  const klopt = await bcrypt.compare(wachtwoord, rij.wachtwoord_hash);
  if (!klopt) return null;
  return {
    id: rij.id,
    email: rij.email,
    naam: rij.naam,
    rol: rij.rol === "admin" ? "admin" : "editor",
  };
}

/** Maakt bij een lege database de accounts uit de omgevingsvariabelen aan. */
export async function zorgVoorStartAccounts(): Promise<void> {
  const aantal = await vraagEen<{ n: string }>(
    "select count(*)::text as n from gebruikers"
  );
  if (aantal && Number(aantal.n) > 0) return;

  const accounts = [
    {
      email: process.env.ADMIN_EMAIL,
      naam: process.env.ADMIN_NAAM || "Kishan",
      wachtwoord: process.env.ADMIN_WACHTWOORD,
      rol: "admin",
    },
    {
      email: process.env.EDITOR_EMAIL,
      naam: process.env.EDITOR_NAAM || "Dylan",
      wachtwoord: process.env.EDITOR_WACHTWOORD,
      rol: "editor",
    },
  ];

  for (const a of accounts) {
    if (!a.email || !a.wachtwoord) continue;
    const hash = await hashWachtwoord(a.wachtwoord);
    await vraagEen(
      `insert into gebruikers (email, naam, wachtwoord_hash, rol)
       values ($1, $2, $3, $4)
       on conflict (email) do nothing`,
      [a.email.trim().toLowerCase(), a.naam, hash, a.rol]
    );
  }
}
