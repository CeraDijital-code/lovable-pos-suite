
-- Add image_url to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Auth users can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Auth users can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Auth users can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images');

-- Sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number SERIAL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sale items table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  barcode TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  campaign_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Auth users can view sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth users can view sale_items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert sale_items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);
