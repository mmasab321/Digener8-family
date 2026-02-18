"use client";

import { useEffect, useRef } from "react";
import { playNotificationSound } from "@/lib/notificationSound";

const POLL_MS = 3000;

/** Polls for channel @mentions/thread replies and DM unread; plays sound site-wide. */
export function NotificationSounds() {
  const channelNotifiedRef = useRef<Set<string>>(new Set());
  const channelSinceRef = useRef<string>(new Date(Date.now() - 6 * 60 * 1000).toISOString());
  const dmNotifiedRef = useRef<Set<string>>(new Set());
  const viewingChannelIdRef = useRef<string | null>(null);

  useEffect(() => {
    const onDmOpened = (e: Event) => {
      const dmId = (e as CustomEvent<{ dmId: string }>).detail?.dmId;
      if (dmId) dmNotifiedRef.current.delete(dmId);
    };
    const onChannelView = (e: Event) => {
      viewingChannelIdRef.current = (e as CustomEvent<{ channelId: string | null }>).detail?.channelId ?? null;
    };
    window.addEventListener("dm-opened", onDmOpened);
    window.addEventListener("channel-view", onChannelView);
    return () => {
      window.removeEventListener("dm-opened", onDmOpened);
      window.removeEventListener("channel-view", onChannelView);
    };
  }, []);

  const runChannelSounds = () => {
    const since = channelSinceRef.current;
    channelSinceRef.current = new Date().toISOString();
    fetch(`/api/notifications/channel-sounds?since=${encodeURIComponent(since)}`)
      .then((r) => r.json())
      .then((data: { items?: { id: string; channelId: string }[] }) => {
        const items = data?.items ?? [];
        const notified = channelNotifiedRef.current;
        const viewingChannelId = viewingChannelIdRef.current;
        for (const item of items) {
          if (notified.has(item.id)) continue;
          if (viewingChannelId && item.channelId === viewingChannelId) continue;
          playNotificationSound();
          notified.add(item.id);
        }
      })
      .catch(() => {});
  };

  const runDmSounds = () => {
    fetch("/api/dms")
      .then((r) => r.json())
      .then((list: { id: string; unreadCount: number }[]) => {
        if (!Array.isArray(list)) return;
        const notified = dmNotifiedRef.current;
        for (const dm of list) {
          if ((dm.unreadCount ?? 0) > 0 && !notified.has(dm.id)) {
            playNotificationSound();
            notified.add(dm.id);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    runChannelSounds();
    runDmSounds();
    const channelInterval = setInterval(runChannelSounds, POLL_MS);
    const dmInterval = setInterval(runDmSounds, POLL_MS);
    return () => {
      clearInterval(channelInterval);
      clearInterval(dmInterval);
    };
  }, []);

  return null;
}
