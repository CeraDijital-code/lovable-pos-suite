
-- Store settings: single-row key-value config table
CREATE TABLE public.store_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name text NOT NULL DEFAULT '',
  store_address text NOT NULL DEFAULT '',
  store_phone text NOT NULL DEFAULT '',
  tax_number text NOT NULL DEFAULT '',
  tax_office text NOT NULL DEFAULT '',
  logo_light_url text,
  logo_dark_url text,
  receipt_header text NOT NULL DEFAULT '',
  receipt_footer text NOT NULL DEFAULT '',
  currency_symbol text NOT NULL DEFAULT '₺',
  points_per_tl numeric NOT NULL DEFAULT 1,
  min_stock_alert boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view settings
CREATE POLICY "Authenticated users can view store_settings"
  ON public.store_settings FOR SELECT
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can update store_settings"
  ON public.store_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert store_settings"
  ON public.store_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a default row
INSERT INTO public.store_settings (store_name) VALUES ('Tekel Bayii');
