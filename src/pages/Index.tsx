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
  // splash phases: "in" → showing, "out" → fading out, "done" → unmounted
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    const minDelay = new Promise<void>((r) => setTimeout(r, 1500));
    Promise.all([minDelay, preloadImg(logoUrl), preloadImg(wordmarkUrl)]).then(
      () => setPhase("out")
    );
  }, []);

  useEffect(() => {
    if (phase !== "out") return;
    const id = setTimeout(() => setPhase("done"), 450);
    return () => clearTimeout(id);
  }, [phase]);

  const showSplash = phase !== "done" || authLoading;

  return (
    <>
      {showSplash && (
        <div
          className={`fixed inset-0 z-[9999] ${
            phase === "out" ? "animate-fade-out pointer-events-none" : ""
          }`}
        >
          <Splash />
        </div>
      )}
      {!showSplash && (
        <div
          key={user ? (activeAccount ? "shell" : "login") : "auth"}
          className="animate-fade-in fixed inset-0 overflow-auto"
        >
          {!user ? (
            <AuthScreen />
          ) : !activeAccount ? (
            <LoginScreen />
          ) : (
            <AppShell />
          )}
        </div>
      )}
    </>
  );
}

const Index = () => (
  <AuthProvider>
    <AppProvider>
      <Inner />
    </AppProvider>
  </AuthProvider>
);

export default Index;
