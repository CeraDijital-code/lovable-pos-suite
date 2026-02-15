
-- Campaign type enum
CREATE TYPE public.campaign_type AS ENUM ('x_al_y_ode', 'x_alana_y_indirim', 'yuzde_indirim');

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type campaign_type NOT NULL,
  -- For x_al_y_ode: buy X pay Y
  buy_quantity INTEGER DEFAULT 0,
  pay_quantity INTEGER DEFAULT 0,
  -- For yuzde_indirim: discount percentage
  discount_percent NUMERIC DEFAULT 0,
  -- For x_alana_y_indirim: buy X of source, get discount on target
  source_buy_quantity INTEGER DEFAULT 0,
  target_discount_percent NUMERIC DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campaign products junction table
CREATE TABLE public.campaign_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'source', -- 'source' or 'target' for x_alana_y_indirim
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, product_id, role)
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaigns
CREATE POLICY "Authenticated users can view campaigns" ON public.campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete campaigns" ON public.campaigns FOR DELETE TO authenticated USING (true);

-- RLS policies for campaign_products
CREATE POLICY "Authenticated users can view campaign_products" ON public.campaign_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert campaign_products" ON public.campaign_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can delete campaign_products" ON public.campaign_products FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
