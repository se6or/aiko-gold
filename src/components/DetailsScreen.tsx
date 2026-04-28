import { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  Play,
  Star,
  Calendar,
  Clock,
  Film as FilmIcon,
  Plus,
  Check,
  Loader2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  xtream,
  VodStream,
  SeriesItem,
  buildVodStreamUrl,
  buildSeriesStreamUrl,
} from "@/lib/xtream";
import { storage } from "@/lib/storage";
import { VideoPlayer, PlayerSource } from "@/components/VideoPlayer";
import { toast } from "sonner";

type Kind = "vod" | "series";

interface Props {
  kind: Kind;
  item: VodStream | SeriesItem;
  onClose: () => void;
}

interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info?: { movie_image?: string; plot?: string; duration?: string };
}

interface VodDetails {
  info: {
    movie_image?: string;
    backdrop_path?: string[];
    plot?: string;
    cast?: string;
    director?: string;
    genre?: string;
    releasedate?: string;
    rating?: string;
    duration?: string;
  };
  movie_data: {
    stream_id: number;
    name: string;
    container_extension: string;
  };
}

interface SeriesDetails {
  seasons?: Array<{ season_number: number; name: string; cover?: string }>;
  info: {
    name: string;
    cover: string;
    plot: string;
    cast?: string;
    director?: string;
    genre?: string;
    releaseDate?: string;
    rating?: string;
    backdrop_path?: string[];
  };
  episodes: Record<string, Episode[]>;
}

