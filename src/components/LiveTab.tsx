import { useEffect, useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  xtream,
  LiveStream,
  Category,
  buildLiveStreamUrl,
} from "@/lib/xtream";
import { Tv } from "lucide-react";
import { VideoPlayer, PlayerSource } from "@/components/VideoPlayer";
import { SearchBar } from "@/components/SearchBar";
import { toast } from "sonner";

export function LiveTab() {
  const { activeAccount, t } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<PlayerSource | null>(null);

  useEffect(() => {
    if (!activeAccount) return;
    let ok = true;
    setLoading(true);
    Promise.all([
      xtream.getLiveCategories(activeAccount),
      xtream.getLiveStreams(activeAccount),
    ])
      .then(([cats, chans]) => {
        if (!ok) return;
        setCategories(Array.isArray(cats) ? cats : []);
        setStreams(Array.isArray(chans) ? chans : []);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => ok && setLoading(false));
    return () => {
      ok = false;
    };
  }, [activeAccount]);

  const filtered = useMemo(() => {
    if (activeCat === "all") return streams;
    return streams.filter((s) => s.category_id === activeCat);
  }, [streams, activeCat]);

  const playChannel = (ch: LiveStream) => {
    if (!activeAccount) return;
    setPlayer({
      url: buildLiveStreamUrl(activeAccount, ch.stream_id),
      title: ch.name,
      isLive: true,
    });
  };

  const searchPool = useMemo(
    () =>
      streams.map((s) => ({
        id: s.stream_id,
        name: s.name,
        icon: s.stream_icon,
        meta: t("live"),
        _ref: s,
      })),
    [streams, t]
  );

  const trending = useMemo(() => searchPool.slice(0, 6), [searchPool]);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-gold-dark">
            AIKO
          </p>
          <h1 className="text-3xl font-black gold-text leading-tight flex items-center gap-2">
            {t("live")}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/20 border border-destructive/40 text-destructive text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse-red" />
              {t("liveNow")}
            </span>
          </h1>
        </div>
        <SearchBar
          items={searchPool}
          trending={trending}
          onPick={(it) => {
            const ref = (it as typeof searchPool[number])._ref;
            if (ref) playChannel(ref);
          }}
        />
      </div>

      {/* Categories */}
      <div className="px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <CatPill
            active={activeCat === "all"}
            onClick={() => setActiveCat("all")}
          >
            {t("all")}
          </CatPill>
          {categories.map((c) => (
            <CatPill
              key={c.category_id}
              active={activeCat === c.category_id}
              onClick={() => setActiveCat(c.category_id)}
            >
              {c.category_name}
            </CatPill>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 mt-3">
        <h2 className="text-lg font-bold text-gold border-e-4 border-gold-dark pe-3 mb-3">
          {t("live")}
        </h2>

        {loading && streams.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton aspect-video rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            {t("noResults")}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.slice(0, 120).map((ch) => (
              <button
                key={ch.stream_id}
                onClick={() => playChannel(ch)}
                className="group relative aspect-video rounded-xl overflow-hidden bg-card border border-transparent hover:border-destructive transition"
              >
                <span className="absolute top-2 start-2 z-10 px-2 py-0.5 rounded-md bg-destructive text-white text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
                {ch.stream_icon ? (
                  <img
                    src={ch.stream_icon}
                    alt={ch.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center">
                    <Tv className="w-8 h-8 text-gold-dark" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/95 to-transparent">
                  <div className="text-xs font-bold truncate text-white">
                    {ch.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {player && (
        <VideoPlayer source={player} onClose={() => setPlayer(null)} />
      )}
    </div>
  );
}

function CatPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold border transition whitespace-nowrap ${
        active
          ? "gold-bg text-black border-gold"
          : "bg-card border-gold-dark/40 text-gold hover:border-gold"
      }`}
    >
      {children}
    </button>
  );
}
