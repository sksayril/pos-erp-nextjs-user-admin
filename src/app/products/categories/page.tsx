'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { 
  FolderTree, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  X, 
  Save, 
  Package,
  Layers
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function CategoriesPage() {
  const { addToast } = useToastStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parentCategory: '',
    description: '',
    status: 'Active'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/products/categories'),
        fetch('/api/products')
      ]);
      const catData = await catRes.json();
      const prodData = await prodRes.json();

      if (Array.isArray(catData)) setCategories(catData);
      if (Array.isArray(prodData)) setProducts(prodData);
    } catch (err) {
      console.error('Fetch categories error:', err);
      addToast('error', 'Error', 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: `CAT-${Math.floor(100 + Math.random() * 900)}`,
      parentCategory: '',
      description: '',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      code: cat.code || '',
      parentCategory: cat.parentCategory || '',
      description: cat.description || '',
      status: cat.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/products/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Category "${name}" removed.`);
        fetchData();
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not delete category');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast('warning', 'Validation', 'Name and Code are required');
      return;
    }

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const body = editingCategory ? { _id: editingCategory._id, ...formData } : formData;

      const res = await fetch('/api/products/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      addToast('success', 'Saved', `Category ${editingCategory ? 'updated' : 'created'} successfully!`);
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not save category');
    }
  };

  // Map product counts
  const dataWithCounts = categories.map(cat => {
    const count = products.filter(p => p.category === cat.name).length;
    return {
      ...cat,
      productCount: count
    };
  });

  const columns = [
    { 
      header: 'Category Name', 
      accessor: 'name', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            <FolderTree className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-xs">{row.name}</p>
            <p className="text-[11px] text-muted-foreground">{row.description || 'No description'}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Category Code', 
      accessor: 'code', 
      sortable: true,
      render: (row: any) => <span className="font-mono text-xs font-semibold">{row.code}</span>
    },
    { 
      header: 'Parent Category', 
      accessor: 'parentCategory', 
      render: (row: any) => <span className="text-xs text-muted-foreground">{row.parentCategory || 'None (Root Level)'}</span>
    },
    { 
      header: 'Assigned Products', 
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
                <FolderTree className="h-6 w-6 text-primary" /> Product Categories
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Organize your catalog into multi-tier product hierarchies for POS and reporting.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={openAddModal} className="h-9 gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> Add Category
              </Button>
            </div>
          </div>

          {/* Quick Category Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <FolderTree className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Categories</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{categories.length}</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Categories</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {categories.filter(c => c.status === 'Active').length}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Mapped Products</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{products.length} Items</h3>
              </div>
            </div>
          </div>

          {/* Categories Table */}
          <DataTable
            title="Category Directory"
            data={dataWithCounts}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search category name..."
          />

        </div>

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <FolderTree className="h-5 w-5 text-primary" /> {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Category Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Smart Wearables"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Category Code *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. CAT-WEARABLE"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Parent Category (Optional)</label>
                  <select 
                    value={formData.parentCategory} 
                    onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">None (Top Level Root)</option>
                    {categories
                      .filter(c => editingCategory ? c._id !== editingCategory._id : true)
                      .map((c, i) => (
                        <option key={i} value={c.name}>{c.name}</option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Description</label>
                  <textarea 
                    rows={2}
                    placeholder="Brief description of products in this category..."
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
                    <Save className="h-4 w-4" /> Save Category
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