"use client";

import { useEffect, useRef } from "react";

export function Tekst({
  label,
  waarde,
  zet,
  placeholder,
  hint,
  breed,
}: {
  label: string;
  waarde: string;
  zet: (v: string) => void;
  placeholder?: string;
  hint?: string;
  breed?: boolean;
}) {
  return (
    <div className={breed ? "col-span-2" : ""}>
      <label className="label">{label}</label>
      <input
        className="invoer"
        value={waarde ?? ""}
        placeholder={placeholder}
        onChange={(e) => zet(e.target.value)}
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Gebied({
  label,
  waarde,
  zet,
  placeholder,
  hint,
  rijen = 3,
}: {
  label?: string;
  waarde: string;
  zet: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rijen?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, rijen * 22)}px`;
  }, [waarde, rijen]);

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea
        ref={ref}
        className="invoer resize-none leading-relaxed"
        rows={rijen}
        value={waarde ?? ""}
        placeholder={placeholder}
        onChange={(e) => zet(e.target.value)}
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Blok({
  titel,
  beschrijving,
  children,
  rechts,
}: {
  titel: string;
  beschrijving?: string;
  children: React.ReactNode;
  rechts?: React.ReactNode;
}) {
  return (
    <section className="kaart border-l-4 border-l-gold p-5">
      <div className="mb-4 flex items-start gap-3">
        <div>
          <h2 className="font-bold text-navy">{titel}</h2>
          {beschrijving && (
            <p className="mt-0.5 text-xs text-slate-500">{beschrijving}</p>
          )}
        </div>
        {rechts && <div className="ml-auto">{rechts}</div>}
      </div>
      {children}
    </section>
  );
}
