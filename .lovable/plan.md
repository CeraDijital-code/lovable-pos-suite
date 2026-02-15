

# Sadakat Programi - Tam Fonksiyonel Uygulama Plani

## 1. Veritabani Degisiklikleri

Asagidaki tablolar olusturulacak:

### `loyalty_customers` - Sadakat Musterileri
| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | uuid (PK) | Birincil anahtar |
| full_name | text | Musteri adi |
| phone | text (unique) | Telefon numarasi (SMS OTP icin) |
| qr_code | text (unique) | Benzersiz QR kod |
| total_points | integer (default 0) | Mevcut puan bakiyesi |
| total_spent | numeric (default 0) | Toplam harcama |
| total_visits | integer (default 0) | Ziyaret sayisi |
| is_active | boolean (default true) | Aktif/Pasif |
| created_at | timestamptz | Kayit tarihi |

### `loyalty_point_rules` - Puan Kazanim Kurallari
| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | uuid (PK) | Birincil anahtar |
| name | text | Kural adi |
| type | text | "genel" (TL basina), "urun" (urun bazli), "ozel_gun" (gun bazli ozel) |
| points_per_tl | numeric (default 0) | Her X TL'ye kac puan (genel tip icin) |
| product_id | uuid (nullable) | Hangi urune ozel (urun tipi icin) |
| min_quantity | integer (default 1) | Minimum alim adedi |
| bonus_points | integer (default 0) | Kazanilacak bonus puan |
| valid_days | text[] (nullable) | Gecerli gunler - ornegin ["monday","friday"] |
| start_date | date | Baslangic tarihi |
| end_date | date | Bitis tarihi |
| is_active | boolean (default true) | Aktif mi |
| created_at | timestamptz | Olusturulma |

### `loyalty_transactions` - Puan Islem Gecmisi
| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | uuid (PK) | Birincil anahtar |
| customer_id | uuid (FK) | Musteri |
| sale_id | uuid (nullable) | Satis referansi |
| type | text | "earn" veya "redeem" |
| points | integer | Puan miktari |
| description | text | Aciklama |
| created_by | uuid (nullable) | Islemi yapan kasiyer |
| created_at | timestamptz | Islem zamani |

### `otp_verifications` - SMS OTP Kayitlari
| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | uuid (PK) | Birincil anahtar |
| phone | text | Telefon numarasi |
| code | text | 6 haneli OTP kodu |
| purpose | text | "login" veya "redeem" |
| expires_at | timestamptz | Son gecerlilik |
| verified | boolean (default false) | Dogrulandi mi |
| created_at | timestamptz | Olusturulma |

### `sales` tablosuna ekleme:
- `loyalty_customer_id` (uuid, nullable) - Satisa bagli sadakat musterisi
- `points_earned` (integer, default 0) - Kazanilan puan
- `points_redeemed` (integer, default 0) - Harcanan puan

Tum tablolara authenticated kullanicilar icin RLS politikalari eklenecek.

## 2. Edge Function: `send-otp`

SMS OTP gondermek icin bir backend fonksiyonu olusturulacak. Bu fonksiyon:
- Telefon numarasina 6 haneli rastgele kod uretir
- `otp_verifications` tablosuna kaydeder (5 dakika gecerlilik)
- Gercek SMS entegrasyonu icin bir SMS saglayici (Twilio, Netgsm vb.) gerekecek. Baslangicta kod sadece veritabanina yazilacak ve konsola loglanacak; SMS saglayici baglantisi icin kullaniciya sorulacak
- `purpose` parametresi: "login" (mobil giris) veya "redeem" (puan harcama)

### Edge Function: `verify-otp`

- Telefon + kod + purpose alir
- `otp_verifications` tablosundan dogrular (suresi dolmamis, kullanilmamis)
- "login" icin: loyalty_customers tablosundan musteriyi dondurur
- "redeem" icin: dogrulama sonucu dondurur, kasada puan harcama islemine izin verir

## 3. Yeni Sayfa: Sadakat Yonetimi (`/sadakat`)

### 3a. Musteri Yonetim Paneli
- Musteri listesi (arama, telefon/isim ile filtreleme)
- Yeni musteri ekleme formu (ad + telefon)
- Her musteriye otomatik QR kod uretimi
- Musteri detay karti: puan bakiyesi, toplam harcama, ziyaret sayisi, islem gecmisi
- QR kod goruntuleme ve yazdirma (qrcode npm paketi ile SVG olusturma)

### 3b. Puan Kazanim Kurallari Yonetimi
Bu ekran uc tip kural destekleyecek:

1. **Genel Kural**: "Her X TL harcamaya Y puan" (ornegin her 1 TL = 1 puan)
2. **Urun Bazli Kural**: "X urununden Y adet alana Z puan" (ornegin Efes Pilsen 3 adet alana 50 puan)
3. **Ozel Gun Kurali**: "X urununu Y gununde alana Z bonus puan" (ornegin Cuma gunleri Efes alana ekstra 20 puan)

