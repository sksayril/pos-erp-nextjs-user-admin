'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Plus, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  Filter, 
  Eye, 
  Trash2, 
  Printer, 
  FileText,
  CreditCard,
  X
} from 'lucide-react';
import { useToastStore } from '../../lib/store';

export default function PurchasesListPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewBill, setViewBill] = useState<any | null>(null);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/purchases');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPurchases(data);
        const sups = Array.from(new Set(data.map((p: any) => p.supplierName).filter(Boolean))) as string[];
        setSuppliers(sups);
      }
    } catch (err: any) {
      console.error('Error fetching purchases:', err);
      addToast('error', 'Error', 'Failed to load purchases from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleDelete = async (id: string, purNo: string) => {
    if (!confirm(`Are you sure you want to delete purchase record "${purNo}"?`)) return;
    try {
      const res = await fetch(`/api/purchases?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Purchase "${purNo}" removed.`);
        fetchPurchases();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to delete purchase record');
    }
  };

  // Filtered list
  const filteredPurchases = purchases.filter((p) => {
    const matchSupplier = selectedSupplier === 'All' || p.supplierName === selectedSupplier;
    const matchPayment = paymentFilter === 'All' || p.paymentStatus === paymentFilter;
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSupplier && matchPayment && matchStatus;
  });

  // KPIs
  const totalSpend = purchases.reduce((acc, p) => acc + (Number(p.grandTotal) || 0), 0);
  const totalPaid = purchases.reduce((acc, p) => acc + (Number(p.paidAmount) || 0), 0);
  const totalOutstandingDue = purchases.reduce((acc, p) => acc + (Number(p.dueAmount) || 0), 0);
  const totalBills = purchases.length;

  const exportCSV = () => {
    if (filteredPurchases.length === 0) {
      addToast('warning', 'Export', 'No purchase data to export');
      return;
    }
    const headers = ['Purchase #', 'Supplier', 'Invoice Ref', 'Date', 'Grand Total', 'Paid', 'Due', 'Payment Status', 'Status'];
    const rows = filteredPurchases.map(p => [
      `"${p.purchaseNumber || ''}"`,
      `"${p.supplierName || ''}"`,
      `"${p.invoiceNumber || ''}"`,
      `"${p.date || ''}"`,
      p.grandTotal || 0,
      p.paidAmount || 0,
      p.dueAmount || 0,
      `"${p.paymentStatus || 'Paid'}"`,
      `"${p.status || 'Received'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Purchases_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Exported', 'Purchases ledger downloaded as CSV.');
  };

  const columns = [
    { 
      header: 'Purchase Ref', 
      accessor: 'purchaseNumber', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold text-xs text-foreground">{row.purchaseNumber}</span>
            <span className="text-[11px] text-muted-foreground font-mono">{row.date}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Supplier / Vendor', 
      accessor: 'supplierName', 
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{row.supplierName}</span>
          {row.invoiceNumber && <span className="text-[11px] text-muted-foreground font-mono">Inv: {row.invoiceNumber}</span>}
        </div>
      )
    },
    { 
      header: 'Grand Total', 
      accessor: 'grandTotal', 
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-foreground">
          Rs. {(Number(row.grandTotal) || 0).toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Paid Amount', 
      accessor: 'paidAmount', 
      render: (row: any) => (
        <span className="font-mono font-medium text-xs text-emerald-600 dark:text-emerald-400">
          Rs. {(Number(row.paidAmount) || 0).toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Outstanding Due', 
      accessor: 'dueAmount', 
      render: (row: any) => {
        const due = Number(row.dueAmount) || 0;
        return (
          <span className={`font-mono font-bold text-xs ${due > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
            {due > 0 ? `Rs. ${due.toLocaleString()}` : 'Rs. 0'}
          </span>
        );
      }
    },
    { 
      header: 'Payment Status', 
      accessor: 'paymentStatus', 
      render: (row: any) => (
        <Badge variant={row.paymentStatus === 'Paid' ? 'success' : row.paymentStatus === 'Partial' ? 'warning' : 'destructive'} className="text-[11px]">
          {row.paymentStatus || 'Paid'}
        </Badge>
      )
    },
    { 
      header: 'Receiving Status', 
      accessor: 'status', 
      render: (row: any) => (
        <Badge variant={row.status === 'Received' ? 'success' : 'outline'} className="text-[11px]">
          {row.status || 'Received'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setViewBill(row)} 
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="View Invoice Receipt"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => router.push(`/purchases/${row._id || row.id}`)} 
            className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Full Bill Details"
          >
            <FileText className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => handleDelete(row._id, row.purchaseNumber)} 
            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Delete Record"
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
                <ShoppingCart className="h-6 w-6 text-primary" /> Purchases & Procurement Bills
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage vendor purchase invoices, inbound inventory receipts, and accounts payable balances.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 gap-1.5">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={fetchPurchases} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={() => router.push('/purchases/create')} className="h-9 gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> Create Purchase
              </Button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Invoices</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{totalBills} Bills</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Procurement Value</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">
                  Rs. {totalSpend.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Settled / Paid</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Rs. {totalPaid.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Supplier Payable Due</p>
                <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  Rs. {totalOutstandingDue.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Filters:</span>
              </div>

              {/* Supplier Filter */}
              <select 
                value={selectedSupplier} 
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="h-8 text-xs bg-background border border-border rounded-lg px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All Suppliers ({suppliers.length})</option>
                {suppliers.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>

              {/* Payment Filter */}
              <select 
                value={paymentFilter} 
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="h-8 text-xs bg-background border border-border rounded-lg px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All Payment States</option>
                <option value="Paid">Fully Paid</option>
                <option value="Partial">Partially Paid</option>
                <option value="Due">Unpaid / Due</option>
              </select>

              {/* Receiving Status Filter */}
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 text-xs bg-background border border-border rounded-lg px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All Receiving Statuses</option>
                <option value="Received">Received (In Stock)</option>
                <option value="Pending">Pending Delivery</option>
                <option value="Ordered">Ordered / In Transit</option>
              </select>
            </div>

            {(selectedSupplier !== 'All' || paymentFilter !== 'All' || statusFilter !== 'All') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSelectedSupplier('All'); setPaymentFilter('All'); setStatusFilter('All'); }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset Filters
              </Button>
            )}
          </div>

          {/* Table */}
          <DataTable
            title="Purchases Ledger"
            data={filteredPurchases}
            columns={columns}
            searchKey="purchaseNumber"
            searchPlaceholder="Search by purchase ref, supplier, or invoice..."
          />

        </div>

        {/* Modal: View Bill Receipt Preview */}
        {viewBill && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Purchase Bill Receipt: {viewBill.purchaseNumber}
                </h3>
                <button onClick={() => setViewBill(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 text-xs">
                <div className="flex justify-between items-start border-b border-border/70 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-foreground">CRIPOCOD POS & ERP</h2>
                    <p className="text-muted-foreground text-xs">Procurement Department</p>
                    <p className="text-muted-foreground mt-2"><strong>Supplier:</strong> {viewBill.supplierName}</p>
                    {viewBill.invoiceNumber && <p className="text-muted-foreground"><strong>Vendor Inv Ref:</strong> {viewBill.invoiceNumber}</p>}
                  </div>
                  <div className="text-right">
                    <Badge variant={viewBill.paymentStatus === 'Paid' ? 'success' : 'warning'} className="text-xs mb-1">
                      {viewBill.paymentStatus}
                    </Badge>
                    <p className="font-mono font-bold text-foreground">Date: {viewBill.date}</p>
                    <p className="text-muted-foreground">Method: {viewBill.paymentMethod || 'Bank'}</p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Array.isArray(viewBill.items) && viewBill.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2.5">
                            <span className="font-semibold text-foreground">{item.productName}</span>
                            {item.sku && <span className="block text-[10px] text-muted-foreground font-mono">SKU: {item.sku}</span>}
                          </td>
                          <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                          <td className="p-2.5 text-right font-mono">Rs. {Number(item.price || 0).toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-foreground">Rs. {Number(item.total || (item.quantity * item.price)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1.5 border-t border-border pt-2 text-right">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal:</span>
                      <span className="font-mono">Rs. {Number(viewBill.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {Number(viewBill.discount) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Discount:</span>
                        <span className="font-mono">-Rs. {Number(viewBill.discount).toLocaleString()}</span>
                      </div>
                    )}
                    {Number(viewBill.tax) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax / GST:</span>
                        <span className="font-mono">+Rs. {Number(viewBill.tax).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-foreground border-t border-border pt-1">
                      <span>Grand Total:</span>
                      <span className="font-mono text-primary">Rs. {Number(viewBill.grandTotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Paid Amount:</span>
                      <span className="font-mono">Rs. {Number(viewBill.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    {Number(viewBill.dueAmount) > 0 && (
                      <div className="flex justify-between text-rose-500 font-bold">
                        <span>Remaining Due:</span>
                        <span className="font-mono">Rs. {Number(viewBill.dueAmount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-border bg-muted/20 flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                  <Printer className="h-4 w-4" /> Print Bill
                </Button>
                <Button variant="primary" size="sm" onClick={() => setViewBill(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

      </PageContainer>
    </AppShell>
  );
}