import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Users, Plus, Pencil, Trash2, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StaffUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

const StaffPage = () => {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: { action: "list" },
    });
    if (!error && data?.users) setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ full_name: "", email: "", password: "", phone: "" });
    setDialogOpen(true);
  };

  const openEdit = (user: StaffUser) => {
    setEditingUser(user);
    setForm({ full_name: user.full_name, email: user.email, password: "", phone: user.phone || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingUser) {
        const body: Record<string, unknown> = {
          action: "update",
          user_id: editingUser.user_id,
          full_name: form.full_name,
          phone: form.phone,
        };
        if (form.email !== editingUser.email) body.email = form.email;
        if (form.password) body.password = form.password;

        const { error } = await supabase.functions.invoke("manage-users", { body });
        if (error) throw error;
        toast({ title: "Personel güncellendi" });
      } else {
        if (!form.password) {
          toast({ title: "Şifre gerekli", variant: "destructive" });
          setSaving(false);
          return;
        }
        const { error } = await supabase.functions.invoke("manage-users", {
          body: { action: "create", ...form },
        });
        if (error) throw error;
        toast({ title: "Personel eklendi" });
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (user: StaffUser) => {
    if (!confirm(`${user.full_name} silinecek. Emin misiniz?`)) return;
    const { error } = await supabase.functions.invoke("manage-users", {
      body: { action: "delete", user_id: user.user_id },
    });
    if (error) {
      toast({ title: "Silinemedi", variant: "destructive" });
    } else {
      toast({ title: "Personel silindi" });
      fetchUsers();
    }
  };

  const toggleActive = async (user: StaffUser) => {
    await supabase.functions.invoke("manage-users", {
      body: { action: "update", user_id: user.user_id, is_active: !user.is_active },
    });
    fetchUsers();
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Personel Yönetimi</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sistem kullanıcılarını yönetin
            </p>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Yeni Personel
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Personel Listesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                Yükleniyor...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personel</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(user.full_name || "?")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.full_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell className="text-sm">{user.phone || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={() => toggleActive(user)}
                          />
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? "Aktif" : "Pasif"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(user)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Henüz personel eklenmemiş
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Personel Düzenle" : "Yeni Personel Ekle"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="personel@firma.com"
                />
              </div>
              <div className="space-y-2">
                <Label>{editingUser ? "Yeni Şifre (boş bırakılabilir)" : "Şifre"}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0 (___) ___ __ __"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default StaffPage;
