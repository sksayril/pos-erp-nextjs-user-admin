'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Users, ArrowDownLeft, Search, Filter, Phone, 
  Mail, RefreshCw, AlertCircle, FileText, CheckCircle2,
  Clock, Download, MessageSquare, Send, ShieldAlert, Check
} from 'lucide-react';

export default function ReceivablesLedgerPage() {
  const { addToast } = useToastStore();

  const [data, setData] = useState<any>({ totalReceivables: 0, customers: [], dueInvoices: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(true);

  // Collect Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);

  const fetchReceivables = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounting/receivables');
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const handleOpenReceive = (cust: any) => {
    setSelectedCust(cust);
    setCollectAmount((cust.outstandingBalance || 0).toString());
    setReference(`REC-${Date.now().toString().slice(-6)}`);
    setPayModalOpen(true);
  };

  const handleSendReminder = (cust: any) => {
    addToast('success', 'Reminder Triggered', `Payment reminder queued for ${cust.name} (${cust.phone || 'SMS'}).`);
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectAmount || Number(collectAmount) <= 0) {
      addToast('warning', 'Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    setIsCollecting(true);
    try {
      const res = await fetch('/api/accounting/receivables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCust._id || selectedCust.id,
          customerName: selectedCust.name,
          amount: Number(collectAmount),
          paymentMethod: payMethod,
          reference,
          notes
        })
      });

      if (res.ok) {
        addToast('success', 'Payment Settled', `Received ₹${Number(collectAmount).toLocaleString('en-IN')} from ${selectedCust.name}.`);
        setPayModalOpen(false);
        fetchReceivables();
      } else {
        const errorData = await res.json();
        addToast('error', 'Error', errorData.error || 'Failed to process collection.');
      }
    } catch {
      addToast('error', 'Network Error', 'Failed to connect to the server.');
    } finally {
      setIsCollecting(false);
    }
  };

  // Filter list
  const filteredCustomers = (data.customers || []).filter((c: any) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
    const matchesDue = !filterDueOnly || Number(c.outstandingBalance) > 0;
    return matchesSearch && matchesDue;
  });

  const totalOutstanding = data.totalReceivables || 0;
  const customersWithDues = (data.customers || []).filter((c: any) => Number(c.outstandingBalance) > 0).length;

  const exportToCSV = () => {
    const headers = ['Customer Name', 'Phone', 'Email', 'Total Dues (₹)', 'Status'];
    const rows = filteredCustomers.map((c: any) => [
      `"${c.name}"`,
      `"${c.phone || '-'}"`,
      `"${c.email || '-'}"`,
      c.outstandingBalance || 0,
      Number(c.outstandingBalance) > 0 ? 'Pending Due' : 'Settled'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Receivables_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('info', 'Export Successful', 'Receivables Ledger downloaded as CSV.');
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1600px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-blue-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
                  <Users className="h-3.5 w-3.5" />
                  <span>Trade Debtors &amp; Customer Credit</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Receivables Ledger (Debtors)
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Track outstanding client balances, invoice dues, payment collections, and credit aging metrics.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fetchReceivables()}
                  title="Refresh Receivables"
                  className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md"
                >
                  <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={exportToCSV}
                  className="h-11 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-2 text-xs font-bold text-white transition-all cursor-pointer backdrop-blur-md"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Metric KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <Badge variant="warning" className="font-mono text-xs">
                  Pending Dues
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Customer Receivables</span>
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono tracking-tight">
                  ₹{Number(totalOutstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  Across {customersWithDues} debtors with outstanding balance
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  Clients Base
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registered Customers</span>
                <p className="text-3xl font-black text-foreground mt-1 font-mono tracking-tight">
                  {data.customers?.length || 0}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Retail &amp; wholesale accounts</p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <Badge variant="success" className="font-mono text-xs">
                  Settled
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Debt Clearance Ratio</span>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tracking-tight">
                  {data.customers?.length ? Math.round(((data.customers.length - customersWithDues) / data.customers.length) * 100) : 100}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{(data.customers?.length || 0) - customersWithDues} accounts zero due</p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search customer name, mobile or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-muted/30 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center bg-muted/40 p-1 rounded-2xl border border-border">
              <button
                onClick={() => setFilterDueOnly(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterDueOnly
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Outstanding Dues Only ({customersWithDues})
              </button>
              <button
                onClick={() => setFilterDueOnly(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !filterDueOnly
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Customers ({data.customers?.length || 0})
              </button>
            </div>
          </div>

          {/* Customer Debtors Ledger Table */}
          <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-sm text-foreground">Receivables Accounts</h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {filteredCustomers.length} accounts
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-4 px-5">Customer Profile</th>
                    <th className="py-4 px-5">Contact Details</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Outstanding Due (₹)</th>
                    <th className="py-4 px-5 text-center">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-7 w-7 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
                          <span className="text-xs font-semibold">Loading Customer Debtors...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((c: any) => {
                      const hasDue = Number(c.outstandingBalance) > 0;
                      return (
                        <tr key={c._id || c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                                {c.name?.slice(0, 2).toUpperCase() || 'CU'}
                              </div>
                              <div>
                                <span className="font-bold text-foreground text-xs block">{c.name}</span>
                                <span className="text-[11px] text-muted-foreground font-mono">ID: {c.customerId || c._id?.slice(-6) || 'CUST'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-5">
                            <p className="text-xs font-mono text-foreground flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {c.phone || 'No phone'}
                            </p>
                            {c.email && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <Mail className="h-3 w-3" />
                                {c.email}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-5">
                            {hasDue ? (
                              <Badge variant="warning" className="text-[10px] py-0.5 px-2">
                                Payment Due
                              </Badge>
                            ) : (
                              <Badge variant="success" className="text-[10px] py-0.5 px-2">
                                Clear / Nil Balance
                              </Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right font-mono font-black text-sm">
                            {hasDue ? (
                              <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-xl">
                                ₹{Number(c.outstandingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">₹0.00</span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {hasDue && (
                                <>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleOpenReceive(c)}
                                    className="h-8 px-3 rounded-xl font-bold text-xs gap-1.5 cursor-pointer shadow-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                                  >
                                    <ArrowDownLeft className="h-3.5 w-3.5" /> Receive
                                  </Button>
                                  <button
                                    onClick={() => handleSendReminder(c)}
                                    title="Send Reminder"
                                    className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center justify-center transition-colors cursor-pointer"
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                              {!hasDue && (
                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Settled
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="h-10 w-10 text-emerald-500/40 stroke-1" />
                          <p className="font-bold text-sm text-foreground">No Customer Dues Found</p>
                          <p className="text-xs text-muted-foreground">All customer accounts have been settled or no matches found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receive Payment Modal */}
          <Modal
            isOpen={payModalOpen}
            onClose={() => !isCollecting && setPayModalOpen(false)}
            title={`Collect Payment from ${selectedCust?.name || 'Customer'}`}
            description="Record incoming receivables settlement and update customer ledger."
            size="md"
          >
            <form onSubmit={handleReceiveSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-bold block">Current Outstanding Balance</span>
                  <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                    ₹{Number(selectedCust?.outstandingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Badge variant="warning" className="text-xs">
                  Pending Due
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Collection Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={selectedCust?.outstandingBalance || undefined}
                    required
                    placeholder="0.00"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Payment Method *</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                  >
                    <option value="UPI">UPI / QR Payment</option>
                    <option value="Cash">Cash in Hand</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Transaction / Receipt Reference</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-TXN-90238"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Collection Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding this settlement..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPayModalOpen(false)}
                  disabled={isCollecting}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isCollecting}
                  className="rounded-xl font-bold px-6 shadow-md cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {isCollecting ? 'Recording...' : 'Confirm Receipt'}
                </Button>
              </div>
            </form>
          </Modal>

        </div>
      </PageContainer>
    </AppShell>
  );
}