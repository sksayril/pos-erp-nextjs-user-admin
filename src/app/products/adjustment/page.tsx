'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { 
  SlidersHorizontal, 
  Plus, 
  Trash2, 
  RefreshCw, 
  X, 
  Save, 
  TrendingUp, 
  TrendingDown, 
  Warehouse,
  FileSpreadsheet
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function StockAdjustmentPage() {
  const { addToast } = useToastStore();
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    adjustmentNumber: '',
    date: new Date().toISOString().split('T')[0],
    warehouseName: 'Main Warehouse - Hub A',
    productId: '',
    productName: '',
    sku: '',
    type: 'Addition',
    quantity: 1,
    reason: 'Inventory Audit Discrepancy',
    adjustedBy: 'Warehouse Manager',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adjRes, prodRes] = await Promise.all([
        fetch('/api/products/adjustment'),
        fetch('/api/products')
      ]);
      const adjData = await adjRes.json();
      const prodData = await prodRes.json();

      if (Array.isArray(adjData)) setAdjustments(adjData);
      if (Array.isArray(prodData)) setProducts(prodData);
    } catch (err) {
      console.error('Fetch adjustment error:', err);
      addToast('error', 'Error', 'Failed to fetch stock adjustments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    const p = products[0] || {};
    setFormData({
      adjustmentNumber: `ADJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      warehouseName: 'Main Warehouse - Hub A',
      productId: p._id || '',
      productName: p.name || '',
      sku: p.sku || '',
      type: 'Addition',
      quantity: 1,
      reason: 'Physical Count Verification',
      adjustedBy: 'Warehouse Manager',
      notes: ''
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
        sku: p.sku
      }));
    }
  };

  const handleDelete = async (id: string, adjNum: string) => {
    if (!confirm(`Are you sure you want to delete adjustment log "${adjNum}"?`)) return;
    try {
      const res = await fetch(`/api/products/adjustment?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Adjustment "${adjNum}" removed.`);
        fetchData();
      } else {
        throw new Error('Failed to delete adjustment');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not delete adjustment');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.adjustmentNumber || !formData.productName || !formData.quantity) {
      addToast('warning', 'Validation', 'Adjustment Number, Product, and Quantity are required');
      return;
    }

    try {
      const res = await fetch('/api/products/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      addToast('success', 'Saved', `Stock adjusted and synced with live product inventory!`);
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not save adjustment');
    }
  };

  const columns = [
    { 
      header: 'Adjustment #', 
      accessor: 'adjustmentNumber', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
            row.type === 'Addition' 
              ? 'bg-emerald-500/10 text-emerald-600' 
              : 'bg-rose-500/10 text-rose-600'
          }`}>
            {row.type === 'Addition' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-mono font-bold text-xs text-foreground">{row.adjustmentNumber}</p>
            <p className="text-[11px] text-muted-foreground font-mono">{row.date}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Product Adjusted', 
      accessor: 'productName', 
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{row.productName}</span>
          <span className="text-[11px] text-muted-foreground font-mono">SKU: {row.sku}</span>
        </div>
      )
    },
    { 
      header: 'Adjustment Type', 
      accessor: 'type', 
      sortable: true,
      render: (row: any) => (
        <Badge variant={row.type === 'Addition' ? 'success' : 'destructive'} className="text-[11px]">
          {row.type === 'Addition' ? '+ Addition (Surplus)' : '- Subtraction (Damage/Loss)'}
        </Badge>
      )
    },
    { 
      header: 'Quantity (Units)', 
      accessor: 'quantity', 
      sortable: true,
      render: (row: any) => (
        <span className={`font-mono font-bold text-xs ${row.type === 'Addition' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {row.type === 'Addition' ? `+${row.quantity}` : `-${row.quantity}`} Units
        </span>
      )
    },
    { 
      header: 'Reason / Notes', 
      accessor: 'reason', 
      render: (row: any) => (
        <div className="flex flex-col max-w-xs">
          <span className="text-xs text-foreground font-medium">{row.reason}</span>
          {row.notes && <span className="text-[11px] text-muted-foreground italic">{row.notes}</span>}
        </div>
      )
    },
    { 
      header: 'Warehouse', 
      accessor: 'warehouseName', 
      render: (row: any) => <span className="text-xs text-muted-foreground">{row.warehouseName || 'Main Hub'}</span>
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => handleDelete(row._id, row.adjustmentNumber)} 
            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Delete Adjustment"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      )
    }
  ];

  const totalAdditions = adjustments.filter(a => a.type === 'Addition').reduce((acc, a) => acc + (Number(a.quantity) || 0), 0);
  const totalSubtractions = adjustments.filter(a => a.type === 'Subtraction').reduce((acc, a) => acc + (Number(a.quantity) || 0), 0);

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <SlidersHorizontal className="h-6 w-6 text-primary" /> Stock Adjustments & Audit
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Record manual inventory corrections, damaged goods write-offs, and cycle audit reconciliations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={openAddModal} className="h-9 gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> New Stock Adjustment
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Adjustment Logs</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{adjustments.length} Records</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Units Added (+)</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  +{totalAdditions} Units
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Units Written-Off (-)</p>
                <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  -{totalSubtractions} Units
                </h3>
              </div>
            </div>
          </div>

          {/* Table */}
          <DataTable
            title="Adjustment Audit Trail"
            data={adjustments}
            columns={columns}
            searchKey="adjustmentNumber"
            searchPlaceholder="Search adjustment number, product, or reason..."
          />

        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" /> Record Stock Adjustment
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Adjustment Ref Number *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.adjustmentNumber}
                    onChange={(e) => setFormData({ ...formData, adjustmentNumber: e.target.value.toUpperCase() })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Date</label>
                    <input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Adjustment Type</label>
                    <select 
                      value={formData.type} 
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Addition">Addition (+) Stock Surplus</option>
                      <option value="Subtraction">Subtraction (-) Damaged / Lost</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Product Item *</label>
                  <select 
                    value={formData.productId} 
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {products.map((p, i) => (
                      <option key={i} value={p._id || p.id}>
                        {p.name} (Current Stock: {p.openingStock || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Quantity to Adjust *</label>
                    <input 
                      type="number" 
                      min={1}
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Warehouse Location</label>
                    <input 
                      type="text" 
                      value={formData.warehouseName}
                      onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Reason for Adjustment</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Audit reconciliation, Water damage in warehouse"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Additional Notes</label>
                  <textarea 
                    rows={2}
                    placeholder="Approver remarks or notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-lg border border-border p-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-semibold gap-1.5">
                    <Save className="h-4 w-4" /> Save & Sync Stock
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