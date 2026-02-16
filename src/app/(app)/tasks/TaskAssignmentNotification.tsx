"use client";

import { useEffect, useRef } from "react";
import { playNotificationSound } from "@/lib/notificationSound";

const ASSIGNMENT_NOTIFICATION_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

export function TaskAssignmentNotification({
  taskAssignedToId,
  taskUpdatedAt,
  currentUserId,
}: {
  taskAssignedToId: string | null;
  taskUpdatedAt: Date;
  currentUserId: string | null;
}) {
  const playedRef = useRef(false);

  useEffect(() => {
    if (!currentUserId || !taskAssignedToId || taskAssignedToId !== currentUserId || playedRef.current) return;
    const updated = new Date(taskUpdatedAt).getTime();
    const now = Date.now();
    if (now - updated <= ASSIGNMENT_NOTIFICATION_WINDOW_MS) {
      playNotificationSound();
      playedRef.current = true;
    }
  }, [taskAssignedToId, taskUpdatedAt, currentUserId]);

  return null;
}
