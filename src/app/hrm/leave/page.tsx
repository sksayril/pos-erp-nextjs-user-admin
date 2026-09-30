'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Calendar, CheckCircle2, XCircle, Clock, 
  Plus, Users, Search, Filter, AlertCircle, Check, X, ShieldAlert, Sparkles 
} from 'lucide-react';

export default function LeaveTrackerPage() {
  const { addToast } = useToastStore();

  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Apply Leave Modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [empId, setEmpId] = useState('');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalDays, setTotalDays] = useState('1');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Leaves
  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hrm/leave');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeaves(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load Employees
  useEffect(() => {
    fetch('/api/hrm/employees')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmployees(data);
          if (data.length > 0) setEmpId(data[0].employeeId);
        }
      })
      .catch(err => console.error(err));

    fetchLeaves();
  }, []);

  // Update Leave Status (Approve / Reject)
  const handleUpdateStatus = async (item: any, newStatus: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch('/api/hrm/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: item._id,
          leaveId: item.leaveId,
          status: newStatus,
          approvedBy: 'Super Admin'
        })
      });

      if (res.ok) {
        setLeaves(prev => prev.map(l => l._id === item._id ? { ...l, status: newStatus, approvedBy: 'Super Admin' } : l));
        addToast(newStatus === 'Approved' ? 'success' : 'warning', `Leave ${newStatus}`, `Application for ${item.employeeName} has been ${newStatus.toLowerCase()}.`);
      }
    } catch {
      addToast('error', 'Update Failed', 'Could not process leave status.');
    }
  };

  // Submit Leave Request
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      addToast('warning', 'Missing Reason', 'Please provide a reason for leave.');
      return;
    }

    setIsSubmitting(true);
    const emp = employees.find(e => e.employeeId === empId);

    try {
      const res = await fetch('/api/hrm/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          employeeName: emp?.name || 'Employee',
          department: emp?.department || 'General',
          leaveType,
          startDate,
          endDate,
          totalDays: Number(totalDays) || 1,
          reason
        })
      });

      if (res.ok) {
        addToast('success', 'Leave Request Submitted', `Application recorded for ${emp?.name || empId}.`);
        setApplyModalOpen(false);
        setReason('');
        fetchLeaves();
      }
    } catch {
      addToast('error', 'Error', 'Failed to submit leave request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter list
  const filteredLeaves = leaves.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || l.employeeName?.toLowerCase().includes(q) || l.employeeId?.toLowerCase().includes(q) || l.leaveType?.toLowerCase().includes(q) || l.department?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI calculations
  const totalRequests = leaves.length;
  const pendingRequests = leaves.filter(l => l.status === 'Pending').length;
  const approvedRequests = leaves.filter(l => l.status === 'Approved').length;
  const rejectedRequests = leaves.filter(l => l.status === 'Rejected').length;

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">Leave Tracker &amp; Approvals</h1>
                <p className="text-xs text-muted-foreground">Manage employee time-off, casual/sick leave requests &amp; approvals workflow.</p>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => setApplyModalOpen(true)}
              className="gap-2 h-10 px-4 rounded-xl shadow-md font-bold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Apply for Leave</span>
            </Button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Total Applications</span>
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground">{totalRequests}</p>
              <p className="text-[11px] text-muted-foreground">All logged requests</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Action</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingRequests}</p>
              <p className="text-[11px] text-muted-foreground">Needs manager review</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Approved Leaves</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{approvedRequests}</p>
              <p className="text-[11px] text-muted-foreground">Authorized time-offs</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Declined</span>
                <XCircle className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{rejectedRequests}</p>
              <p className="text-[11px] text-muted-foreground">Rejected requests</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Employee, Type or Reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-muted/20 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Filter Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Requests</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Leaves Table */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Leave Category</th>
                    <th className="py-3.5 px-4">Duration &amp; Days</th>
                    <th className="py-3.5 px-4">Reason / Remarks</th>
                    <th className="py-3.5 px-4">Applied Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span>Loading leave requests...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLeaves.length > 0 ? (
                    filteredLeaves.map((l) => (
                      <tr key={l._id || l.leaveId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                              {l.employeeName?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{l.employeeName}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{l.employeeId} • {l.department}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground">{l.leaveType}</span>
                        </td>

                        <td className="py-3 px-4">
                          <div>
                            <span className="font-mono text-foreground font-semibold">{l.startDate} → {l.endDate}</span>
                            <span className="text-[10px] text-muted-foreground block font-bold">({l.totalDays} Days)</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate text-muted-foreground" title={l.reason}>
                          {l.reason}
                        </td>

                        <td className="py-3 px-4 text-[11px] text-muted-foreground font-mono">
                          {l.appliedOn || '2026-09-30'}
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={l.status === 'Approved' ? 'success' : l.status === 'Pending' ? 'warning' : 'destructive'}>
                            {l.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {l.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleUpdateStatus(l, 'Approved')}
                                className="h-8 px-2.5 text-[10px] font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <Check className="h-3 w-3" />
                                <span>Approve</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(l, 'Rejected')}
                                className="h-8 px-2.5 text-[10px] font-bold gap-1 text-rose-600 hover:bg-rose-50"
                              >
                                <X className="h-3 w-3" />
                                <span>Reject</span>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">
                              Reviewed by {l.approvedBy || 'Admin'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="font-semibold text-xs text-foreground">No leave records found</p>
                        <p className="text-[11px]">Click &quot;Apply for Leave&quot; to log a time-off request.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* APPLY FOR LEAVE MODAL */}
        <Modal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          title="Submit Leave Application"
          size="md"
        >
          <form onSubmit={handleApplyLeave} className="space-y-4 select-none text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Employee *</label>
              <select
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId} - {emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Leave Category *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Casual Leave">Casual Leave (CL)</option>
                  <option value="Sick Leave">Sick Leave (SL)</option>
                  <option value="Annual Paid Leave">Annual Paid Leave (PL)</option>
                  <option value="Maternity/Paternity Leave">Maternity / Paternity</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Total Days *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={totalDays}
                  onChange={(e) => setTotalDays(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">From Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">To Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Reason for Leave *</label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the reason for time-off..."
                className="w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="border-t border-border/50 pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setApplyModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Submit Application</Button>
            </div>
          </form>
        </Modal>

      </PageContainer>
    </AppShell>
  );
}