import { useEffect, useState } from "react";
import { Eye, EyeOff, LogIn, Plus, Play, Trash2, Languages } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import logo from "@/assets/aiko-logo.png";

export function LoginScreen() {
  const {
    prefs,
    setPrefs,
    accounts,
    loading,
    loginError,
    addAndLogin,
    switchAccount,
    deleteAccount,
    t,
  } = useApp();

  const [mode, setMode] = useState<"list" | "new">(
    accounts.length ? "list" : "new"
  );
  const [form, setForm] = useState({
    name: "",
    server: "",
    username: "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (loginError) toast.error(loginError);
  }, [loginError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.server || !form.username || !form.password) {
      toast.error("املأ جميع الحقول المطلوبة");
      return;
    }
    const ok = await addAndLogin(form);
    if (ok) toast.success("تم تسجيل الدخول");
  };

  const toggleLang = () => {
    setPrefs({ lang: prefs.lang === "ar" ? "en" : "ar" });
  };

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-gradient-to-br from-black via-bg-primary to-bg-secondary">
      {/* Lang toggle */}
      <button
        type="button"
        onClick={toggleLang}
        className="absolute top-4 end-4 z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-card/80 border border-gold-dark/50 text-gold text-sm hover:bg-gold-dark hover:text-black transition"
        aria-label="Toggle language"
      >
        <Languages className="w-4 h-4" />
        {prefs.lang === "ar" ? "EN" : "AR"}
      </button>

      <div className="flex flex-col items-center px-5 pt-10 pb-10">
        <img
          src={logo}
          alt="AIKO GOLD"
          width={96}
          height={96}
          className="w-24 h-24 drop-shadow-[0_0_20px_hsl(var(--gold-dark)/0.6)]"
        />
        <h1 className="mt-3 text-2xl gold-text">AIKO GOLD</h1>
        <p className="text-xs text-muted-foreground mt-1">{t("tagline")}</p>

        <div className="w-full max-w-md mt-8">
          {mode === "list" && accounts.length > 0 ? (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gold">
                  {t("savedAccounts")}
                </h2>
                <button
                  onClick={() => setMode("new")}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gold-dark/50 text-gold hover:bg-gold-dark hover:text-black transition"
                >
                  <Plus className="w-4 h-4" />
                  {t("addNew")}
                </button>
              </div>

              <div className="space-y-3">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-card/80 border border-gold-dark/30 hover:border-gold transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-gold grid place-items-center text-black font-black text-lg border-2 border-gold shrink-0">
                        {acc.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold truncate">{acc.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {acc.server}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => switchAccount(acc.id)}
                        disabled={loading}
                        className="w-9 h-9 rounded-lg grid place-items-center bg-success/20 text-success hover:bg-success hover:text-black transition disabled:opacity-50"
                        aria-label={t("login")}
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t("deleteConfirm"))) deleteAccount(acc.id);
                        }}
                        className="w-9 h-9 rounded-lg grid place-items-center bg-destructive/20 text-destructive border border-destructive/50 hover:bg-destructive hover:text-white transition"
                        aria-label="delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-card/80 border border-gold-dark/40 rounded-2xl p-6 animate-fade-in"
            >
              <h2 className="text-xl font-bold text-gold text-center mb-5">
                {t("login")}
              </h2>
              <div className="space-y-3">
                <input
                  className="w-full px-4 py-3 rounded-lg bg-input border border-gold-dark/40 focus:border-gold focus:outline-none text-center"
                  placeholder={t("name")}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  className="w-full px-4 py-3 rounded-lg bg-input border border-gold-dark/40 focus:border-gold focus:outline-none text-center"
                  placeholder={`${t("server")} (http://example.com:8080)`}
                  value={form.server}
                  onChange={(e) => setForm({ ...form, server: e.target.value })}
                  autoComplete="url"
                  required
                  dir="ltr"
                />
                <input
                  className="w-full px-4 py-3 rounded-lg bg-input border border-gold-dark/40 focus:border-gold focus:outline-none text-center"
                  placeholder={t("username")}
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  autoComplete="username"
                  required
                  dir="ltr"
                />
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 rounded-lg bg-input border border-gold-dark/40 focus:border-gold focus:outline-none text-center"
                    type={showPw ? "text" : "password"}
                    placeholder={t("password")}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    autoComplete="current-password"
                    required
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-gold"
                    aria-label="toggle password"
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-lg gold-bg text-black font-bold text-base hover:opacity-95 active:scale-[0.98] transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin-gold" />
                    {t("connecting")}
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    {t("login")}
                  </>
                )}
              </button>

              {accounts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMode("list")}
                  className="mt-3 w-full py-2 text-sm text-muted-foreground hover:text-gold"
                >
                  ← {t("savedAccounts")}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
