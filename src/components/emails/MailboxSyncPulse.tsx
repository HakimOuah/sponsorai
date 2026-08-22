"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SYNC_INTERVAL_MS = 2 * 60 * 1_000;
const INITIAL_DELAY_MS = 4_000;
const STORAGE_KEY = "vectis:mailbox-sync:last-at:v1";

type SyncResponse = {
  analyzed?: number;
};

function shouldSync() {
  try {
    const lastSyncAt = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
    return !lastSyncAt || Date.now() - lastSyncAt >= SYNC_INTERVAL_MS;
  } catch {
    return true;
  }
}

function markSyncStarted() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // The sync can still run when storage is unavailable.
  }
}

export function MailboxSyncPulse() {
  const router = useRouter();
  const runningRef = useRef(false);

  useEffect(() => {
    let disposed = false;

    const sync = async () => {
      if (
        disposed ||
        runningRef.current ||
        document.visibilityState !== "visible" ||
        !shouldSync()
      ) {
        return;
      }

      runningRef.current = true;
      markSyncStarted();
      try {
        const response = await fetch("/api/mailbox/sync", {
          method: "POST",
          cache: "no-store",
        });
        if (!response.ok) return;

        const result = (await response.json()) as SyncResponse;
        if (!disposed && (result.analyzed || 0) > 0) {
          router.refresh();
          window.dispatchEvent(new CustomEvent("vectis:mailbox-synced"));
        }
      } catch {
        // Background synchronization remains silent; the manual control reports errors.
      } finally {
        runningRef.current = false;
      }
    };

    const initialTimer = window.setTimeout(sync, INITIAL_DELAY_MS);
    const interval = window.setInterval(sync, SYNC_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
