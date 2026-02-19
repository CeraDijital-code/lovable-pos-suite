import { useState, useEffect, useCallback } from "react";

const QUOTES = [
  "Fıstıkların tazeliği konusunda yemin edebilirim ama ispatlayamam.",
  "Buz gibi bir mutluluğa 1 metre uzaklıktasın.",
  "Çakmağını evde unutanlar kulübüne hoş geldin.",
  "Bugün diyetin 'cheat day' günü ilan edildi, kutlarız!",
  "Cips paketindeki o son parçayı kimseye verme, o senin hakkın.",
  "Akşamki maçın skorunu bilmem ama buradaki soğukluk garantili.",
  "Efkarlı mısın? Gel bir fıstık patlat, geçer.",
  "Cips paketini açtığında gelen o ses... İşte huzur!",
  "Bir 'tık' daha fazlası her zaman iyi fikirdir.",
  "Masa hazır mı? Eksikleri tamamlamaya geldin sanırım.",
  "Buradan eli boş çıkanın keyfi kaçık demektir.",
  "Sıcaklar seni yorduysa, buzdolabımız seni bekliyor.",
  "Hayat kısa, o fıstığı bugün ye!",
  "Barkod sesindeki o ritim... Müzik gibi değil mi?",
  "Bir paket çekirdek, üç saatlik dedikodunun yakıtıdır.",
  "Hafta sonu planın biziz, kabul et.",
  "Çikolata krizine acil müdahale ekibi burada!",
  "O son soğuk içeceği sen kaptın, şanslı günündesin.",
  "Burada sadece alışveriş yapmazsın, moral depolarsın.",
  "Dostlarla kurulan masanın gizli kahramanı biziz.",
  "Eve giderken 'ay şunu da unutmayayım' dediğin her şey burada.",
  "Aç mısın, susuz musun yoksa sadece canın mı sıkkın?",
  "En sevdiğin atıştırmalık şu an sana bakıyor, görmüyor musun?",
  "Kasa sırası değil, keyif hazırlığı burası.",
  "Yarın pazartesi değilmiş gibi davranalım mı?",
  "Buzdolabı kapaklarını açarken dilek tut, kesin kabul olur.",
  "Evi sinema salonuna çevirecek o meşhur paket burada.",
  "Çakmağına sahip çık, burası kurtlar sofrası! :)",
  "Enerjin mi düştü? Raflar arasında bir tur at, kendine gel.",
  "Gülümse! Belki bir sonraki paket bedava çıkar... (Şaka şaka).",
  "Biranın yanına fıstık, hüznün yanına biz.",
  "Gece acıkmalarının en büyük destekçisiyiz.",
  "Bugün kendin için ne yaptın? Bir gofret al bari.",
  "Dünyayı kurtaramayabiliriz ama akşamını kurtarabiliriz.",
  "Soğukluk derecemiz: Kutup ayısı bile üşür.",
  "Atıştırmalıklar bittikten sonra gelen pişmanlık dahil değildir.",
  "Sen seçerken biz buradayız, acele etme keyfini çıkar.",
  "Buradaki tek sıcak şey, ekrandaki bu mesajlar.",
  "Aradığın huzur 3. rafta, sağdan ikinci sırada.",
  "Çekirdek çitlemek en doğal meditasyondur, unutma.",
  "Cüzdanını değil, keyfini düşünme saati.",
  "Bizde her şey taze, dertler bile günlük.",
  "Bir paket cips, bir dost kazandırır (paylaşırsan).",
  "Yine bekleriz ama çok da özletme!",
  "Hadi seç artık, içeride içecekler ısınıyor!",
  "Bugün çok yakışıklısın/güzelsin, kesin bir kutlama lazım.",
  "Barkod okuyucunun 'bip' sesi, mutluluğun melodisidir.",
  "Hadi eve git de keyfine bak artık.",
  "Daha fazlasını mı istiyorsun? Raflara bir daha bak.",
  "Kapıdan çıkarken dertlerini burada bırakabilirsin.",
];

const TYPING_SPEED = 45; // ms per character
const HOLD_DURATION = 5000; // 5 seconds hold after typing complete
const ERASING_SPEED = 20; // ms per character when erasing

const TypewriterQuotes = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "erasing">("typing");

  const currentQuote = QUOTES[quoteIndex];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (displayText.length < currentQuote.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentQuote.slice(0, displayText.length + 1));
        }, TYPING_SPEED);
      } else {
        timeout = setTimeout(() => setPhase("holding"), 100);
      }
    } else if (phase === "holding") {
      timeout = setTimeout(() => setPhase("erasing"), HOLD_DURATION);
    } else if (phase === "erasing") {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, ERASING_SPEED);
      } else {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, phase, currentQuote]);

  return (
    <div className="flex-1 flex items-center justify-center min-w-0 px-4">
      <p className="text-sm text-muted-foreground italic truncate max-w-[600px]">
        {displayText}
        <span className="inline-block w-[2px] h-[1em] bg-primary ml-0.5 align-middle animate-pulse" />
      </p>
    </div>
  );
};

export default TypewriterQuotes;
