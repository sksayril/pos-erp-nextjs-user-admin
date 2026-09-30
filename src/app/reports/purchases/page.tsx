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
  Truck, RefreshCw, Printer, Eye, IndianRupee, 
  CreditCard, Calendar, Users, ShoppingCart, ArrowDownLeft
} from 'lucide-react';

export default function PurchaseReportPage() {
  const { addToast } = useToastStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPurchaseReport = async () => {
    setLoading(true);
    try {
      let query = '';
      const today = new Date().toISOString().split('T')[0];
      if (dateFilter === 'today') {
        query = `?startDate=${today}&endDate=${today}`;
      } else if (dateFilter === 'month') {
        const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        query = `?startDate=${firstDay}&endDate=${today}`;
      }

      const res = await fetch(`/api/reports/purchases${query}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      addToast('error', 'Fetch Error', 'Failed to load purchase report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseReport();
  }, [dateFilter]);

  const purchaseList = data?.purchases || [];

  const columns = [
    { 
      header: 'Purchase #', 
      accessor: 'purchaseNumber', 
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded text-xs">
          {row.purchaseNumber}
        </span>
      )
    },
    { 
      header: 'Supplier', 
      accessor: 'supplierName', 
      sortable: true,
      render: (row: any) => <span className="font-semibold text-foreground text-xs">{row.supplierName}</span>
    },
    { header: 'Date', accessor: 'date', sortable: true },
    { 
      header: 'Total Bill', 
      accessor: 'grandTotal', 
      sortable: true,
      render: (row: any) => <span className="font-extrabold text-foreground text-xs">₹{(Number(row.grandTotal) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> 
    },
    { 
      header: 'Paid Amount', 
      accessor: 'paidAmount', 
      sortable: true,
      render: (row: any) => <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">₹{(Number(row.paidAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> 
    },
    { 
      header: 'Due Payable', 
      accessor: 'dueAmount', 
      sortable: true,
      render: (row: any) => (
        <span className={`text-xs font-bold ${Number(row.dueAmount) > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
          ₹{(Number(row.dueAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      header: 'Status', 
      accessor: 'paymentStatus', 
      render: (row: any) => (
        <Badge variant={row.paymentStatus === 'Paid' ? 'success' : row.paymentStatus === 'Partial' ? 'warning' : 'destructive'}>
          {row.paymentStatus || 'Paid'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedPurchase(row);
              setIsModalOpen(true);
            }}
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Inspect Bill"
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
                <Truck className="h-6 w-6 text-violet-600 dark:text-violet-400" /> Purchase & Procurement Report
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Supplier procurement logs, vendor payments, purchase tax credits, and payables breakdown.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${dateFilter === 'all' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setDateFilter('month')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${dateFilter === 'month' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${dateFilter === 'today' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  Today
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={fetchPurchaseReport} className="h-9 gap-1.5 text-xs font-semibold">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9 gap-1.5 text-xs font-semibold">
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-xs hover:border-violet-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Purchases</p>
                  <p className="text-2xl font-bold text-foreground mt-1">₹{(Number(data?.totalNetSpend) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-violet-500 font-medium mt-0.5 block">{data?.totalPurchaseCount || 0} Bills Logged</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-emerald-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid to Suppliers</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{(Number(data?.totalPaid) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Cleared Outflow</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-amber-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding Payables</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">₹{(Number(data?.totalDue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Supplier Dues</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-blue-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchase Tax (ITC)</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">₹{(Number(data?.totalTax) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-blue-500 font-medium mt-0.5 block">Input Tax Credit</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Suppliers Breakdown */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" /> Top Procurement Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(data?.topSuppliers || []).map((sup: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-violet-500/10 text-violet-600 font-bold text-xs flex items-center justify-center">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold text-foreground">{sup.name}</p>
                        <p className="text-[10px] text-muted-foreground">{sup.orders} purchase orders</p>
                      </div>
                    </div>
                    <span className="font-bold text-foreground">₹{Number(sup.totalSpend).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* DataTable */}
          <DataTable
            title="Purchase Bills Register"
            data={purchaseList}
            columns={columns}
            searchKey="supplierName"
            searchPlaceholder="Search by Supplier, Bill #..."
          />
        </div>

        {/* PURCHASE DETAIL MODAL */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Purchase Bill Details"
          size="lg"
        >
          {selectedPurchase && (
            <div className="space-y-5 text-foreground">
              <div className="p-4 bg-muted/30 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight">{selectedPurchase.purchaseNumber}</h2>
                    <Badge variant={selectedPurchase.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                      {selectedPurchase.paymentStatus || 'Paid'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Date: {selectedPurchase.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Total Bill</p>
                  <p className="text-2xl font-black text-violet-600 dark:text-violet-400">₹{(Number(selectedPurchase.grandTotal) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-card p-4 rounded-xl border border-border text-xs">
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Supplier</p>
                  <p className="font-bold text-foreground text-sm">{selectedPurchase.supplierName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Payment Method</p>
                  <p className="font-bold text-foreground text-sm">{selectedPurchase.paymentMethod || 'Cash'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Paid / Payable</p>
                  <p className="font-bold text-emerald-600">₹{(Number(selectedPurchase.paidAmount) || 0).toFixed(2)} / <span className="text-amber-500">₹{(Number(selectedPurchase.dueAmount) || 0).toFixed(2)}</span></p>
                </div>
              </div>

              {/* Items */}
              {Array.isArray(selectedPurchase.items) && selectedPurchase.items.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold text-left">
                      <tr>
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Cost Rate</th>
                        <th className="p-3 text-right">Subtotal (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedPurchase.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-3 font-semibold text-foreground">{item.productName || item.name}</td>
                          <td className="p-3 text-center font-bold text-violet-600">{item.quantity}</td>
                          <td className="p-3 text-right">₹{(Number(item.price || item.unitCost || 0)).toFixed(2)}</td>
                          <td className="p-3 text-right font-black text-foreground">₹{(Number(item.total || (item.price * item.quantity) || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                  <Printer className="h-4 w-4" /> Print Bill
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