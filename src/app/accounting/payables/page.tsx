'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Building2, ArrowUpRight, Search, Filter, Phone, 
  RefreshCw, AlertCircle, FileText, CheckCircle2,
  Clock, Download, Send, ShieldAlert, Check, Mail, Truck
} from 'lucide-react';

export default function PayablesLedgerPage() {
  const { addToast } = useToastStore();

  const [data, setData] = useState<any>({ totalPayables: 0, suppliers: [], duePurchases: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(true);

  // Settle Payables Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedSup, setSelectedSup] = useState<any>(null);
  const [disburseAmount, setDisburseAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isDisbursing, setIsDisbursing] = useState(false);

  const fetchPayables = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounting/payables');
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayables();
  }, []);

  const handleOpenPay = (sup: any) => {
    setSelectedSup(sup);
    setDisburseAmount((sup.outstandingPayable || 0).toString());
    setReference(`PAY-${Date.now().toString().slice(-6)}`);
    setPayModalOpen(true);
  };

  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseAmount || Number(disburseAmount) <= 0) {
      addToast('warning', 'Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    setIsDisbursing(true);
    try {
      const res = await fetch('/api/accounting/payables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSup._id || selectedSup.id,
          supplierName: selectedSup.name,
          amount: Number(disburseAmount),
          paymentMethod: payMethod,
          reference,
          notes
        })
      });

      if (res.ok) {
        addToast('success', 'Disbursement Confirmed', `Paid ₹${Number(disburseAmount).toLocaleString('en-IN')} to ${selectedSup.name}.`);
        setPayModalOpen(false);
        fetchPayables();
      } else {
        const errorData = await res.json();
        addToast('error', 'Error', errorData.error || 'Failed to process vendor disbursement.');
      }
    } catch {
      addToast('error', 'Network Error', 'Failed to connect to the server.');
    } finally {
      setIsDisbursing(false);
    }
  };

  // Filter list
  const filteredSuppliers = (data.suppliers || []).filter((s: any) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || s.name?.toLowerCase().includes(q) || s.phone?.includes(q) || s.email?.toLowerCase().includes(q);
    const matchesDue = !filterDueOnly || Number(s.outstandingPayable) > 0;
    return matchesSearch && matchesDue;
  });

  const totalPayableDues = data.totalPayables || 0;
  const suppliersWithDues = (data.suppliers || []).filter((s: any) => Number(s.outstandingPayable) > 0).length;

  const exportToCSV = () => {
    const headers = ['Supplier Name', 'Phone', 'Email', 'Payable Due (₹)', 'Status'];
    const rows = filteredSuppliers.map((s: any) => [
      `"${s.name}"`,
      `"${s.phone || '-'}"`,
      `"${s.email || '-'}"`,
      s.outstandingPayable || 0,
      Number(s.outstandingPayable) > 0 ? 'Pending Bill' : 'Settled'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Payables_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('info', 'Export Successful', 'Payables Ledger downloaded as CSV.');
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1600px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-rose-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold backdrop-blur-md">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Trade Creditors &amp; Vendor Liabilities</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Payables Ledger (Creditors)
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Manage vendor bills, outstanding purchase dues, outgoing disbursements, and supplier credit balances.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fetchPayables()}
                  title="Refresh Payables"
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
                <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <Badge variant="destructive" className="font-mono text-xs">
                  Payable Liability
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Vendor Payables</span>
                <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono tracking-tight">
                  ₹{Number(totalPayableDues).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  Across {suppliersWithDues} suppliers with pending balances
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-foreground flex items-center justify-center">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  Suppliers
                </Badge>
              </div>
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registered Vendors</span>
                <p className="text-3xl font-black text-foreground mt-1 font-mono tracking-tight">
                  {data.suppliers?.length || 0}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Wholesale &amp; raw material partners</p>
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
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Supplier Clearance Ratio</span>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tracking-tight">
                  {data.suppliers?.length ? Math.round(((data.suppliers.length - suppliersWithDues) / data.suppliers.length) * 100) : 100}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{(data.suppliers?.length || 0) - suppliersWithDues} accounts zero payable</p>
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
                placeholder="Search vendor name, contact or phone..."
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
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Outstanding Bills Only ({suppliersWithDues})
              </button>
              <button
                onClick={() => setFilterDueOnly(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !filterDueOnly
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Suppliers ({data.suppliers?.length || 0})
              </button>
            </div>
          </div>

          {/* Suppliers Payables Table */}
          <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-rose-500" />
                <h3 className="font-bold text-sm text-foreground">Trade Creditors Ledger</h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {filteredSuppliers.length} accounts
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-4 px-5">Supplier Profile</th>
                    <th className="py-4 px-5">Contact Info</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Outstanding Payable (₹)</th>
                    <th className="py-4 px-5 text-center">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-7 w-7 animate-spin rounded-full border-3 border-rose-500 border-t-transparent" />
                          <span className="text-xs font-semibold">Loading Vendor Creditors...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((s: any) => {
                      const hasDue = Number(s.outstandingPayable) > 0;
                      return (
                        <tr key={s._id || s.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center text-xs">
                                {s.name?.slice(0, 2).toUpperCase() || 'SU'}
                              </div>
                              <div>
                                <span className="font-bold text-foreground text-xs block">{s.name}</span>
                                <span className="text-[11px] text-muted-foreground font-mono">ID: {s.supplierId || s._id?.slice(-6) || 'SUPP'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-5">
                            <p className="text-xs font-mono text-foreground flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {s.phone || 'No phone'}
                            </p>
                            {s.email && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <Mail className="h-3 w-3" />
                                {s.email}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-5">
                            {hasDue ? (
                              <Badge variant="destructive" className="text-[10px] py-0.5 px-2">
                                Bill Pending
                              </Badge>
                            ) : (
                              <Badge variant="success" className="text-[10px] py-0.5 px-2">
                                Clear / Nil Balance
                              </Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right font-mono font-black text-sm">
                            {hasDue ? (
                              <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-1 rounded-xl">
                                ₹{Number(s.outstandingPayable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">₹0.00</span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {hasDue ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleOpenPay(s)}
                                  className="h-8 px-3 rounded-xl font-bold text-xs gap-1.5 cursor-pointer shadow-xs bg-gradient-to-r from-rose-500 to-red-600 text-white"
                                >
                                  <ArrowUpRight className="h-3.5 w-3.5" /> Pay Vendor
                                </Button>
                              ) : (
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
                          <p className="font-bold text-sm text-foreground">No Vendor Liabilities Found</p>
                          <p className="text-xs text-muted-foreground">All supplier bills have been paid in full or no matches found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disburse Payment Modal */}
          <Modal
            isOpen={payModalOpen}
            onClose={() => !isDisbursing && setPayModalOpen(false)}
            title={`Disburse Payment to ${selectedSup?.name || 'Vendor'}`}
            description="Process outgoing payment settlement and update supplier payable ledger."
            size="md"
          >
            <form onSubmit={handleDisburseSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-rose-700 dark:text-rose-400 font-bold block">Current Bill Due</span>
                  <p className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                    ₹{Number(selectedSup?.outstandingPayable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Payable
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Disbursement Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={selectedSup?.outstandingPayable || undefined}
                    required
                    placeholder="0.00"
                    value={disburseAmount}
                    onChange={(e) => setDisburseAmount(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Payment Method *</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-border bg-card px-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40 cursor-pointer"
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="RTGS">RTGS Wire</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="Cash">Cash in Hand</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Wire / Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-PAY-99201"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-border bg-muted/20 px-4 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Disbursement Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding this vendor bill settlement..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPayModalOpen(false)}
                  disabled={isDisbursing}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isDisbursing}
                  className="rounded-xl font-bold px-6 shadow-md cursor-pointer bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white"
                >
                  {isDisbursing ? 'Disbursing...' : 'Confirm Payment'}
                </Button>
              </div>
            </form>
          </Modal>

        </div>
      </PageContainer>
    </AppShell>
  );
}