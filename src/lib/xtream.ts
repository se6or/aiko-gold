import { supabase } from "@/integrations/supabase/client";

export interface XtreamAccount {
  id: string;
  name: string;
  server: string;
  username: string;
  password: string;
  createdAt: number;
}

export interface XtreamUserInfo {
  username: string;
  status: string;
  exp_date: string | null;
  max_connections: string;
  active_cons: string;
  created_at: string;
  is_trial: string;
}

export interface XtreamServerInfo {
  url: string;
  port: string;
  https_port: string;
  server_protocol: string;
  timezone: string;
}

export interface LiveStream {
  stream_id: number;
  name: string;
  stream_icon: string;
  category_id: string;
  epg_channel_id?: string;
  tv_archive?: number;
  tv_archive_duration?: number;
}

export interface VodStream {
  stream_id: number;
  name: string;
  stream_icon: string;
  category_id: string;
  rating: string;
  rating_5based?: number;
  year?: string;
  added?: string;
}

export interface SeriesItem {
  series_id: number;
  name: string;
  cover: string;
  category_id: string;
  plot?: string;
  rating?: string;
  rating_5based?: number;
  releaseDate?: string;
  genre?: string;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

async function callProxy<T = unknown>(
  account: XtreamAccount,
  action?: string,
  params?: Record<string, string | number>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("xtream-proxy", {
    body: {
      server: account.server,
      username: account.username,
      password: account.password,
      action,
      params,
    },
  });
  if (error) throw new Error(error.message);
  if (data && typeof data === "object" && "error" in data) {
    throw new Error(String((data as { error: string }).error));
  }
async function callProxy<T = unknown>(
  account: XtreamAccount,
  action?: string,
  params?: Record<string, string | number>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("xtream-proxy", {
    body: {
      server: account.server,
      username: account.username,
      password: account.password,
      action,
      params,
    },
  });
  if (error) throw new Error(error.message);
  if (data && typeof data === "object" && "error" in data) {
    throw new Error(String((data as { error: string }).error));
  }
  return data as T;
}

// Lightweight in-memory cache to make tab switches instant.
// Keyed per-account+action+params. Lives for the session.
const memCache = new Map<string, { ts: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheKey(
  a: XtreamAccount,
  action?: string,
  params?: Record<string, string | number>
) {
  return `${a.id}|${action || "_auth"}|${JSON.stringify(params || {})}`;
}

async function cachedCall<T>(
  a: XtreamAccount,
  action?: string,
  params?: Record<string, string | number>
): Promise<T> {
  const key = cacheKey(a, action, params);
  const hit = memCache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data as T;
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = callProxy<T>(a, action, params)
    .then((d) => {
      memCache.set(key, { ts: Date.now(), data: d });
      inflight.delete(key);
      return d;
    })
    .catch((e) => {
      inflight.delete(key);
      throw e;
    });
  inflight.set(key, p);
  return p;
}

export const xtream = {
  authenticate: (account: XtreamAccount) =>
    callProxy<{
      user_info: XtreamUserInfo;
      server_info: XtreamServerInfo;
    }>(account),

  getLiveCategories: (a: XtreamAccount) =>
    cachedCall<Category[]>(a, "get_live_categories"),

  getLiveStreams: (a: XtreamAccount, categoryId?: string) =>
    cachedCall<LiveStream[]>(
      a,
      "get_live_streams",
      categoryId ? { category_id: categoryId } : undefined
    ),

  getVodCategories: (a: XtreamAccount) =>
    cachedCall<Category[]>(a, "get_vod_categories"),

  getVodStreams: (a: XtreamAccount, categoryId?: string) =>
    cachedCall<VodStream[]>(
      a,
      "get_vod_streams",
      categoryId ? { category_id: categoryId } : undefined
    ),

  getSeriesCategories: (a: XtreamAccount) =>
    cachedCall<Category[]>(a, "get_series_categories"),

  getSeries: (a: XtreamAccount, categoryId?: string) =>
    cachedCall<SeriesItem[]>(
      a,
      "get_series",
      categoryId ? { category_id: categoryId } : undefined
    ),

  getSeriesInfo: (a: XtreamAccount, seriesId: number) =>
    callProxy<{
      seasons?: Array<{
        season_number: number;
        name: string;
        cover?: string;
      }>;
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
      episodes: Record<
        string,
        Array<{
          id: string;
          episode_num: number;
          title: string;
          container_extension: string;
          info?: { movie_image?: string; plot?: string; duration?: string };
        }>
      >;
    }>(a, "get_series_info", { series_id: seriesId }),

  getVodInfo: (a: XtreamAccount, vodId: number) =>
    callProxy<{
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
    }>(a, "get_vod_info", { vod_id: vodId }),
};

export function normalizeServer(server: string): string {
  let s = server.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(s)) s = "http://" + s;
  return s;
}

export function buildLiveStreamUrl(
  account: XtreamAccount,
  streamId: number,
  extension: "m3u8" | "ts" = "m3u8"
): string {
  const base = normalizeServer(account.server);
  const path =
    extension === "m3u8"
      ? `live/${account.username}/${account.password}/${streamId}.m3u8`
      : `live/${account.username}/${account.password}/${streamId}.ts`;
  return `${base}/${path}`;
}

export function buildVodStreamUrl(
  account: XtreamAccount,
  streamId: number,
  ext = "mp4"
): string {
  const base = normalizeServer(account.server);
  return `${base}/movie/${account.username}/${account.password}/${streamId}.${ext}`;
}

export function buildSeriesStreamUrl(
  account: XtreamAccount,
  episodeId: string | number,
  ext = "mp4"
): string {
  const base = normalizeServer(account.server);
  return `${base}/series/${account.username}/${account.password}/${episodeId}.${ext}`;
}
