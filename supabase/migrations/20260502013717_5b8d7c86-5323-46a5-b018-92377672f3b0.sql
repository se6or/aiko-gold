CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own history"
ON public.search_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own history"
ON public.search_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own history"
ON public.search_history FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_search_history_user_created
ON public.search_history(user_id, created_at DESC);

CREATE INDEX idx_search_history_user_query_scope
ON public.search_history(user_id, query, scope);