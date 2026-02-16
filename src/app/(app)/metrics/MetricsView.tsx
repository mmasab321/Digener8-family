"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Archive,
} from "lucide-react";

type Metric = {
  id: string;
  name: string;
  valueType: string;
  frequency: string;
  targetValue: number | null;
  category: { name: string; slug: string } | null;
  entries: { id: string; value: number; periodStart: Date }[];
};

type Category = { id: string; name: string; slug: string };

export function MetricsView({
  metrics,
  categories,
  isAdmin,
}: {
  metrics: Metric[];
  categories: Category[];
  isAdmin: boolean;
}) {
  const [filterCategory, setFilterCategory] = useState("");
  const [addingEntry, setAddingEntry] = useState<string | null>(null);
  const [entryValue, setEntryValue] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = filterCategory
    ? metrics.filter((m) => m.category?.slug === filterCategory)
    : metrics;

  function formatValue(m: Metric, value: number): string {
    if (m.valueType === "Currency") return `$${value.toLocaleString()}`;
    if (m.valueType === "Percentage") return `${value}%`;
    return String(value);
  }

  async function submitEntry(metricId: string) {
    const v = Number(entryValue);
    if (Number.isNaN(v)) return;
    const res = await fetch(`/api/metrics/${metricId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: v }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Failed");
      return;
    }
    setAddingEntry(null);
    setEntryValue("");
    window.location.reload();
  }

  async function archiveMetric(id: string) {
    if (!confirm("Archive this metric? It will be hidden from the list.")) return;
    await fetch(`/api/metrics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    window.location.reload();
  }

  const latest = (m: Metric) => m.entries[0];
  const previous = (m: Metric) => m.entries[1];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-1.5 text-sm text-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            <Plus className="h-4 w-4" /> Add metric
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <MetricForm
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            window.location.reload();
          }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((m) => {
          const curr = latest(m);
          const prev = previous(m);
          const trend =
            curr && prev
              ? curr.value > prev.value
                ? "up"
                : curr.value < prev.value
                  ? "down"
                  : "same"
              : null;

          return (
            <div
              key={m.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
                    {m.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {m.category?.name ?? "—"} · {m.frequency}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => archiveMetric(m.id)}
                      className="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                      title="Archive"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {curr ? formatValue(m, curr.value) : "—"}
                </span>
                {trend && (
                  <span className="flex items-center text-sm">
                    {trend === "up" && <TrendingUp className="h-4 w-4 text-[var(--success)]" />}
                    {trend === "down" && <TrendingDown className="h-4 w-4 text-[var(--danger)]" />}
                    {trend === "same" && <Minus className="h-4 w-4 text-[var(--text-muted)]" />}
                  </span>
                )}
              </div>

              {m.targetValue != null && curr && (
                <p
                  className={cn(
                    "text-sm mt-1",
                    curr.value >= m.targetValue ? "text-[var(--success)]" : "text-[var(--danger)]"
                  )}
                >
                  Target: {formatValue(m, m.targetValue)}
                  {curr.value >= m.targetValue ? " ✓" : ""}
                </p>
              )}

              {addingEntry === m.id ? (
                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    value={entryValue}
                    onChange={(e) => setEntryValue(e.target.value)}
                    placeholder="Value"
                    className="flex-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => submitEntry(m.id)}
                    className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm text-white"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingEntry(null)}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-muted)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingEntry(m.id)}
                  className="mt-3 text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Log entry
                </button>
              )}

              {m.entries.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Recent</p>
                  <div className="space-y-0.5 max-h-24 overflow-y-auto">
                    {m.entries.slice(0, 5).map((e) => (
                      <div
                        key={e.id}
                        className="flex justify-between text-xs text-[var(--text-muted)]"
                      >
                        <span>{formatDate(e.periodStart)}</span>
                        <span className="text-white">{formatValue(m, e.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-[var(--text-muted)] py-8 text-center">
          No metrics yet. {isAdmin && "Add a metric above."}
        </p>
      )}
    </div>
  );
}

function MetricForm({
  categories,
  onClose,
  onSaved,
}: {
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    valueType: "Number",
    frequency: "Weekly",
    targetValue: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        categoryId: form.categoryId || null,
        targetValue: form.targetValue === "" ? null : Number(form.targetValue),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Failed");
      return;
    }
    onSaved();
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-4"
    >
      <h3 className="font-semibold text-white">New metric</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">Value type</label>
          <select
            value={form.valueType}
            onChange={(e) => setForm((f) => ({ ...f, valueType: e.target.value }))}
            className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          >
            <option value="Number">Number</option>
            <option value="Percentage">Percentage</option>
            <option value="Currency">Currency</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">Frequency</label>
          <select
            value={form.frequency}
            onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
            className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">Target (optional)</label>
          <input
            type="number"
            step="any"
            value={form.targetValue}
            onChange={(e) => setForm((f) => ({ ...f, targetValue: e.target.value }))}
            className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)]">
          Cancel
        </button>
      </div>
    </form>
  );
}
