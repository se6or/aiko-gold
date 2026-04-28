import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { storage, Prefs, applyTheme, applyLang } from "@/lib/storage";
import { XtreamAccount, xtream, XtreamUserInfo } from "@/lib/xtream";
import { translations, Lang, TKey } from "@/lib/i18n";

interface AppContextValue {
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
  accounts: XtreamAccount[];
  activeAccount: XtreamAccount | null;
  userInfo: XtreamUserInfo | null;
  loading: boolean;
  loginError: string | null;
  addAndLogin: (acc: Omit<XtreamAccount, "id" | "createdAt">) => Promise<boolean>;
  switchAccount: (id: string) => Promise<boolean>;
  deleteAccount: (id: string) => void;
  logout: () => void;
  t: (key: TKey) => string;
}

const Ctx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(() => storage.getPrefs());
  const [accounts, setAccounts] = useState<XtreamAccount[]>(() =>
    storage.getAccounts()
  );
  const [activeAccount, setActiveAccount] = useState<XtreamAccount | null>(
    () => storage.getActiveAccount()
  );
  const [userInfo, setUserInfo] = useState<XtreamUserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(prefs.theme);
    applyLang(prefs.lang);
  }, [prefs.theme, prefs.lang]);

  // Auto-authenticate active account on mount
  useEffect(() => {
    if (!activeAccount) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await xtream.authenticate(activeAccount);
        if (!cancelled) setUserInfo(res.user_info);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeAccount]);

  const setPrefs = useCallback((p: Partial<Prefs>) => {
    const merged = storage.savePrefs(p);
    setPrefsState(merged);
  }, []);

  const addAndLogin = useCallback(
    async (acc: Omit<XtreamAccount, "id" | "createdAt">) => {
      setLoading(true);
      setLoginError(null);
      try {
        const newAcc: XtreamAccount = {
          ...acc,
          name: acc.name || acc.username,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        };
        const res = await xtream.authenticate(newAcc);
        if (!res?.user_info || res.user_info.auth === 0) {
          throw new Error("Authentication failed");
        }
        const all = [...storage.getAccounts().filter(
          (x) =>
            !(x.server === newAcc.server && x.username === newAcc.username)
        ), newAcc];
        storage.saveAccounts(all);
        storage.setActiveAccountId(newAcc.id);
        setAccounts(all);
        setActiveAccount(newAcc);
        setUserInfo(res.user_info);
        return true;
      } catch (err) {
        setLoginError(err instanceof Error ? err.message : "Login failed");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const switchAccount = useCallback(async (id: string) => {
    const acc = storage.getAccounts().find((a) => a.id === id);
    if (!acc) return false;
    setLoading(true);
    setLoginError(null);
    try {
      const res = await xtream.authenticate(acc);
      storage.setActiveAccountId(acc.id);
      setActiveAccount(acc);
      setUserInfo(res.user_info);
      return true;
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(
    (id: string) => {
      const next = accounts.filter((a) => a.id !== id);
      storage.saveAccounts(next);
      setAccounts(next);
      if (activeAccount?.id === id) {
        storage.setActiveAccountId(null);
        setActiveAccount(null);
        setUserInfo(null);
      }
    },
    [accounts, activeAccount]
  );

  const logout = useCallback(() => {
    storage.setActiveAccountId(null);
    setActiveAccount(null);
    setUserInfo(null);
  }, []);

  const t = useCallback(
    (key: TKey) => translations[prefs.lang as Lang][key] ?? key,
    [prefs.lang]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      prefs,
      setPrefs,
      accounts,
      activeAccount,
      userInfo,
      loading,
      loginError,
      addAndLogin,
      switchAccount,
      deleteAccount,
      logout,
      t,
    }),
    [
      prefs,
      setPrefs,
      accounts,
      activeAccount,
      userInfo,
      loading,
      loginError,
      addAndLogin,
      switchAccount,
      deleteAccount,
      logout,
      t,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
