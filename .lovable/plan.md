
# Tedarikci Modulu - Kapsamli Yol Haritasi

## Genel Bakis

Tedarikci Modulu, tedarikci yonetimi, irsaliye/fatura yukleme (PDF/gorsel), yapay zeka ile otomatik urun tanima, stok girisi ve cari hesap (borc/alacak) takibini tek bir modulde birlestiren kapsamli bir cozumdur.

## Faz 1: Temel Altyapi (Tedarikci ve Irsaliye Yonetimi)

### 1.1 Veritabani Tablolari

- **suppliers**: Tedarikci bilgileri (ad, vergi no, telefon, adres, iban, yetkili kisi, notlar, aktif/pasif)
- **supplier_invoices**: Irsaliye/fatura kayitlari (tedarikci_id, belge no, tarih, toplam tutar, KDV, durum [beklemede/onaylandi/iptal], dosya URL, not)
- **supplier_invoice_items**: Irsaliye kalemleri (irsaliye_id, urun_id, urun_adi, barkod, miktar, birim fiyat, toplam, KDV orani)
- **supplier_payments**: Odeme kayitlari (tedarikci_id, irsaliye_id [opsiyonel], tutar, odeme tarihi, odeme yontemi, aciklama)
- **supplier_documents**: Ek belgeler (tedarikci_id, dosya_url, dosya_adi, dosya_tipi, yuklenme tarihi)

### 1.2 Tedarikci CRUD Islemleri

- Tedarikci ekleme, duzenleme, silme (soft delete)
- Tedarikci arama ve filtreleme
- Tedarikci detay sayfasi (ozet bilgiler, cari bakiye, son islemler)

## Faz 2: Irsaliye/Fatura Yukleme ve AI ile Otomatik Tanima

### 2.1 Belge Yukleme

- PDF ve gorsel (JPG, PNG) yukleme destegi (Lovable Cloud Storage)
- Yuklenen belgelerin onizleme ve arsivlenmesi
- Coklu dosya yukleme destegi

### 2.2 AI ile Otomatik Urun Tanima

- Yuklenen irsaliye gorseli/PDF'i Lovable AI destekli modeller (google/gemini-2.5-flash) ile analiz edilir
- AI, belgeden urun adlari, miktarlar, birim fiyatlar ve toplam tutarlari cikarir
- Cikartilan veriler mevcut urun veritabaniyla eslestirilir (barkod veya isim benzerligi)
- Eslesmeyenler icin "Yeni urun olustur" veya "Manuel esle" secenegi sunulur
- Kullanici onayindan sonra toplu stok girisi yapilir

### 2.3 Stok Girisi Entegrasyonu

- Onaylanan irsaliye kalemleri otomatik olarak `stock_movements` tablosuna "in" hareketi olarak kaydedilir
- `products` tablosundaki stok miktarlari guncellenir
- Irsaliye ile stok hareketi arasinda referans baglantisi tutulur

## Faz 3: Cari Hesap (Borc/Alacak Takibi)

### 3.1 Cari Bakiye Hesaplama

- Her tedarikci icin toplam borc (onaylanan irsaliyeler) ve toplam odeme takibi
- Canli bakiye gosterimi: `Toplam Borc - Toplam Odeme = Kalan Borc`
- Vadesi gecmis borclar icin uyari sistemi

### 3.2 Odeme Kaydi

- Nakit, havale/EFT, kredi karti, cek ile odeme girisi
- Parcali odeme destegi (bir irsaliyeye birden fazla odeme)
- Serbest odeme (belirli bir irsaliyeye baglanmayan genel odeme)

### 3.3 Cari Ekstre

- Tarih araligina gore tedarikci bazli ekstre raporu
- PDF olarak ekstre indirme (jsPDF ile)

## Faz 4: Raporlama ve Analitik

### 4.1 Tedarikci Raporlari

- En cok alim yapilan tedarikcilar (tutara ve kaleme gore)
- Aylik/haftalik tedarikci bazli alisveris trendi (recharts grafikleri)
- Odenmemis borc ozeti ve vade analizi
- Urun bazli tedarikci karsilastirmasi (ayni urunu hangi tedarikci daha uygun sunuyor)

