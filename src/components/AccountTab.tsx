import { useApp } from "@/context/AppContext";
import {
  User,
  Calendar,
  Radio,
  Palette,
  Languages,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

function fmtDate(exp: string | null | undefined, lang: "ar" | "en") {
  if (!exp) return "∞";
  const n = Number(exp);
  if (!isFinite(n) || n <= 0) return "∞";
  const d = new Date(n * 1000);
  return d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
}

export function AccountTab() {
  const { prefs, setPrefs, userInfo, activeAccount, logout, t } = useApp();

  const statusActive =
    userInfo?.status?.toLowerCase() === "active" || !!userInfo;

  return (
    <div className="pb-20">
      <div className="px-5 pt-10 pb-6 bg-gradient-to-b from-gold-dark/20 to-transparent text-center">
        <div className="w-20 h-20 mx-auto rounded-full gold-bg grid place-items-center border-[3px] border-gold shadow-gold">
          <User className="w-10 h-10 text-black" strokeWidth={2.5} />
        </div>
        <h2 className="mt-3 text-xl font-bold gold-text">
          {activeAccount?.name || userInfo?.username || "User"}
        </h2>
        <span
          className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full border ${
            statusActive
              ? "bg-success/20 text-success border-success"
              : "bg-destructive/20 text-destructive border-destructive"
          }`}
        >
          {statusActive ? t("active") : t("expired")}
        </span>
      </div>

      <div className="px-5 space-y-5">
        <Group title={t("subscriptionInfo")}>
          <Row
            icon={<Calendar className="w-4 h-4" />}
            label={t("expiryDate")}
            value={fmtDate(userInfo?.exp_date, prefs.lang)}
          />
          <Row
            icon={<Radio className="w-4 h-4" />}
            label={t("connections")}
            value={`${userInfo?.active_cons ?? 0} / ${
              userInfo?.max_connections ?? "?"
            }`}
          />
        </Group>

        <Group title={t("appSettings")}>
          <button
            onClick={() =>
              setPrefs({ theme: prefs.theme === "dark" ? "light" : "dark" })
            }
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gold-dark/10 transition"
          >
            <div className="flex items-center gap-3 text-foreground">
              <Palette className="w-5 h-5 text-gold-dark" />
              <span>{t("theme")}</span>
            </div>
            <div className="flex items-center gap-2 text-gold text-sm font-bold">
              {prefs.theme === "dark" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
              {prefs.theme === "dark" ? t("dark") : t("light")}
            </div>
          </button>
          <button
            onClick={() =>
              setPrefs({ lang: prefs.lang === "ar" ? "en" : "ar" })
            }
            className="w-full flex items-center justify-between px-5 py-4 border-t border-white/5 hover:bg-gold-dark/10 transition"
          >
            <div className="flex items-center gap-3 text-foreground">
              <Languages className="w-5 h-5 text-gold-dark" />
              <span>{t("language")}</span>
            </div>
            <span className="text-gold text-sm font-bold">
              {prefs.lang === "ar" ? "العربية" : "English"}
            </span>
          </button>
        </Group>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-destructive/10 border border-destructive/40 text-destructive font-bold hover:bg-destructive hover:text-white transition"
        >
          <LogOut className="w-4 h-4" />
          {t("logout")}
        </button>
      </div>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card/60 border border-gold-dark/20 rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-1 text-sm font-bold text-gold-dark">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-white/5 first:border-t-0">
      <div className="flex items-center gap-3 text-foreground">
        <span className="text-gold-dark">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="text-gold text-sm font-bold" dir="ltr">
        {value}
      </span>
    </div>
  );
}
