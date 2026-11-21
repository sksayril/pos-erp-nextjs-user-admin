'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { 
  Boxes, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  X, 
  Save, 
  Tag
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function VariantsPage() {
  const { addToast } = useToastStore();
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    attributeName: '',
    code: '',
    valuesString: '',
    status: 'Active'
  });

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products/variants');
      const data = await res.json();
      if (Array.isArray(data)) {
        setVariants(data);
      }
    } catch (err) {
      console.error('Fetch variants error:', err);
      addToast('error', 'Error', 'Failed to fetch variants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  const openAddModal = () => {
    setEditingVariant(null);
    setFormData({
      attributeName: '',
      code: `VAR-${Math.floor(100 + Math.random() * 900)}`,
      valuesString: 'Red, Green, Blue',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const openEditModal = (v: any) => {
    setEditingVariant(v);
    setFormData({
      attributeName: v.attributeName || '',
      code: v.code || '',
      valuesString: Array.isArray(v.values) ? v.values.join(', ') : '',
      status: v.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/products/variants?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Variant "${name}" removed.`);
        fetchVariants();
      } else {
        throw new Error('Failed to delete variant');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not delete variant');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.attributeName || !formData.code) {
      addToast('warning', 'Validation', 'Attribute Name and Code are required');
      return;
    }

    try {
      const method = editingVariant ? 'PUT' : 'POST';
      const body = {
        attributeName: formData.attributeName,
        code: formData.code,
        values: formData.valuesString.split(',').map(s => s.trim()).filter(Boolean),
        status: formData.status,
        ...(editingVariant ? { _id: editingVariant._id } : {})
      };

      const res = await fetch('/api/products/variants', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      addToast('success', 'Saved', `Variant ${editingVariant ? 'updated' : 'created'} successfully!`);
      setModalOpen(false);
      fetchVariants();
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not save variant');
    }
  };

  const columns = [
    { 
      header: 'Attribute Name', 
      accessor: 'attributeName', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs">
            <Boxes className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-xs">{row.attributeName}</p>
            <p className="text-[11px] text-muted-foreground font-mono">Code: {row.code}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Assigned Value Options', 
      accessor: 'values', 
      render: (row: any) => (
        <div className="flex flex-wrap gap-1.5 max-w-md">
          {Array.isArray(row.values) && row.values.map((val: string, idx: number) => (
            <span 
              key={idx} 
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/80"
            >
              {val}
            </span>
          ))}
        </div>
      )
    },
    { 
      header: 'Total Options', 
      accessor: 'values', 
      sortable: true,
      render: (row: any) => (
        <Badge variant="outline" className="font-mono text-xs">
          {Array.isArray(row.values) ? row.values.length : 0} Values
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
            onClick={() => handleDelete(row._id, row.attributeName)} 
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
                <Boxes className="h-6 w-6 text-primary" /> Product Variants & Attributes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Define dynamic multi-attribute matrix (Sizes, Colors, Storage, Specifications) for matrix SKUs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchVariants} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={openAddModal} className="h-9 gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> Add Variant Attribute
              </Button>
            </div>
          </div>

          {/* Table */}
          <DataTable
            title="Product Matrix Attributes"
            data={variants}
            columns={columns}
            searchKey="attributeName"
            searchPlaceholder="Search attribute name..."
          />

        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-primary" /> {editingVariant ? 'Edit Variant Attribute' : 'Add Variant Attribute'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Attribute Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Color, Storage, Shoe Size"
                    value={formData.attributeName}
                    onChange={(e) => setFormData({ ...formData, attributeName: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Attribute Code *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. VAR-COLOR"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Value Options (Comma Separated) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Red, Blue, Navy, Emerald"
                    value={formData.valuesString}
                    onChange={(e) => setFormData({ ...formData, valuesString: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">Separate each option value with a comma.</p>
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
                    <Save className="h-4 w-4" /> Save Attribute
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