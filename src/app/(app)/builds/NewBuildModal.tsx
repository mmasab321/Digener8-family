"use client";

import { useState, useEffect } from "react";

type BuildType = "YOUTUBE" | "SAAS";
type User = { id: string; name: string | null; email: string };

export function NewBuildModal({
  defaultType,
  onClose,
  onCreated,
}: {
  defaultType: BuildType;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<BuildType>(defaultType);
  const [status, setStatus] = useState("PLANNING");
  const [priority, setPriority] = useState("MEDIUM");
  const [ownerId, setOwnerId] = useState("");
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [youtubeUploadTarget, setYoutubeUploadTarget] = useState("");
  const [youtubeVideosThisMonth, setYoutubeVideosThisMonth] = useState(0);
  const [saasStage, setSaasStage] = useState("");

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/users/list")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    setType(defaultType);
  }, [defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    const progressNum = Math.min(100, Math.max(0, Number(progress)));
    setLoading(true);
    const res = await fetch("/api/builds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        type,
        status,
        priority,
        ownerId: ownerId || null,
        progress: progressNum,
        startDate: startDate || null,
        targetDate: targetDate || null,
        youtubeUploadTarget: type === "YOUTUBE" ? (youtubeUploadTarget.trim() || null) : null,
        youtubeVideosThisMonth: type === "YOUTUBE" ? youtubeVideosThisMonth : null,
        saasStage: type === "SAAS" ? (saasStage || null) : null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to create build");
      return;
    }
    onCreated();
  };

  const inputClass = "w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]";
  const labelClass = "block text-xs font-medium text-[var(--text-muted)] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">New Build</h2>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${step === 1 ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-surface)] text-[var(--text-muted)]"}`}
          >
            Step 1: Basics
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${step === 2 ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-surface)] text-[var(--text-muted)]"}`}
          >
            Step 2: Type-specific
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value as BuildType)} className={inputClass}>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="SAAS">SaaS</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Owner</label>
                  <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inputClass}>
                    <option value="">None</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Progress (0–100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Target date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {type === "YOUTUBE" && (
                <>
                  <div>
                    <label className={labelClass}>Upload target</label>
                    <input
                      type="text"
                      value={youtubeUploadTarget}
                      onChange={(e) => setYoutubeUploadTarget(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 2 long/week"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Videos this month</label>
                    <input
                      type="number"
                      min={0}
                      value={youtubeVideosThisMonth}
                      onChange={(e) => setYoutubeVideosThisMonth(Number(e.target.value) || 0)}
                      className={inputClass}
                    />
                  </div>
                </>
              )}
              {type === "SAAS" && (
                <div>
                  <label className={labelClass}>Stage</label>
                  <select value={saasStage} onChange={(e) => setSaasStage(e.target.value)} className={inputClass}>
                    <option value="">None</option>
                    <option value="IDEA">Idea</option>
                    <option value="BUILDING">Building</option>
                    <option value="BETA">Beta</option>
                    <option value="LIVE">Live</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
            >
              Cancel
            </button>
            {step === 1 ? (
              <button type="submit" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]">
                Next: Type-specific
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create Build"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
