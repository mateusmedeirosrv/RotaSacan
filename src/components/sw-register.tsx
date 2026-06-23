"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((erro) => {
      console.error("Falha ao registrar o service worker:", erro);
    });
  }, []);

  return null;
}
