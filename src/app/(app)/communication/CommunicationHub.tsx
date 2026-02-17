"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hash,
  ChevronDown,
  ChevronRight,
  Plus,
  MessageCircle,
  Users,
  Pin,
  Info,
  Send,
  MoreVertical,
  Pencil,
  Trash2,
  Paperclip,
  X,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  uploadToWasabiOnly,
  confirmAttachment,
  getViewUrl,
  formatBytes as formatBytesMedia,
  type PendingAttachment,
} from "@/lib/media/upload";
import { playNotificationSound } from "@/lib/notificationSound";

type ChannelCategory = {
  id: string;
  name: string;
  slug: string;
  order: number;
  channels: (Channel & { unreadCount: number; lastActivityAt: Date })[];
};

type Channel = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  type: string;
  visibility: string;
  channelCategoryId: string | null;
  members: { lastReadAt: Date | null }[];
  _count: { messages: number; members: number };
  unreadCount?: number;
  lastActivityAt?: Date;
};

type User = { id: string; name: string | null; email: string };

type DMPreview = {
  id: string;
  otherUser: User | null;
  lastMessage: { content: string; createdAt: Date; senderName: string | null } | null;
  unreadCount: number;
};

export function CommunicationHub({
  channelCategories,
  users,
  currentUser,
  canCreateChannel,
  canManageChannelsAndCategories,
  isAdmin,
}: {
  channelCategories: ChannelCategory[];
  users: User[];
  currentUser: { id: string; name: string; email: string; role: string };
  canCreateChannel: boolean;
  canManageChannelsAndCategories: boolean;
  isAdmin: boolean;
}) {
  const [view, setView] = useState<"channel" | "dm">("channel");
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedDmId, setSelectedDmId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [rightPanel, setRightPanel] = useState<"info" | "members" | "pinned" | null>(null);
  const [dms, setDms] = useState<DMPreview[]>([]);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editingCategory, setEditingCategory] = useState<ChannelCategory | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/dms")
      .then((r) => r.json())
      .then((data) => setDms(Array.isArray(data) ? data : []))
      .catch(() => setDms([]));
  }, [selectedDmId]);

  const selectedChannel = channelCategories
    .flatMap((c) => c.channels)
    .find((ch) => ch.id === selectedChannelId);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  async function deleteChannel(channelId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this channel? All messages will be permanently removed.")) return;
    const res = await fetch(`/api/channels/${channelId}`, { method: "DELETE" });
    if (!res.ok) return;
    if (selectedChannelId === channelId) {
      setSelectedChannelId(null);
      setView("channel");
    }
    window.location.reload();
  }

  async function deleteCategory(cat: ChannelCategory, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (cat.id === "__uncategorized__") return;
    if (!confirm(`Delete the category "${cat.name}"? Channels inside will move to "Other".`)) return;
    const res = await fetch(`/api/channel-categories/${cat.id}`, { method: "DELETE" });
    if (!res.ok) return;
    router.refresh();
  }

  return (
    <div className="flex flex-1 min-h-0 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="p-3 border-b border-[var(--border)]">
          <h2 className="font-semibold text-white">Degener8</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--success)]" title="Online" />
            <span className="text-sm text-[var(--text-muted)] truncate">
              {currentUser.name || currentUser.email}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {channelCategories.map((cat) => (
            <div key={cat.id} className="mb-1">
              <div className="flex items-center gap-1 px-1 py-0.5 rounded group/cat">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="flex-1 flex items-center gap-1.5 px-2 py-1.5 text-left text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-white min-w-0 rounded"
                >
                  {expandedCategories[cat.id] !== false ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{cat.name}</span>
                </button>
                {canManageChannelsAndCategories && cat.id !== "__uncategorized__" && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingCategory(cat);
                      }}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--accent)] shrink-0"
                      title="Edit category"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => deleteCategory(cat, e)}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400 shrink-0"
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
              {expandedCategories[cat.id] !== false && (
                <div className="ml-1">
                  {cat.channels.map((ch) => (
                    <div
                      key={ch.id}
                      className="group/ch flex items-center gap-1 px-1 py-0.5 rounded hover:bg-[var(--bg-elevated)]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setView("channel");
                          setSelectedChannelId(ch.id);
                          setSelectedDmId(null);
                        }}
                        className={cn(
                          "flex-1 flex items-center gap-2 px-2 py-1.5 pl-5 text-sm text-left min-w-0 rounded",
                          selectedChannelId === ch.id && view === "channel"
                            ? "bg-[var(--accent-muted)] text-[var(--accent)] font-medium"
                            : "text-[var(--text-muted)] hover:text-white",
                          (ch.unreadCount ?? 0) > 0 && "font-semibold text-white"
                        )}
                      >
                        <Hash className="h-4 w-4 shrink-0 opacity-70" />
                        <span className="truncate flex-1">#{ch.name}</span>
                        {(ch.unreadCount ?? 0) > 0 && (
                          <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-xs text-white shrink-0">
                            {ch.unreadCount}
                          </span>
                        )}
                      </button>
                      {canManageChannelsAndCategories && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingChannel(ch);
                            }}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--accent)] shrink-0"
                            title="Edit channel"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => deleteChannel(ch.id, e)}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400 shrink-0"
                            title="Delete channel"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {canManageChannelsAndCategories && (
            <button
              type="button"
              onClick={() => setAddingCategory(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--bg-elevated)] w-full"
            >
              <Plus className="h-4 w-4" /> Add category
            </button>
          )}
          {canCreateChannel && (
            <Link
              href="/communication/new-channel"
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--bg-elevated)]"
            >
              <Plus className="h-4 w-4" /> Create Channel
            </Link>
          )}

          {editingCategory && (
            <EditCategoryModal
              category={editingCategory}
              onClose={() => setEditingCategory(null)}
              onSaved={() => {
                setEditingCategory(null);
                router.refresh();
              }}
            />
          )}
          {addingCategory && (
            <AddCategoryModal
              onClose={() => setAddingCategory(false)}
              onSaved={() => {
                setAddingCategory(false);
                router.refresh();
              }}
            />
          )}
          {editingChannel && (
            <EditChannelModal
              channel={editingChannel}
              categories={channelCategories.filter((c) => c.id !== "__uncategorized__")}
              onClose={() => setEditingChannel(null)}
              onSaved={() => {
                setEditingChannel(null);
                router.refresh();
              }}
            />
          )}

          <div className="mt-4 pt-2 border-t border-[var(--border)]">
            <p className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Direct Messages
            </p>
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/dms/find-or-create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ otherUserId: u.id }),
                  });
                  const data = await res.json();
                  if (data.id) {
                    setView("dm");
                    setSelectedDmId(data.id);
                    setSelectedChannelId(null);
                    setDms((prev) => {
                      const existing = prev.find((d) => d.id === data.id);
                      if (existing) return prev;
                      return [...prev, { id: data.id, otherUser: data.otherUser, lastMessage: null, unreadCount: 0 }];
                    });
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left",
                  selectedDmId && view === "dm" ? "bg-[var(--bg-elevated)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-white"
                )}
              >
                <MessageCircle className="h-4 w-4 shrink-0 opacity-70" />
                <span className="truncate flex-1">{u.name || u.email}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {view === "channel" && selectedChannel && (
          <ChannelChat
            channel={selectedChannel}
            currentUser={currentUser}
            isAnnouncementOnly={selectedChannel.type === "announcement" && !["Admin", "Manager"].includes(currentUser.role)}
            rightPanel={rightPanel}
            setRightPanel={setRightPanel}
            canManageChannel={canManageChannelsAndCategories}
            canAddMembers={canCreateChannel}
            workspaceUsers={users}
            onEditChannel={setEditingChannel}
            onChannelDeleted={() => {
              setSelectedChannelId(null);
              window.location.reload();
            }}
          />
        )}
        {view === "dm" && selectedDmId && (
          <DMChat dmId={selectedDmId} currentUser={currentUser} />
        )}
        {!selectedChannelId && view === "channel" && !selectedDmId && (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
            <p>Select a channel or start a direct message</p>
          </div>
        )}
      </main>
    </div>
  );
}

