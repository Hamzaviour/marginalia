"use client";

import { FormEvent, ReactNode, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import GlassButton from "./GlassButton";
import GlowBackground from "./GlowBackground";

interface Field {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
}

interface AuthFormProps {
  title: string;
  subtitle: string;
  fields: Field[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<string | null>;
  footer: ReactNode;
}

export default function AuthForm({ title, subtitle, fields, submitLabel, onSubmit, footer }: AuthFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await onSubmit(values);
    setLoading(false);
    if (result) setError(result);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <GlowBackground />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-panel w-full max-w-sm rounded-2xl border border-amber/15 p-8"
      >
        <p className="font-display text-2xl text-amber">Marginalia</p>
        <h1 className="mt-4 font-display text-xl text-paper">{title}</h1>
        <p className="mt-1 text-sm text-ash">{subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <label htmlFor={f.name} className="text-xs uppercase tracking-wide text-ash">
                {f.label}
              </label>
              <input
                id={f.name}
                name={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                required
                value={values[f.name] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                className="w-full rounded-lg border border-amber/15 bg-ink/60 px-3 py-2.5 text-sm text-paper placeholder:text-ash focus:border-amber/50"
              />
            </div>
          ))}

          {error && (
            <p role="alert" className="text-sm text-glow-rose">
              {error}
            </p>
          )}

          <GlassButton type="submit" variant="amber" disabled={loading} className="w-full">
            {loading ? "Please wait…" : submitLabel}
          </GlassButton>
        </form>

        <div className="mt-6 text-center text-sm text-ash">{footer}</div>
      </motion.div>
    </main>
  );
}