Kural olusturma formu:
- Tip secimi (gorsel kartlar ile)
- Urun secimi (barkod okuma destekli, urun bazli ve ozel gun kurallari icin)
- Tarih araligi
- Aktif/pasif durumu
- Kural listesi (kart gorunumu, duzenle/sil)

## 4. Kasa Entegrasyonu

### 4a. Musteri Secimi
- Kasa ekraninin ust kisminda "Sadakat Musterisi" alani
- Telefon numarasi ile arama veya QR kod okutma
- Secili musterinin adi ve puan bakiyesi gosterimi
- Musteri kaldir butonu

### 4b. Puan Kazanma (Otomatik)
- Satis tamamlandiginda, aktif puan kurallari kontrol edilir
- Genel kural: toplam tutar uzerinden puan hesaplanir
- Urun bazli kural: sepetteki urunler kontrol edilir, minimum adet saglananlar icin bonus puan eklenir
- Ozel gun kurali: bugunun gunu kontrol edilir, eslesen urunler icin ekstra puan eklenir
- Tum puanlar toplanir ve `loyalty_transactions` tablosuna "earn" olarak kaydedilir
- Musteri `total_points` guncellenir

### 4c. Puanla Odeme
- Odeme butunlari arasina "Puanla Ode" secenegi eklenir
- Puan/TL cevrim orani: ornegin 100 puan = 1 TL (ayarlanabilir)
- Puanla odeme secildiginde SMS OTP dogrulama modali acilir:
  1. Musterinin telefonuna OTP gonderilir (send-otp edge function)
  2. Kasiyer OTP kodunu girer
  3. verify-otp ile dogrulanir
  4. Dogrulama basariliysa puan dusumu yapilir
- Parcali odemede de puan kullanimi desteklenir

## 5. Mobil Uygulama Altyapisi

Sistem su sekilde mobil uygulamaya hazir olacak:

- `loyalty_customers` tablosunda `phone` ve `qr_code` alanlari mobil giris ve tanima icin kullanilacak
- `send-otp` ve `verify-otp` edge function'lari mobil uygulama tarafindan da cagrilabilecek
- Mobil uygulama akisi:
  1. Kullanici telefon numarasini girer
  2. `send-otp` cagirilir (purpose: "login")
  3. SMS ile gelen kodu girer
  4. `verify-otp` ile dogrulanir
  5. Musteri bilgileri ve QR kodu gosterilir
- OTP tablosu ve edge function'lar hem POS hem mobil icin ortak kullanilacak

## 6. Navigasyon ve Routing

- `Navbar.tsx`: navItems dizisine `{ label: "Sadakat", path: "/sadakat", icon: Heart }` eklenir
- `App.tsx`: `/sadakat` route'u `LoyaltyPage` icin eklenir

## 7. Yeni Hook: `useLoyalty.tsx`

- `useLoyaltyCustomers()` - Musteri listesi
- `useCreateLoyaltyCustomer()` - Yeni musteri
- `useUpdateLoyaltyCustomer()` - Musteri guncelleme
- `useLoyaltyPointRules()` - Puan kurallari listesi
- `useCreatePointRule()` - Yeni kural
- `useUpdatePointRule()` / `useDeletePointRule()` - Kural CRUD
- `useLoyaltyTransactions(customerId)` - Islem gecmisi
- `calculateEarnedPoints(cartItems, rules)` - Sepetten kazanilacak puan hesabi
- `useRedeemPoints()` - Puan harcama (OTP dogrulama sonrasi)

## 8. Yeni Paket

- `qrcode` npm paketi: Musteri QR kod uretimi icin

## 9. Dosya Degisiklikleri Ozeti

| Dosya | Islem |
|-------|-------|
| Migration SQL | Yeni: 4 tablo + sales guncelleme |
| `src/hooks/useLoyalty.tsx` | Yeni: Tum sadakat hook'lari |
| `src/pages/LoyaltyPage.tsx` | Yeni: Sadakat yonetim sayfasi |
| `supabase/functions/send-otp/index.ts` | Yeni: OTP gonderme |
| `supabase/functions/verify-otp/index.ts` | Yeni: OTP dogrulama |
| `src/pages/CashRegisterPage.tsx` | Guncelleme: Musteri secimi, puan kazanma/harcama, OTP modali |
| `src/hooks/useSales.tsx` | Guncelleme: loyalty_customer_id, puan islemleri |
| `src/components/Navbar.tsx` | Guncelleme: Sadakat linki |
| `src/App.tsx` | Guncelleme: /sadakat route |

## 10. SMS Saglayici Notu

Gercek SMS gonderimi icin bir SMS API saglayicisi gereklidir (Twilio, Netgsm, Iletimerkezi vb.). Baslangicta OTP kodlari:
- Edge function loglarinda gorunecek
- Veritabaninda `otp_verifications` tablosunda saklanacak
- Kasada test amacli olarak "Son gonderilen kod" bilgisi gelistirici modunda gosterilebilir

SMS entegrasyonu icin kullanicidan API anahtari istenecek ve backend'e guvenli sekilde eklenecektir.

