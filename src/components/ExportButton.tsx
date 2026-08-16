"use client";

interface Props {
  sessionId: string;
  title: string;
}

export default function ExportButton({ sessionId, title }: Props) {
  async function handleExport() {
    const res = await fetch(`/api/sessions/${sessionId}/export`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="text-xs text-ash hover:text-amber"
      title="Export session as Markdown"
    >
      Export
    </button>
  );
}
