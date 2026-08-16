"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  const router = useRouter();

  async function handleSubmit(values: Record<string, string>): Promise<string | null> {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        return data?.error ?? `Registration failed (${res.status} ${res.statusText}).`;
      }

      const signInResult = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (signInResult?.error) return "Account created! Please log in.";
      window.location.href = "/chat";
      return null;
    } catch (err: any) {
      return err?.message ?? "Network error during registration. Please check your connection.";
    }
  }

  return (
    <AuthForm
      title="Create your account"
      subtitle="Bring your own Groq key, get your own space."
      submitLabel="Sign up"
      fields={[
        { name: "name", label: "Name", type: "text", autoComplete: "name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
      ]}
      onSubmit={handleSubmit}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-amber hover:underline">
            Log in
          </Link>
        </>
      }
    />
  );
}
