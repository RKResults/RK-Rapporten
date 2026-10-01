"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Balk({
  naam,
  rol,
  terug,
}: {
  naam: string;
  rol: string;
  terug?: { href: string; label: string };
}) {
  const router = useRouter();

  async function uitloggen() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b-4 border-gold bg-navy">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-5">
        <Link href="/leads" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">
            RK Results
          </span>
          <span className="hidden text-sm text-gold sm:inline">Rapporten</span>
        </Link>

        {terug && (
          <Link
            href={terug.href}
            className="rounded-md px-2.5 py-1 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            ← {terug.label}
          </Link>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-slate-300 sm:inline">
            {naam}
            {rol === "admin" && <span className="ml-1 text-gold">•</span>}
          </span>
          <button
            onClick={uitloggen}
            className="rounded-md px-2.5 py-1 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Uitloggen
          </button>
        </div>
      </div>
    </header>
  );
}