function AddMemberDropdown({
  users,
  channelId,
  onAdded,
}: {
  users: User[];
  channelId: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const addMember = async (userId: string) => {
    setAdding(userId);
    const res = await fetch(`/api/channels/${channelId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setAdding(null);
    if (res.ok) {
      onAdded();
      setOpen(false);
    }
  };
  return (
    <div className="relative mb-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
      >
        <Plus className="h-4 w-4" /> Add member
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] py-1 shadow-lg min-w-[180px] max-h-48 overflow-y-auto">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => addMember(u.id)}
              disabled={adding === u.id}
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[var(--border)] disabled:opacity-50"
            >
              {u.name || u.email}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditCategoryModal({
  category,
  onClose,
  onSaved,
}: {
  category: ChannelCategory;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/channel-categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update category");
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-3">Edit category</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-white text-sm"
              required
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddCategoryModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/channel-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to create category");
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-3">Add category</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering, Support"
              className="w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-white text-sm"
              required
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditChannelModal({
  channel,
  categories,
  onClose,
  onSaved,
}: {
  channel: Channel;
  categories: { id: string; name: string; slug: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description ?? "");
  const [channelCategoryId, setChannelCategoryId] = useState(channel.channelCategoryId ?? "");
  const [visibility, setVisibility] = useState(channel.visibility);
  const [type, setType] = useState(channel.type);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/channels/${channel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        channelCategoryId: channelCategoryId || null,
        visibility,
        type,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update channel");
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-3">Edit channel</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Category</label>
            <select
              value={channelCategoryId}
              onChange={(e) => setChannelCategoryId(e.target.value)}
              className="w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-white text-sm"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-white text-sm"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-white text-sm"
            >
              <option value="normal">Normal</option>
              <option value="announcement">Announcement</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChannelChat({
  channel,
  currentUser,
  isAnnouncementOnly,
  rightPanel,
  setRightPanel,
  canManageChannel,
  canAddMembers,
  workspaceUsers,
  onEditChannel,
  onChannelDeleted,
}: {
  channel: Channel & { unreadCount?: number; lastActivityAt?: Date };
  currentUser: { id: string; name: string; email: string; role: string };
  isAnnouncementOnly: boolean;
  rightPanel: string | null;
  setRightPanel: (v: "info" | "members" | "pinned" | null) => void;
  canManageChannel?: boolean;
  canAddMembers?: boolean;
  workspaceUsers?: User[];
  onEditChannel?: (channel: Channel) => void;
  onChannelDeleted?: () => void;
}) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [pinned, setPinned] = useState<MessageType[]>([]);
  const [channelDetail, setChannelDetail] = useState<{ members: { user: User }[]; lastActivityAt?: Date } | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  type MessageType = {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date | null;
    sender: User;
    pinned?: boolean;
    attachments?: { id: string; fileName: string; mimeType: string; sizeBytes: number }[];
  };

  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelOpenedAtRef = useRef<number>(0);
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());
  const CHAT_ACCEPT = "image/png,image/jpeg,image/webp,video/mp4,application/pdf";

  const refetchChannelDetail = () => {
    fetch(`/api/channels/${channel.id}`)
      .then((r) => r.json())
      .then((detail) => setChannelDetail(detail))
      .catch(() => {});
  };

  useEffect(() => {
    if (!channel.id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/channels/${channel.id}/messages`).then((r) => r.json()),
      fetch(`/api/channels/${channel.id}/pinned`).then((r) => r.json()),
      fetch(`/api/channels/${channel.id}`).then((r) => r.json()),
    ])
      .then(([msgs, pinnedList, detail]) => {
        setMessages(Array.isArray(msgs) ? msgs : []);
        setPinned(Array.isArray(pinnedList) ? pinnedList : []);
        setChannelDetail(detail);
        channelOpenedAtRef.current = Date.now();
        notifiedMessageIdsRef.current = new Set();
        return fetch(`/api/channels/${channel.id}/read`, { method: "POST" });
      })
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [channel.id]);

  useEffect(() => {
    if (!channel.id || !currentUser?.name) return;
    const interval = setInterval(() => {
      fetch(`/api/channels/${channel.id}/messages`)
        .then((r) => r.json())
        .then((msgs: MessageType[]) => {
          if (!Array.isArray(msgs)) return;
          const openedAt = channelOpenedAtRef.current;
          const notified = notifiedMessageIdsRef.current;
          const myName = (currentUser.name || "").trim();
          const myEmail = (currentUser.email || "").trim();
          for (const msg of msgs) {
            const createdAt = new Date(msg.createdAt).getTime();
            if (createdAt <= openedAt || notified.has(msg.id)) continue;
            const content = (msg.content || "").toLowerCase();
            const mentioned = (myName && content.includes("@" + myName.toLowerCase())) || (myEmail && content.includes("@" + myEmail.toLowerCase()));
            if (mentioned) {
              playNotificationSound();
              notified.add(msg.id);
            }
          }
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [channel.id, currentUser?.name, currentUser?.email]);

  useEffect(() => {
    if (!channel.id) return;
    const interval = setInterval(() => {
      fetch(`/api/channels/${channel.id}/messages`)
        .then((r) => r.json())
        .then((msgs: MessageType[]) => {
          if (!Array.isArray(msgs)) return;
          setMessages((prev) => {
            const pending = prev.filter((m) => String(m.id).startsWith("temp-"));
            const combined = [...msgs];
            for (const p of pending) {
              if (!combined.some((m) => m.id === p.id)) combined.push(p);
            }
            combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return combined;
          });
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [channel.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (isAnnouncementOnly) return;
    if (!input.trim() && pendingAttachments.length === 0) return;
    if (sendingMessage) return;
    setUploadError(null);
    setSendingMessage(true);
    const content = input.trim() || "(attachment)";
    try {
      const res = await fetch(`/api/channels/${channel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.error || `Failed to send (${res.status})`);
        return;
      }
      const msg = data;
      const confirmed: { id: string; fileName: string; mimeType: string; sizeBytes: number }[] = [];
      for (const p of pendingAttachments) {
        try {
          const m = await confirmAttachment(p, { type: "message", id: msg.id });
          confirmed.push(m);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Failed to attach file";
          setUploadError(errMsg);
        }
      }
      setMessages((prev) => [...prev, { ...msg, attachments: confirmed }]);
      setPendingAttachments([]);
      setInput("");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || isAnnouncementOnly) return;
    setUploadError(null);
    setUploadingFile(true);
    setUploadProgress(0);
    try {
      const pending = await uploadToWasabiOnly(file, (p) => setUploadProgress(p));
      setPendingAttachments((prev) => [...prev, pending]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadError(message);
    } finally {
      setUploadingFile(false);
      setUploadProgress(null);
    }
  };

  const groupByDay = (msgs: MessageType[]) => {
    const groups: { date: string; messages: MessageType[] }[] = [];
    let currentDate = "";
    msgs.forEach((m) => {
      const d = formatDate(m.createdAt);
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: d, messages: [] });
      }
      groups[groups.length - 1].messages.push(m);
    });
    return groups;
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="h-5 w-5 text-[var(--text-muted)] shrink-0" />
          <div className="min-w-0">
            <h1 className="font-semibold text-white truncate">#{channel.name}</h1>
            {channel.description && (
              <p className="text-xs text-[var(--text-muted)] truncate">{channel.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setRightPanel(rightPanel === "info" ? null : "info")}
            className="p-2 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
            title="Channel info"
          >
            <Info className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setRightPanel(rightPanel === "members" ? null : "members")}
            className="p-2 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
            title="Members"
          >
            <Users className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setRightPanel(rightPanel === "pinned" ? null : "pinned")}
            className="p-2 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
            title="Pinned"
          >
            <Pin className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Current topic / context */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-elevated)]/50">
        <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
          {channelDetail?.lastActivityAt && (
            <span>Last activity: {formatDateTime(channelDetail.lastActivityAt)}</span>
          )}
          {channelDetail?.members && (
            <span>{channelDetail.members.length} member{channelDetail.members.length !== 1 ? "s" : ""}</span>
          )}
          {pinned.length > 0 && (
            <span>{pinned.length} pinned message{pinned.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {loading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
            {!loading && messages.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">No activity yet. Start the conversation.</p>
            )}
            {!loading && groupByDay(messages).map((g) => (
              <div key={g.date}>
                <p className="text-xs text-[var(--text-muted)] sticky top-0 py-1 bg-[var(--bg-surface)]">
                  {g.date}
                </p>
                <div className="space-y-1 mt-1">
                  {g.messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      currentUserId={currentUser.id}
                      channelId={channel.id}
                      onEdit={() => {
                        setMessages((prev) =>
                          prev.map((msg) => (msg.id === m.id ? { ...msg, content: (m as { content?: string }).content ?? msg.content } : msg))
                        );
                      }}
                      onDelete={() => setMessages((prev) => prev.filter((msg) => msg.id !== m.id))}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {!isAnnouncementOnly && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="p-4 border-t border-[var(--border)]"
            >
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pendingAttachments.map((p, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] text-sm"
                    >
                      <Paperclip className="h-4 w-4" />
                      {p.fileName} ({formatBytesMedia(p.sizeBytes)})
                      <button
                        type="button"
                        onClick={() => setPendingAttachments((prev) => prev.filter((_, j) => j !== i))}
                        className="p-0.5 rounded hover:bg-[var(--accent)]/20"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {uploadError && (
                <p className="text-sm text-red-400 px-1 py-0.5">
                  {uploadError}
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="ml-2 underline"
                  >
                    Dismiss
                  </button>
                </p>
              )}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={CHAT_ACCEPT}
                  className="hidden"
                  onChange={handleAttachFile}
                  disabled={uploadingFile}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-white shrink-0"
                  title="Attach file"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                {uploadingFile && uploadProgress != null && (
                  <span className="text-sm text-[var(--text-muted)] self-center">
                    Uploading… {uploadProgress}%
                  </span>
                )}
                <MessageInputWithMentions
                  value={input}
                  onChange={setInput}
                  placeholder="Type a message… (use @ to mention)"
                  channelMembers={channelDetail?.members?.map((m) => m.user) ?? []}
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={(!input.trim() && pendingAttachments.length === 0) || uploadingFile || sendingMessage}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 shrink-0"
                >
                  {sendingMessage ? (
                    <span className="text-sm">Sending…</span>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>
          )}
          {isAnnouncementOnly && (
            <div className="p-4 border-t border-[var(--border)] text-sm text-[var(--text-muted)]">
              Only Admin and Manager can post in this channel.
            </div>
          )}
        </div>

        {rightPanel && (
          <aside className="w-64 flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-elevated)] p-3 overflow-y-auto">
            {rightPanel === "info" && (
              <div className="space-y-2">
                <h3 className="font-medium text-white">About</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {channel.description || "No description."}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {channel.type === "announcement" ? "Announcement channel" : channel.visibility}
                </p>
                {canManageChannel && onEditChannel && (
                  <button
                    type="button"
                    onClick={() => onEditChannel(channel)}
                    className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent-muted)]/30 rounded"
                  >
                    <Pencil className="h-4 w-4" /> Edit channel
                  </button>
                )}
                {canManageChannel && onChannelDeleted && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("Delete this channel? All messages will be permanently removed.")) return;
                      const res = await fetch(`/api/channels/${channel.id}`, { method: "DELETE" });
                      if (res.ok) onChannelDeleted();
                    }}
                    className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded"
                  >
                    <Trash2 className="h-4 w-4" /> Delete channel
                  </button>
                )}
              </div>
            )}
            {rightPanel === "members" && channelDetail?.members && (
              <div className="space-y-2">
                <h3 className="font-medium text-white">Members</h3>
                {canAddMembers && workspaceUsers && (() => {
                  const memberIds = new Set(channelDetail.members.map((m) => m.user.id));
                  const addable = workspaceUsers.filter((u) => !memberIds.has(u.id));
                  return addable.length > 0 ? (
                    <AddMemberDropdown
                      users={addable}
                      channelId={channel.id}
                      onAdded={refetchChannelDetail}
                    />
                  ) : null;
                })()}
                <ul className="space-y-1">
                  {channelDetail.members.map((m) => (
                    <li key={m.user.id} className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
                      {m.user.name || m.user.email}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rightPanel === "pinned" && (
              <div className="space-y-2">
                <h3 className="font-medium text-white">Pinned</h3>
                {pinned.length === 0 && (
                  <p className="text-sm text-[var(--text-muted)]">No pinned messages.</p>
                )}
                <ul className="space-y-2">
                  {pinned.map((m) => (
                    <li key={m.id} className="text-sm p-2 rounded bg-[var(--bg-surface)]">
                      <p className="text-white">{m.content}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {m.sender?.name || m.sender?.email} · {formatDateTime(m.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}
      </div>
    </>
  );
}

function MessageInputWithMentions({
  value,
  onChange,
  placeholder,
  channelMembers,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  channelMembers: User[];
  disabled: boolean;
}) {
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const lastAtIndex = value.lastIndexOf("@");
  const query =
    lastAtIndex >= 0
      ? value.slice(lastAtIndex + 1).split(/\s/)[0] ?? ""
      : "";
  const filtered =
    query === ""
      ? channelMembers
      : channelMembers.filter((u) => {
          const name = (u.name || u.email || "").toLowerCase();
          return name.includes(query.toLowerCase());
        });

  useEffect(() => {
    setMentionOpen(lastAtIndex >= 0 && filtered.length > 0);
    setMentionIndex(0);
  }, [lastAtIndex, query, filtered.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mentionOpen || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && mentionOpen) {
      e.preventDefault();
      const user = filtered[mentionIndex];
      if (user) {
        const displayName = user.name || user.email || "?";
        const endOfWord = value.indexOf(" ", lastAtIndex) >= 0 ? value.indexOf(" ", lastAtIndex) : value.length;
        const newValue = value.slice(0, lastAtIndex) + "@" + displayName + " " + value.slice(endOfWord).trimStart();
        onChange(newValue);
        setMentionOpen(false);
      }
    } else if (e.key === "Escape") {
      setMentionOpen(false);
    }
  };

  const selectMention = (user: User) => {
    const displayName = user.name || user.email || "?";
    const endOfWord = value.indexOf(" ", lastAtIndex) >= 0 ? value.indexOf(" ", lastAtIndex) : value.length;
    const newValue = value.slice(0, lastAtIndex) + "@" + displayName + " " + value.slice(endOfWord).trimStart();
    onChange(newValue);
    setMentionOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex-1 relative min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setMentionOpen(false), 150)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white placeholder:text-gray-500 text-sm"
      />
      {mentionOpen && filtered.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] py-1 shadow-lg max-h-40 overflow-y-auto z-10">
          {filtered.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onClick={() => selectMention(u)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-[var(--border)]",
                i === mentionIndex ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "text-white"
              )}
            >
              {u.name || u.email}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  currentUserId,
  channelId,
  onEdit,
  onDelete,
}: {
  message: {
    id: string;
    content: string;
    createdAt: Date;
    sender: User;
    attachments?: { id: string; fileName: string; mimeType: string; sizeBytes: number }[];
  };
  currentUserId: string;
  channelId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const isOwn = message.sender.id === currentUserId;
  const attachments = message.attachments ?? [];

  const openAttachment = async (id: string) => {
    setOpeningId(id);
    try {
      const url = await getViewUrl(id);
      window.open(url, "_blank");
    } finally {
      setOpeningId(null);
    }
  };

  const handleSaveEdit = async () => {
    const res = await fetch(`/api/messages/${message.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    if (res.ok) {
      setEditing(false);
      onEdit();
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/messages/${message.id}`, { method: "DELETE" });
    if (res.ok) onDelete();
    setShowMenu(false);
  };

  const handlePin = async () => {
    await fetch(`/api/channels/${channelId}/pinned`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: message.id }),
    });
    setShowMenu(false);
  };

  return (
    <div className="group flex gap-2 py-1">
      <div className="h-8 w-8 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-sm font-medium text-[var(--accent)] shrink-0">
        {(message.sender.name || message.sender.email || "?").slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-white">
            {message.sender.name || message.sender.email}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {formatDateTime(message.createdAt)}
          </span>
        </div>
        {editing ? (
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-1 text-sm text-white"
              autoFocus
            />
            <button type="button" onClick={handleSaveEdit} className="text-sm text-[var(--accent)]">
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-[var(--text-muted)]">
              Cancel
            </button>
          </div>
        ) : (
          <div className="relative">
            <p className="text-sm text-[var(--text-muted)] mt-0.5 whitespace-pre-wrap break-words">
              {message.content.split(/(@[^\s@]+)/g).map((part, i) =>
                part.startsWith("@") ? (
                  <span key={i} className="text-[var(--accent)] font-medium bg-[var(--accent-muted)]/50 px-1 rounded">
                    {part}
                  </span>
                ) : (
                  part
                )
              )}
            </p>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm"
                  >
                    <Paperclip className="h-4 w-4 text-[var(--text-muted)]" />
                    <span className="text-white truncate max-w-[120px]">{a.fileName}</span>
                    <span className="text-xs text-[var(--text-muted)]">{formatBytesMedia(a.sizeBytes)}</span>
                    <button
                      type="button"
                      onClick={() => openAttachment(a.id)}
                      disabled={openingId === a.id}
                      className="text-[var(--accent)] hover:underline text-xs shrink-0"
                    >
                      {openingId === a.id ? "…" : "Open"}
                    </button>
                  </span>
                ))}
              </div>
            )}
            {isOwn && (
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] py-1 z-10 min-w-[120px]">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-white hover:bg-[var(--border)]"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={handlePin}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-white hover:bg-[var(--border)]"
                    >
                      <Pin className="h-4 w-4" /> Pin
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-red-400 hover:bg-[var(--border)]"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DMChat({
  dmId,
  currentUser,
}: {
  dmId: string;
  currentUser: { id: string; name: string; email: string };
}) {
  const [dm, setDm] = useState<{
    otherUser: User | null;
    messages: { id: string; content: string; createdAt: Date; sender: User | null }[];
  } | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/dms/${dmId}`)
      .then((r) => r.json())
      .then(setDm)
      .catch(() => setDm(null));
  }, [dmId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dm?.messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const res = await fetch(`/api/dms/${dmId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim() }),
    });
    if (!res.ok) return;
    const msg = await res.json();
    setDm((prev) =>
      prev ? { ...prev, messages: [...prev.messages, msg] } : { otherUser: null, messages: [msg] }
    );
    setInput("");
  };

  if (!dm) return <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">Loading…</div>;

  const other = dm.otherUser;

  return (
    <>
      <header className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2">
        <MessageCircle className="h-5 w-5 text-[var(--text-muted)]" />
        <h1 className="font-semibold text-white">{other?.name || other?.email || "Direct message"}</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {dm.messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex gap-2 py-1",
              m.sender?.id === currentUser.id ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-lg px-3 py-2",
                m.sender?.id === currentUser.id
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              )}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
              <p className="text-xs opacity-70 mt-1">{formatDateTime(m.createdAt)}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="p-4 border-t border-[var(--border)]"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white placeholder:text-gray-500 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </>
  );
}
