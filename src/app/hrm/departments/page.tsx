'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Building2, Plus, Users, DollarSign, Search, 
  Trash2, Edit3, Briefcase, ShieldAlert, Sparkles, RefreshCw, CheckCircle2 
} from 'lucide-react';

export default function DepartmentsPage() {
  const { addToast } = useToastStore();

  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for create
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [head, setHead] = useState('');
  const [budget, setBudget] = useState('150000');
  const [description, setDescription] = useState('');

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hrm/departments');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDepartments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Create Department
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      addToast('warning', 'Required Fields', 'Department Name and Code are required.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/hrm/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          headOfDepartment: head.trim() || 'Unassigned',
          budget: Number(budget) || 0,
          description: description.trim(),
          status: 'Active'
        })
      });

      if (res.ok) {
        addToast('success', 'Department Created', `Department ${name} added.`);
        setCreateModalOpen(false);
        setName('');
        setCode('');
        setHead('');
        setDescription('');
        fetchDepartments();
      }
    } catch {
      addToast('error', 'Error', 'Failed to create department.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Department
  const handleDelete = async (dep: any) => {
    if (!confirm(`Are you sure you want to delete ${dep.name}?`)) return;
    try {
      const res = await fetch(`/api/hrm/departments?id=${dep._id}`, { method: 'DELETE' });
      if (res.ok) {
        setDepartments(prev => prev.filter(d => d._id !== dep._id));
        addToast('info', 'Department Deleted', `${dep.name} removed from system.`);
      }
    } catch {
      addToast('error', 'Failed', 'Could not delete department.');
    }
  };

  // Edit Save
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/hrm/departments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDept)
      });
      const updated = await res.json();
      if (res.ok) {
        setDepartments(prev => prev.map(d => d._id === updated._id ? updated : d));
        addToast('success', 'Saved', `${updated.name} updated.`);
        setEditDept(null);
      }
    } catch {
      addToast('error', 'Failed', 'Could not update department.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter list
  const filteredDepartments = departments.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q) || d.headOfDepartment?.toLowerCase().includes(q);
  });

  const totalBudget = departments.reduce((sum, d) => sum + (Number(d.budget) || 0), 0);
  const totalEmployees = departments.reduce((sum, d) => sum + (Number(d.employeeCount) || 0), 0);

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">Organization Departments</h1>
                <p className="text-xs text-muted-foreground">Manage corporate divisions, department heads, operational budgets &amp; staff allocations.</p>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => setCreateModalOpen(true)}
              className="gap-2 h-10 px-4 rounded-xl shadow-md font-bold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Department</span>
            </Button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Total Departments</span>
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground">{departments.length}</p>
              <p className="text-[11px] text-muted-foreground">Functional branches</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Allocated Staff</span>
                <Users className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalEmployees}</p>
              <p className="text-[11px] text-muted-foreground">Across all divisions</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Total Monthly Budget</span>
                <DollarSign className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">₹{totalBudget.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Operating allowances</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Status</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-foreground">100% Active</p>
              <p className="text-[11px] text-muted-foreground">All units operational</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Department Name, Code, or Head..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-muted/20 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
          </div>

          {/* Departments Table */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Head of Department</th>
                    <th className="py-3.5 px-4">Employees</th>
                    <th className="py-3.5 px-4">Monthly Budget</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span>Loading departments...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDepartments.length > 0 ? (
                    filteredDepartments.map((d) => (
                      <tr key={d._id || d.departmentId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center text-xs">
                              {d.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-xs">{d.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{d.departmentId}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-extrabold px-2 py-0.5 rounded bg-muted text-foreground text-[10px]">
                            {d.code}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-semibold text-foreground">
                          {d.headOfDepartment || 'Unassigned'}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-primary font-mono">{d.employeeCount || 0} Staff</span>
                        </td>

                        <td className="py-3 px-4 font-bold font-mono text-foreground">
                          ₹{Number(d.budget || 0).toLocaleString()}
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate text-muted-foreground" title={d.description}>
                          {d.description || '—'}
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={d.status === 'Active' ? 'success' : 'secondary'}>
                            {d.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditDept({ ...d })}
                              className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                              title="Edit Department"
                            >
                              <Edit3 className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(d)}
                              className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <Building2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="font-semibold text-xs text-foreground">No departments found</p>
                        <p className="text-[11px]">Click &quot;+ Add Department&quot; to create a division.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* 1. CREATE DEPARTMENT MODAL */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Department"
          size="md"
        >
          <form onSubmit={handleCreateDept} className="space-y-4 select-none text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Department Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Quality Assurance"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. QA"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Head of Department</label>
                <input
                  type="text"
                  value={head}
                  onChange={(e) => setHead(e.target.value)}
                  placeholder="e.g. Rohit Mehra"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Monthly Budget (₹)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="150000"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Department responsibilities and function..."
                className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="border-t border-border/50 pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving}>Save Department</Button>
            </div>
          </form>
        </Modal>

        {/* 2. EDIT DEPARTMENT MODAL */}
        <Modal
          isOpen={!!editDept}
          onClose={() => setEditDept(null)}
          title="Edit Department"
          size="md"
        >
          {editDept && (
            <form onSubmit={handleSaveEdit} className="space-y-4 select-none text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={editDept.name || ''}
                    onChange={(e) => setEditDept({ ...editDept, name: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Code *</label>
                  <input
                    type="text"
                    required
                    value={editDept.code || ''}
                    onChange={(e) => setEditDept({ ...editDept, code: e.target.value.toUpperCase() })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Head of Department</label>
                  <input
                    type="text"
                    value={editDept.headOfDepartment || ''}
                    onChange={(e) => setEditDept({ ...editDept, headOfDepartment: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Monthly Budget (₹)</label>
                  <input
                    type="number"
                    value={editDept.budget || 0}
                    onChange={(e) => setEditDept({ ...editDept, budget: Number(e.target.value) })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">Description</label>
                <textarea
                  rows={2}
                  value={editDept.description || ''}
                  onChange={(e) => setEditDept({ ...editDept, description: e.target.value })}
                  className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="border-t border-border/50 pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDept(null)}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isSaving}>Save Changes</Button>
              </div>
            </form>
          )}
        </Modal>

      </PageContainer>
    </AppShell>
  );
}