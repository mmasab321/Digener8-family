"use client";

import { useEffect, useRef } from "react";

const POLL_MS = 4000;
const BADGE_SIZE = 32;
const DEFAULT_FAVICON = "/logo.png";

function setFavicon(url: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

function drawFaviconWithBadge(count: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = BADGE_SIZE;
    canvas.height = BADGE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("No canvas context"));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      ctx.drawImage(img, 0, 0, BADGE_SIZE, BADGE_SIZE);

      const displayCount = Math.min(count, 99);
      const radius = 10;
      const x = BADGE_SIZE - radius - 2;
      const y = radius + 2;

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const text = String(displayCount);
      ctx.fillText(text, x, y);

      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        reject(new Error("toDataURL failed"));
      }
    };

    img.onerror = () => {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, BADGE_SIZE, BADGE_SIZE);
      const displayCount = Math.min(count, 99);
      const radius = 10;
      const x = BADGE_SIZE - radius - 2;
      const y = radius + 2;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(displayCount), x, y);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch {
        reject(new Error("toDataURL failed"));
      }
    };

    img.src = DEFAULT_FAVICON;
  });
}

export function FaviconBadge() {
  const lastTotalRef = useRef<number>(0);
  const defaultFaviconRef = useRef<string | null>(null);

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link?.href) defaultFaviconRef.current = link.href;
    else defaultFaviconRef.current = new URL(DEFAULT_FAVICON, window.location.origin).href;

    const poll = async () => {
      try {
        const res = await fetch("/api/unread");
        const data = await res.json().catch(() => ({}));
        const total = typeof data.total === "number" ? data.total : 0;

        if (total === lastTotalRef.current) return;
        lastTotalRef.current = total;

        if (total <= 0) {
          setFavicon(defaultFaviconRef.current ?? DEFAULT_FAVICON);
          return;
        }

        const dataUrl = await drawFaviconWithBadge(total);
        setFavicon(dataUrl);
      } catch {
        // ignore
      }
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
