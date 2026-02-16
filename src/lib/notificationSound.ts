let audio: HTMLAudioElement | null = null;

export function playNotificationSound(): void {
  try {
    if (typeof window === "undefined") return;
    if (!audio) audio = new Audio("/notification.mp3");
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}
