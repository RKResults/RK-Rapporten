"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [fout, setFout] = useState("");
  const [bezig, setBezig] = useState(false);

  async function versturen(e: React.FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFout("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, wachtwoord }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFout(json.fout || "Inloggen lukte niet");
        return;
      }
      router.push("/leads");
      router.refresh();
    } catch {
      setFout("Er ging iets mis, probeer het nog eens");
    } finally {
      setBezig(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-white">RK Results</h1>
          <p className="mt-1 text-sm text-gold">Rapporten</p>
        </div>

        <form
          onSubmit={versturen}
          className="rounded-lg border-l-4 border-gold bg-white p-6 shadow-xl"
        >
          <label className="label">E-mailadres</label>
          <input
            type="email"
            className="invoer"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <label className="label mt-4">Wachtwoord</label>
          <input
            type="password"
            className="invoer"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            autoComplete="current-password"
            required
          />

          {fout && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {fout}
            </p>
          )}

          <button
            type="submit"
            disabled={bezig}
            className="knop-primair mt-5 w-full"
          >
            {bezig ? "Bezig..." : "Inloggen"}
          </button>
        </form>
      </div>
    </main>
  );
}
