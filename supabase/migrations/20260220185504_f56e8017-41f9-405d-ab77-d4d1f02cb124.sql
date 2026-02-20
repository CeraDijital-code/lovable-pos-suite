
-- Cash register sessions table for daily cash register activity
CREATE TABLE public.cash_register_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opened_by UUID NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opening_amount NUMERIC NOT NULL DEFAULT 0,
  closed_at TIMESTAMPTZ,
  closing_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_register_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Auth users can view cash_register_sessions"
ON public.cash_register_sessions FOR SELECT USING (true);

CREATE POLICY "Auth users can insert cash_register_sessions"
ON public.cash_register_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Auth users can update cash_register_sessions"
ON public.cash_register_sessions FOR UPDATE USING (true) WITH CHECK (true);
