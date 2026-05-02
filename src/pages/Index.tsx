import { useEffect, useState } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Splash } from "@/components/Splash";
import { LoginScreen } from "@/components/LoginScreen";
import { AppShell } from "@/components/AppShell";
import { AuthScreen } from "@/components/AuthScreen";
import logoUrl from "@/assets/aiko-logo.webp";
import wordmarkUrl from "@/assets/aiko-gold-wordmark.webp";

const preloadImg = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });

function Inner() {
  const { activeAccount } = useApp();
  const { user, loading: authLoading } = useAuth();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const minDelay = new Promise<void>((r) => setTimeout(r, 600));
    Promise.all([minDelay, preloadImg(logoUrl), preloadImg(wordmarkUrl)]).then(
      () => setSplash(false)
    );
  }, []);

  if (splash || authLoading) return <Splash />;
  if (!user) return <AuthScreen />;
  if (!activeAccount) return <LoginScreen />;
  return <AppShell />;
}

const Index = () => (
  <AuthProvider>
    <AppProvider>
      <Inner />
    </AppProvider>
  </AuthProvider>
);

export default Index;
