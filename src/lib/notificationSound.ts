const NOTIFICATION_SRC = "/notification.mp3";

let audio: HTMLAudioElement | null = null;
let unlocked = false;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(NOTIFICATION_SRC);
    audio.preload = "auto";
  }
  return audio;
}

/** Call once after a user gesture so later play() is not blocked by autoplay policy. */
export function unlockNotificationAudio(): void {
  if (typeof window === "undefined") return;
  try {
    const a = getAudio();
    a.volume = 0.01;
    a.currentTime = 0;
    a.play().then(() => {
      unlocked = true;
      a.volume = 1;
      a.pause();
      a.currentTime = 0;
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export function playNotificationSound(): void {
  if (typeof window === "undefined") return;
  try {
    const a = getAudio();
    a.volume = 1;
    a.currentTime = 0;
    a.play().catch(() => {
      if (!unlocked) return;
      a.currentTime = 0;
      a.play().catch(() => {});
    });
  } catch {
    // ignore
  }
}
