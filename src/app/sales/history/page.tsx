'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { 
  History, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  Package, 
  DollarSign, 
  User, 
  Layers,
  Filter
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function SalesHistoryPage() {
  const { addToast } = useToastStore();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'items' | 'invoices'>('items');
  const [customerFilter, setCustomerFilter] = useState('All');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sales');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSales(data);
      }
    } catch (err) {
      console.error('Fetch sales history error:', err);
      addToast('error', 'Error', 'Failed to fetch sales history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Flatten sales into itemized transaction lines
  const itemRows = sales.flatMap(s => {
    if (!Array.isArray(s.items)) return [];
    return s.items.map((item: any, idx: number) => ({
      id: `${s._id || s.invoiceNumber}-${idx}`,
      invoiceNumber: s.invoiceNumber,
      date: s.date,
      customerName: s.customerName,
      paymentMethod: s.paymentMethod,
      productName: item.productName,
      sku: item.sku,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.price) || 0,
      tax: Number(item.tax) || 0,
      lineTotal: Number(item.total) || ((Number(item.price) || 0) * (Number(item.quantity) || 1)),
      paymentStatus: s.paymentStatus
    }));
  });

  const customers = Array.from(new Set(sales.map(s => s.customerName).filter(Boolean)));

  const filteredItems = itemRows.filter(i => {
    if (customerFilter === 'All') return true;
    return i.customerName === customerFilter;
  });

  const filteredInvoices = sales.filter(s => {
    if (customerFilter === 'All') return true;
    return s.customerName === customerFilter;
  });

  // Metrics
  const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
  const totalUnitsSold = itemRows.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const avgOrderValue = sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0;

  // Top Customer
  const customerSpendMap: Record<string, number> = {};
  sales.forEach(s => {
    customerSpendMap[s.customerName] = (customerSpendMap[s.customerName] || 0) + (Number(s.grandTotal) || 0);
  });
  const topCustomer = Object.entries(customerSpendMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Walk-in Customer';

  const exportCSV = () => {
    if (viewTab === 'items') {
      if (filteredItems.length === 0) return;
      const headers = ['Invoice #', 'Date', 'Customer', 'Product', 'SKU', 'Quantity', 'Unit Rate', 'Total Amount', 'Payment Status'];
      const rows = filteredItems.map(i => [
        `"${i.invoiceNumber}"`,
        `"${i.date}"`,
        `"${i.customerName}"`,
        `"${i.productName}"`,
        `"${i.sku}"`,
        i.quantity,
        i.unitPrice,
        i.lineTotal,
        `"${i.paymentStatus}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Sales_Items_History_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('success', 'Exported', 'Item sales history exported.');
    } else {
      if (filteredInvoices.length === 0) return;
      const headers = ['Invoice #', 'Customer', 'Date', 'Grand Total', 'Paid', 'Due', 'Payment Method', 'Status'];
      const rows = filteredInvoices.map(s => [
        `"${s.invoiceNumber}"`,
        `"${s.customerName}"`,
        `"${s.date}"`,
        s.grandTotal,
        s.paidAmount,
        s.dueAmount,
        `"${s.paymentMethod}"`,
        `"${s.status}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Sales_Invoices_History_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('success', 'Exported', 'Sales invoice history exported.');
    }
  };

  const itemColumns = [
    { 
      header: 'Product Sold', 
      accessor: 'productName', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-xs text-foreground">{row.productName}</p>
            <p className="text-[11px] text-muted-foreground font-mono">SKU: {row.sku}</p>
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
          <span className="text-[11px] text-muted-foreground font-mono">Inv: {row.invoiceNumber}</span>
        </div>
      )
    },
    { 
      header: 'Sale Date', 
      accessor: 'date', 
      sortable: true,
      render: (row: any) => <span className="font-mono text-xs text-muted-foreground">{row.date}</span>
    },
    { 
      header: 'Quantity Sold', 
      accessor: 'quantity', 
      sortable: true,
      render: (row: any) => <span className="font-mono font-bold text-xs text-foreground">{row.quantity} Units</span>
    },
    { 
      header: 'Unit Price', 
      accessor: 'unitPrice', 
      render: (row: any) => <span className="font-mono text-xs">Rs. {row.unitPrice.toLocaleString()}</span>
    },
    { 
      header: 'Total Value', 
      accessor: 'lineTotal', 
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
          Rs. {row.lineTotal.toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Status', 
      accessor: 'paymentStatus', 
      render: (row: any) => (
        <Badge variant={row.paymentStatus === 'Paid' ? 'success' : 'warning'} className="text-[11px]">
          {row.paymentStatus}
        </Badge>
      )
    }
  ];

  const invoiceColumns = [
    { 
      header: 'Invoice #', 
      accessor: 'invoiceNumber', 
      sortable: true,
      render: (row: any) => <span className="font-mono font-bold text-xs text-foreground">{row.invoiceNumber}</span>
    },
    { 
      header: 'Customer Name', 
      accessor: 'customerName', 
      sortable: true,
      render: (row: any) => <span className="font-semibold text-xs text-foreground">{row.customerName}</span>
    },
    { 
      header: 'Date', 
      accessor: 'date', 
      render: (row: any) => <span className="font-mono text-xs">{row.date}</span>
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
      render: (row: any) => <span className="font-mono text-xs text-emerald-600 font-semibold">Rs. {(Number(row.paidAmount) || 0).toLocaleString()}</span>
    },
    { 
      header: 'Payment Status', 
      accessor: 'paymentStatus', 
      render: (row: any) => (
        <Badge variant={row.paymentStatus === 'Paid' ? 'success' : 'warning'} className="text-[11px]">
          {row.paymentStatus}
        </Badge>
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
                <History className="h-6 w-6 text-primary" /> Sales Audit History & Revenue Analytics
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Deep-dive into historical sales transactions, product throughput, and customer account ledgers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 gap-1.5">
                <Download className="h-4 w-4" /> Export Ledger
              </Button>
              <Button variant="outline" size="sm" onClick={fetchHistory} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Cumulative Sales</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">Rs. {totalRevenue.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Items Outbounded</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{totalUnitsSold.toLocaleString()} Units</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Avg Ticket Size</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Rs. {avgOrderValue.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Top Buyer</p>
                <h3 className="text-sm font-bold text-foreground mt-1 truncate max-w-[150px]">{topCustomer}</h3>
              </div>
            </div>
          </div>

          {/* Toggle View & Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewTab('items')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewTab === 'items' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Item-Level Audit ({itemRows.length} Line Items)
              </button>
              <button
                onClick={() => setViewTab('invoices')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewTab === 'invoices' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Invoice Summary Ledger ({sales.length} Invoices)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="h-8 text-xs bg-background border border-border rounded-lg px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All Customers ({customers.length})</option>
                {customers.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          {viewTab === 'items' ? (
            <DataTable
              title="Item-Level Sales Audit"
              data={filteredItems}
              columns={itemColumns}
              searchKey="productName"
              searchPlaceholder="Search by item name or SKU..."
            />
          ) : (
            <DataTable
              title="Sales Invoice History"
              data={filteredInvoices}
              columns={invoiceColumns}
              searchKey="invoiceNumber"
              searchPlaceholder="Search by invoice number..."
            />
          )}

        </div>
      </PageContainer>
    </AppShell>
  );
}