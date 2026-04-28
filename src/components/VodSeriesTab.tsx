import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  xtream,
  VodStream,
  SeriesItem,
  Category,
  buildVodStreamUrl,
  buildSeriesStreamUrl,
} from "@/lib/xtream";
import { Play, Film, Tv2 } from "lucide-react";
import { VideoPlayer, PlayerSource } from "@/components/VideoPlayer";
import { toast } from "sonner";

interface Props {
  kind: "vod" | "series";
}

export function VodSeriesTab({ kind }: Props) {
  const { activeAccount, t } = useApp();
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<(VodStream | SeriesItem)[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<PlayerSource | null>(null);

  useEffect(() => {
    if (!activeAccount) return;
    let ok = true;
    setLoading(true);
    const load =
      kind === "vod"
        ? Promise.all([
            xtream.getVodCategories(activeAccount),
            xtream.getVodStreams(activeAccount),
          ])
        : Promise.all([
            xtream.getSeriesCategories(activeAccount),
            xtream.getSeries(activeAccount),
          ]);
    load
      .then(([c, it]) => {
        if (!ok) return;
        setCats(Array.isArray(c) ? c : []);
        setItems(Array.isArray(it) ? it : []);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => ok && setLoading(false));
    return () => {
      ok = false;
    };
  }, [activeAccount, kind]);

  const filtered = useMemo(() => {
    if (activeCat === "all") return items;
    return items.filter((x) => x.category_id === activeCat);
  }, [items, activeCat]);

  const openItem = async (item: VodStream | SeriesItem) => {
    if (!activeAccount) return;
    if (kind === "vod") {
      const vod = item as VodStream;
      try {
        const info = await xtream.getVodInfo(activeAccount, vod.stream_id);
        const ext = info?.movie_data?.container_extension || "mp4";
        setPlayer({
          url: buildVodStreamUrl(activeAccount, vod.stream_id, ext),
          title: vod.name,
        });
      } catch {
        setPlayer({
          url: buildVodStreamUrl(activeAccount, vod.stream_id),
          title: vod.name,
        });
      }
    } else {
      const series = item as SeriesItem;
      try {
        const info = await xtream.getSeriesInfo(activeAccount, series.series_id);
        // pick first episode
        const seasons = Object.keys(info.episodes || {});
        if (seasons.length === 0) {
          toast.error("لا توجد حلقات متاحة");
          return;
        }
        const firstSeason = info.episodes[seasons[0]];
        const firstEp = firstSeason?.[0];
        if (!firstEp) {
          toast.error("لا توجد حلقات متاحة");
          return;
        }
        setPlayer({
          url: buildSeriesStreamUrl(
            activeAccount,
            firstEp.id,
            firstEp.container_extension || "mp4"
          ),
          title: `${series.name} - ${firstEp.title}`,
        });
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  };

  const Icon = kind === "vod" ? Film : Tv2;

  return (
    <div className="pb-20 pt-4">
      <div className="px-4">
        <h1 className="text-2xl font-black gold-text mb-3">
          {kind === "vod" ? t("movies") : t("series")}
        </h1>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
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

        {loading ? (
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
            {filtered.slice(0, 150).map((x) => {
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
                  onClick={() => openItem(x)}
                  className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-card border border-transparent hover:border-gold-dark transition hover:-translate-y-1 duration-300"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={x.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center bg-bg-tertiary">
                      <Icon className="w-10 h-10 text-gold-dark" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/95 to-transparent opacity-0 group-hover:opacity-100 transition">
                    <div className="flex items-center gap-1 text-xs text-white">
                      <Play className="w-3 h-3 text-gold" />
                      <span className="truncate">{x.name}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {player && (
        <VideoPlayer source={player} onClose={() => setPlayer(null)} />
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
