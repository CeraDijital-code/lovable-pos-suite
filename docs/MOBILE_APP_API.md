# TekelPOS Mobil Uygulama API Dokümantasyonu

Bu dosya, TekelPOS ERP sistemi ile entegre çalışacak mobil uygulamanın geliştirilmesi için gerekli tüm API endpoint'lerini, veri modellerini ve iş akışlarını tanımlar.

## Bağlantı Bilgileri

```
SUPABASE_URL: (Lovable Cloud'dan alınır)
SUPABASE_ANON_KEY: (Lovable Cloud'dan alınır)
```

JavaScript/React Native client kurulumu:
```javascript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

## 1. Kimlik Doğrulama (SMS OTP)

### 1.1 OTP Gönder
Mobil giriş veya puan harcama işlemi için SMS OTP kodu gönderir.

**Edge Function:** `send-otp`

```javascript
const { data, error } = await supabase.functions.invoke('send-otp', {
  body: {
    phone: '+905551234567',    // Türkiye formatı
    purpose: 'login'           // 'login' | 'redeem'
  }
});

// Başarılı yanıt:
// { success: true, message: 'OTP gönderildi' }
```

### 1.2 OTP Doğrula
Gönderilen OTP kodunu doğrular.

**Edge Function:** `verify-otp`

```javascript
const { data, error } = await supabase.functions.invoke('verify-otp', {
  body: {
    phone: '+905551234567',
    code: '123456',
    purpose: 'login'
  }
});

// Başarılı yanıt (login):
// {
//   success: true,
//   customer: {
//     id: 'uuid',
//     full_name: 'Ahmet Yılmaz',
//     phone: '+905551234567',
//     qr_code: 'LYL-ABC12345',
//     total_points: 1250,
//     total_spent: 15000,
//     total_visits: 45,
//     is_active: true
//   }
// }

// Başarılı yanıt (redeem):
// { success: true, verified: true }
```

---

## 2. Müşteri Verileri

### 2.1 Müşteri Bilgileri
Telefon numarası veya QR kod ile müşteri sorgulama.

```javascript
// Telefon ile
const { data } = await supabase
  .from('loyalty_customers')
  .select('*')
  .eq('phone', '+905551234567')
  .single();

// QR kod ile
const { data } = await supabase
  .from('loyalty_customers')
  .select('*')
  .eq('qr_code', 'LYL-ABC12345')
  .single();
```

### 2.2 Müşteri Veri Modeli

```typescript
interface LoyaltyCustomer {
  id: string;              // UUID
  full_name: string;       // Müşteri adı
  phone: string;           // Telefon (unique)
  qr_code: string;         // QR kod (unique, format: LYL-XXXXX)
  total_points: number;    // Güncel puan bakiyesi
  total_spent: number;     // Toplam harcama (TL)
  total_visits: number;    // Toplam ziyaret
  is_active: boolean;      // Aktif durumu
  created_at: string;      // Kayıt tarihi (ISO 8601)
}
```

---

## 3. Puan İşlemleri

### 3.1 Puan Geçmişi
Müşterinin tüm puan kazanma ve harcama geçmişi.

```javascript
const { data } = await supabase
  .from('loyalty_transactions')
  .select('*')
  .eq('customer_id', 'müşteri-uuid')
  .order('created_at', { ascending: false })
  .limit(50);
```

### 3.2 Puan İşlem Modeli

```typescript
interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  sale_id: string | null;     // İlişkili satış (varsa)
  type: 'earn' | 'redeem';   // Kazanım veya harcama
  points: number;             // Puan miktarı
  description: string;        // Açıklama
  created_by: string | null;  // İşlemi yapan kasiyer
  created_at: string;
}
```

### 3.3 Aktif Puan Kuralları
Müşteriye gösterilecek aktif puan kuralları.

```javascript
const today = new Date().toISOString().split('T')[0];
const { data } = await supabase
  .from('loyalty_point_rules')
  .select('*, products(name, barcode, image_url)')
  .eq('is_active', true)
  .lte('start_date', today)
  .gte('end_date', today);
