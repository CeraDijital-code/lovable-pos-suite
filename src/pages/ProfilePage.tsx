import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUserRoles, roleLabels, type AppRole } from "@/hooks/useRoles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera, Save, User, Shield, Lock, Mail, Phone, Calendar,
  CheckCircle2, AlertCircle, Eye, EyeOff, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { data: roles } = useCurrentUserRoles();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Profile completion
  const getProfileCompletion = () => {
    let score = 0;
    if (profile?.full_name) score += 30;
    if (profile?.phone) score += 25;
    if (profile?.avatar_url) score += 25;
    if (user?.email) score += 20;
    return score;
  };

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const filePath = `${user.id}/avatar.${file.name.split(".").pop()}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Yükleme hatası", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    await refreshProfile();
    toast({ title: "Avatar güncellendi" });
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Profil güncellendi" });
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Hata", description: "Yeni şifre en az 6 karakter olmalıdır.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Hata", description: "Şifreler eşleşmiyor.", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Şifre başarıyla güncellendi" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const completion = getProfileCompletion();

  const passwordStrength = (() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 6) s += 25;
    if (newPassword.length >= 10) s += 25;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) s += 25;
    if (/[^a-zA-Z0-9]/.test(newPassword)) s += 25;
    return s;
  })();

  const passwordStrengthColor = passwordStrength <= 25
    ? "bg-destructive"
    : passwordStrength <= 50
      ? "bg-warning"
      : passwordStrength <= 75
        ? "bg-info"
        : "bg-success";

  const passwordStrengthLabel = passwordStrength <= 25
    ? "Zayıf"
    : passwordStrength <= 50
      ? "Orta"
      : passwordStrength <= 75
        ? "İyi"
        : "Güçlü";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/20" />
          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 text-background opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{profile?.full_name || "İsimsiz Kullanıcı"}</h1>
              <p className="text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </p>
              {profile?.phone && (
                <p className="text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {profile.phone}
                </p>
              )}

              {/* Roles */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                {roles?.map((role) => (
                  <Badge key={role} variant="secondary" className="gap-1 text-xs font-medium">
                    <Shield className="h-3 w-3" />
                    {roleLabels[role as AppRole] || role}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Completion */}
            <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray={`${completion}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  %{completion}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">Profil Tamamlanma</span>
            </div>
          </div>

          {/* Meta row */}
          <div className="relative flex flex-wrap gap-x-6 gap-y-1 mt-6 pt-4 border-t text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Katılım: {user?.created_at ? format(new Date(user.created_at), "d MMMM yyyy", { locale: tr }) : "—"}
            </span>
            <span className="flex items-center gap-1">
              {profile?.is_active ? (
                <><CheckCircle2 className="h-3 w-3 text-success" /> Aktif</>
              ) : (
                <><AlertCircle className="h-3 w-3 text-destructive" /> Pasif</>
              )}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="info" className="gap-2">
              <User className="h-4 w-4" />
              Kişisel Bilgiler
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              Güvenlik
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kişisel Bilgiler</CardTitle>
                <CardDescription>Adınızı, telefonunuzu ve iletişim bilgilerinizi güncelleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Ad Soyad</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        placeholder="Adınız Soyadınız"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        placeholder="0 (___) ___ __ __"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" value={user?.email || ""} disabled className="pl-10 opacity-60" />
                  </div>
                  <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez</p>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px]">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Şifre Değiştir</CardTitle>
                <CardDescription>Hesap güvenliğiniz için şifrenizi düzenli olarak güncelleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Yeni Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Şifre Gücü</span>
                        <span className="font-medium">{passwordStrengthLabel}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrengthColor}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Şifreler eşleşmiyor
                    </p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                    <p className="text-xs text-success flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Şifreler eşleşiyor
                    </p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={changingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                    className="gap-2 min-w-[140px]"
                  >
                    {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    {changingPassword ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProfilePage;
