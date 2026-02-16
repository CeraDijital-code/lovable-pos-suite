import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, useSupplierBalance, type Supplier, type SupplierInsert } from "@/hooks/useSuppliers";
import { useSupplierInvoices, useCreateSupplierInvoice, useUploadInvoiceDocument, useCreateSupplierInvoiceItems } from "@/hooks/useSupplierInvoices";
import { useSupplierPayments, useCreateSupplierPayment } from "@/hooks/useSupplierPayments";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, Truck, FileText, CreditCard, Eye, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ── Supplier Form ──
function SupplierForm({ supplier, onSave, onCancel }: { supplier?: Supplier; onSave: (data: SupplierInsert) => void; onCancel: () => void }) {
  const [form, setForm] = useState<SupplierInsert>({
    name: supplier?.name || "",
    tax_number: supplier?.tax_number || "",
    tax_office: supplier?.tax_office || "",
    phone: supplier?.phone || "",
    email: supplier?.email || "",
    address: supplier?.address || "",
    contact_person: supplier?.contact_person || "",
    iban: supplier?.iban || "",
    notes: supplier?.notes || "",
    is_active: supplier?.is_active ?? true,
  });

  const set = (key: keyof SupplierInsert, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Tedarikçi Adı *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Firma adı" />
        </div>
        <div className="space-y-1.5">
          <Label>Yetkili Kişi</Label>
          <Input value={form.contact_person || ""} onChange={(e) => set("contact_person", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Vergi No</Label>
          <Input value={form.tax_number || ""} onChange={(e) => set("tax_number", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Vergi Dairesi</Label>
          <Input value={form.tax_office || ""} onChange={(e) => set("tax_office", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Telefon</Label>
          <Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>E-posta</Label>
          <Input value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Adres</Label>
          <Textarea value={form.address || ""} onChange={(e) => set("address", e.target.value)} rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label>IBAN</Label>
          <Input value={form.iban || ""} onChange={(e) => set("iban", e.target.value)} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Notlar</Label>
          <Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>İptal</Button>
        <Button onClick={() => onSave(form)} disabled={!form.name.trim()}>Kaydet</Button>
      </div>
    </div>
  );
}

// ── Supplier Detail ──
function SupplierDetail({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  const { data: balance } = useSupplierBalance(supplier.id);
  const { data: invoices = [] } = useSupplierInvoices(supplier.id);
  const { data: payments = [] } = useSupplierPayments(supplier.id);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Toplam Borç</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">₺{(balance?.totalDebt || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Toplam Ödeme</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">₺{(balance?.totalPaid || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Kalan Bakiye</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">₺{(balance?.balance || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {supplier.tax_number && <div><span className="text-muted-foreground">Vergi No:</span> {supplier.tax_number}</div>}
        {supplier.tax_office && <div><span className="text-muted-foreground">Vergi Dairesi:</span> {supplier.tax_office}</div>}
        {supplier.phone && <div><span className="text-muted-foreground">Telefon:</span> {supplier.phone}</div>}
        {supplier.email && <div><span className="text-muted-foreground">E-posta:</span> {supplier.email}</div>}
        {supplier.contact_person && <div><span className="text-muted-foreground">Yetkili:</span> {supplier.contact_person}</div>}
        {supplier.iban && <div><span className="text-muted-foreground">IBAN:</span> {supplier.iban}</div>}
        {supplier.address && <div className="md:col-span-2"><span className="text-muted-foreground">Adres:</span> {supplier.address}</div>}
      </div>

      <div>
        <h4 className="font-semibold mb-2">Son İrsaliyeler</h4>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz irsaliye yok</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Belge No</TableHead><TableHead>Tarih</TableHead><TableHead>Toplam</TableHead><TableHead>Durum</TableHead></TableRow></TableHeader>
            <TableBody>
              {invoices.slice(0, 5).map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.invoice_number || "-"}</TableCell>
                  <TableCell>{new Date(inv.invoice_date).toLocaleDateString("tr-TR")}</TableCell>
                  <TableCell>₺{Number(inv.total).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell><Badge variant={inv.status === "approved" ? "default" : inv.status === "cancelled" ? "destructive" : "secondary"}>{inv.status === "approved" ? "Onaylı" : inv.status === "cancelled" ? "İptal" : "Beklemede"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div>
        <h4 className="font-semibold mb-2">Son Ödemeler</h4>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz ödeme yok</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Tutar</TableHead><TableHead>Yöntem</TableHead><TableHead>Açıklama</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.slice(0, 5).map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.payment_date).toLocaleDateString("tr-TR")}</TableCell>
                  <TableCell>₺{Number(p.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{p.payment_method === "cash" ? "Nakit" : p.payment_method === "transfer" ? "Havale/EFT" : p.payment_method === "credit_card" ? "Kredi Kartı" : p.payment_method === "check" ? "Çek" : p.payment_method}</TableCell>
                  <TableCell>{p.description || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>Kapat</Button>
      </div>
    </div>
  );
}

// ── Invoice Form with file upload + AI parse ──
function InvoiceForm({ suppliers, onClose }: { suppliers: Supplier[]; onClose: () => void }) {
  const { user } = useAuth();
  const createInvoice = useCreateSupplierInvoice();
  const createItems = useCreateSupplierInvoiceItems();
  const uploadDoc = useUploadInvoiceDocument();
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [aiItems, setAiItems] = useState<any[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleAiParse = async () => {
    if (!file || !supplierId) return;
    setParsing(true);
    try {
      // Upload file first
      const url = await uploadDoc.mutateAsync({ file, supplierId });

      // Call AI parse edge function
      const { data, error } = await supabase.functions.invoke("parse-invoice", {
        body: { documentUrl: url, fileName: file.name },
      });
      if (error) throw error;
      if (data?.items) setAiItems(data.items);
    } catch (e: any) {
      console.error("AI parse error:", e);
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!supplierId) return;
    setSaving(true);
    try {
      let docUrl: string | null = null;
      if (file && !uploadDoc.data) {
        docUrl = await uploadDoc.mutateAsync({ file, supplierId });
      } else {
        docUrl = uploadDoc.data || null;
      }

      const subtotal = aiItems.reduce((s, i) => s + Number(i.total || 0), 0);
      const taxAmount = aiItems.reduce((s, i) => s + (Number(i.total || 0) * Number(i.tax_rate || 0) / 100), 0);

      const invoice = await createInvoice.mutateAsync({
        supplier_id: supplierId,
        invoice_number: invoiceNumber || null,
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        subtotal,
        tax_amount: taxAmount,
        total: subtotal + taxAmount,
        status: "pending",
        document_url: docUrl,
        notes: notes || null,
        created_by: user?.id || null,
      });

      if (aiItems.length > 0) {
        await createItems.mutateAsync(
          aiItems.map((item) => ({
            invoice_id: invoice.id,
            product_id: item.product_id || null,
            product_name: item.product_name || "",
            barcode: item.barcode || null,
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
            tax_rate: Number(item.tax_rate) || 0,
            total: Number(item.total) || 0,
          }))
        );
      }

      onClose();
    } catch (e: any) {
      console.error("Save invoice error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Tedarikçi *</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
            <SelectContent>{suppliers.filter(s => s.is_active).map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>İrsaliye/Fatura No</Label>
          <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Tarih</Label>
          <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Vade Tarihi</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Belge Yükle (PDF / Görsel)</Label>
        <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
      </div>

      {file && supplierId && (
        <Button variant="outline" onClick={handleAiParse} disabled={parsing} className="gap-2">
          {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {parsing ? "AI Analiz Ediliyor..." : "AI ile Ürünleri Tanı"}
        </Button>
      )}

      {aiItems.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Tanınan Kalemler ({aiItems.length})</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün Adı</TableHead>
                <TableHead>Barkod</TableHead>
                <TableHead>Miktar</TableHead>
                <TableHead>Birim Fiyat</TableHead>
                <TableHead>Toplam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aiItems.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Input value={item.product_name} onChange={(e) => {
                      const copy = [...aiItems];
                      copy[idx] = { ...copy[idx], product_name: e.target.value };
                      setAiItems(copy);
                    }} className="h-8" />
                  </TableCell>
                  <TableCell>
                    <Input value={item.barcode || ""} onChange={(e) => {
                      const copy = [...aiItems];
                      copy[idx] = { ...copy[idx], barcode: e.target.value };
                      setAiItems(copy);
                    }} className="h-8 w-28" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={item.quantity} onChange={(e) => {
                      const copy = [...aiItems];
                      copy[idx] = { ...copy[idx], quantity: e.target.value };
                      setAiItems(copy);
                    }} className="h-8 w-20" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={item.unit_price} onChange={(e) => {
                      const copy = [...aiItems];
                      copy[idx] = { ...copy[idx], unit_price: e.target.value };
                      setAiItems(copy);
                    }} className="h-8 w-24" />
                  </TableCell>
                  <TableCell>₺{Number(item.total || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Notlar</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>İptal</Button>
        <Button onClick={handleSave} disabled={!supplierId || saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Kaydet
        </Button>
      </div>
    </div>
  );
}

// ── Payment Form ──
function PaymentForm({ suppliers, onClose }: { suppliers: Supplier[]; onClose: () => void }) {
  const { user } = useAuth();
  const createPayment = useCreateSupplierPayment();
  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [description, setDescription] = useState("");

  const handleSave = async () => {
    if (!supplierId || !amount) return;
    await createPayment.mutateAsync({
      supplier_id: supplierId,
      invoice_id: null,
      amount: Number(amount),
      payment_date: paymentDate,
      payment_method: paymentMethod,
      description: description || null,
      created_by: user?.id || null,
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Tedarikçi *</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
            <SelectContent>{suppliers.filter(s => s.is_active).map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tutar *</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label>Ödeme Tarihi</Label>
          <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Ödeme Yöntemi</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Nakit</SelectItem>
              <SelectItem value="transfer">Havale/EFT</SelectItem>
              <SelectItem value="credit_card">Kredi Kartı</SelectItem>
              <SelectItem value="check">Çek</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Açıklama</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>İptal</Button>
        <Button onClick={handleSave} disabled={!supplierId || !amount || createPayment.isPending}>
          {createPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Kaydet
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const { data: invoices = [] } = useSupplierInvoices();
  const { data: payments = [] } = useSupplierPayments();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const activeSuppliers = suppliers.filter((s) => s.is_active);
  const filtered = activeSuppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.tax_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tedarikçiler</h1>
            <p className="text-muted-foreground">Tedarikçi, irsaliye ve ödeme yönetimi</p>
          </div>
        </div>

        <Tabs defaultValue="suppliers">
          <TabsList>
            <TabsTrigger value="suppliers" className="gap-1.5"><Truck className="h-4 w-4" />Tedarikçiler</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5"><FileText className="h-4 w-4" />İrsaliyeler</TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5"><CreditCard className="h-4 w-4" />Ödemeler</TabsTrigger>
          </TabsList>

          {/* SUPPLIERS TAB */}
          <TabsContent value="suppliers" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tedarikçi ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Dialog open={showForm || !!editSupplier} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditSupplier(null); } }}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Tedarikçi Ekle</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>{editSupplier ? "Tedarikçi Düzenle" : "Yeni Tedarikçi"}</DialogTitle></DialogHeader>
                  <SupplierForm
                    supplier={editSupplier || undefined}
                    onSave={(data) => {
                      if (editSupplier) {
                        updateSupplier.mutate({ id: editSupplier.id, ...data });
                      } else {
                        createSupplier.mutate(data);
                      }
                      setShowForm(false);
                      setEditSupplier(null);
                    }}
                    onCancel={() => { setShowForm(false); setEditSupplier(null); }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tedarikçi</TableHead>
                      <TableHead className="hidden md:table-cell">Yetkili</TableHead>
                      <TableHead className="hidden md:table-cell">Telefon</TableHead>
                      <TableHead className="hidden lg:table-cell">Vergi No</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tedarikçi bulunamadı</TableCell></TableRow>
                    ) : (
                      filtered.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{s.contact_person || "-"}</TableCell>
                          <TableCell className="hidden md:table-cell">{s.phone || "-"}</TableCell>
                          <TableCell className="hidden lg:table-cell">{s.tax_number || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailSupplier(s)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditSupplier(s)}>✏️</Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSupplier.mutate(s.id)}>🗑️</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INVOICES TAB */}
          <TabsContent value="invoices" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5"><Plus className="h-4 w-4" />İrsaliye Ekle</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>Yeni İrsaliye / Fatura</DialogTitle></DialogHeader>
                  <InvoiceForm suppliers={activeSuppliers} onClose={() => setShowInvoiceForm(false)} />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tedarikçi</TableHead>
                      <TableHead>Belge No</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Toplam</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Henüz irsaliye yok</TableCell></TableRow>
                    ) : (
                      invoices.map((inv: any) => (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.suppliers?.name || "-"}</TableCell>
                          <TableCell>{inv.invoice_number || "-"}</TableCell>
                          <TableCell>{new Date(inv.invoice_date).toLocaleDateString("tr-TR")}</TableCell>
                          <TableCell>₺{Number(inv.total).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell><Badge variant={inv.status === "approved" ? "default" : inv.status === "cancelled" ? "destructive" : "secondary"}>{inv.status === "approved" ? "Onaylı" : inv.status === "cancelled" ? "İptal" : "Beklemede"}</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5"><Plus className="h-4 w-4" />Ödeme Ekle</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Yeni Ödeme</DialogTitle></DialogHeader>
                  <PaymentForm suppliers={activeSuppliers} onClose={() => setShowPaymentForm(false)} />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tedarikçi</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Yöntem</TableHead>
                      <TableHead className="hidden md:table-cell">Açıklama</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Henüz ödeme yok</TableCell></TableRow>
                    ) : (
                      payments.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.suppliers?.name || "-"}</TableCell>
                          <TableCell>{new Date(p.payment_date).toLocaleDateString("tr-TR")}</TableCell>
                          <TableCell>₺{Number(p.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{p.payment_method === "cash" ? "Nakit" : p.payment_method === "transfer" ? "Havale/EFT" : p.payment_method === "credit_card" ? "Kredi Kartı" : "Çek"}</TableCell>
                          <TableCell className="hidden md:table-cell">{p.description || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Supplier Detail Dialog */}
        <Dialog open={!!detailSupplier} onOpenChange={(o) => { if (!o) setDetailSupplier(null); }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>{detailSupplier?.name} - Detay</DialogTitle></DialogHeader>
            {detailSupplier && <SupplierDetail supplier={detailSupplier} onClose={() => setDetailSupplier(null)} />}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
