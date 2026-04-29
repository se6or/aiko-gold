import { useEffect, useState } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { Splash } from "@/components/Splash";
import { LoginScreen } from "@/components/LoginScreen";
import { AppShell } from "@/components/AppShell";
import logoUrl from "@/assets/aiko-logo.png";
import wordmarkUrl from "@/assets/aiko-gold-wordmark.png";

function Inner() {
  const { activeAccount } = useApp();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const minDelay = new Promise<void>((r) => setTimeout(r, 900));
    const preload = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => resolve();
        img.src = src;
      });
    Promise.all([minDelay, preload(logoUrl), preload(wordmarkUrl)]).then(() => {
      if (!cancelled) setSplash(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (splash) return <Splash />;
  if (!activeAccount) return <LoginScreen />;
  return <AppShell />;
}

const Index = () => (
  <AppProvider>
    <Inner />
  </AppProvider>
);

export default Index;
