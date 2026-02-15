
-- Kategoriler: sadece authenticated kullanıcılar erişebilir (RESTRICTIVE -> PERMISSIVE düzeltme)
DROP POLICY "Authenticated users can insert categories" ON public.categories;
DROP POLICY "Authenticated users can update categories" ON public.categories;
DROP POLICY "Authenticated users can delete categories" ON public.categories;
DROP POLICY "Authenticated users can insert stock movements" ON public.stock_movements;

DROP POLICY "Authenticated users can insert products" ON public.products;
DROP POLICY "Authenticated users can update products" ON public.products;
DROP POLICY "Authenticated users can delete products" ON public.products;

-- Profiles tablosundaki eski RESTRICTIVE politikaları da düzeltelim
DROP POLICY IF EXISTS "Service role can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Yeniden oluştur - PERMISSIVE olarak
CREATE POLICY "Auth users can insert categories"
  ON public.categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth users can update categories"
  ON public.categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth users can delete categories"
  ON public.categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users can insert products"
  ON public.products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth users can update products"
  ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth users can delete products"
  ON public.products FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth users can insert stock movements"
  ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (true);

-- Profiles için service_role politikaları yeniden
CREATE POLICY "Service role manages profiles insert"
  ON public.profiles FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role manages profiles delete"
  ON public.profiles FOR DELETE TO service_role USING (true);
