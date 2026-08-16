import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChatClient from "./ChatClient";
import GlowBackground from "@/components/GlowBackground";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <main className="flex h-screen w-full overflow-hidden">
      <GlowBackground />
      <ChatClient />
    </main>
  );
}