```

### 3.4 Puan Kuralı Modeli

```typescript
interface LoyaltyPointRule {
  id: string;
  name: string;
  type: 'genel' | 'urun' | 'ozel_gun';
  points_per_tl: number;       // Genel: X TL eşik değeri
  bonus_points: number;        // Kazanılacak puan
  product_id: string | null;   // Ürün bazlı kural (nullable)
  min_quantity: number;         // Minimum alım adedi
  valid_days: string[] | null;  // Geçerli günler ['monday', 'friday']
  start_date: string;
  end_date: string;
  is_active: boolean;
  products?: {                  // Join ile gelen ürün bilgisi
    name: string;
    barcode: string;
    image_url: string | null;
  };
}
```

---

## 4. Satış Geçmişi

### 4.1 Müşterinin Satışları
Sadakat müşterisine bağlı tüm satışlar.

```javascript
const { data } = await supabase
  .from('sales')
  .select(`
    *,
    sale_items(
      id, product_name, barcode, quantity,
      unit_price, discount, total, campaign_name
    )
  `)
  .eq('loyalty_customer_id', 'müşteri-uuid')
  .order('created_at', { ascending: false })
  .limit(20);
```

### 4.2 Satış Modeli

```typescript
interface Sale {
  id: string;
  sale_number: number;        // Otomatik artan fiş no
  payment_method: string;     // 'cash' | 'card' | 'points'
  subtotal: number;           // Ara toplam
  discount: number;           // İndirim tutarı
  total: number;              // Toplam tutar
  loyalty_customer_id: string | null;
  points_earned: number;      // Bu satıştan kazanılan puan
  points_redeemed: number;    // Bu satışta harcanan puan
  created_by: string | null;
  created_at: string;
  sale_items: SaleItem[];
}

interface SaleItem {
  id: string;
  product_name: string;
  barcode: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  campaign_name: string | null;
}
```

---

## 5. Kampanyalar

### 5.1 Aktif Kampanyalar
Müşteriye gösterilecek güncel kampanyalar.

```javascript
const today = new Date().toISOString().split('T')[0];
const { data } = await supabase
  .from('campaigns')
  .select(`
    *,
    campaign_products(
      role,
      products:product_id(id, name, barcode, price, image_url)
    )
  `)
  .eq('is_active', true)
  .lte('start_date', today)
  .gte('end_date', today);
```

### 5.2 Kampanya Tipleri

```typescript
type CampaignType =
  | 'x_al_y_ode'           // X Al Y Öde (örn: 3 al 2 öde)
  | 'x_alana_y_indirim'    // X alana Y'ye indirim
  | 'yuzde_indirim'        // Yüzde indirim
  | 'ozel_fiyat';          // Özel fiyat

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  buy_quantity: number | null;
  pay_quantity: number | null;
  discount_percent: number | null;
  special_price: number | null;
  special_price_min_quantity: number | null;
  source_buy_quantity: number | null;
  target_discount_percent: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  campaign_products: {
    role: string;   // 'source' | 'target'
    products: {
      id: string;
      name: string;
      barcode: string;
      price: number;
      image_url: string | null;
    };
  }[];
}
```

---

## 6. Ürünler

### 6.1 Ürün Listesi (Müşteri Görüntüleme)

```javascript
const { data } = await supabase
  .from('products')
  .select('id, name, barcode, price, image_url, categories(name)')
  .eq('is_active', true)
  .order('name');
```

### 6.2 Barkod ile Ürün Sorgulama

```javascript
const { data } = await supabase
  .from('products')
  .select('id, name, barcode, price, image_url, categories(name)')
  .eq('barcode', '8690000000001')
  .single();
