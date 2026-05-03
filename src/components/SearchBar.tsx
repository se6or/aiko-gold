import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  loadSearchHistory,
  addSearchHistory,
  clearSearchHistory,
} from "@/lib/searchHistory";

interface SearchableItem {
  id: string | number;
  name: string;
  icon?: string;
  meta?: string;
}

interface Props {
  /** All items eligible for searching (already loaded by parent). */
  items: SearchableItem[];
  /** Up to 6 trending items shown when input is empty (e.g. first popular items). */
  trending?: SearchableItem[];
  onPick: (item: SearchableItem) => void;
  /** Optional initial fixed label shown next to the icon. */
  hint?: string;
  /** Independent history bucket (e.g. "live", "cinema"). Defaults to "all". */
  scope?: string;
  /** Custom placeholder override (falls back to t("searchPlaceholder")). */
  placeholder?: string;
}

/**
 * Smart search trigger + dropdown.
 * - Compact icon button by default; expands into an overlay with input + suggestions.
 * - Shows recent searches and trending before typing.
 * - Live filters items as the user types (case-insensitive, accent-insensitive).
 */
export function SearchBar({ items, trending = [], onPick, hint, scope = "all" }: Props) {
  const { t } = useApp();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reload history when opening or when the signed-in user changes
  // (so a freshly logged-in user immediately sees their cloud history).
  useEffect(() => {
    let active = true;
    loadSearchHistory(scope).then((h) => {
      if (active) setHistory(h);
    });
    return () => {
      active = false;
    };
  }, [user?.id, open, scope]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const normalize = (s: string) =>
    s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();

  const results = useMemo(() => {
    const term = normalize(q);
    if (!term) return [];
    return items
      .filter((i) => normalize(i.name).includes(term))
      .slice(0, 30);
  }, [q, items]);

  const commit = async (text: string) => {
    const v = text.trim();
    if (!v) return;
    await addSearchHistory(v, scope);
    const next = await loadSearchHistory(scope);
    setHistory(next);
  };

  const handlePick = (item: SearchableItem) => {
    void commit(item.name);
    setOpen(false);
    setQ("");
    onPick(item);
  };

  const handleHistoryClick = (text: string) => {
    setQ(text);
  };

  const clearHistory = async () => {
    await clearSearchHistory(scope);
    setHistory([]);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-10 px-3 rounded-full bg-card border border-gold-dark/40 text-gold hover:border-gold transition active:scale-95"
        aria-label={t("search")}
      >
        <Search className="w-4 h-4" />
        {hint && <span className="text-xs font-bold">{hint}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[12000] bg-black/70 backdrop-blur-md animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="mx-auto max-w-xl mt-4 mb-4 px-4 h-[calc(100%-2rem)] flex flex-col">
            {/* Input row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 h-12 px-3 rounded-full bg-bg-secondary border border-gold-dark/60 focus-within:border-gold transition">
                <Search className="w-5 h-5 text-gold shrink-0" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (results[0]) handlePick(results[0]);
                      else commit(q);
                    } else if (e.key === "Escape") setOpen(false);
                  }}
                  placeholder={t("searchPlaceholder")}
                  className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground text-sm"
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
                    className="p-1 rounded-full hover:bg-card text-muted-foreground"
                    aria-label="clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-12 px-4 rounded-full bg-card border border-gold-dark/40 text-gold text-sm font-bold"
              >
                {t("cancel")}
              </button>
            </div>

            {/* Results / suggestions */}
            <div className="flex-1 mt-3 rounded-2xl bg-bg-secondary/95 border border-gold-dark/30 overflow-y-auto animate-slide-up">
              {!q ? (
                <div className="p-4 space-y-5">
                  {history.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-dark">
                          <Clock className="w-3.5 h-3.5" />
                          {t("recentSearches")}
                        </h3>
                        <button
                          onClick={clearHistory}
                          className="text-[11px] text-muted-foreground hover:text-gold"
                        >
                          {t("clearHistory")}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {history.map((h) => (
                          <button
                            key={h}
                            onClick={() => handleHistoryClick(h)}
                            className="px-3 py-1.5 rounded-full bg-card border border-gold-dark/40 text-xs text-gold hover:border-gold transition"
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {trending.length > 0 && (
                    <section>
                      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-dark mb-2">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {t("trending")}
                      </h3>
                      <ul className="divide-y divide-gold-dark/15">
                        {trending.slice(0, 6).map((it) => (
                          <ResultRow
                            key={`${it.id}-${it.name}`}
                            item={it}
                            onClick={() => handlePick(it)}
                          />
                        ))}
                      </ul>
                    </section>
                  )}

                  {history.length === 0 && trending.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-10">
                      {t("searchPlaceholder")}
                    </p>
                  )}
                </div>
              ) : results.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">
                  {t("noSearchResults")}
                </p>
              ) : (
                <ul className="divide-y divide-gold-dark/15">
                  {results.map((it) => (
                    <ResultRow
                      key={`${it.id}-${it.name}`}
                      item={it}
                      onClick={() => handlePick(it)}
                      highlight={q}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ResultRow({
  item,
  onClick,
  highlight,
}: {
  item: SearchableItem;
  onClick: () => void;
  highlight?: string;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-card/60 transition"
      >
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-bg-tertiary shrink-0 grid place-items-center">
          {item.icon ? (
            <img
              src={item.icon}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) =>
                ((e.currentTarget as HTMLImageElement).style.display = "none")
              }
            />
          ) : (
            <Search className="w-4 h-4 text-gold-dark" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">
            {highlight ? highlightText(item.name, highlight) : item.name}
          </div>
          {item.meta && (
            <div className="text-[11px] text-muted-foreground truncate">
              {item.meta}
            </div>
          )}
        </div>
      </button>
    </li>
  );
}

function highlightText(text: string, term: string) {
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent text-gold font-bold">
        {text.slice(i, i + term.length)}
      </mark>
      {text.slice(i + term.length)}
    </>
  );
}
