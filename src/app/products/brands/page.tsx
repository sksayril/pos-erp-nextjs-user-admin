'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  X, 
  Save, 
  Globe,
  Package
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function BrandsPage() {
  const { addToast } = useToastStore();
  const [brands, setBrands] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    country: 'United States',
    logoUrl: '',
    description: '',
    status: 'Active'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [brandRes, prodRes] = await Promise.all([
        fetch('/api/products/brands'),
        fetch('/api/products')
      ]);
      const brandData = await brandRes.json();
      const prodData = await prodRes.json();

      if (Array.isArray(brandData)) setBrands(brandData);
      if (Array.isArray(prodData)) setProducts(prodData);
    } catch (err) {
      console.error('Fetch brands error:', err);
      addToast('error', 'Error', 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      code: `BR-${Math.floor(100 + Math.random() * 900)}`,
      country: 'Global',
      logoUrl: '',
      description: '',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const openEditModal = (brand: any) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || '',
      code: brand.code || '',
      country: brand.country || 'Global',
      logoUrl: brand.logoUrl || '',
      description: brand.description || '',
      status: brand.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/products/brands?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Brand "${name}" removed.`);
        fetchData();
      } else {
        throw new Error('Failed to delete brand');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not delete brand');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast('warning', 'Validation', 'Brand Name and Code are required');
      return;
    }

    try {
      const method = editingBrand ? 'PUT' : 'POST';
      const body = editingBrand ? { _id: editingBrand._id, ...formData } : formData;

      const res = await fetch('/api/products/brands', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      addToast('success', 'Saved', `Brand ${editingBrand ? 'updated' : 'created'} successfully!`);
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not save brand');
    }
  };

  const dataWithCounts = brands.map(brand => {
    const count = products.filter(p => p.brand === brand.name).length;
    return {
      ...brand,
      productCount: count
    };
  });

  const columns = [
    { 
      header: 'Brand', 
      accessor: 'name', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {row.name ? row.name.slice(0, 2).toUpperCase() : 'BR'}
          </div>
          <div>
            <p className="font-semibold text-foreground text-xs">{row.name}</p>
            <p className="text-[11px] text-muted-foreground">{row.description || 'Verified manufacturer'}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Brand Code', 
      accessor: 'code', 
      sortable: true,
      render: (row: any) => <span className="font-mono text-xs font-semibold">{row.code}</span>
    },
    { 
      header: 'Origin Country', 
      accessor: 'country', 
      render: (row: any) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          <span>{row.country || 'Global'}</span>
        </div>
      )
    },
    { 
      header: 'Catalog Products', 
      accessor: 'productCount', 
      sortable: true,
      render: (row: any) => (
        <Badge variant="outline" className="text-xs font-mono font-bold">
          {row.productCount || 0} Products
        </Badge>
      )
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
            onClick={() => openEditModal(row)} 
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
                <Building2 className="h-6 w-6 text-primary" /> Manufacturer Brands
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Maintain certified brand partnerships and manufacturer supplier profiles.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={openAddModal} className="h-9 gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> Add Brand
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Brands</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{brands.length}</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Brands</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {brands.filter(b => b.status === 'Active').length}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Global Markets</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">
                  {Array.from(new Set(brands.map(b => b.country).filter(Boolean))).length} Countries
                </h3>
              </div>
            </div>
          </div>

          {/* Brands Table */}
          <DataTable
            title="Brand Registry"
            data={dataWithCounts}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search brand name..."
          />

        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> {editingBrand ? 'Edit Brand' : 'Add New Brand'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Brand Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Sony, Apple, Bose"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Brand Code *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. BR-SONY"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Country of Origin</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Japan, United States, Germany"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Description</label>
                  <textarea 
                    rows={2}
                    placeholder="Brand history, certified vendor status..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-border p-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-semibold gap-1.5">
                    <Save className="h-4 w-4" /> Save Brand
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </PageContainer>
    </AppShell>
  );
}