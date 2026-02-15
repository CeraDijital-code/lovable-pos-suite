
-- Role-page permissions table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  page_path text NOT NULL,
  page_label text NOT NULL,
  page_description text NOT NULL DEFAULT '',
  allowed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, page_path)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Authenticated users can view role_permissions"
ON public.role_permissions FOR SELECT TO authenticated
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert role_permissions"
ON public.role_permissions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update role_permissions"
ON public.role_permissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete role_permissions"
ON public.role_permissions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default permissions for all roles and pages
-- Pages: /, /stok, /kampanyalar, /kasa, /raporlar, /stok-raporu, /sadakat, /personel, /ayarlar
-- admin gets all, others get specific pages

INSERT INTO public.role_permissions (role, page_path, page_label, page_description, allowed) VALUES
-- admin (all allowed)
('admin', '/', 'Dashboard', 'Ana kontrol paneli', true),
('admin', '/stok', 'Stok Yönetimi', 'Ürün ve stok yönetimi', true),
('admin', '/kampanyalar', 'Kampanyalar', 'Kampanya oluşturma ve yönetimi', true),
('admin', '/kasa', 'Kasa', 'Satış ve kasa işlemleri', true),
('admin', '/raporlar', 'Raporlar', 'Satış ve finansal raporlar', true),
('admin', '/stok-raporu', 'Stok Raporu', 'Stok hareket raporları', true),
('admin', '/sadakat', 'Sadakat', 'Müşteri sadakat programı', true),
('admin', '/personel', 'Personel', 'Personel ve yetki yönetimi', true),
('admin', '/ayarlar', 'Ayarlar', 'Sistem ayarları', true),
-- kasiyer
('kasiyer', '/', 'Dashboard', 'Ana kontrol paneli', true),
('kasiyer', '/stok', 'Stok Yönetimi', 'Ürün ve stok yönetimi', false),
('kasiyer', '/kampanyalar', 'Kampanyalar', 'Kampanya oluşturma ve yönetimi', true),
('kasiyer', '/kasa', 'Kasa', 'Satış ve kasa işlemleri', true),
('kasiyer', '/raporlar', 'Raporlar', 'Satış ve finansal raporlar', false),
('kasiyer', '/stok-raporu', 'Stok Raporu', 'Stok hareket raporları', false),
('kasiyer', '/sadakat', 'Sadakat', 'Müşteri sadakat programı', true),
('kasiyer', '/personel', 'Personel', 'Personel ve yetki yönetimi', false),
('kasiyer', '/ayarlar', 'Ayarlar', 'Sistem ayarları', false),
-- depocu
('depocu', '/', 'Dashboard', 'Ana kontrol paneli', true),
('depocu', '/stok', 'Stok Yönetimi', 'Ürün ve stok yönetimi', true),
('depocu', '/kampanyalar', 'Kampanyalar', 'Kampanya oluşturma ve yönetimi', false),
('depocu', '/kasa', 'Kasa', 'Satış ve kasa işlemleri', false),
('depocu', '/raporlar', 'Raporlar', 'Satış ve finansal raporlar', false),
('depocu', '/stok-raporu', 'Stok Raporu', 'Stok hareket raporları', true),
('depocu', '/sadakat', 'Sadakat', 'Müşteri sadakat programı', false),
('depocu', '/personel', 'Personel', 'Personel ve yetki yönetimi', false),
('depocu', '/ayarlar', 'Ayarlar', 'Sistem ayarları', false),
-- muhasebe
('muhasebe', '/', 'Dashboard', 'Ana kontrol paneli', true),
('muhasebe', '/stok', 'Stok Yönetimi', 'Ürün ve stok yönetimi', false),
('muhasebe', '/kampanyalar', 'Kampanyalar', 'Kampanya oluşturma ve yönetimi', false),
('muhasebe', '/kasa', 'Kasa', 'Satış ve kasa işlemleri', false),
('muhasebe', '/raporlar', 'Raporlar', 'Satış ve finansal raporlar', true),
('muhasebe', '/stok-raporu', 'Stok Raporu', 'Stok hareket raporları', true),
('muhasebe', '/sadakat', 'Sadakat', 'Müşteri sadakat programı', false),
('muhasebe', '/personel', 'Personel', 'Personel ve yetki yönetimi', false),
('muhasebe', '/ayarlar', 'Ayarlar', 'Sistem ayarları', false);
