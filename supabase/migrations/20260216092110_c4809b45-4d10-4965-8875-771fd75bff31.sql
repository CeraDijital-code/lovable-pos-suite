
-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tax_number TEXT,
  tax_office TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  iban TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Auth users can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can update suppliers" ON public.suppliers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete suppliers" ON public.suppliers FOR DELETE USING (true);

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create supplier_invoices table
CREATE TABLE public.supplier_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  invoice_number TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  document_url TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view supplier_invoices" ON public.supplier_invoices FOR SELECT USING (true);
CREATE POLICY "Auth users can insert supplier_invoices" ON public.supplier_invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can update supplier_invoices" ON public.supplier_invoices FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete supplier_invoices" ON public.supplier_invoices FOR DELETE USING (true);

CREATE TRIGGER update_supplier_invoices_updated_at
  BEFORE UPDATE ON public.supplier_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create supplier_invoice_items table
CREATE TABLE public.supplier_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.supplier_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL DEFAULT '',
  barcode TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.supplier_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view supplier_invoice_items" ON public.supplier_invoice_items FOR SELECT USING (true);
CREATE POLICY "Auth users can insert supplier_invoice_items" ON public.supplier_invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can update supplier_invoice_items" ON public.supplier_invoice_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete supplier_invoice_items" ON public.supplier_invoice_items FOR DELETE USING (true);

-- Create supplier_payments table
CREATE TABLE public.supplier_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.supplier_invoices(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  description TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view supplier_payments" ON public.supplier_payments FOR SELECT USING (true);
CREATE POLICY "Auth users can insert supplier_payments" ON public.supplier_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can update supplier_payments" ON public.supplier_payments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete supplier_payments" ON public.supplier_payments FOR DELETE USING (true);

-- Create supplier_documents table
CREATE TABLE public.supplier_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view supplier_documents" ON public.supplier_documents FOR SELECT USING (true);
CREATE POLICY "Auth users can insert supplier_documents" ON public.supplier_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can delete supplier_documents" ON public.supplier_documents FOR DELETE USING (true);

-- Create storage bucket for supplier invoices/documents
INSERT INTO storage.buckets (id, name, public) VALUES ('supplier-documents', 'supplier-documents', true);

CREATE POLICY "Auth users can upload supplier documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'supplier-documents');
CREATE POLICY "Anyone can view supplier documents" ON storage.objects FOR SELECT USING (bucket_id = 'supplier-documents');
CREATE POLICY "Auth users can delete supplier documents" ON storage.objects FOR DELETE USING (bucket_id = 'supplier-documents');
