
-- Loyalty Customers
CREATE TABLE public.loyalty_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL UNIQUE,
  qr_code text NOT NULL UNIQUE,
  total_points integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  total_visits integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view loyalty_customers" ON public.loyalty_customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert loyalty_customers" ON public.loyalty_customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update loyalty_customers" ON public.loyalty_customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete loyalty_customers" ON public.loyalty_customers FOR DELETE TO authenticated USING (true);

-- Loyalty Point Rules
CREATE TABLE public.loyalty_point_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'genel',
  points_per_tl numeric NOT NULL DEFAULT 0,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  min_quantity integer NOT NULL DEFAULT 1,
  bonus_points integer NOT NULL DEFAULT 0,
  valid_days text[] DEFAULT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_point_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view loyalty_point_rules" ON public.loyalty_point_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert loyalty_point_rules" ON public.loyalty_point_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update loyalty_point_rules" ON public.loyalty_point_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete loyalty_point_rules" ON public.loyalty_point_rules FOR DELETE TO authenticated USING (true);

-- Loyalty Transactions
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.loyalty_customers(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  type text NOT NULL,
  points integer NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by uuid DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view loyalty_transactions" ON public.loyalty_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert loyalty_transactions" ON public.loyalty_transactions FOR INSERT TO authenticated WITH CHECK (true);

-- OTP Verifications
CREATE TABLE public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  purpose text NOT NULL DEFAULT 'login',
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- OTP is managed by edge functions with service role, no direct client access needed
-- But allow authenticated users to read for POS display
CREATE POLICY "Auth users can view otp_verifications" ON public.otp_verifications FOR SELECT TO authenticated USING (true);

-- Add loyalty fields to sales
ALTER TABLE public.sales
  ADD COLUMN loyalty_customer_id uuid REFERENCES public.loyalty_customers(id) ON DELETE SET NULL,
  ADD COLUMN points_earned integer NOT NULL DEFAULT 0,
  ADD COLUMN points_redeemed integer NOT NULL DEFAULT 0;
