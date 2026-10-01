import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _rkPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var _rkSchema: Promise<void> | undefined;
}

function maakPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL ontbreekt. Zet die in je omgevingsvariabelen (Railway doet dit zelf als je een Postgres koppelt)."
    );
  }
  const lokaal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");
  return new Pool({
    connectionString,
    ssl: lokaal ? undefined : { rejectUnauthorized: false },
    max: 5,
  });
}

export function pool(): Pool {
  if (!global._rkPool) global._rkPool = maakPool();
  return global._rkPool;
}

const SCHEMA = `
create table if not exists gebruikers (
  id serial primary key,
  email text unique not null,
  naam text not null,
  wachtwoord_hash text not null,
  rol text not null default 'editor',
  aangemaakt timestamptz not null default now()
);

create table if not exists leads (
  id serial primary key,
  bedrijfsnaam text not null,
  plaats text not null default '',
  contactpersoon text not null default '',
  email text not null default '',
  telefoon text not null default '',
  website text not null default '',
  zoekterm text not null default '',
  bron text not null default '',
  status text not null default 'nieuw',
  notitie text not null default '',
  aangemaakt timestamptz not null default now(),
  bijgewerkt timestamptz not null default now()
);

create table if not exists rapporten (
  id serial primary key,
  lead_id integer not null references leads(id) on delete cascade,
  status text not null default 'concept',
  data jsonb not null,
  aangemaakt timestamptz not null default now(),
  bijgewerkt timestamptz not null default now(),
  goedgekeurd_op timestamptz,
  verstuurd_op timestamptz,
  verstuurd_naar text
);

create table if not exists bestanden (
  id text primary key,
  rapport_id integer references rapporten(id) on delete cascade,
  mime text not null,
  naam text not null,
  data text not null,
  aangemaakt timestamptz not null default now()
);

create index if not exists leads_status_idx on leads(status);
create index if not exists rapporten_lead_idx on rapporten(lead_id);
`;

export async function zorgVoorSchema(): Promise<void> {
  if (!global._rkSchema) {
    global._rkSchema = pool()
      .query(SCHEMA)
      .then(() => undefined)
      .catch((e) => {
        global._rkSchema = undefined;
        throw e;
      });
  }
  return global._rkSchema;
}

export async function vraag<T = any>(
  tekst: string,
  waarden: unknown[] = []
): Promise<T[]> {
  await zorgVoorSchema();
  const res = await pool().query(tekst, waarden as any[]);
  return res.rows as T[];
}

export async function vraagEen<T = any>(
  tekst: string,
  waarden: unknown[] = []
): Promise<T | null> {
  const rijen = await vraag<T>(tekst, waarden);
  return rijen[0] ?? null;
}
