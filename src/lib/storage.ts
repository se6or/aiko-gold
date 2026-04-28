import { XtreamAccount } from "./xtream";

const ACCOUNTS_KEY = "aiko_accounts";
const ACTIVE_KEY = "aiko_active_account";
const PREFS_KEY = "aiko_prefs";
const SEARCH_HIST_KEY = "aiko_search_history";
const FAV_KEY = "aiko_favorites";

export interface Prefs {
  theme: "dark" | "light";
  lang: "ar" | "en";
  subtitleSize: number; // 1 - 5 (relative)
  subtitleColor: string;
}

const defaultPrefs: Prefs = {
  theme: "dark",
  lang: "ar",
  subtitleSize: 3,
  subtitleColor: "#fcf6ba",
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storage = {
  getAccounts(): XtreamAccount[] {
    return safeParse(localStorage.getItem(ACCOUNTS_KEY), []);
  },
  saveAccounts(accounts: XtreamAccount[]) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  },
  getActiveAccountId(): string | null {
    return localStorage.getItem(ACTIVE_KEY);
  },
  setActiveAccountId(id: string | null) {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  },
  getActiveAccount(): XtreamAccount | null {
    const id = storage.getActiveAccountId();
    if (!id) return null;
    return storage.getAccounts().find((a) => a.id === id) || null;
  },
  getPrefs(): Prefs {
    return { ...defaultPrefs, ...safeParse(localStorage.getItem(PREFS_KEY), {}) };
  },
  savePrefs(p: Partial<Prefs>) {
    const merged = { ...storage.getPrefs(), ...p };
    localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
    return merged;
  },
  getSearchHistory(): string[] {
    return safeParse(localStorage.getItem(SEARCH_HIST_KEY), []);
  },
  addSearchHistory(q: string) {
    const list = storage.getSearchHistory().filter((x) => x !== q);
    list.unshift(q);
    localStorage.setItem(SEARCH_HIST_KEY, JSON.stringify(list.slice(0, 10)));
  },
  clearSearchHistory() {
    localStorage.removeItem(SEARCH_HIST_KEY);
  },
  getFavorites(): { type: "live" | "vod" | "series"; id: number; name: string; icon: string }[] {
    return safeParse(localStorage.getItem(FAV_KEY), []);
  },
  toggleFavorite(
    item: { type: "live" | "vod" | "series"; id: number; name: string; icon: string }
  ) {
    const list = storage.getFavorites();
    const idx = list.findIndex((x) => x.type === item.type && x.id === item.id);
    if (idx >= 0) list.splice(idx, 1);
    else list.unshift(item);
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
    return idx < 0;
  },
  isFavorite(type: "live" | "vod" | "series", id: number) {
    return storage.getFavorites().some((x) => x.type === type && x.id === id);
  },
};

export function applyTheme(theme: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", theme);
}

export function applyLang(lang: "ar" | "en") {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}
