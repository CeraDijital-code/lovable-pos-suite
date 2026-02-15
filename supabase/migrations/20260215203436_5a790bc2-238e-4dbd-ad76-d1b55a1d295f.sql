
-- Add new campaign type
ALTER TYPE public.campaign_type ADD VALUE IF NOT EXISTS 'ozel_fiyat';

-- Add special_price column to campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS special_price NUMERIC DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS special_price_min_quantity INTEGER DEFAULT 0;
