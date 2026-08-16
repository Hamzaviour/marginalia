"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  const router = useRouter();

  async function handleSubmit(values: Record<string, string>): Promise<string | null> {
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) return "Incorrect email or password.";
    window.location.href = "/chat";
    return null;
  }

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Log in to pick up your research threads."
      submitLabel="Log in"
      fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
      ]}
      onSubmit={handleSubmit}
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="text-amber hover:underline">
            Create an account
          </Link>
        </>
      }
    />
  );
}
