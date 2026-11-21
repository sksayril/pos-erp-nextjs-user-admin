'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Clock, Calendar, CheckCircle2, AlertCircle, XCircle, 
  Users, Search, Filter, LogIn, LogOut, RefreshCw, 
  Plus, Edit3, ShieldAlert 
} from 'lucide-react';

export default function AttendancePage() {
  const { addToast } = useToastStore();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [markStatus, setMarkStatus] = useState('Present');
  const [checkInTime, setCheckInTime] = useState('09:00 AM');
  const [checkOutTime, setCheckOutTime] = useState('06:00 PM');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Attendance
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hrm/attendance?date=${date}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecords(data);
      }
    } catch (err) {
      addToast('error', 'Fetch Error', 'Failed to retrieve attendance records.');
    } finally {
      setLoading(false);
    }
  };

  // Load Employees list for attendance marker
  useEffect(() => {
    fetch('/api/hrm/employees')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmployees(data);
          if (data.length > 0) setSelectedEmpId(data[0].employeeId);
        }
      })
      .catch(() => addToast('error', 'Fetch Error', 'Failed to load employee list.'));
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  // Quick Punch-In / Punch-Out
  const handleQuickPunch = async (rec: any, type: 'in' | 'out') => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatePayload: any = { _id: rec._id, attendanceId: rec.attendanceId };
    if (type === 'in') {
      updatePayload.checkIn = timeNow;
      updatePayload.status = 'Present';
    } else {
      updatePayload.checkOut = timeNow;
    }

    try {
      const res = await fetch('/api/hrm/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      if (res.ok) {
        setRecords(prev => prev.map(r => r._id === rec._id ? { ...r, ...updatePayload } : r));
        addToast('success', `Punched ${type === 'in' ? 'IN' : 'OUT'}`, `${rec.employeeName} logged at ${timeNow}`);
      }
    } catch {
      addToast('error', 'Punch Failed', 'Could not record punch.');
    }
  };

  // Submit manual mark attendance modal
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const emp = employees.find(e => e.employeeId === selectedEmpId);

    try {
      const res = await fetch('/api/hrm/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          employeeName: emp?.name || 'Employee',
          department: emp?.department || 'General',
          date,
          checkIn: markStatus === 'Absent' ? undefined : checkInTime,
          checkOut: markStatus === 'Absent' ? undefined : checkOutTime,
          status: markStatus,
          workingHours: markStatus === 'Present' ? 8 : markStatus === 'Half Day' ? 4 : 0,
          notes
        })
      });
      if (res.ok) {
        addToast('success', 'Attendance Recorded', `Saved status for ${emp?.name || selectedEmpId}.`);
        setMarkModalOpen(false);
        fetchAttendance();
      }
    } catch {
      addToast('error', 'Save Failed', 'Could not save record.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter logic
  const filteredRecords = records.filter((rec) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || rec.employeeName?.toLowerCase().includes(q) || rec.employeeId?.toLowerCase().includes(q) || rec.department?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI calculations
  const totalLogged = records.length;
  const presentCount = records.filter(r => r.status === 'Present').length;
  const lateCount = records.filter(r => r.status === 'Late').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">Daily Attendance Manager</h1>
                <p className="text-xs text-muted-foreground">Monitor daily shifts, punch-in/out timestamps, late marks &amp; presence.</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-xl">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                />
              </div>

              <Button
                variant="primary"
                onClick={() => setMarkModalOpen(true)}
                className="gap-2 h-10 px-4 rounded-xl shadow-md font-bold cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Mark Attendance</span>
              </Button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Total Enrolled</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground">{totalLogged}</p>
              <p className="text-[11px] text-muted-foreground">Records for {date}</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Present Today</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{presentCount}</p>
              <p className="text-[11px] text-muted-foreground">On duty &amp; logged in</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Late Check-ins</span>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{lateCount}</p>
              <p className="text-[11px] text-muted-foreground">Arrived after standard shift</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Absent / Off</span>
                <XCircle className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{absentCount}</p>
              <p className="text-[11px] text-muted-foreground">Unmarked or on leave</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Employee, ID or Department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-muted/20 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="Half Day">Half Day</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Check In</th>
                    <th className="py-3.5 px-4">Check Out</th>
                    <th className="py-3.5 px-4">Working Hours</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Quick Punch Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span>Loading attendance data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecords.length > 0 ? (
                    filteredRecords.map((rec) => (
                      <tr key={rec._id || rec.attendanceId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                              {rec.employeeName?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{rec.employeeName}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{rec.employeeId}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-foreground">
                          {rec.department}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {rec.checkIn || '—'}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {rec.checkOut || '—'}
                        </td>

                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {rec.workingHours || 8} hrs
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={
                            rec.status === 'Present' ? 'success' : 
                            rec.status === 'Late' ? 'warning' : 
                            rec.status === 'Half Day' ? 'secondary' : 'destructive'
                          }>
                            {rec.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickPunch(rec, 'in')}
                              className="h-8 px-2 text-[10px] font-bold gap-1"
                            >
                              <LogIn className="h-3 w-3 text-emerald-500" />
                              <span>Punch IN</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickPunch(rec, 'out')}
                              className="h-8 px-2 text-[10px] font-bold gap-1"
                            >
                              <LogOut className="h-3 w-3 text-rose-500" />
                              <span>Punch OUT</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="font-semibold text-xs text-foreground">No attendance records for {date}</p>
                        <p className="text-[11px]">Click &quot;Mark Attendance&quot; to log shifts.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* MARK ATTENDANCE MODAL */}
        <Modal
          isOpen={markModalOpen}
          onClose={() => setMarkModalOpen(false)}
          title="Mark Employee Attendance"
          size="md"
        >
          <form onSubmit={handleSaveAttendance} className="space-y-4 select-none text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Select Employee *</label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
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
                <label className="font-bold text-foreground">Status *</label>
                <select
                  value={markStatus}
                  onChange={(e) => setMarkStatus(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {markStatus !== 'Absent' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground">Check-In Time</label>
                  <input
                    type="text"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground">Check-Out Time</label>
                  <input
                    type="text"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    placeholder="06:00 PM"
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Remarks / Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                className="h-16 w-full rounded-xl border border-border bg-card p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="border-t border-border/50 pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMarkModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSaving}>Save Attendance</Button>
            </div>
          </form>
        </Modal>

      </PageContainer>
    </AppShell>
  );
}