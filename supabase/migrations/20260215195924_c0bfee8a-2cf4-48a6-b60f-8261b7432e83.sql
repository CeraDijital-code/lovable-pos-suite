
-- Kategoriler tablosu
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON public.categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON public.categories FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete categories"
  ON public.categories FOR DELETE TO authenticated USING (true);

-- Ürünler tablosu (ulusal barkod sistemi)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'Adet',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete products"
  ON public.products FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Stok hareketleri tablosu (raporlama için)
CREATE TYPE public.stock_movement_type AS ENUM ('in', 'out', 'adjustment');

CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type public.stock_movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL DEFAULT 0,
  new_stock INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock movements"
  ON public.stock_movements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert stock movements"
  ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (true);

-- Varsayılan kategorileri ekle
INSERT INTO public.categories (name, description) VALUES
  ('Bira', 'Bira çeşitleri'),
  ('Viski', 'Viski çeşitleri'),
  ('Votka', 'Votka çeşitleri'),
  ('Rakı', 'Rakı çeşitleri'),
  ('Şarap', 'Şarap çeşitleri'),
  ('Sigara', 'Sigara çeşitleri'),
  ('Enerji İçeceği', 'Enerji içecekleri'),
  ('Alkolsüz İçecek', 'Alkolsüz içecekler'),
  ('Atıştırmalık', 'Atıştırmalık ürünler'),
  ('Diğer', 'Diğer ürünler');
