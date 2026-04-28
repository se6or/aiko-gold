import { useEffect, useState } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { Splash } from "@/components/Splash";
import { LoginScreen } from "@/components/LoginScreen";
import { AppShell } from "@/components/AppShell";

function Inner() {
  const { activeAccount } = useApp();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setSplash(false), 2200);
    return () => clearTimeout(id);
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