### 4.2 Maliyet Analizi

- Urun maliyet fiyati degisim gecmisi (tedarikci irsaliyelerinden otomatik)
- Kar marji analizi: Satis fiyati vs son alis fiyati karsilastirmasi

## Faz 5: Gelismis Ozellikler

### 5.1 Otomatik Siparis Onerisi

- Min stok seviyesinin altina dusen urunler icin tedarikci bazli siparis onerisi
- Onceki alimlara gore tercih edilen tedarikci ve miktar onerisi

### 5.2 Tedarikci Performans Degerlendirmesi

- Teslimat suresi takibi
- Fiyat istikrari skoru
- Urun kalitesi puanlamasi (kullanici girdisi ile)

### 5.3 Bildirim Sistemi

- Vadesi yaklasan odemeler icin hatirlatma
- Yeni irsaliye yuklendigi zaman ilgili kullanicilara bildirim

---

## Teknik Detaylar

### Veritabani Semasi

```text
suppliers
  id (uuid, PK)
  name (text, NOT NULL)
  tax_number (text)
  tax_office (text)
  phone (text)
  email (text)
  address (text)
  contact_person (text)
  iban (text)
  notes (text)
  is_active (boolean, default true)
  created_at, updated_at

supplier_invoices
  id (uuid, PK)
  supplier_id (uuid, FK -> suppliers)
  invoice_number (text)
  invoice_date (date)
  due_date (date)
  subtotal (numeric)
  tax_amount (numeric)
  total (numeric)
  status (text: pending/approved/cancelled)
  document_url (text)
  notes (text)
  created_by (uuid)
  created_at, updated_at

supplier_invoice_items
  id (uuid, PK)
  invoice_id (uuid, FK -> supplier_invoices)
  product_id (uuid, FK -> products, nullable)
  product_name (text)
  barcode (text)
  quantity (integer)
  unit_price (numeric)
  tax_rate (numeric, default 0)
  total (numeric)

supplier_payments
  id (uuid, PK)
  supplier_id (uuid, FK -> suppliers)
  invoice_id (uuid, FK -> supplier_invoices, nullable)
  amount (numeric)
  payment_date (date)
  payment_method (text)
  description (text)
  created_by (uuid)
  created_at

supplier_documents
  id (uuid, PK)
  supplier_id (uuid, FK -> suppliers)
  file_url (text)
  file_name (text)
  file_type (text)
  created_at
```

### Yeni Dosyalar

- `src/pages/SuppliersPage.tsx` - Ana tedarikci sayfasi (tab yapisi)
- `src/hooks/useSuppliers.tsx` - Tedarikci CRUD hook'lari
- `src/hooks/useSupplierInvoices.tsx` - Irsaliye hook'lari
- `src/hooks/useSupplierPayments.tsx` - Odeme hook'lari
- `supabase/functions/parse-invoice/index.ts` - AI irsaliye analiz edge function

### Mevcut Dosyalarda Degisiklikler

- `src/App.tsx` - Yeni route ekleme (`/tedarikciler`)
- `src/components/Navbar.tsx` - Nav menusune "Tedarikciler" ekleme
- `src/config/rbac.ts` - `allPages` listesine yeni sayfa ekleme
- `src/integrations/supabase/types.ts` - Otomatik guncellenecek

### AI Irsaliye Analizi (Edge Function)

- Yuklenen PDF/gorsel Lovable Cloud Storage'a kaydedilir
- Edge function, dosyayi `google/gemini-2.5-flash` modeline gonderir
- Model, belgeden yapilandirilmis veri cikarir (urun adi, miktar, fiyat, KDV)
- Sonuc JSON olarak doner, frontend'de kullanici onayina sunulur

### Uygulama Onceligi

Faz 1 ve 2 birlikte uygulanacak (temel CRUD + irsaliye yukleme + AI tanima). Faz 3 (cari hesap) hemen ardindan eklenecek. Faz 4 ve 5 ileriki asamalarda gelistirilecek.
