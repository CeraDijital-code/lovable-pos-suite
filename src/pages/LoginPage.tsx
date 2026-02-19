import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wallet, LogIn, Eye, EyeOff, ShieldCheck, BarChart3, Package, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useThemeLogo } from "@/hooks/useThemeLogo";
import loginBg from "@/assets/login-bg.jpg";

const TYPEWRITER_PHRASES = [
  "Satışlarınızı kolayca yönetin.",
  "Stok takibinizi otomatikleştirin.",
  "Kampanyalarınızı optimize edin.",
  "Sadakat programıyla müşteri kazanın.",
  "Raporlarla büyümenizi analiz edin.",
];

const FEATURES = [
  { icon: BarChart3, title: "Anlık Raporlama", desc: "Satış ve stok verileriniz her an elinizin altında" },
  { icon: Package, title: "Akıllı Stok", desc: "Otomatik stok uyarıları ve barkod desteği" },
  { icon: Users, title: "Sadakat Sistemi", desc: "Puan bazlı müşteri sadakat programı" },
  { icon: ShieldCheck, title: "Güvenli Erişim", desc: "Rol bazlı yetkilendirme sistemi" },
];

function useTypewriter(phrases: string[], typingSpeed = 60, deletingSpeed = 30, pauseTime = 2000) {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(current.slice(0, text.length + 1));
        if (text.length + 1 === current.length) {
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        setText(current.slice(0, text.length - 1));
        if (text.length === 0) {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseTime]);

  return text;
}

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const typedText = useTypewriter(TYPEWRITER_PHRASES);
  const { logoUrl } = useThemeLogo();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: "Giriş Başarısız",
        description: "E-posta veya şifre hatalı.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [email, password, signIn, toast]);

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img src={loginBg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/60" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/10 animate-pulse"
            style={{
              width: `${20 + i * 15}px`,
              height: `${20 + i * 15}px`,
              top: `${10 + i * 15}%`,
              left: `${5 + i * 16}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Left - Hero Section */}
      <div className="relative z-10 hidden lg:flex lg:w-[55%] flex-col justify-between p-12">
        {/* Top Logo */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-11 object-contain" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Center Content */}
        <div className="max-w-lg space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold leading-tight text-foreground xl:text-5xl">
              İşletmenizi
              <br />
              <span className="bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
                Geleceğe Taşıyın
              </span>
            </h1>
            <div className="h-8">
              <p className="text-lg text-muted-foreground font-medium">
                {typedText}
                <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse" />
              </p>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-4 transition-all duration-300 hover:border-primary/40 hover:bg-card/50 hover:shadow-lg hover:shadow-primary/5"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <f.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="flex items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Sistem Aktif
          </div>
          <span className="text-border">•</span>
          <span>v2.0 Enterprise</span>
          <span className="text-border">•</span>
          <span>256-bit SSL</span>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="relative z-10 flex w-full items-center justify-center p-6 lg:w-[45%]">
        <div className="w-full max-w-[420px] animate-fade-in">
          {/* Mobile Logo */}
          <div className="mb-8 text-center lg:hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="mx-auto mb-3 h-14 object-contain" />
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
                  <Wallet className="h-7 w-7 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">TekelPOS</h1>
              </>
            )}
            <p className="text-sm text-muted-foreground mt-1">ERP Yönetim Sistemi</p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-8 shadow-2xl shadow-background/50">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 hidden lg:flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <LogIn className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Hoş Geldiniz</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Hesabınıza giriş yapın
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  E-posta Adresi
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="personel@tekelpos.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-11 bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Şifre
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-background/50 border-border/60 focus:border-primary/50 pr-10 transition-colors"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 gap-2 text-sm font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Giriş Yap
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-xs text-muted-foreground">Güvenli Bağlantı</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground leading-relaxed">
              Hesap bilgilerinizi yöneticinizden alabilirsiniz.
              <br />
              <span className="text-primary/70">Şifrenizi unuttuysanız yöneticinize başvurun.</span>
            </p>
          </div>

          {/* Mobile typewriter */}
          <div className="mt-6 text-center lg:hidden">
            <p className="text-sm text-muted-foreground">
              {typedText}
              <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
