import { useState } from "react";
import { Home, Film, Tv, Tv2, User } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { LiveTab } from "@/components/LiveTab";
import { VodSeriesTab } from "@/components/VodSeriesTab";
import { AccountTab } from "@/components/AccountTab";

type TabKey = "live" | "movies" | "series" | "account";

export function AppShell() {
  const { t } = useApp();
  const [tab, setTab] = useState<TabKey>("live");

  return (
    <div className="relative w-full h-full overflow-hidden bg-bg-primary">
      <div className="absolute inset-0 bottom-[65px] overflow-y-auto">
        {tab === "live" && <LiveTab key="live" />}
        {tab === "movies" && <VodSeriesTab key="vod" kind="vod" />}
        {tab === "series" && <VodSeriesTab key="series" kind="series" />}
        {tab === "account" && <AccountTab key="acc" />}
      </div>

      <nav className="absolute bottom-0 inset-x-0 h-[65px] glass-dark border-t border-gold-dark/30 flex items-center justify-around z-40">
        <NavBtn
          active={tab === "live"}
          onClick={() => setTab("live")}
          icon={<Tv className="w-5 h-5" />}
          label={t("live")}
        />
        <NavBtn
          active={tab === "movies"}
          onClick={() => setTab("movies")}
          icon={<Film className="w-5 h-5" />}
          label={t("movies")}
        />
        <NavBtn
          active={tab === "series"}
          onClick={() => setTab("series")}
          icon={<Tv2 className="w-5 h-5" />}
          label={t("series")}
        />
        <NavBtn
          active={tab === "account"}
          onClick={() => setTab("account")}
          icon={<User className="w-5 h-5" />}
          label={t("account")}
        />
      </nav>
    </div>
  );
}

function NavBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 h-full transition ${
        active ? "text-gold" : "text-muted-foreground"
      }`}
    >
      <div
        className={`transition ${
          active ? "-translate-y-0.5 drop-shadow-[0_0_6px_hsl(var(--gold)/0.5)]" : ""
        }`}
      >
        {icon}
      </div>
      <span className="text-[11px] font-bold mt-0.5">{label}</span>
    </button>
  );
}
