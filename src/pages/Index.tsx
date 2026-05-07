import { useEffect, useState } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { Splash } from "@/components/Splash";
import { LoginScreen } from "@/components/LoginScreen";
import { AppShell } from "@/components/AppShell";
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

  const showSplash = phase !== "done";

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
          key={activeAccount ? "shell" : "login"}
          className="animate-fade-in fixed inset-0 overflow-auto"
        >
          {!activeAccount ? <LoginScreen /> : <AppShell />}
        </div>
      )}
    </>
  );
}

const Index = () => (
  <AppProvider>
    <Inner />
  </AppProvider>
);

export default Index;
