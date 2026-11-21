'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { 
  BadgePercent, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  X, 
  Save, 
  Users
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function PriceListsPage() {
  const { addToast } = useToastStore();
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Percentage Discount',
    value: 10,
    applicableFor: 'All Customers',
    status: 'Active'
  });

  const fetchPriceLists = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products/prices');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPriceLists(data);
      }
    } catch (err) {
      console.error('Fetch price lists error:', err);
      addToast('error', 'Error', 'Failed to fetch price lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceLists();
  }, []);

  const openAddModal = () => {
    setEditingPrice(null);
    setFormData({
      name: '',
      code: `PL-${Math.floor(100 + Math.random() * 900)}`,
      type: 'Percentage Discount',
      value: 10,
      applicableFor: 'All Customers',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingPrice(p);
    setFormData({
      name: p.name || '',
      code: p.code || '',
      type: p.type || 'Percentage Discount',
      value: p.value || 0,
      applicableFor: p.applicableFor || 'All Customers',
      status: p.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/products/prices?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Price list "${name}" removed.`);
        fetchPriceLists();
      } else {
        throw new Error('Failed to delete price list');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not delete price list');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast('warning', 'Validation', 'Name and Code are required');
      return;
    }

    try {
      const method = editingPrice ? 'PUT' : 'POST';
      const body = {
        ...formData,
        value: Number(formData.value) || 0,
        ...(editingPrice ? { _id: editingPrice._id } : {})
      };

      const res = await fetch('/api/products/prices', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      addToast('success', 'Saved', `Price rule ${editingPrice ? 'updated' : 'created'} successfully!`);
      setModalOpen(false);
      fetchPriceLists();
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not save price list');
    }
  };

  const columns = [
    { 
      header: 'Price List Name', 
      accessor: 'name', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
            <BadgePercent className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-xs">{row.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono">Code: {row.code}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Adjustment Type', 
      accessor: 'type', 
      sortable: true,
      render: (row: any) => (
        <Badge variant={row.type === 'Markup' ? 'warning' : 'outline'} className="text-xs">
          {row.type}
        </Badge>
      )
    },
    { 
      header: 'Rate / Discount Value', 
      accessor: 'value', 
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-foreground">
          {row.type === 'Percentage Discount' ? `${row.value}% OFF` : row.type === 'Markup' ? `+${row.value}% Markup` : `Rs. ${row.value}`}
        </span>
      )
    },
    { 
      header: 'Target Buyer Group', 
      accessor: 'applicableFor', 
      render: (row: any) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{row.applicableFor || 'General Public'}</span>
        </div>
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
                <BadgePercent className="h-6 w-6 text-primary" /> Price Lists & Margins
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Establish automated customer tier pricing, wholesale discount matrices, and distributor markups.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchPriceLists} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={openAddModal} className="h-9 gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> Add Price Rule
              </Button>
            </div>
          </div>

          {/* Table */}
          <DataTable
            title="Active Price List Rules"
            data={priceLists}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search price list name..."
          />

        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <BadgePercent className="h-5 w-5 text-primary" /> {editingPrice ? 'Edit Price Rule' : 'Create Price Rule'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Rule / List Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. VIP Member Discount 15%"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Rule Code *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. PL-VIP-15"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Rule Type</label>
                    <select 
                      value={formData.type} 
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Percentage Discount">Percentage (%) Discount</option>
                      <option value="Fixed Price">Fixed Absolute Price</option>
                      <option value="Markup">Percentage (%) Markup</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Value (% or Rs.)</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="10"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Applicable For</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Wholesale B2B Clients, VIP Club"
                    value={formData.applicableFor}
                    onChange={(e) => setFormData({ ...formData, applicableFor: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                    <Save className="h-4 w-4" /> Save Price Rule
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