
-- Add KDV rate column to products table (default 20% for existing products)
ALTER TABLE public.products ADD COLUMN kdv_rate numeric NOT NULL DEFAULT 20;

-- Add comment for clarity
COMMENT ON COLUMN public.products.kdv_rate IS 'KDV (VAT) rate percentage: 1, 10, or 20';
