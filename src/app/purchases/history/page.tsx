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
  Building2, 
  Package, 
  DollarSign, 
  Calendar,
  Layers,
  Filter
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function PurchaseHistoryPage() {
  const { addToast } = useToastStore();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'items' | 'bills'>('items');
  const [supplierFilter, setSupplierFilter] = useState('All');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/purchases');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPurchases(data);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
      addToast('error', 'Error', 'Failed to fetch purchase history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Flatten purchases into item-level rows for deep audit
  const itemRows = purchases.flatMap(p => {
    if (!Array.isArray(p.items)) return [];
    return p.items.map((item: any, idx: number) => ({
      id: `${p._id || p.purchaseNumber}-${idx}`,
      purchaseNumber: p.purchaseNumber,
      date: p.date,
      supplierName: p.supplierName,
      paymentMethod: p.paymentMethod,
      productName: item.productName,
      sku: item.sku,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.price) || 0,
      tax: Number(item.tax) || 0,
      lineTotal: Number(item.total) || ((Number(item.price) || 0) * (Number(item.quantity) || 1)),
      paymentStatus: p.paymentStatus
    }));
  });

  const suppliers = Array.from(new Set(purchases.map(p => p.supplierName).filter(Boolean)));

  const filteredItems = itemRows.filter(i => {
    if (supplierFilter === 'All') return true;
    return i.supplierName === supplierFilter;
  });

  const filteredBills = purchases.filter(p => {
    if (supplierFilter === 'All') return true;
    return p.supplierName === supplierFilter;
  });

  // Analytics Metrics
  const totalVolume = purchases.reduce((acc, p) => acc + (Number(p.grandTotal) || 0), 0);
  const totalUnits = itemRows.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const avgOrderValue = purchases.length > 0 ? Math.round(totalVolume / purchases.length) : 0;
  
  // Top Supplier
  const supplierSpendMap: Record<string, number> = {};
  purchases.forEach(p => {
    supplierSpendMap[p.supplierName] = (supplierSpendMap[p.supplierName] || 0) + (Number(p.grandTotal) || 0);
  });
  const topSupplier = Object.entries(supplierSpendMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const exportCSV = () => {
    if (viewTab === 'items') {
      if (filteredItems.length === 0) return;
      const headers = ['Purchase #', 'Date', 'Supplier', 'Product', 'SKU', 'Quantity', 'Unit Price', 'Total Cost', 'Payment Status'];
      const rows = filteredItems.map(i => [
        `"${i.purchaseNumber}"`,
        `"${i.date}"`,
        `"${i.supplierName}"`,
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
      link.setAttribute('download', `Purchase_Items_History_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('success', 'Exported', 'Item purchase history downloaded.');
    } else {
      if (filteredBills.length === 0) return;
      const headers = ['Purchase #', 'Supplier', 'Date', 'Grand Total', 'Paid', 'Due', 'Status'];
      const rows = filteredBills.map(p => [
        `"${p.purchaseNumber}"`,
        `"${p.supplierName}"`,
        `"${p.date}"`,
        p.grandTotal,
        p.paidAmount,
        p.dueAmount,
        `"${p.paymentStatus}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Purchase_Bills_History_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('success', 'Exported', 'Purchase bills history downloaded.');
    }
  };

  const itemColumns = [
    { 
      header: 'Purchased Item', 
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
      header: 'Supplier / Vendor', 
      accessor: 'supplierName', 
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{row.supplierName}</span>
          <span className="text-[11px] text-muted-foreground font-mono">Bill: {row.purchaseNumber}</span>
        </div>
      )
    },
    { 
      header: 'Procurement Date', 
      accessor: 'date', 
      sortable: true,
      render: (row: any) => <span className="font-mono text-xs text-muted-foreground">{row.date}</span>
    },
    { 
      header: 'Qty Procured', 
      accessor: 'quantity', 
      sortable: true,
      render: (row: any) => <span className="font-mono font-bold text-xs text-foreground">{row.quantity} Units</span>
    },
    { 
      header: 'Unit Cost', 
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

  const billColumns = [
    { 
      header: 'Purchase Ref', 
      accessor: 'purchaseNumber', 
      sortable: true,
      render: (row: any) => <span className="font-mono font-bold text-xs text-foreground">{row.purchaseNumber}</span>
    },
    { 
      header: 'Supplier Name', 
      accessor: 'supplierName', 
      sortable: true,
      render: (row: any) => <span className="font-semibold text-xs text-foreground">{row.supplierName}</span>
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
                <History className="h-6 w-6 text-primary" /> Purchase Audit History & Analytics
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Deep-dive into historical procurement logs, unit price fluctuations, and vendor volume trends.
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

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Historical Spend</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">Rs. {totalVolume.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Units Inbounded</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{totalUnits.toLocaleString()} Units</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Avg Purchase Bill</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Rs. {avgOrderValue.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Primary Partner</p>
                <h3 className="text-sm font-bold text-foreground mt-1 truncate max-w-[150px]">{topSupplier}</h3>
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
                Item-Wise Audit ({itemRows.length} Line Items)
              </button>
              <button
                onClick={() => setViewTab('bills')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewTab === 'bills' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Bill Summary Ledger ({purchases.length} Invoices)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="h-8 text-xs bg-background border border-border rounded-lg px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All Suppliers ({suppliers.length})</option>
                {suppliers.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          {viewTab === 'items' ? (
            <DataTable
              title="Item-Level Procurement History"
              data={filteredItems}
              columns={itemColumns}
              searchKey="productName"
              searchPlaceholder="Search by item name or SKU..."
            />
          ) : (
            <DataTable
              title="Purchase Invoices History"
              data={filteredBills}
              columns={billColumns}
              searchKey="purchaseNumber"
              searchPlaceholder="Search by purchase number..."
            />
          )}

        </div>
      </PageContainer>
    </AppShell>
  );
}