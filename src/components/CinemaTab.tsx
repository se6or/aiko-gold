import { useEffect, useMemo, useState } from "react";
import { Film, Tv2, Play } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  xtream,
  VodStream,
  SeriesItem,
  Category,
  buildVodStreamUrl,
} from "@/lib/xtream";
import { DetailsScreen } from "@/components/DetailsScreen";
import { VideoPlayer, PlayerSource } from "@/components/VideoPlayer";
import { SearchBar } from "@/components/SearchBar";
import { toast } from "sonner";

type Kind = "vod" | "series";

export function CinemaTab() {
  const { activeAccount, t } = useApp();
  const [kind, setKind] = useState<Kind>("vod");

  const [vodCats, setVodCats] = useState<Category[]>([]);
  const [vodItems, setVodItems] = useState<VodStream[]>([]);
  const [serCats, setSerCats] = useState<Category[]>([]);
  const [serItems, setSerItems] = useState<SeriesItem[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VodStream | SeriesItem | null>(null);
  const [player, setPlayer] = useState<PlayerSource | null>(null);

  const quickPlay = (e: React.MouseEvent, x: VodStream | SeriesItem) => {
    e.stopPropagation();
    if (!activeAccount) return;
    if (kind === "vod") {
      const v = x as VodStream;
      setPlayer({
        url: buildVodStreamUrl(activeAccount, v.stream_id),
        title: v.name,
      });
    } else {
      // Series quick-play opens details (needs episode selection)
      setSelected(x);
    }
  };

  // Preload BOTH vod + series in parallel — eliminates lag when switching tabs.
  useEffect(() => {
    if (!activeAccount) return;
    let ok = true;
    setLoading(true);
    Promise.all([
      xtream.getVodCategories(activeAccount).catch(() => []),
      xtream.getVodStreams(activeAccount).catch(() => []),
      xtream.getSeriesCategories(activeAccount).catch(() => []),
      xtream.getSeries(activeAccount).catch(() => []),
    ])
      .then(([vc, vi, sc, si]) => {
        if (!ok) return;
        setVodCats(Array.isArray(vc) ? vc : []);
        setVodItems(Array.isArray(vi) ? vi : []);
        setSerCats(Array.isArray(sc) ? sc : []);
        setSerItems(Array.isArray(si) ? si : []);
      })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => ok && setLoading(false));
    return () => {
      ok = false;
    };
  }, [activeAccount]);

  // Reset category when switching kind
  useEffect(() => {
    setActiveCat("all");
  }, [kind]);

  const cats = kind === "vod" ? vodCats : serCats;
  const items: (VodStream | SeriesItem)[] =
    kind === "vod" ? vodItems : serItems;

  const filtered = useMemo(() => {
    if (activeCat === "all") return items;
    return items.filter((x) => x.category_id === activeCat);
  }, [items, activeCat]);

  const searchPool = useMemo(() => {
    return [
      ...vodItems.map((v) => ({
        id: `v-${v.stream_id}`,
        name: v.name,
        icon: v.stream_icon,
        meta: t("movies"),
        _ref: { kind: "vod" as const, item: v },
      })),
      ...serItems.map((s) => ({
        id: `s-${s.series_id}`,
        name: s.name,
        icon: s.cover,
        meta: t("series"),
        _ref: { kind: "series" as const, item: s },
      })),
    ];
  }, [vodItems, serItems, t]);

  const trending = useMemo(() => searchPool.slice(0, 6), [searchPool]);

  return (
    <div className="pb-20">
      {/* Premium header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-dark/15 via-bg-primary to-bg-primary pointer-events-none" />
        <div className="relative px-4 pt-6 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black gold-text leading-tight">
              {t("cinema")}
            </h1>
          </div>
          <SearchBar
            items={searchPool}
            trending={trending}
            scope="cinema"
            placeholder={t("searchPlaceholderCinema")}
            onPick={(it) => {
              const ref = (it as typeof searchPool[number])._ref;
              if (ref) {
                setKind(ref.kind);
                setSelected(ref.item);
              }
            }}
          />
        </div>

        {/* Segmented kind switch */}
        <div className="px-4">
          <div className="relative grid grid-cols-2 p-1 rounded-full bg-card border border-gold-dark/40">
            <span
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full gold-bg shadow-gold transition-all duration-300"
              style={{ insetInlineStart: kind === "vod" ? "4px" : "calc(50% + 0px)" }}
            />
            <button
              onClick={() => setKind("vod")}
              className={`relative z-10 flex items-center justify-center gap-2 py-2 text-sm font-bold transition ${
                kind === "vod" ? "text-black" : "text-gold"
              }`}
            >
              <Film className="w-4 h-4" />
              {t("movies")}
            </button>
            <button
              onClick={() => setKind("series")}
              className={`relative z-10 flex items-center justify-center gap-2 py-2 text-sm font-bold transition ${
                kind === "series" ? "text-black" : "text-gold"
              }`}
            >
              <Tv2 className="w-4 h-4" />
              {t("series")}
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Pill
            active={activeCat === "all"}
            onClick={() => setActiveCat("all")}
          >
            {t("all")}
          </Pill>
          {cats.map((c) => (
            <Pill
              key={c.category_id}
              active={activeCat === c.category_id}
              onClick={() => setActiveCat(c.category_id)}
            >
              {c.category_name}
            </Pill>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 mt-3">
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            {t("noResults")}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.slice(0, 200).map((x) => {
              const id =
                kind === "vod"
                  ? (x as VodStream).stream_id
                  : (x as SeriesItem).series_id;
              const cover =
                kind === "vod"
                  ? (x as VodStream).stream_icon
                  : (x as SeriesItem).cover;
              return (
                <button
                  key={id}
                  onClick={() => setSelected(x)}
                  className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-card border border-transparent hover:border-gold-dark transition hover:-translate-y-1 duration-300"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={x.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) =>
                        ((e.currentTarget as HTMLImageElement).style.display =
                          "none")
                      }
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center bg-bg-tertiary">
                      {kind === "vod" ? (
                        <Film className="w-10 h-10 text-gold-dark" />
                      ) : (
                        <Tv2 className="w-10 h-10 text-gold-dark" />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/95 to-transparent">
                    <div className="text-[11px] font-bold truncate text-white">
                      {x.name}
                    </div>
                  </div>
                  {/* Quick play button */}
                  <span
                    role="button"
                    aria-label={`Play ${x.name}`}
                    onClick={(e) => quickPlay(e, x)}
                    className="absolute top-2 end-2 w-9 h-9 rounded-full gold-bg grid place-items-center shadow-gold opacity-90 hover:scale-110 active:scale-95 transition"
                  >
                    <Play className="w-4 h-4 text-black fill-black ms-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {player && (
        <VideoPlayer source={player} onClose={() => setPlayer(null)} />
      )}

      {selected && (
        <DetailsScreen
          kind={kind}
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Pill({
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
