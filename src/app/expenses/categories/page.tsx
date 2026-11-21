'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { 
  Tag, Plus, RefreshCw, Edit3, Trash2, 
  DollarSign, CheckCircle2, ShieldAlert, FolderKanban
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function CategoriesPage() {
  const { addToast } = useToastStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    budgetLimit: '',
    description: '',
    color: 'blue',
    status: 'Active'
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
      addToast('error', 'Fetch Error', 'Failed to retrieve expense categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditCategory(null);
    setForm({
      name: '',
      code: '',
      budgetLimit: '',
      description: '',
      color: 'blue',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditCategory(cat);
    setForm({
      name: cat.name || '',
      code: cat.code || '',
      budgetLimit: cat.budgetLimit ? String(cat.budgetLimit) : '',
      description: cat.description || '',
      color: cat.color || 'blue',
      status: cat.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast('error', 'Validation Error', 'Category name is required.');
      return;
    }

    try {
      setIsSaving(true);
      const url = editCategory ? `/api/expenses/categories/${editCategory._id}` : '/api/expenses/categories';
      const method = editCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          budgetLimit: Number(form.budgetLimit) || 0
        })
      });

      if (res.ok) {
        const saved = await res.json();
        addToast('success', editCategory ? 'Category Updated' : 'Category Created', `"${saved.name}" has been saved.`);
        if (editCategory) {
          setCategories(prev => prev.map(c => c._id === saved._id ? saved : c));
        } else {
          setCategories(prev => [saved, ...prev]);
        }
        setModalOpen(false);
      } else {
        const err = await res.json();
        addToast('error', 'Save Failed', err.error || 'Could not save category.');
      }
    } catch (error) {
      addToast('error', 'Error', 'Failed to communicate with database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/expenses/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Category Deleted', `"${name}" removed successfully.`);
        setCategories(prev => prev.filter(c => c._id !== id));
      } else {
        const err = await res.json();
        addToast('error', 'Delete Failed', err.error || 'Could not delete category.');
      }
    } catch (error) {
      addToast('error', 'Error', 'Failed to delete category.');
    }
  };

  const totalBudget = categories.reduce((acc, c) => acc + (Number(c.budgetLimit) || 0), 0);
  const activeCount = categories.filter(c => c.status === 'Active').length;

  const columns = [
    {
      header: 'Category Name',
      accessor: 'name',
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            <Tag className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-xs text-foreground block">{row.name}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{row.code || '—'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Monthly Budget Limit',
      accessor: 'budgetLimit',
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-foreground">
          ₹{Number(row.budgetLimit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Description / Purpose',
      accessor: 'description',
      render: (row: any) => (
        <span className="text-xs text-muted-foreground line-clamp-1">
          {row.description || 'No description provided.'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row: any) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'outline'} className="text-[11px]">
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
            onClick={() => handleOpenEdit(row)}
            className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Edit Category"
          >
            <Edit3 className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => handleDelete(row._id, row.name)}
            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Delete Category"
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
                <FolderKanban className="h-6 w-6 text-primary" /> Expense Categories & Budget
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure expense classification headers, budget caps, and overhead cost categories.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading} className="cursor-pointer">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={handleOpenAdd} className="cursor-pointer">
                <Plus className="h-4 w-4" /> Add Category
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground">Total Categories</span>
              <div className="text-2xl font-bold text-foreground mt-1">{categories.length}</div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Active overhead groups</span>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground">Combined Monthly Budget Cap</span>
              <div className="text-2xl font-bold text-primary mt-1">
                ₹{totalBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Allocated limit across categories</span>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground">Active Status</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{activeCount} / {categories.length}</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Operational nodes</span>
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            data={categories}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search category name or code..."
          />

          {/* Add / Edit Modal */}
          <Modal
            isOpen={modalOpen}
            onClose={() => !isSaving && setModalOpen(false)}
            title={editCategory ? 'Edit Expense Category' : 'Add New Expense Category'}
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Office Rent & Maintenance"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Category Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. EXP-RENT"
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Monthly Budget Cap (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.budgetLimit}
                    onChange={(e) => setForm(f => ({ ...f, budgetLimit: e.target.value }))}
                    placeholder="0.00"
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Description & Scope</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Explain what kind of expenses belong in this category..."
                  className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSaving}>
                  {editCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </div>
            </form>
          </Modal>

        </div>
      </PageContainer>
    </AppShell>
  );
}