```

---

## 7. Mobil Uygulama Akışları

### 7.1 Giriş Akışı
```
1. Kullanıcı telefon numarasını girer
2. send-otp çağrılır (purpose: 'login')
3. SMS ile gelen 6 haneli kodu girer
4. verify-otp çağrılır → müşteri bilgileri döner
5. QR kod ve puan bakiyesi gösterilir
```

### 7.2 QR Kod ile Tanınma (Kasada)
```
1. Müşteri mobil uygulamadaki QR kodunu kasiyere gösterir
2. Kasiyer QR kodu okutarak müşteriyi seçer
3. Satış tamamlandığında puanlar otomatik hesaplanır
```

### 7.3 Puanla Ödeme Akışı
```
1. Kasiyer müşteriyi seçer ve "Puanla Öde" seçeneğini tıklar
2. Müşterinin telefonuna OTP gönderilir (purpose: 'redeem')
3. Müşteri kodu kasiyere söyler
4. Kasiyer kodu girer ve doğrulama yapılır
5. Onay sonrası puanlar düşülür
```

### 7.4 Müşteri Ana Ekranı
Mobil uygulamada gösterilecek veriler:
- **QR Kod**: Kasa tanıma için benzersiz QR
- **Puan Bakiyesi**: Güncel toplam puan
- **Son Satışlar**: Son 20 satış, detaylarıyla
- **Puan Geçmişi**: Kazanım ve harcama logları
- **Aktif Kampanyalar**: Güncel kampanya listesi
- **Puan Kuralları**: Nasıl puan kazanılır bilgisi

---

## 8. Veritabanı Şeması (Özet)

| Tablo | Açıklama |
|-------|----------|
| `loyalty_customers` | Sadakat müşterileri (telefon, QR, puanlar) |
| `loyalty_transactions` | Puan kazanım/harcama geçmişi |
| `loyalty_point_rules` | Puan kazanım kuralları |
| `sales` | Satış kayıtları |
| `sale_items` | Satış detayları (ürün bazlı) |
| `products` | Ürün kataloğu |
| `categories` | Ürün kategorileri |
| `campaigns` | Kampanya tanımları |
| `campaign_products` | Kampanya-ürün ilişkileri |
| `otp_verifications` | OTP doğrulama kayıtları |
| `user_roles` | Personel yetki rolleri |

---

## 9. RLS (Row Level Security) Notları

- Tüm tablolarda RLS aktiftir
- `loyalty_customers`, `loyalty_transactions`, `sales`, `sale_items` tabloları **authenticated** kullanıcılar tarafından okunabilir
- Mobil uygulama **anonim** erişim kullanmaz; SMS OTP ile doğrulanan müşteriler **edge function** üzerinden veri çeker
- Edge function'lar service_role_key kullanır ve RLS'yi bypass eder

---

## 10. SMS Sağlayıcı Entegrasyonu

Şu anda OTP kodları veritabanına kaydedilmekte ve edge function loglarında görünmektedir. Gerçek SMS gönderimi için:

1. Netgsm, Twilio veya İleti Merkezi gibi bir SMS API sağlayıcısı seçin
2. API anahtarını Lovable Cloud'a secret olarak ekleyin
3. `send-otp` edge function'ında SMS gönderim kodunu aktifleştirin

---

## 11. Puan Hesaplama Mantığı

```typescript
function calculateEarnedPoints(
  cartItems: CartItem[],
  rules: LoyaltyPointRule[],
  saleTotal: number
): number {
  let totalPoints = 0;
  const today = new Date();
  const dayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][today.getDay()];

  for (const rule of rules) {
    if (!rule.is_active) continue;
    if (new Date(rule.start_date) > today || new Date(rule.end_date) < today) continue;

    switch (rule.type) {
      case 'genel':
        // Her X TL harcamaya Y puan (points_per_tl = X eşik, bonus_points = Y)
        if (rule.points_per_tl > 0) {
          totalPoints += Math.floor(saleTotal / rule.points_per_tl) * rule.bonus_points;
        }
        break;

      case 'urun':
        // Belirli üründen minimum adet alana bonus puan
        const matchingItem = cartItems.find(i => i.productId === rule.product_id);
        if (matchingItem && matchingItem.quantity >= rule.min_quantity) {
          totalPoints += rule.bonus_points;
        }
        break;

      case 'ozel_gun':
        // Belirli günlerde belirli üründen alana bonus puan
        if (rule.valid_days?.includes(dayName)) {
          const dayItem = cartItems.find(i => i.productId === rule.product_id);
          if (dayItem && dayItem.quantity >= rule.min_quantity) {
            totalPoints += rule.bonus_points;
          }
        }
        break;
    }
  }

  return totalPoints;
}
```

---

Bu dosya, mobil uygulama geliştiricisinin TekelPOS sistemiyle sorunsuz entegrasyon kurabilmesi için hazırlanmıştır.
Son güncelleme: 2026-02-15
