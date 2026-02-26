"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

type LinkRow = { id: string; label: string; url: string };

type BriefData = {
  id: string;
  briefText: string | null;
  links: { id: string; label: string | null; url: string }[];
};

export function EditBriefModal({
  clientId,
  initialBrief,
  onClose,
  onSaved,
}: {
  clientId: string;
  initialBrief: BriefData | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [briefText, setBriefText] = useState(initialBrief?.briefText ?? "");
  const [links, setLinks] = useState<LinkRow[]>(
    (initialBrief?.links ?? []).map((l) => ({
      id: l.id,
      label: l.label ?? "",
      url: l.url,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBriefText(initialBrief?.briefText ?? "");
    setLinks(
      (initialBrief?.links ?? []).map((l) => ({
        id: l.id,
        label: l.label ?? "",
        url: l.url,
      }))
    );
  }, [initialBrief]);

  const addLink = () =>
    setLinks((prev) => [...prev, { id: crypto.randomUUID(), label: "", url: "" }]);
  const removeLink = (id: string) => setLinks((prev) => prev.filter((l) => l.id !== id));
  const updateLink = (id: string, field: "label" | "url", value: string) =>
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/brief`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        briefText: briefText.trim() || null,
        links: links.filter((l) => l.url.trim()).map((l) => ({ label: l.label.trim() || null, url: l.url.trim() })),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update brief");
      return;
    }
    onSaved();
  };

  const labelClass = "block text-xs font-medium text-[var(--text-muted)] mb-1";
  const inputClass =
    "w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">Edit Brief & Creatives</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Brief</label>
            <textarea
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              rows={5}
              className={inputClass}
              placeholder="Client brief, goals, references..."
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Reference links</label>
              <button
                type="button"
                onClick={addLink}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add link
              </button>
            </div>
            {links.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No links added.</p>
            ) : (
              <div className="space-y-2">
                {links.map((l) => (
                  <div key={l.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={l.label}
                      onChange={(e) => updateLink(l.id, "label", e.target.value)}
                      className="flex-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]"
                      placeholder="Label"
                    />
                    <input
                      type="url"
                      value={l.url}
                      onChange={(e) => updateLink(l.id, "url", e.target.value)}
                      className="flex-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(l.id)}
                      className="p-2 rounded text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
