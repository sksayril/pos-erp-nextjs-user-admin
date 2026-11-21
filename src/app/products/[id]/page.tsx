'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useParams, useRouter } from 'next/navigation';
import { 
  Package, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Barcode, 
  Layers, 
  DollarSign, 
  Building2, 
  Scale, 
  Tag, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToastStore();
  const id = params?.id as string;

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const found = data.find((p: any) => p._id === id || p.id === id);
          if (found) {
            setProduct(found);
          }
        }
      })
      .catch(err => console.error('Fetch product error:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!product) return;
    try {
      const res = await fetch(`/api/products?id=${product._id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Product "${product.name}" removed.`);
        router.push('/products');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-sm text-muted-foreground animate-pulse">Loading product specifications...</p>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell>
        <PageContainer>
          <div className="text-center py-12 space-y-4">
            <Package className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Product Not Found</h2>
            <p className="text-xs text-muted-foreground">The requested product ID does not exist in your MongoDB catalog.</p>
            <Button onClick={() => router.push('/products')} size="sm">Back to Products</Button>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const stock = Number(product.openingStock) || 0;
  const minStock = Number(product.minStockAlert) || 5;
  const isLow = stock > 0 && stock <= minStock;
  const isOut = stock <= 0;
  const profitMargin = product.sellingPrice && product.costPrice 
    ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100) 
    : 0;

  return (
    <AppShell>
      <PageContainer>
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/products')} className="h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> {product.name}
                </h1>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  SKU: {product.sku} | Barcode: {product.barcode || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/products/create?edit=${product._id}`)} 
                className="h-9 gap-1.5 text-xs font-semibold"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Product
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete} 
                className="h-9 gap-1.5 text-xs font-semibold"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Card: Image & Quick Stats */}
            <div className="space-y-6 lg:col-span-1">
              <Card className="border border-border overflow-hidden shadow-sm">
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden border-b border-border">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-20 w-20 text-muted-foreground/40" />
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Lifecycle Status</span>
                    <Badge variant={product.status === 'Active' ? 'success' : 'destructive'}>
                      {product.status || 'Active'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/60 pt-2">
                    <span className="text-xs text-muted-foreground font-medium">Stock Health</span>
                    <div className="flex items-center gap-1.5">
                      {isOut && <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>}
                      {isLow && <Badge variant="warning" className="text-[10px] bg-amber-500/10 text-amber-600">Low Stock</Badge>}
                      {!isOut && !isLow && <Badge variant="success" className="text-[10px] bg-emerald-500/10 text-emerald-600">In Stock</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Barcode Sticker Preview */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-2 border-b border-border/60">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2">
                    <Barcode className="h-4 w-4 text-primary" /> Barcode Sticker Reference
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col items-center justify-center text-center">
                  <div className="p-3 bg-white border border-zinc-300 rounded-lg text-zinc-950 w-full max-w-[220px]">
                    <p className="text-[9px] font-black uppercase tracking-wider text-zinc-700">CRIPOCOD POS</p>
                    <p className="text-[10px] font-bold truncate mt-0.5">{product.name}</p>
                    <div className="h-7 w-full bg-zinc-900 my-1 flex items-stretch px-1 gap-0.5">
                      {[...Array(24)].map((_, i) => (
                        <div key={i} className={`bg-white ${i % 3 === 0 ? 'w-[2px]' : 'w-[1px]'}`} />
                      ))}
                    </div>
                    <p className="text-[9px] font-mono font-bold tracking-widest">{product.barcode || product.sku}</p>
                    <div className="flex justify-between items-center text-[9px] font-mono border-t border-zinc-200 mt-1 pt-0.5">
                      <span>{product.sku}</span>
                      <span className="font-bold">Rs. {Number(product.sellingPrice || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push('/products/barcode')} 
                    className="mt-3 text-xs text-primary hover:text-primary"
                  >
                    Open Barcode Label Generator
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Card: Full Specs & Financial Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Financial Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Purchase Cost</p>
                  <h3 className="text-lg font-bold font-mono text-foreground mt-0.5">
                    Rs. {Number(product.costPrice || 0).toLocaleString()}
                  </h3>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Selling Price (MRP)</p>
                  <h3 className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Rs. {Number(product.sellingPrice || 0).toLocaleString()}
                  </h3>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Gross Margin %</p>
                  <h3 className="text-lg font-bold font-mono text-primary mt-0.5">
                    +{profitMargin}% Margin
                  </h3>
                </div>
              </div>

              {/* Master Data Sheet */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" /> Master Data Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Category</span>
                      <p className="font-semibold text-foreground text-sm">{product.category || 'Uncategorized'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Brand Manufacturer</span>
                      <p className="font-semibold text-foreground text-sm">{product.brand || 'Generic'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Unit of Measurement</span>
                      <p className="font-semibold text-foreground text-sm">{product.unit || 'Pieces (pcs)'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">GST / Tax Rate</span>
                      <p className="font-semibold text-foreground text-sm">{product.taxRate || 0}% Standard Tax</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Physical Stock on Hand</span>
                      <p className="font-semibold font-mono text-foreground text-sm">{stock} Units</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Minimum Reorder Alert Level</span>
                      <p className="font-semibold font-mono text-foreground text-sm">{minStock} Units</p>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-muted-foreground">Authorized Supplier / Vendor</span>
                      <p className="font-semibold text-foreground text-sm">{product.supplier || 'Primary Direct Wholesale'}</p>
                    </div>
                    <div className="space-y-1 sm:col-span-2 border-t border-border pt-3">
                      <span className="text-muted-foreground">Description & Overview</span>
                      <p className="text-foreground leading-relaxed mt-0.5">{product.description || 'No extended description recorded for this inventory item.'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>

        </div>
      </PageContainer>
    </AppShell>
  );
}