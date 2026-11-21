'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Layers, 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle2,
  X
} from 'lucide-react';
import { useToastStore } from '../../lib/store';

export default function ProductsListPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [stockFilter, setStockFilter] = useState('All'); // All, Low, Out, InStock
  const [viewProduct, setViewProduct] = useState<any | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        const cats = Array.from(new Set(data.map((p: any) => p.category).filter(Boolean))) as string[];
        const brs = Array.from(new Set(data.map((p: any) => p.brand).filter(Boolean))) as string[];
        setCategories(cats);
        setBrands(brs);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      addToast('error', 'Error', 'Failed to load products from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Product "${name}" was deleted.`);
        fetchProducts();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to delete product');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    let matchStock = true;
    const stock = Number(p.openingStock) || 0;
    const min = Number(p.minStockAlert) || 5;

    if (stockFilter === 'Low') matchStock = stock > 0 && stock <= min;
    else if (stockFilter === 'Out') matchStock = stock <= 0;
    else if (stockFilter === 'InStock') matchStock = stock > min;

    return matchCategory && matchBrand && matchStock;
  });

  // Metrics
  const totalProducts = products.length;
  const totalStockCount = products.reduce((acc, p) => acc + (Number(p.openingStock) || 0), 0);
  const totalInventoryValuation = products.reduce((acc, p) => acc + ((Number(p.costPrice) || 0) * (Number(p.openingStock) || 0)), 0);
  const lowStockCount = products.filter((p) => (Number(p.openingStock) || 0) <= (Number(p.minStockAlert) || 5)).length;

  const exportCSV = () => {
    if (filteredProducts.length === 0) {
      addToast('warning', 'Export', 'No product data to export');
      return;
    }
    const headers = ['Name', 'SKU', 'Barcode', 'Category', 'Brand', 'Cost Price', 'Selling Price', 'Stock', 'Status'];
    const rows = filteredProducts.map(p => [
      `"${p.name || ''}"`,
      `"${p.sku || ''}"`,
      `"${p.barcode || ''}"`,
      `"${p.category || ''}"`,
      `"${p.brand || ''}"`,
      p.costPrice || 0,
      p.sellingPrice || 0,
      p.openingStock || 0,
      `"${p.status || 'Active'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Products_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Exported', 'Products catalog downloaded as CSV.');
  };

  const columns = [
    { 
      header: 'Product', 
      accessor: 'name',
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          {row.image ? (
            <img 
              src={row.image} 
              alt={row.name} 
              className="h-10 w-10 rounded-lg object-cover border border-border/70 flex-shrink-0 bg-muted" 
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {row.name ? row.name.slice(0, 2).toUpperCase() : 'PR'}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-foreground line-clamp-1">{row.name}</span>
            <span className="text-[11px] text-muted-foreground font-mono">SKU: {row.sku}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Category & Brand', 
      accessor: 'category',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-foreground">{row.category || 'Uncategorized'}</span>
          <span className="text-[11px] text-muted-foreground">{row.brand || 'Generic'}</span>
        </div>
      )
    },
    { 
      header: 'Cost Price', 
      accessor: 'costPrice',
      sortable: true,
      render: (row: any) => (
        <span className="text-xs font-mono font-medium text-muted-foreground">
          Rs. {(Number(row.costPrice) || 0).toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Selling Price', 
      accessor: 'sellingPrice',
      sortable: true,
      render: (row: any) => (
        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
          Rs. {(Number(row.sellingPrice) || 0).toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Stock Status', 
      accessor: 'openingStock',
      sortable: true,
      render: (row: any) => {
        const stock = Number(row.openingStock) || 0;
        const minAlert = Number(row.minStockAlert) || 5;
        const isOutOfStock = stock <= 0;
        const isLow = stock > 0 && stock <= minAlert;

        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold text-xs ${isOutOfStock ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-foreground'}`}>
              {stock} {row.unit ? `(${row.unit.split(' ')[0]})` : ''}
            </span>
            {isOutOfStock && <Badge variant="destructive" className="text-[10px] py-0 px-1.5">Out of Stock</Badge>}
            {isLow && <Badge variant="warning" className="text-[10px] py-0 px-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/30">Low</Badge>}
            {!isOutOfStock && !isLow && <Badge variant="success" className="text-[10px] py-0 px-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">In Stock</Badge>}
          </div>
        );
      }
    },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row: any) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'destructive'} className="text-[11px]">
          {row.status || 'Active'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setViewProduct(row)} 
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="View Details"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => router.push(`/products/create?edit=${row._id}`)} 
            className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Edit"
          >
            <Edit className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => handleDelete(row._id, row.name)} 
            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Delete"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" /> Products Catalog
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your enterprise inventory items, pricing, categories, and stock levels.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 gap-1.5">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={fetchProducts} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={() => router.push('/products/create')} className="h-9 gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Products</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{totalProducts} Items</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Stock Units</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{totalStockCount.toLocaleString()} Units</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Inventory Valuation</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Rs. {totalInventoryValuation.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Low Stock Alert</p>
                <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{lowStockCount} Items</h3>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Filters:</span>
              </div>

              {/* Category Filter */}
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-8 text-xs bg-background border border-border rounded-lg px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All Categories ({categories.length})</option>
                {categories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>

              {/* Brand Filter */}
              <select 
                value={selectedBrand} 
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="h-8 text-xs bg-background border border-border rounded-lg px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All Brands ({brands.length})</option>
                {brands.map((b, i) => (
                  <option key={i} value={b}>{b}</option>
                ))}
              </select>

              {/* Stock Status Filter */}
              <select 
                value={stockFilter} 
                onChange={(e) => setStockFilter(e.target.value)}
                className="h-8 text-xs bg-background border border-border rounded-lg px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All Stock Levels</option>
                <option value="InStock">In Stock (Healthy)</option>
                <option value="Low">Low Stock Alert</option>
                <option value="Out">Out of Stock</option>
              </select>
            </div>

            {(selectedCategory !== 'All' || selectedBrand !== 'All' || stockFilter !== 'All') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSelectedCategory('All'); setSelectedBrand('All'); setStockFilter('All'); }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset Filters
              </Button>
            )}
          </div>

          {/* Product Data Table */}
          <DataTable
            title="Inventory Items"
            data={filteredProducts}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search product by name, SKU..."
          />

        </div>

        {/* View Product Details Modal */}
        {viewProduct && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> Product Specifications
                </h3>
                <button onClick={() => setViewProduct(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  {viewProduct.image ? (
                    <img src={viewProduct.image} alt={viewProduct.name} className="h-20 w-20 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                      {viewProduct.name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{viewProduct.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{viewProduct.description || 'No description provided.'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs font-mono">SKU: {viewProduct.sku}</Badge>
                      {viewProduct.barcode && <Badge variant="outline" className="text-xs font-mono">Barcode: {viewProduct.barcode}</Badge>}
                      <Badge variant={viewProduct.status === 'Active' ? 'success' : 'destructive'} className="text-xs">
                        {viewProduct.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted/40 rounded-xl p-4 border border-border/70 text-xs">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-bold text-foreground mt-0.5">{viewProduct.category || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Brand:</span>
                    <p className="font-bold text-foreground mt-0.5">{viewProduct.brand || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unit:</span>
                    <p className="font-bold text-foreground mt-0.5">{viewProduct.unit || 'Pieces'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost Price:</span>
                    <p className="font-bold text-foreground mt-0.5 font-mono">Rs. {Number(viewProduct.costPrice || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Selling Price:</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">Rs. {Number(viewProduct.sellingPrice || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Stock:</span>
                    <p className="font-bold text-primary mt-0.5 font-mono">{viewProduct.openingStock || 0} Units</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min Stock Alert:</span>
                    <p className="font-bold text-foreground mt-0.5 font-mono">{viewProduct.minStockAlert || 5} Units</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tax Rate:</span>
                    <p className="font-bold text-foreground mt-0.5 font-mono">{viewProduct.taxRate || 0}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Supplier:</span>
                    <p className="font-bold text-foreground mt-0.5">{viewProduct.supplier || 'Direct Supply'}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 border-t border-border bg-muted/20 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setViewProduct(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

      </PageContainer>
    </AppShell>
  );
}