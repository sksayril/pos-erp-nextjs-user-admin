'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Users, UserPlus, Search, Filter, Phone, Mail, 
  Building2, Briefcase, DollarSign, Calendar, CheckCircle2, 
  Trash2, Edit3, Eye, MoreVertical, X, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';

export default function EmployeesPage() {
  const { addToast } = useToastStore();

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [viewEmployee, setViewEmployee] = useState<any>(null);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hrm/employees');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter logic
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      emp.name?.toLowerCase().includes(q) || 
      emp.employeeId?.toLowerCase().includes(q) || 
      emp.email?.toLowerCase().includes(q) || 
      emp.phone?.includes(q) ||
      emp.designation?.toLowerCase().includes(q);

    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Unique departments for filter
  const departments = ['all', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];

  // KPI calculations
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const onLeaveEmployees = employees.filter(e => e.status === 'On Leave').length;
  const totalPayroll = employees.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);

  // Quick Status Toggle
  const handleToggleStatus = async (emp: any) => {
    const newStatus = emp.status === 'Active' ? 'On Leave' : 'Active';
    try {
      const res = await fetch('/api/hrm/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: emp._id, employeeId: emp.employeeId, status: newStatus })
      });
      if (res.ok) {
        setEmployees(prev => prev.map(item => item._id === emp._id ? { ...item, status: newStatus } : item));
        addToast('success', 'Status Updated', `${emp.name} marked as ${newStatus}.`);
      }
    } catch {
      addToast('error', 'Update Failed', 'Could not update employee status.');
    }
  };

  // Delete Employee
  const handleDelete = async (emp: any) => {
    if (!confirm(`Are you sure you want to remove employee "${emp.name}"?`)) return;
    try {
      const res = await fetch(`/api/hrm/employees?id=${emp._id}`, { method: 'DELETE' });
      if (res.ok) {
        setEmployees(prev => prev.filter(item => item._id !== emp._id));
        addToast('info', 'Employee Removed', `${emp.name} deleted from records.`);
      }
    } catch {
      addToast('error', 'Delete Failed', 'Could not delete employee record.');
    }
  };

  // Update employee details from Edit Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch('/api/hrm/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editEmployee)
      });
      const updated = await res.json();
      if (res.ok) {
        setEmployees(prev => prev.map(item => item._id === updated._id ? updated : item));
        addToast('success', 'Employee Saved', `${updated.name} profile updated successfully.`);
        setEditEmployee(null);
      }
    } catch {
      addToast('error', 'Update Error', 'Failed to save changes.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-foreground tracking-tight">Employees Directory</h1>
                  <p className="text-xs text-muted-foreground">Manage organization staff, job designations, salary structures &amp; profiles.</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="sm" onClick={fetchEmployees} className="gap-1.5 h-10 rounded-xl">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Link href="/hrm/employees/create">
                <Button variant="primary" className="gap-2 h-10 px-4 rounded-xl shadow-md font-bold cursor-pointer">
                  <UserPlus className="h-4 w-4" />
                  <span>+ Add New Employee</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Total Staff</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground">{totalEmployees}</p>
              <p className="text-[11px] text-muted-foreground">Across all departments</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Active Staff</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeEmployees}</p>
              <p className="text-[11px] text-muted-foreground">On duty &amp; regular payroll</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">On Leave</span>
                <Briefcase className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{onLeaveEmployees}</p>
              <p className="text-[11px] text-muted-foreground">Approved time-off today</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Monthly Payroll</span>
                <DollarSign className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">₹{totalPayroll.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Estimated gross monthly expense</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Name, ID, Phone, Role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-muted/20 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 font-semibold">
                <Filter className="h-3.5 w-3.5" /> Department:
              </div>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 font-semibold ml-2">
                Status:
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* Employees Table Grid */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Employee ID</th>
                    <th className="py-3.5 px-4">Department &amp; Role</th>
                    <th className="py-3.5 px-4">Contact Details</th>
                    <th className="py-3.5 px-4">Monthly Salary</th>
                    <th className="py-3.5 px-4">Join Date</th>
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
                          <span>Loading employee directory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <tr key={emp._id || emp.employeeId} className="hover:bg-muted/30 transition-colors">
                        
                        {/* Employee Avatar & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-extrabold flex items-center justify-center shrink-0 border border-primary/20 text-xs">
                              {emp.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-xs">{emp.name}</p>
                              <p className="text-[10px] text-muted-foreground">{emp.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* ID */}
                        <td className="py-3 px-4 font-mono font-bold text-[11px] text-foreground">
                          {emp.employeeId}
                        </td>

                        {/* Department & Role */}
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-bold text-foreground">{emp.department}</span>
                            <span className="text-[10px] text-muted-foreground block">{emp.designation}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3 text-primary/70 shrink-0" /> {emp.phone}
                            </div>
                            {emp.address && (
                              <p className="text-[10px] truncate max-w-[150px]">{emp.address}</p>
                            )}
                          </div>
                        </td>

                        {/* Salary */}
                        <td className="py-3 px-4 font-bold text-foreground font-mono">
                          ₹{Number(emp.salary || 0).toLocaleString()}
                          <span className="text-[9px] text-muted-foreground font-normal block">/ Month</span>
                        </td>

                        {/* Join Date */}
                        <td className="py-3 px-4 text-[11px] text-muted-foreground">
                          {emp.joinDate || '2024-01-15'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(emp)}
                            title="Click to toggle status"
                            className="cursor-pointer"
                          >
                            <Badge variant={emp.status === 'Active' ? 'success' : emp.status === 'On Leave' ? 'warning' : 'destructive'}>
                              {emp.status}
                            </Badge>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewEmployee(emp)}
                              className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => setEditEmployee({ ...emp })}
                              className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                              title="Edit Employee"
                            >
                              <Edit3 className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(emp)}
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
                        <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="font-semibold text-xs text-foreground">No employees found</p>
                        <p className="text-[11px]">Try searching with a different term or filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* 1. VIEW EMPLOYEE PROFILE MODAL */}
        <Modal
          isOpen={!!viewEmployee}
          onClose={() => setViewEmployee(null)}
          title="Employee Profile & Details"
          size="lg"
        >
          {viewEmployee && (
            <div className="space-y-5 select-none text-xs">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center shadow-md">
                  {viewEmployee.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">{viewEmployee.name}</h3>
                  <p className="text-xs text-primary font-bold">{viewEmployee.designation} • {viewEmployee.department}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{viewEmployee.employeeId}</p>
                </div>
                <div className="ml-auto">
                  <Badge variant={viewEmployee.status === 'Active' ? 'success' : 'warning'}>
                    {viewEmployee.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-primary" /> Job &amp; Compensation
                  </h4>
                  <div className="space-y-1 text-muted-foreground">
                    <p>Department: <strong className="text-foreground">{viewEmployee.department}</strong></p>
                    <p>Designation: <strong className="text-foreground">{viewEmployee.designation}</strong></p>
                    <p>Monthly Basic: <strong className="text-foreground font-mono">₹{Number(viewEmployee.salary || 0).toLocaleString()}</strong></p>
                    <p>Salary Type: <strong className="text-foreground">{viewEmployee.salaryType || 'Monthly'}</strong></p>
                    <p>Join Date: <strong className="text-foreground">{viewEmployee.joinDate}</strong></p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> Contact &amp; Banking
                  </h4>
                  <div className="space-y-1 text-muted-foreground">
                    <p>Email: <strong className="text-foreground">{viewEmployee.email}</strong></p>
                    <p>Phone: <strong className="text-foreground font-mono">{viewEmployee.phone}</strong></p>
                    <p>Bank Name: <strong className="text-foreground">{viewEmployee.bankName || 'HDFC Bank Ltd'}</strong></p>
                    <p>Account No: <strong className="text-foreground font-mono">{viewEmployee.bankAccount || '5010088992211'}</strong></p>
                    <p>Address: <strong className="text-foreground">{viewEmployee.address || 'Kolkata, WB'}</strong></p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-3 flex justify-end">
                <Button variant="primary" onClick={() => setViewEmployee(null)}>Close Profile</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* 2. EDIT EMPLOYEE MODAL */}
        <Modal
          isOpen={!!editEmployee}
          onClose={() => setEditEmployee(null)}
          title="Edit Employee Information"
          size="lg"
        >
          {editEmployee && (
            <form onSubmit={handleSaveEdit} className="space-y-4 select-none text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editEmployee.name || ''}
                    onChange={(e) => setEditEmployee({ ...editEmployee, name: e.target.value })}
                    className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editEmployee.email || ''}
                    onChange={(e) => setEditEmployee({ ...editEmployee, email: e.target.value })}
                    className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editEmployee.phone || ''}
                    onChange={(e) => setEditEmployee({ ...editEmployee, phone: e.target.value })}
                    className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Department</label>
                  <input
                    type="text"
                    value={editEmployee.department || ''}
                    onChange={(e) => setEditEmployee({ ...editEmployee, department: e.target.value })}
                    className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Designation</label>
                  <input
                    type="text"
                    value={editEmployee.designation || ''}
                    onChange={(e) => setEditEmployee({ ...editEmployee, designation: e.target.value })}
                    className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={editEmployee.salary || 0}
                    onChange={(e) => setEditEmployee({ ...editEmployee, salary: Number(e.target.value) })}
                    className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Status</label>
                  <select
                    value={editEmployee.status || 'Active'}
                    onChange={(e) => setEditEmployee({ ...editEmployee, status: e.target.value })}
                    className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground">Bank Name</label>
                  <input
                    type="text"
                    value={editEmployee.bankName || ''}
                    onChange={(e) => setEditEmployee({ ...editEmployee, bankName: e.target.value })}
                    className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="border-t border-border/50 pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditEmployee(null)}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isUpdating}>Save Changes</Button>
              </div>
            </form>
          )}
        </Modal>

      </PageContainer>
    </AppShell>
  );
}