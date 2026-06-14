"use client";
import { useEffect, useRef } from "react";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";

export function SyncListener() {
  const router = useRouter();
  const lastSyncRef = useRef(0);

  useEffect(() => {
    // Set initial ref to avoid triggering on first load
    const init = async () => {
        try {
            const res = await fetch("/api/status");
            const { lastSync } = await res.json();
            lastSyncRef.current = lastSync;
        } catch (e) {
            console.error("Polling init error", e);
        }
    };
    init();

    const poll = async () => {
      try {
        const res = await fetch("/api/status");
        const { lastSync } = await res.json();

        if (lastSyncRef.current !== 0 && lastSync > lastSyncRef.current) {
          toast.info("¡Resultados actualizados!", {
            description: "Hay nuevos puntajes disponibles.",
            action: { label: "Refrescar", onClick: () => router.refresh() },
            duration: 10000,
          });
        }
        lastSyncRef.current = lastSync;
      } catch (e) {
        console.error("Polling error", e);
      }
    };

    const interval = setInterval(poll, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [router]);

  return <Toaster position="bottom-center" />;
}