export function DetailsScreen({ kind, item, onClose }: Props) {
  const { activeAccount, t } = useApp();
  const [loading, setLoading] = useState(true);
  const [vod, setVod] = useState<VodDetails | null>(null);
  const [series, setSeries] = useState<SeriesDetails | null>(null);
  const [activeSeason, setActiveSeason] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerSource | null>(null);
  const [isFav, setIsFav] = useState<boolean>(() => {
    const id =
      kind === "vod"
        ? (item as VodStream).stream_id
        : (item as SeriesItem).series_id;
    return storage.isFavorite(kind, id);
  });

  const itemName = item.name;
  const itemCover =
    kind === "vod"
      ? (item as VodStream).stream_icon
      : (item as SeriesItem).cover;

  // Load details
  useEffect(() => {
    if (!activeAccount) return;
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        if (kind === "vod") {
          const v = await xtream.getVodInfo(
            activeAccount,
            (item as VodStream).stream_id
          );
          if (!cancelled) setVod(v as VodDetails);
        } else {
          const s = await xtream.getSeriesInfo(
            activeAccount,
            (item as SeriesItem).series_id
          );
          if (!cancelled) {
            setSeries(s as SeriesDetails);
            const seasons = Object.keys(s.episodes || {});
            if (seasons.length > 0) setActiveSeason(seasons[0]);
          }
        }
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeAccount, kind, item]);

  const backdrop = useMemo(() => {
    if (kind === "vod") {
      return (
        vod?.info?.backdrop_path?.[0] ||
        vod?.info?.movie_image ||
        itemCover
      );
    }
    return (
      series?.info?.backdrop_path?.[0] || series?.info?.cover || itemCover
    );
  }, [kind, vod, series, itemCover]);

  const plot = kind === "vod" ? vod?.info?.plot : series?.info?.plot;
  const genre = kind === "vod" ? vod?.info?.genre : series?.info?.genre;
  const rating =
    kind === "vod" ? vod?.info?.rating : series?.info?.rating;
  const year =
    kind === "vod"
      ? vod?.info?.releasedate?.slice(0, 4)
      : series?.info?.releaseDate?.slice(0, 4);
  const duration = kind === "vod" ? vod?.info?.duration : undefined;

  const playVod = () => {
    if (!activeAccount || !vod) return;
    const ext = vod.movie_data?.container_extension || "mp4";
    setPlayer({
      url: buildVodStreamUrl(activeAccount, vod.movie_data.stream_id, ext),
      title: itemName,
    });
  };

  const playEpisode = (ep: Episode) => {
    if (!activeAccount) return;
    setPlayer({
      url: buildSeriesStreamUrl(
        activeAccount,
        ep.id,
        ep.container_extension || "mp4"
      ),
      title: `${itemName} — ${ep.title}`,
    });
  };

  const playFirstEpisode = () => {
    if (!series || !activeSeason) return;
    const first = series.episodes[activeSeason]?.[0];
    if (first) playEpisode(first);
  };

  const toggleFav = () => {
    const id =
      kind === "vod"
        ? (item as VodStream).stream_id
        : (item as SeriesItem).series_id;
    const added = storage.toggleFavorite({
      type: kind,
      id,
      name: itemName,
      icon: itemCover || "",
    });
    setIsFav(added);
    toast.success(added ? t("addToList") : t("removeFromList"));
  };

  const seasonKeys = series ? Object.keys(series.episodes || {}) : [];
  const currentEpisodes =
    series && activeSeason ? series.episodes[activeSeason] || [] : [];

  return (
    <div className="fixed inset-0 z-[11000] bg-bg-primary overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div className="relative h-[55vh] min-h-[320px] w-full">
        {backdrop ? (
          <img
            src={backdrop}
            alt={itemName}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-bg-tertiary to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-bg-primary/60 to-bg-primary" />

        <button
          onClick={onClose}
          className="absolute top-4 start-4 z-10 w-11 h-11 rounded-xl glass-dark border border-gold-dark/50 text-gold grid place-items-center hover:bg-gold-dark hover:text-black transition"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </button>

        {/* Big play button floating */}
        {!loading && (
          <button
            onClick={kind === "vod" ? playVod : playFirstEpisode}
            aria-label={t("play")}
            className="tap-target tap-target-lg absolute left-1/2 -translate-x-1/2 translate-y-1/2 bottom-0 z-30 grid place-items-center bg-transparent border-0 p-0 touch-manipulation"
          >
            {/* Visible button shape (unchanged across breakpoints) */}
            <span className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full gold-bg grid place-items-center text-black shadow-gold border-2 border-white/90 hover:scale-110 active:scale-95 transition">
              <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-black ms-1" />
            </span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative px-5 pb-24 -mt-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-10 h-10 text-gold animate-spin-gold" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-center text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] mb-4 px-2">
              {itemName}
            </h1>

            {/* Meta row */}
            <div className="flex justify-center items-center gap-5 flex-wrap mb-5">
              {rating && Number(rating) > 0 && (
                <Meta icon={<Star className="w-4 h-4 fill-gold" />}>
                  {Number(rating).toFixed(1)}
                </Meta>
              )}
              {year && (
                <Meta icon={<Calendar className="w-4 h-4" />}>{year}</Meta>
              )}
              {duration && (
                <Meta icon={<Clock className="w-4 h-4" />}>{duration}</Meta>
              )}
              {kind === "series" && seasonKeys.length > 0 && (
                <Meta icon={<FilmIcon className="w-4 h-4" />}>
                  {seasonKeys.length} {t("seasons")}
                </Meta>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 mb-6">
              <button
                onClick={kind === "vod" ? playVod : playFirstEpisode}
                className="flex items-center gap-2 px-7 py-3 rounded-full gold-bg text-black font-bold hover:scale-105 transition"
              >
                <Play className="w-4 h-4 fill-black" />
                {t("play")}
              </button>
              <button
                onClick={toggleFav}
                className={`flex items-center gap-2 px-5 py-3 rounded-full border-2 font-bold transition ${
                  isFav
                    ? "bg-gold-dark/20 border-gold text-gold"
                    : "bg-card/80 border-gold-dark/50 text-muted-foreground hover:border-gold hover:text-gold"
                }`}
              >
                {isFav ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t("removeFromList")}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {t("addToList")}
                  </>
                )}
              </button>
            </div>

            {/* Plot */}
            {plot && (
              <p className="text-sm text-muted-foreground leading-7 text-center max-w-2xl mx-auto mb-5">
                {plot}
              </p>
            )}

            {/* Genre tags */}
            {genre && (
              <div className="flex justify-center gap-2 flex-wrap mb-8">
                {genre
                  .split(/[,،/]/)
                  .map((g) => g.trim())
                  .filter(Boolean)
                  .slice(0, 6)
                  .map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 rounded-full bg-gold-dark/20 border border-gold-dark/40 text-gold text-xs font-bold"
                    >
                      {g}
                    </span>
                  ))}
              </div>
            )}

            {/* Seasons / Episodes */}
            {kind === "series" && seasonKeys.length > 0 && (
              <div className="mt-4">
                <h2 className="text-lg font-bold text-gold border-e-4 border-gold-dark pe-3 mb-4">
                  {t("seasons")}
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-3 mb-5">
                  {seasonKeys.map((sk) => {
                    const seasonMeta = series?.seasons?.find(
                      (s) => String(s.season_number) === sk
                    );
                    const cover =
                      seasonMeta?.cover ||
                      series?.episodes[sk]?.[0]?.info?.movie_image ||
                      itemCover;
                    return (
                      <button
                        key={sk}
                        onClick={() => setActiveSeason(sk)}
                        className={`shrink-0 w-24 text-center transition ${
                          activeSeason === sk ? "scale-105" : "opacity-70"
                        }`}
                      >
                        <div
                          className={`w-24 h-32 rounded-xl overflow-hidden border-2 ${
                            activeSeason === sk
                              ? "border-gold shadow-gold"
                              : "border-transparent"
                          } bg-card`}
                        >
                          {cover ? (
                            <img
                              src={cover}
                              alt={`Season ${sk}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-gold-dark">
                              <FilmIcon className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <span className="block mt-2 text-xs font-bold text-white">
                          {seasonMeta?.name || `Season ${sk}`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <h2 className="text-lg font-bold text-gold border-e-4 border-gold-dark pe-3 mb-3">
                  {t("episodes")}
                </h2>
                <div className="space-y-3">
                  {currentEpisodes.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => playEpisode(ep)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card/70 border border-white/5 hover:border-gold-dark hover:bg-card transition text-start"
                    >
                      <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-bg-tertiary shrink-0">
                        {ep.info?.movie_image ? (
                          <img
                            src={ep.info.movie_image}
                            alt={ep.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-gold-dark">
                            <Play className="w-6 h-6" />
                          </div>
                        )}
                        <span className="absolute inset-0 bg-black/40 grid place-items-center opacity-0 hover:opacity-100 transition">
                          <Play className="w-6 h-6 text-gold fill-gold" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {ep.episode_num}. {ep.title}
                        </div>
                        {ep.info?.duration && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {ep.info.duration}
                          </div>
                        )}
                        {ep.info?.plot && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {ep.info.plot}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {player && (
        <VideoPlayer source={player} onClose={() => setPlayer(null)} />
      )}
    </div>
  );
}

function Meta({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-white text-sm font-bold">
      <span className="text-gold">{icon}</span>
      {children}
    </div>
  );
}
