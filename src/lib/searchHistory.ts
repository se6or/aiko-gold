import { supabase } from "@/integrations/supabase/client";
import { storage } from "./storage";

const MAX = 10;

/** Get history merged from cloud (if logged in) + local fallback. */
export async function loadSearchHistory(scope: string = "all"): Promise<string[]> {
  const { data: auth } = await supabase.auth.getUser();
  const local = storage.getSearchHistory();
  if (!auth.user) return local.slice(0, MAX);

  const { data, error } = await supabase
    .from("search_history")
    .select("query, created_at")
    .eq("user_id", auth.user.id)
    .eq("scope", scope)
    .order("created_at", { ascending: false })
    .limit(MAX);

  if (error || !data) return local.slice(0, MAX);

  // Merge: cloud first, then any local items not in cloud (legacy)
  const cloudList = data.map((r) => r.query);
  const merged = [...cloudList];
  for (const q of local) if (!merged.includes(q)) merged.push(q);
  return merged.slice(0, MAX);
}

/** Add a search term, persisted both locally and (if logged in) in the cloud. */
export async function addSearchHistory(q: string, scope: string = "all") {
  const v = q.trim();
  if (!v) return;
  storage.addSearchHistory(v);

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  // Upsert-like: delete same query then insert fresh row to refresh timestamp
  await supabase
    .from("search_history")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("scope", scope)
    .eq("query", v);

  await supabase.from("search_history").insert({
    user_id: auth.user.id,
    query: v,
    scope,
  });

  // Trim to MAX rows: keep newest, delete the rest
  const { data: rows } = await supabase
    .from("search_history")
    .select("id, created_at")
    .eq("user_id", auth.user.id)
    .eq("scope", scope)
    .order("created_at", { ascending: false });
  if (rows && rows.length > MAX) {
    const idsToDelete = rows.slice(MAX).map((r) => r.id);
    await supabase.from("search_history").delete().in("id", idsToDelete);
  }
}

export async function clearSearchHistory(scope: string = "all") {
  storage.clearSearchHistory();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase
    .from("search_history")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("scope", scope);
}
