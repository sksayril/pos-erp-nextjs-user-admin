'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  Building2, RefreshCw, Printer, Eye, IndianRupee, 
  Phone, Mail, ArrowDownLeft, ShieldCheck
} from 'lucide-react';

export default function SupplierLedgerReportPage() {
  const { addToast } = useToastStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSup, setSelectedSup] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSupplierLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/suppliers');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      addToast('error', 'Fetch Error', 'Failed to load supplier ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierLedger();
  }, []);

  const supplierList = data?.supplierLedgers || [];

  const columns = [
    { 
      header: 'Supplier Details', 
      accessor: 'name', 
      sortable: true,
      render: (row: any) => (
        <div>
          <p className="font-bold text-foreground text-xs">{row.name}</p>
          <span className="text-[10px] text-muted-foreground">{row.phone} {row.email !== 'N/A' ? `• ${row.email}` : ''}</span>
        </div>
      )
    },
    { 
      header: 'Total Purchases (₹)', 
      accessor: 'totalPurchased', 
      sortable: true,
      render: (row: any) => <span className="font-extrabold text-foreground text-xs">₹{Number(row.totalPurchased).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
    { 
      header: 'Total Paid (₹)', 
      accessor: 'totalPaid', 
      sortable: true,
      render: (row: any) => <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">₹{Number(row.totalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
    { 
      header: 'Outstanding Payable (₹)', 
      accessor: 'totalPayable', 
      sortable: true,
      render: (row: any) => (
        <span className={`text-xs font-black ${Number(row.totalPayable) > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
          ₹{Number(row.totalPayable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      header: 'Debit Claims (₹)', 
      accessor: 'debitClaims', 
      sortable: true,
      render: (row: any) => <span className="text-xs text-muted-foreground">₹{Number(row.debitClaims).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
    { 
      header: 'Orders', 
      accessor: 'ordersCount', 
      render: (row: any) => <span className="text-xs font-semibold text-foreground">{row.ordersCount} POs</span>
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedSup(row);
              setIsModalOpen(true);
            }}
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="View Statement & History"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between select-none border-b border-border pb-4 gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Building2 className="h-6 w-6 text-violet-600 dark:text-violet-400" /> Supplier Statement & Ledger Report
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Supplier liabilities, procurement billing history, payments made, and vendor balances.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchSupplierLedger} className="h-9 gap-1.5 text-xs font-semibold">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9 gap-1.5 text-xs font-semibold">
                <Printer className="h-3.5 w-3.5" /> Print Statement
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-xs hover:border-violet-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Suppliers</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{data?.totalSupplierCount || 0}</p>
                  <span className="text-[10px] text-violet-500 font-medium mt-0.5 block">Active vendors</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-blue-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Procurement</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">₹{(Number(data?.totalLifetimeProcurement) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-blue-500 font-medium mt-0.5 block">Lifetime Purchasing</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-emerald-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Paid</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{(Number(data?.totalSettled) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Settled to Vendors</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-amber-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Payables</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">₹{(Number(data?.totalPayables) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Outstanding Dues</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DataTable */}
          <DataTable
            title="Supplier Accounts Ledger"
            data={supplierList}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search by Supplier Name, Phone..."
          />
        </div>

        {/* SUPPLIER STATEMENT DRILLDOWN MODAL */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Supplier Account Statement"
          size="lg"
        >
          {selectedSup && (
            <div className="space-y-5 text-foreground">
              <div className="p-4 bg-muted/30 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-tight">{selectedSup.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Phone: {selectedSup.phone} | Email: {selectedSup.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Outstanding Payable</p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400">₹{Number(selectedSup.totalPayable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-card p-4 rounded-xl border border-border text-xs">
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Lifetime Purchases</p>
                  <p className="font-bold text-foreground text-sm">₹{Number(selectedSup.totalPurchased).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Total Paid</p>
                  <p className="font-bold text-emerald-600 text-sm">₹{Number(selectedSup.totalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Debit Claims Deducted</p>
                  <p className="font-bold text-violet-600 dark:text-violet-400 text-sm">₹{Number(selectedSup.debitClaims).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Recent Bills */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">Recent Purchase Bills</h4>
                {Array.isArray(selectedSup.recentBills) && selectedSup.recentBills.length > 0 ? (
                  <div className="border border-border rounded-xl overflow-hidden text-xs">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold text-left">
                        <tr>
                          <th className="p-2.5">Purchase #</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5 text-right">Bill Amount</th>
                          <th className="p-2.5 text-right">Paid</th>
                          <th className="p-2.5 text-right">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedSup.recentBills.map((bill: any, idx: number) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-mono font-bold text-violet-600 dark:text-violet-400">{bill.purchaseNumber}</td>
                            <td className="p-2.5 text-muted-foreground">{bill.date}</td>
                            <td className="p-2.5 text-right font-semibold">₹{Number(bill.amount).toFixed(2)}</td>
                            <td className="p-2.5 text-right text-emerald-600 font-bold">₹{Number(bill.paid).toFixed(2)}</td>
                            <td className="p-2.5 text-right text-amber-500 font-bold">₹{Number(bill.due).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No recent purchase orders found.</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                  <Printer className="h-4 w-4" /> Print Ledger
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

      </PageContainer>
    </AppShell>
  );
}