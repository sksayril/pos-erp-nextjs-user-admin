'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { 
  CalendarClock, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  X, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  Package
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function BatchesPage() {
  const { addToast } = useToastStore();
  const [batches, setBatches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    batchNumber: '',
    productId: '',
    productName: '',
    sku: '',
    mfgDate: '',
    expDate: '',
    quantity: 50,
    remainingQuantity: 50,
    costPrice: 0,
    status: 'Active'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchRes, prodRes] = await Promise.all([
        fetch('/api/products/batches'),
        fetch('/api/products')
      ]);
      const batchData = await batchRes.json();
      const prodData = await prodRes.json();

      if (Array.isArray(batchData)) setBatches(batchData);
      if (Array.isArray(prodData)) setProducts(prodData);
    } catch (err) {
      console.error('Fetch batches error:', err);
      addToast('error', 'Error', 'Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingBatch(null);
    const p = products[0] || {};
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setFormData({
      batchNumber: `BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      productId: p._id || '',
      productName: p.name || '',
      sku: p.sku || '',
      mfgDate: today,
      expDate: nextYear,
      quantity: 50,
      remainingQuantity: 50,
      costPrice: p.costPrice || 0,
      status: 'Active'
    });
    setModalOpen(true);
  };

  const openEditModal = (b: any) => {
    setEditingBatch(b);
    setFormData({
      batchNumber: b.batchNumber || '',
      productId: b.productId || '',
      productName: b.productName || '',
      sku: b.sku || '',
      mfgDate: b.mfgDate || '',
      expDate: b.expDate || '',
      quantity: b.quantity || 0,
      remainingQuantity: b.remainingQuantity || 0,
      costPrice: b.costPrice || 0,
      status: b.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleProductSelect = (id: string) => {
    const p = products.find((x: any) => (x._id || x.id) === id);
    if (p) {
      setFormData(prev => ({
        ...prev,
        productId: p._id || p.id,
        productName: p.name,
        sku: p.sku,
        costPrice: p.costPrice || prev.costPrice
      }));
    }
  };

  const handleDelete = async (id: string, batchNum: string) => {
    if (!confirm(`Are you sure you want to delete batch "${batchNum}"?`)) return;
    try {
      const res = await fetch(`/api/products/batches?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Batch "${batchNum}" removed.`);
        fetchData();
      } else {
        throw new Error('Failed to delete batch');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not delete batch');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batchNumber || !formData.productName) {
      addToast('warning', 'Validation', 'Batch Number and Product are required');
      return;
    }

    try {
      const method = editingBatch ? 'PUT' : 'POST';
      const body = {
        ...formData,
        quantity: Number(formData.quantity) || 0,
        remainingQuantity: Number(formData.remainingQuantity) || 0,
        costPrice: Number(formData.costPrice) || 0,
        ...(editingBatch ? { _id: editingBatch._id } : {})
      };

      const res = await fetch('/api/products/batches', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      addToast('success', 'Saved', `Batch ${editingBatch ? 'updated' : 'created'} successfully!`);
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not save batch');
    }
  };

  // Helper for expiry status
  const getExpiryStatus = (expDate: string) => {
    if (!expDate) return { label: 'No Expiry', color: 'default' };
    const exp = new Date(expDate).getTime();
    const now = new Date().getTime();
    const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { label: 'Expired', color: 'destructive', days: daysLeft };
    if (daysLeft <= 30) return { label: `Expiring Soon (${daysLeft}d)`, color: 'warning', days: daysLeft };
    return { label: `Valid (${daysLeft}d left)`, color: 'success', days: daysLeft };
  };

  const columns = [
    { 
      header: 'Batch Number', 
      accessor: 'batchNumber', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono font-bold text-xs text-foreground">{row.batchNumber}</p>
            <p className="text-[11px] text-muted-foreground">{row.productName}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'SKU', 
      accessor: 'sku', 
      sortable: true,
      render: (row: any) => <span className="font-mono text-xs">{row.sku}</span>
    },
    { 
      header: 'Mfg Date', 
      accessor: 'mfgDate', 
      render: (row: any) => <span className="text-xs text-muted-foreground font-mono">{row.mfgDate || 'N/A'}</span>
    },
    { 
      header: 'Exp Date & Shelf Life', 
      accessor: 'expDate', 
      sortable: true,
      render: (row: any) => {
        const expStatus = getExpiryStatus(row.expDate);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-mono font-semibold text-foreground">{row.expDate || 'None'}</span>
            <Badge variant={expStatus.color as any} className="text-[10px] py-0 w-fit">
              {expStatus.label}
            </Badge>
          </div>
        );
      }
    },
    { 
      header: 'Remaining Stock', 
      accessor: 'remainingQuantity', 
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-foreground">
            {row.remainingQuantity} / {row.quantity} Units
          </span>
          <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className="bg-primary h-full" 
              style={{ width: `${Math.min(100, Math.round(((row.remainingQuantity || 0) / (row.quantity || 1)) * 100))}%` }} 
            />
          </div>
        </div>
      )
    },
    { 
      header: 'Cost Price', 
      accessor: 'costPrice', 
      render: (row: any) => <span className="font-mono text-xs">Rs. {Number(row.costPrice || 0).toLocaleString()}</span>
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
            onClick={() => handleDelete(row._id, row.batchNumber)} 
            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Delete"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      )
    }
  ];

  const totalBatches = batches.length;
  const expiredCount = batches.filter(b => getExpiryStatus(b.expDate).color === 'destructive').length;
  const expiringSoonCount = batches.filter(b => getExpiryStatus(b.expDate).color === 'warning').length;

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <CalendarClock className="h-6 w-6 text-primary" /> Batches & Expiry Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor lot numbers, production dates, perishability, and FIFO stock rotation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={openAddModal} className="h-9 gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> Add New Batch
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <CalendarClock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Active Batches</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{totalBatches} Lots</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Expiring in 30 Days</p>
                <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{expiringSoonCount} Lots</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Expired Items</p>
                <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{expiredCount} Lots</h3>
              </div>
            </div>
          </div>

          {/* Table */}
          <DataTable
            title="Batch Expiry Ledger"
            data={batches}
            columns={columns}
            searchKey="batchNumber"
            searchPlaceholder="Search batch number or SKU..."
          />

        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" /> {editingBatch ? 'Edit Batch Record' : 'Record New Batch'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Batch / Lot Number *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. BAT-2026-891"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value.toUpperCase() })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Select Product *</label>
                  <select 
                    value={formData.productId} 
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {products.map((p, i) => (
                      <option key={i} value={p._id || p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Mfg Date</label>
                    <input 
                      type="date" 
                      value={formData.mfgDate}
                      onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Exp Date</label>
                    <input 
                      type="date" 
                      value={formData.expDate}
                      onChange={(e) => setFormData({ ...formData, expDate: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Total Quantity</label>
                    <input 
                      type="number" 
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Remaining Quantity</label>
                    <input 
                      type="number" 
                      value={formData.remainingQuantity}
                      onChange={(e) => setFormData({ ...formData, remainingQuantity: parseInt(e.target.value) || 0 })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-semibold gap-1.5">
                    <Save className="h-4 w-4" /> Save Batch
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