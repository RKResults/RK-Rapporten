import { redirect, notFound } from "next/navigation";
import { huidigeGebruiker } from "@/lib/auth";
import { haalRapport, haalLead } from "@/lib/rapporten";
import Balk from "@/components/Balk";
import Editor from "@/components/Editor";

export const dynamic = "force-dynamic";

export default async function RapportPagina({
  params,
}: {
  params: { id: string };
}) {
  const gebruiker = await huidigeGebruiker();
  if (!gebruiker) redirect("/login");

  const rapport = await haalRapport(Number(params.id));
  if (!rapport) notFound();
  const lead = await haalLead(rapport.lead_id);

  return (
    <>
      <Balk
        naam={gebruiker.naam}
        rol={gebruiker.rol}
        terug={{ href: "/leads", label: "Leads" }}
      />
      <Editor
        rapportId={rapport.id}
        beginData={rapport.data}
        beginStatus={rapport.status}
        rol={gebruiker.rol}
        leadEmail={lead?.email ?? ""}
        leadNaam={lead?.bedrijfsnaam ?? ""}
      />
    </>
  );
}
