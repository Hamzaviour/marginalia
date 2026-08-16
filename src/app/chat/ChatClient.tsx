"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar, { SessionSummary } from "@/components/Sidebar";
import ChatBubble, { ChatMessageData } from "@/components/ChatBubble";
import ChatInput from "@/components/ChatInput";
import ExportButton from "@/components/ExportButton";
import OnboardingTooltip from "@/components/OnboardingTooltip";
import { DEFAULT_PROVIDER, type ProviderId } from "@/lib/providers";

const API_KEY_STORAGE_PREFIX = "marginalia-api-key:";
const PROVIDER_STORAGE_KEY = "marginalia-provider";

export default function ChatClient() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [provider, setProvider] = useState<ProviderId>(DEFAULT_PROVIDER);
  const [apiKey, setApiKey] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PROVIDER_STORAGE_KEY);
      if (saved) setProvider(saved as ProviderId);
      setApiKey(localStorage.getItem(`${API_KEY_STORAGE_PREFIX}${provider}`) ?? "");
    }
    void loadSessions();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleProviderChange(newProvider: ProviderId) {
    setProvider(newProvider);
    localStorage.setItem(PROVIDER_STORAGE_KEY, newProvider);
    setApiKey(localStorage.getItem(`${API_KEY_STORAGE_PREFIX}${newProvider}`) ?? "");
  }

  function handleApiKeyChange(key: string) {
    setApiKey(key);
    localStorage.setItem(`${API_KEY_STORAGE_PREFIX}${provider}`, key);
  }

  async function loadSessions() {
    const res = await fetch("/api/sessions");
    if (!res.ok) return;
    const data = await res.json();
    setSessions(data.sessions);
    if (data.sessions.length > 0 && !activeSessionId) {
      void selectSession(data.sessions[0].id);
    }
  }

  const selectSession = useCallback(async (id: string) => {
    setActiveSessionId(id);
    setError(null);
    const res = await fetch(`/api/sessions/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(
      data.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations,
      }))
    );
  }, []);

  async function createSession() {
    const res = await fetch("/api/sessions", { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setSessions((prev) => [{ id: data.session.id, title: data.session.title, updatedAt: data.session.updatedAt }, ...prev]);
    setActiveSessionId(data.session.id);
    setMessages([]);
    setError(null);
  }

  async function sendMessage(text: string, retryMessageId?: string) {
    setError(null);
    setRetrying(false);

    if (!apiKey.trim()) {
      setError(`Add your ${provider} API key in the sidebar before sending a message.`);
      return;
    }

    let sessionId = activeSessionId;
    if (!sessionId) {
      const res = await fetch("/api/sessions", { method: "POST" });
      const data = await res.json();
      sessionId = data.session.id;
      setActiveSessionId(sessionId);
      setSessions((prev) => [{ id: data.session.id, title: data.session.title, updatedAt: data.session.updatedAt }, ...prev]);
    }

    const userMessage: ChatMessageData = { id: `local-user-${Date.now()}`, role: "user", content: text };
    const assistantTempId = `local-assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantTempId, role: "assistant", content: "", streaming: true },
    ]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text, provider, apiKey }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantTempId));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: any;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          if (event.type === "citations") {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantTempId ? { ...m, citations: event.citations } : m))
            );
          } else if (event.type === "delta") {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantTempId ? { ...m, content: m.content + event.text } : m))
            );
          } else if (event.type === "error") {
            setError(event.error);
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantTempId ? { ...m, streaming: false } : m))
            );
          } else if (event.type === "done") {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantTempId ? { ...m, id: event.messageId, streaming: false } : m))
            );
            void loadSessions();
          }
        }
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setSending(false);
      setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
    }
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <>
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={selectSession}
        onNewSession={createSession}
        provider={provider}
        onProviderChange={handleProviderChange}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
      />

      <div className="flex h-full flex-1 flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg text-paper">{activeSession?.title ?? "Marginalia"}</h1>
          {activeSessionId && <ExportButton sessionId={activeSessionId} title={activeSession?.title ?? "session"} />}
        </div>

        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto pr-2">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-ash">
              <p className="font-display text-2xl text-paper">What are you researching?</p>
              <p className="max-w-md text-sm">
                Ask a question and Marginalia will search arXiv, then answer with the sources cited inline.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-glow-rose/30 bg-glow-rose/10 px-4 py-2 text-sm text-glow-rose">
            <span>{error}</span>
            {!sending && (
              <button
                onClick={() => sendMessage(messages[messages.length - 1]?.content ?? "", error)}
                className="ml-auto rounded border border-glow-rose/50 px-2 py-0.5 text-xs hover:bg-glow-rose/20"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <ChatInput onSend={sendMessage} disabled={sending} />
      </div>

      <OnboardingTooltip />
    </>
  );
}
