import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package, Plus, Search, Filter, Edit, Trash2, PackagePlus, PackageMinus, Loader2, Tag, ImagePlus, Monitor,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  useProducts, useCategories, useCreateProduct, useUpdateProduct,
  useDeleteProduct, useUpdateStock, useCreateCategory, useDeleteCategory,
} from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";

const StockPage = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stockAction, setStockAction] = useState<"in" | "out">("in");

  // Form state
  const [form, setForm] = useState({
    barcode: "", name: "", category_id: "", price: "", cost_price: "",
    stock: "", min_stock: "", unit: "Adet", image_url: "",
  });
  const [stockForm, setStockForm] = useState({ quantity: "", note: "" });
  const [newCategory, setNewCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const uploadProductImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleImageSelect = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const { data: products, isLoading } = useProducts(search || undefined, categoryFilter && categoryFilter !== "all" ? categoryFilter : undefined);
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateStock = useUpdateStock();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const resetForm = () => {
    setForm({ barcode: "", name: "", category_id: "", price: "", cost_price: "", stock: "", min_stock: "", unit: "Adet", image_url: "" });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAdd = async () => {
    setUploadingImage(true);
    try {
      let image_url: string | undefined;
      if (imageFile) {
        image_url = await uploadProductImage(imageFile);
      }
      createProduct.mutate({
        barcode: form.barcode,
        name: form.name,
        category_id: form.category_id || null,
        price: parseFloat(form.price) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
        stock: parseInt(form.stock) || 0,
        min_stock: parseInt(form.min_stock) || 0,
        unit: form.unit,
        ...(image_url ? { image_url } : {}),
      } as any, {
        onSuccess: () => { setShowAddProduct(false); resetForm(); },
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;
    setUploadingImage(true);
    try {
      let image_url = form.image_url || undefined;
      if (imageFile) {
        image_url = await uploadProductImage(imageFile);
      }
      updateProduct.mutate({
        id: selectedProduct.id,
        barcode: form.barcode,
        name: form.name,
        category_id: form.category_id || null,
        price: parseFloat(form.price) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
        min_stock: parseInt(form.min_stock) || 0,
        unit: form.unit,
        ...(image_url !== undefined ? { image_url } : {}),
      } as any, {
        onSuccess: () => { setShowEditProduct(false); setSelectedProduct(null); resetForm(); },
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleStockUpdate = () => {
    if (!selectedProduct) return;
    updateStock.mutate({
      productId: selectedProduct.id,
      quantity: parseInt(stockForm.quantity) || 0,
      type: stockAction,
      note: stockForm.note || undefined,
    }, {
      onSuccess: () => { setShowStockDialog(false); setStockForm({ quantity: "", note: "" }); },
    });
  };

  const openEdit = (product: any) => {
    setSelectedProduct(product);
    setForm({
      barcode: product.barcode,
      name: product.name,
      category_id: product.category_id || "",
      price: String(product.price),
      cost_price: String(product.cost_price),
      stock: String(product.stock),
      min_stock: String(product.min_stock),
      unit: product.unit,
      image_url: product.image_url || "",
    });
    setImagePreview(product.image_url || null);
    setImageFile(null);
    setShowEditProduct(true);
  };

  const totalProducts = products?.length || 0;
  const lowStockCount = products?.filter((p) => p.stock <= p.min_stock).length || 0;
  const totalValue = products?.reduce((sum, p) => sum + p.price * p.stock, 0) || 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stok Yönetimi</h1>
            <p className="text-muted-foreground text-sm mt-1">Ulusal barkod sistemi ile ürün takibi</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowCategoryDialog(true)}>
              <Tag className="h-4 w-4" />
              Kategoriler
            </Button>
            <Button className="gap-2" onClick={() => { resetForm(); setShowAddProduct(true); }}>
              <Plus className="h-4 w-4" />
              Yeni Ürün Ekle
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Ürün adı veya barkod ile ara..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Kategori Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Ürün</p>
                <p className="text-xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Package className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Düşük Stok</p>
                <p className="text-xl font-bold">{lowStockCount}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stok Değeri</p>
                <p className="text-xl font-bold">₺{totalValue.toLocaleString("tr-TR")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ürün Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !products?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-3 opacity-40" />
                <p>Henüz ürün eklenmemiş</p>
                <Button variant="outline" className="mt-3" onClick={() => { resetForm(); setShowAddProduct(true); }}>
                  İlk ürünü ekle
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Barkod</TableHead>
                    <TableHead>Ürün Adı</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Fiyat</TableHead>
                    <TableHead className="text-right">Stok</TableHead>
                     <TableHead>Durum</TableHead>
                     <TableHead className="text-center">Carousel</TableHead>
                     <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="h-10 w-10 rounded-md bg-muted/50 flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover rounded-md" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{product.barcode}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.categories?.name || "-"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">₺{Number(product.price).toLocaleString("tr-TR")}</TableCell>
                      <TableCell className="text-right font-mono">{product.stock}</TableCell>
                      <TableCell>
                        {product.stock <= product.min_stock ? (
                          <Badge variant="destructive" className="text-xs">Düşük</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Yeterli</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={!!(product as any).show_in_carousel}
                          onCheckedChange={(checked) => {
                            updateProduct.mutate({ id: product.id, show_in_carousel: checked } as any);
                          }}
                          title="Müşteri ekranında göster"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" title="Stok Giriş"
                            onClick={() => { setSelectedProduct(product); setStockAction("in"); setStockForm({ quantity: "", note: "" }); setShowStockDialog(true); }}>
                            <PackagePlus className="h-4 w-4 text-success" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Stok Çıkış"
                            onClick={() => { setSelectedProduct(product); setStockAction("out"); setStockForm({ quantity: "", note: "" }); setShowStockDialog(true); }}>
                            <PackageMinus className="h-4 w-4 text-warning" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost"
                            onClick={() => { setSelectedProduct(product); setShowDeleteConfirm(true); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Ürün Ekle</DialogTitle>
            <DialogDescription>Ulusal barkod numarası ile yeni ürün ekleyin</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Barkod *</Label>
                <Input placeholder="8690504012345" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ürün Adı *</Label>
                <Input placeholder="Ürün adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Birim</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Adet">Adet</SelectItem>
                    <SelectItem value="Paket">Paket</SelectItem>
                    <SelectItem value="Koli">Koli</SelectItem>
                    <SelectItem value="Litre">Litre</SelectItem>
                    <SelectItem value="Kg">Kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Satış Fiyatı (₺)</Label>
                <Input type="number" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Alış Fiyatı (₺)</Label>
                <Input type="number" placeholder="0.00" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Başlangıç Stok</Label>
                <Input type="number" placeholder="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Minimum Stok</Label>
                <Input type="number" placeholder="0" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
              </div>
            </div>
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Ürün Görseli</Label>
              <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={(e) => handleImageSelect(e.target.files?.[0] || null)} />
              <div className="flex items-center gap-3">
                <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => imageInputRef.current?.click()}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Ürün" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Görsel yüklemek için tıklayın</p>
                  <p>JPG, PNG, WebP (max 5MB)</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>İptal</Button>
            <Button onClick={handleAdd} disabled={!form.barcode || !form.name || createProduct.isPending || uploadingImage}>
              {(createProduct.isPending || uploadingImage) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditProduct} onOpenChange={setShowEditProduct}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ürün Düzenle</DialogTitle>
            <DialogDescription>Ürün bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Barkod *</Label>
                <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ürün Adı *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Birim</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Adet">Adet</SelectItem>
                    <SelectItem value="Paket">Paket</SelectItem>
                    <SelectItem value="Koli">Koli</SelectItem>
                    <SelectItem value="Litre">Litre</SelectItem>
                    <SelectItem value="Kg">Kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Satış Fiyatı (₺)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Alış Fiyatı (₺)</Label>
                <Input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Minimum Stok</Label>
              <Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
            </div>
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Ürün Görseli</Label>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e.target.files?.[0] || null)} ref={(el) => { if (el) el.id = "edit-image-input"; }} />
              <div className="flex items-center gap-3">
                <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => document.getElementById("edit-image-input")?.click()}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Ürün" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Görsel yüklemek için tıklayın</p>
                  <p>JPG, PNG, WebP (max 5MB)</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProduct(false)}>İptal</Button>
            <Button onClick={handleEdit} disabled={!form.barcode || !form.name || updateProduct.isPending || uploadingImage}>
              {(updateProduct.isPending || uploadingImage) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Update Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{stockAction === "in" ? "Stok Giriş" : "Stok Çıkış"}</DialogTitle>
            <DialogDescription>{selectedProduct?.name} — Mevcut: {selectedProduct?.stock} {selectedProduct?.unit}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Miktar</Label>
              <Input type="number" placeholder="0" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Not (opsiyonel)</Label>
              <Input placeholder="Açıklama..." value={stockForm.note} onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockDialog(false)}>İptal</Button>
            <Button onClick={handleStockUpdate} disabled={!stockForm.quantity || updateStock.isPending}>
              {updateStock.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {stockAction === "in" ? "Stok Ekle" : "Stok Çıkar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedProduct?.name}</strong> ürünü ve tüm stok hareketleri kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedProduct) deleteProduct.mutate(selectedProduct.id);
                setShowDeleteConfirm(false);
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Management Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategori Yönetimi</DialogTitle>
            <DialogDescription>Kategorileri ekleyin veya silin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="Yeni kategori adı"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCategory.trim()) {
                    createCategory.mutate({ name: newCategory.trim() });
                    setNewCategory("");
                  }
                }}
              />
              <Button
                onClick={() => { if (newCategory.trim()) { createCategory.mutate({ name: newCategory.trim() }); setNewCategory(""); } }}
                disabled={!newCategory.trim() || createCategory.isPending}
              >
                Ekle
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories?.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{c.name}</span>
                  <Button size="icon" variant="ghost" onClick={() => deleteCategory.mutate(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default StockPage;
