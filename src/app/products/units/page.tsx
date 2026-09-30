'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { 
  Scale, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  X, 
  Save, 
  Calculator
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function UnitsPage() {
  const { addToast } = useToastStore();
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    baseUnit: '',
    operator: '*',
    operationValue: 1,
    status: 'Active'
  });

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products/units');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUnits(data);
      }
    } catch (err) {
      console.error('Fetch units error:', err);
      addToast('error', 'Error', 'Failed to fetch units of measurement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const openAddModal = () => {
    setEditingUnit(null);
    setFormData({
      name: '',
      code: '',
      baseUnit: '',
      operator: '*',
      operationValue: 1,
      status: 'Active'
    });
    setModalOpen(true);
  };

  const openEditModal = (unit: any) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name || '',
      code: unit.code || '',
      baseUnit: unit.baseUnit || '',
      operator: unit.operator || '*',
      operationValue: unit.operationValue || 1,
      status: unit.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete unit "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/units?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Unit "${name}" removed.`);
        fetchUnits();
      } else {
        throw new Error('Failed to delete unit');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not delete unit');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast('warning', 'Validation', 'Unit Name and Code are required');
      return;
    }

    try {
      const method = editingUnit ? 'PUT' : 'POST';
      const body = editingUnit ? { _id: editingUnit._id, ...formData } : formData;

      const res = await fetch('/api/products/units', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      addToast('success', 'Saved', `Unit ${editingUnit ? 'updated' : 'created'} successfully!`);
      setModalOpen(false);
      fetchUnits();
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not save unit');
    }
  };

  const columns = [
    { 
      header: 'Unit Name', 
      accessor: 'name', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-xs">{row.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono">Symbol: {row.code}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Short Code', 
      accessor: 'code', 
      sortable: true,
      render: (row: any) => <Badge variant="outline" className="font-mono text-xs">{row.code}</Badge>
    },
    { 
      header: 'Base Unit Conversion', 
      accessor: 'baseUnit', 
      render: (row: any) => (
        row.baseUnit ? (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-muted-foreground">1 {row.code} =</span>
            <span className="font-bold text-primary">{row.operationValue} {row.baseUnit}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Base Root Unit</span>
        )
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
                <Scale className="h-6 w-6 text-primary" /> Units of Measurement
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure standard measuring units, weight, volume, and packaging multipliers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchUnits} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={openAddModal} className="h-9 gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> Add Unit
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Units</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{units.length} Standard Units</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Compound Multipliers</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">
                  {units.filter(u => u.baseUnit).length} Converted
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center" variant="success">OK</Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active For POS</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {units.filter(u => u.status === 'Active').length} Active
                </h3>
              </div>
            </div>
          </div>

          {/* Units Table */}
          <DataTable
            title="Measurement Units"
            data={units}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search unit by name or code..."
          />

        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" /> {editingUnit ? 'Edit Unit' : 'Add Measurement Unit'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Unit Full Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Kilograms, Box of 12, Liters"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Unit Short Code / Symbol *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. kg, box, ltr, pcs"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                    className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Base Unit (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. pcs, gm"
                      value={formData.baseUnit}
                      onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Conversion Multiplier</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="1"
                      value={formData.operationValue}
                      onChange={(e) => setFormData({ ...formData, operationValue: parseFloat(e.target.value) || 1 })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
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
                    <Save className="h-4 w-4" /> Save Unit
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