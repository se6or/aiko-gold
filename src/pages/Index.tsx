import { useEffect, useState } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { Splash } from "@/components/Splash";
import { LoginScreen } from "@/components/LoginScreen";
import { AppShell } from "@/components/AppShell";
import logoUrl from "@/assets/aiko-logo.webp";
import wordmarkUrl from "@/assets/aiko-gold-wordmark.webp";

/** Preload an image — resolves as soon as it's decoded & cached */
const preloadImg = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });

function Inner() {
  const { activeAccount } = useApp();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    // Wait for both: minimum visual time + assets fully decoded
    const minDelay = new Promise<void>((r) => setTimeout(r, 600));
    Promise.all([minDelay, preloadImg(logoUrl), preloadImg(wordmarkUrl)]).then(
      () => setSplash(false)
    );
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
