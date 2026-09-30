'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Plus, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
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

export default function SalesListPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sales');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSales(data);
      }
    } catch (err: any) {
      console.error('Error fetching sales:', err);
      addToast('error', 'Error', 'Failed to load sales from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleDelete = async (id: string, invNo: string) => {
    if (!confirm(`Are you sure you want to delete invoice "${invNo}"?`)) return;
    try {
      const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Invoice "${invNo}" removed.`);
        fetchSales();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to delete sale invoice');
    }
  };

  const filteredSales = sales.filter((s) => {
    const matchPayment = paymentFilter === 'All' || s.paymentStatus === paymentFilter;
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchPayment && matchStatus;
  });

  // KPIs
  const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
  const totalCollected = sales.reduce((acc, s) => acc + (Number(s.paidAmount) || 0), 0);
  const totalReceivable = sales.reduce((acc, s) => acc + (Number(s.dueAmount) || 0), 0);
  const totalInvoices = sales.length;

  const exportCSV = () => {
    if (filteredSales.length === 0) {
      addToast('warning', 'Export', 'No sales data to export');
      return;
    }
    const headers = ['Invoice #', 'Customer', 'Date', 'Grand Total', 'Paid Amount', 'Due Amount', 'Payment Method', 'Payment Status', 'Status'];
    const rows = filteredSales.map(s => [
      `"${s.invoiceNumber || ''}"`,
      `"${s.customerName || ''}"`,
      `"${s.date || ''}"`,
      s.grandTotal || 0,
      s.paidAmount || 0,
      s.dueAmount || 0,
      `"${s.paymentMethod || 'Cash'}"`,
      `"${s.paymentStatus || 'Paid'}"`,
      `"${s.status || 'Completed'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Exported', 'Sales ledger exported.');
  };

  const columns = [
    { 
      header: 'Invoice #', 
      accessor: 'invoiceNumber', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono font-bold text-xs text-foreground">{row.invoiceNumber}</p>
            <p className="text-[11px] text-muted-foreground font-mono">{row.date}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Customer', 
      accessor: 'customerName', 
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{row.customerName}</span>
          <span className="text-[11px] text-muted-foreground">Mode: {row.paymentMethod || 'Cash'}</span>
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
        <span className="font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
          Rs. {(Number(row.paidAmount) || 0).toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Balance Due', 
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
      header: 'Status', 
      accessor: 'status', 
      render: (row: any) => (
        <Badge variant={row.status === 'Completed' ? 'success' : 'outline'} className="text-[11px]">
          {row.status || 'Completed'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setSelectedInvoice(row)} 
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="View Receipt"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => router.push(`/sales/${row._id || row.id}`)} 
            className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Full Invoice"
          >
            <FileText className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => handleDelete(row._id, row.invoiceNumber)} 
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
                <ShoppingBag className="h-6 w-6 text-primary" /> Sales Invoices & Orders
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage retail and wholesale sales invoices, checkout receipts, and receivables.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 gap-1.5">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={fetchSales} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={() => router.push('/sales/create')} className="h-9 gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> Create Sale
              </Button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Invoices</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{totalInvoices} Bills</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Gross Revenue</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Rs. {totalRevenue.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Realized Cash Inflow</p>
                <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  Rs. {totalCollected.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Customer Receivables Due</p>
                <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  Rs. {totalReceivable.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Filters:</span>
              </div>

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

              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 text-xs bg-background border border-border rounded-lg px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {(paymentFilter !== 'All' || statusFilter !== 'All') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setPaymentFilter('All'); setStatusFilter('All'); }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset Filters
              </Button>
            )}
          </div>

          {/* Table */}
          <DataTable
            title="Sales Invoice Directory"
            data={filteredSales}
            columns={columns}
            searchKey="invoiceNumber"
            searchPlaceholder="Search by invoice number or customer..."
          />

        </div>

        {/* Modal: View Receipt Preview */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Tax Invoice: {selectedInvoice.invoiceNumber}
                </h3>
                <button onClick={() => setSelectedInvoice(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 text-xs">
                <div className="flex justify-between items-start border-b border-border/70 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-foreground">CRIPOCOD POS & ERP</h2>
                    <p className="text-muted-foreground text-xs">Original Tax Invoice</p>
                    <p className="text-muted-foreground mt-2"><strong>Billed To:</strong> {selectedInvoice.customerName}</p>
                    <p className="text-muted-foreground">Payment Method: <strong>{selectedInvoice.paymentMethod || 'Cash'}</strong></p>
                  </div>
                  <div className="text-right">
                    <Badge variant={selectedInvoice.paymentStatus === 'Paid' ? 'success' : 'warning'} className="text-xs mb-1">
                      {selectedInvoice.paymentStatus}
                    </Badge>
                    <p className="font-mono font-bold text-foreground">Date: {selectedInvoice.date}</p>
                    <p className="text-muted-foreground">Invoice: {selectedInvoice.invoiceNumber}</p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Rate</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Array.isArray(selectedInvoice.items) && selectedInvoice.items.map((item: any, idx: number) => (
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
                      <span className="font-mono">Rs. {Number(selectedInvoice.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {Number(selectedInvoice.discount) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Discount:</span>
                        <span className="font-mono text-emerald-600">-Rs. {Number(selectedInvoice.discount).toLocaleString()}</span>
                      </div>
                    )}
                    {Number(selectedInvoice.tax) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST / Tax:</span>
                        <span className="font-mono">+Rs. {Number(selectedInvoice.tax).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-foreground border-t border-border pt-1">
                      <span>Grand Total:</span>
                      <span className="font-mono text-primary">Rs. {Number(selectedInvoice.grandTotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Amount Received:</span>
                      <span className="font-mono">Rs. {Number(selectedInvoice.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    {Number(selectedInvoice.dueAmount) > 0 && (
                      <div className="flex justify-between text-rose-500 font-bold">
                        <span>Balance Due:</span>
                        <span className="font-mono">Rs. {Number(selectedInvoice.dueAmount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-border bg-muted/20 flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                  <Printer className="h-4 w-4" /> Print Tax Invoice
                </Button>
                <Button variant="primary" size="sm" onClick={() => setSelectedInvoice(null)}>
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