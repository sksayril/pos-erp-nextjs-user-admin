'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToastStore } from '../../../lib/store';
import { 
  Package, 
  ArrowLeft, 
  Save, 
  Sparkles, 
  DollarSign, 
  Layers, 
  Image as ImageIcon,
  Tag,
  Building2,
  Scale
} from 'lucide-react';

function CreateProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { addToast } = useToastStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    brand: '',
    unit: 'Pieces (pcs)',
    costPrice: 0,
    sellingPrice: 0,
    taxRate: 18,
    openingStock: 10,
    minStockAlert: 5,
    supplier: '',
    description: '',
    status: 'Active',
    image: ''
  });

  useEffect(() => {
    // Load dropdown options
    const loadOptions = async () => {
      try {
        const [catRes, brandRes, unitRes] = await Promise.all([
          fetch('/api/products/categories'),
          fetch('/api/products/brands'),
          fetch('/api/products/units')
        ]);
        const cats = await catRes.json();
        const brs = await brandRes.json();
        const uns = await unitRes.json();
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(brs)) setBrands(brs);
        if (Array.isArray(uns)) setUnits(uns);

        if (cats.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: cats[0].name }));
        }
        if (brs.length > 0 && !formData.brand) {
          setFormData(prev => ({ ...prev, brand: brs[0].name }));
        }
      } catch (err) {
        console.error('Error fetching dropdown options:', err);
      }
    };
    loadOptions();

    // If in edit mode, fetch existing product
    if (editId) {
      setLoading(true);
      fetch('/api/products')
        .then(res => res.json())
        .then(products => {
          if (Array.isArray(products)) {
            const item = products.find((p: any) => p._id === editId || p.id === editId);
            if (item) {
              setFormData({
                name: item.name || '',
                sku: item.sku || '',
                barcode: item.barcode || '',
                category: item.category || '',
                brand: item.brand || '',
                unit: item.unit || 'Pieces (pcs)',
                costPrice: Number(item.costPrice) || 0,
                sellingPrice: Number(item.sellingPrice) || 0,
                taxRate: Number(item.taxRate) || 0,
                openingStock: Number(item.openingStock) || 0,
                minStockAlert: Number(item.minStockAlert) || 5,
                supplier: item.supplier || '',
                description: item.description || '',
                status: item.status || 'Active',
                image: item.image || ''
              });
            }
          }
        })
        .catch(err => console.error('Error fetching product for edit:', err))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const generateAutoSKU = () => {
    const prefix = formData.name ? formData.name.slice(0, 3).toUpperCase() : 'PRD';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedSKU = `${prefix}-${randomNum}`;
    const generatedBarcode = `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setFormData(prev => ({
      ...prev,
      sku: generatedSKU,
      barcode: prev.barcode || generatedBarcode
    }));
    addToast('info', 'Generated', `Assigned SKU: ${generatedSKU}`);
  };

  const calculateMargin = () => {
    if (!formData.sellingPrice || !formData.costPrice || formData.sellingPrice <= 0) return 0;
    const profit = formData.sellingPrice - formData.costPrice;
    return Math.round((profit / formData.sellingPrice) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      addToast('warning', 'Validation', 'Product name and SKU code are required.');
      return;
    }

    try {
      setSaving(true);
      const url = '/api/products';
      const method = editId ? 'PUT' : 'POST';
      const body = editId ? { _id: editId, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save product');

      addToast('success', 'Success', editId ? 'Product updated successfully!' : 'New product created in MongoDB!');
      router.push('/products');
    } catch (err: any) {
      console.error('Save error:', err);
      addToast('error', 'Error', err.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/products')} className="h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> {editId ? 'Edit Product Item' : 'Create New Product'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure inventory master parameters, valuation prices, and taxonomy.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={generateAutoSKU} 
                className="gap-1.5 text-xs h-9"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Auto-Generate SKU
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={saving} 
                size="sm" 
                className="gap-1.5 text-xs h-9 font-semibold"
              >
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : editId ? 'Update Product' : 'Save Product'}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Basic Information */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" /> 1. General Identification
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Product Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. MacBook Pro M3 Max 16-inch"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">SKU (Stock Keeping Unit) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. MBP-M3-16-01"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      className="h-9 w-full rounded-lg border border-border px-3 text-xs bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Barcode / EAN / UPC</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 8901234567890"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-3 text-xs bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Category</label>
                    <select 
                      value={formData.category} 
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c, i) => (
                        <option key={i} value={c.name}>{c.name}</option>
                      ))}
                      {categories.length === 0 && (
                        <>
                          <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                          <option value="Computers & Laptops">Computers & Laptops</option>
                          <option value="Mobile Phones">Mobile Phones</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Brand</label>
                    <select 
                      value={formData.brand} 
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b, i) => (
                        <option key={i} value={b.name}>{b.name}</option>
                      ))}
                      {brands.length === 0 && (
                        <>
                          <option value="Apple">Apple</option>
                          <option value="Samsung">Samsung</option>
                          <option value="Sony">Sony</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Product Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Short product overview, specifications, and warranty information..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-border p-3 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Pricing & Taxation */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" /> 2. Pricing, Margin & Taxation
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Estimated Profit Margin: <strong className="text-emerald-500 font-mono">{calculateMargin()}%</strong>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Cost / Purchase Price (Rs.)</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="0.00"
                      value={formData.costPrice || ''}
                      onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                      className="h-9 w-full rounded-lg border border-border px-3 text-xs bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Selling / Retail Price (Rs.) *</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="0.00"
                      value={formData.sellingPrice || ''}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                      className="h-9 w-full rounded-lg border border-border px-3 text-xs bg-background font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">GST / Tax Rate (%)</label>
                    <select 
                      value={formData.taxRate} 
                      onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value={0}>0% (Tax Exempt / Nil)</option>
                      <option value={5}>5% (GST 5%)</option>
                      <option value={12}>12% (GST 12%)</option>
                      <option value={18}>18% (Standard GST 18%)</option>
                      <option value={28}>28% (Luxury GST 28%)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Inventory & Warehouse Stock */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> 3. Stock Level & Unit Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Unit of Measure</label>
                    <select 
                      value={formData.unit} 
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {units.map((u, i) => (
                        <option key={i} value={`${u.name} (${u.code})`}>{u.name} ({u.code})</option>
                      ))}
                      {units.length === 0 && (
                        <>
                          <option value="Pieces (pcs)">Pieces (pcs)</option>
                          <option value="Kilograms (kg)">Kilograms (kg)</option>
                          <option value="Boxes (box)">Boxes (box)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Opening / Initial Stock</label>
                    <input 
                      type="number" 
                      value={formData.openingStock}
                      onChange={(e) => setFormData({ ...formData, openingStock: parseInt(e.target.value) || 0 })}
                      className="h-9 w-full rounded-lg border border-border px-3 text-xs bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Min Stock Reorder Alert</label>
                    <input 
                      type="number" 
                      value={formData.minStockAlert}
                      onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                      className="h-9 w-full rounded-lg border border-border px-3 text-xs bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Preferred Supplier / Vendor</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Apex Global Distributors Ltd."
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Status</label>
                    <select 
                      value={formData.status} 
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Active">Active (Available for POS & Sales)</option>
                      <option value="Inactive">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Product Image */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-blue-500" /> 4. Product Media & Image URL
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-semibold text-foreground">Image Web URL (HTTPS / Cloud)</label>
                    <input 
                      type="url" 
                      placeholder="https://images.unsplash.com/..."
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-3 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Paste direct image URL or use cloud CDN asset link.
                    </p>
                  </div>
                  {formData.image && (
                    <div className="h-20 w-20 rounded-xl border border-border overflow-hidden bg-muted flex-shrink-0">
                      <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push('/products')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="font-semibold gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : editId ? 'Update Product' : 'Create Product Item'}
              </Button>
            </div>

          </form>

        </div>
      </PageContainer>
    </AppShell>
  );
}

export default function CreateProductPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs font-semibold">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading product editor...
            </div>
          </div>
        </PageContainer>
      </AppShell>
    }>
      <CreateProductForm />
    </Suspense>
  );
}