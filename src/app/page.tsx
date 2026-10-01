import { redirect } from "next/navigation";
import { huidigeGebruiker } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const gebruiker = await huidigeGebruiker();
  redirect(gebruiker ? "/leads" : "/login");
}
