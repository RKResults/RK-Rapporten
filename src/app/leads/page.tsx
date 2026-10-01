import { redirect } from "next/navigation";
import { huidigeGebruiker, zorgVoorStartAccounts } from "@/lib/auth";
import { haalLeads } from "@/lib/rapporten";
import { vraag } from "@/lib/db";
import Balk from "@/components/Balk";
import Leadlijst from "@/components/Leadlijst";

export const dynamic = "force-dynamic";

export default async function LeadsPagina() {
  const gebruiker = await huidigeGebruiker();
  if (!gebruiker) redirect("/login");
  await zorgVoorStartAccounts();

  const leads = await haalLeads();
  const rapporten = await vraag<{ lead_id: number; id: number; status: string }>(
    "select distinct on (lead_id) lead_id, id, status from rapporten order by lead_id, id desc"
  );
  const perLead = Object.fromEntries(
    rapporten.map((r) => [r.lead_id, { id: r.id, status: r.status }])
  );

  return (
    <>
      <Balk naam={gebruiker.naam} rol={gebruiker.rol} />
      <main className="mx-auto max-w-[1600px] px-5 py-7">
        <Leadlijst
          leads={leads}
          rapporten={perLead}
          rol={gebruiker.rol}
        />
      </main>
    </>
  );
}
