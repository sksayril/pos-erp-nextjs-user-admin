'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { 
  Boxes, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  Warehouse,
  Filter
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';
import { useRouter } from 'next/navigation';

export default function StockInventoryPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'All' | 'Low' | 'Out'>('All');

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Fetch stock error:', err);
      addToast('error', 'Error', 'Failed to fetch inventory stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const totalStockItems = products.reduce((acc, p) => acc + (Number(p.openingStock) || 0), 0);
  const totalValuationCost = products.reduce((acc, p) => acc + ((Number(p.costPrice) || 0) * (Number(p.openingStock) || 0)), 0);
  const totalValuationRetail = products.reduce((acc, p) => acc + ((Number(p.sellingPrice) || 0) * (Number(p.openingStock) || 0)), 0);
  const potentialProfit = totalValuationRetail - totalValuationCost;

  const filteredData = products.filter(p => {
    const stock = Number(p.openingStock) || 0;
    const minAlert = Number(p.minStockAlert) || 5;
    if (filterMode === 'Low') return stock > 0 && stock <= minAlert;
    if (filterMode === 'Out') return stock <= 0;
    return true;
  });

  const exportCSV = () => {
    if (filteredData.length === 0) {
      addToast('warning', 'Export', 'No stock data to export');
      return;
    }
    const headers = ['Product', 'SKU', 'Category', 'Unit Stock', 'Cost Price', 'Retail Price', 'Total Cost Valuation', 'Total Retail Valuation', 'Status'];
    const rows = filteredData.map(p => {
      const stock = Number(p.openingStock) || 0;
      const cost = Number(p.costPrice) || 0;
      const sell = Number(p.sellingPrice) || 0;
      return [
        `"${p.name}"`,
        `"${p.sku}"`,
        `"${p.category || 'General'}"`,
        stock,
        cost,
        sell,
        stock * cost,
        stock * sell,
        `"${stock <= 0 ? 'Out of Stock' : stock <= (p.minStockAlert || 5) ? 'Low Stock' : 'Adequate'}"`
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Valuation_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Exported', 'Inventory valuation downloaded.');
  };

  const columns = [
    { 
      header: 'Product Item', 
      accessor: 'name', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
            <Boxes className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs text-foreground line-clamp-1">{row.name}</span>
            <span className="text-[11px] text-muted-foreground font-mono">SKU: {row.sku}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Category', 
      accessor: 'category', 
      render: (row: any) => <span className="text-xs text-muted-foreground">{row.category || 'Unassigned'}</span>
    },
    { 
      header: 'Available Stock', 
      accessor: 'openingStock', 
      sortable: true,
      render: (row: any) => {
        const stock = Number(row.openingStock) || 0;
        const min = Number(row.minStockAlert) || 5;
        const isOut = stock <= 0;
        const isLow = stock > 0 && stock <= min;

        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold text-xs ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-foreground'}`}>
              {stock} Units
            </span>
            {isOut && <Badge variant="destructive" className="text-[10px] py-0">Out</Badge>}
            {isLow && <Badge variant="warning" className="text-[10px] py-0 bg-amber-500/10 text-amber-600">Low</Badge>}
          </div>
        );
      }
    },
    { 
      header: 'Unit Cost', 
      accessor: 'costPrice', 
      render: (row: any) => <span className="font-mono text-xs">Rs. {Number(row.costPrice || 0).toLocaleString()}</span>
    },
    { 
      header: 'Unit Retail', 
      accessor: 'sellingPrice', 
      render: (row: any) => <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">Rs. {Number(row.sellingPrice || 0).toLocaleString()}</span>
    },
    { 
      header: 'Cost Valuation', 
      accessor: 'costPrice', 
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-foreground">
          Rs. {((Number(row.costPrice) || 0) * (Number(row.openingStock) || 0)).toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Retail Valuation', 
      accessor: 'sellingPrice', 
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
          Rs. {((Number(row.sellingPrice) || 0) * (Number(row.openingStock) || 0)).toLocaleString()}
        </span>
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
                <Warehouse className="h-6 w-6 text-primary" /> Stock Inventory & Asset Valuation
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time valuation of physical on-hand inventory across purchase costs and potential retail value.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 gap-1.5">
                <Download className="h-4 w-4" /> Export Report
              </Button>
              <Button variant="outline" size="sm" onClick={fetchStock} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={() => router.push('/products/adjustment')} className="h-9 gap-1.5 font-semibold">
                Adjust Stock
              </Button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Physical Units</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{totalStockItems.toLocaleString()} Units</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Inventory Cost Basis</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">
                  Rs. {totalValuationCost.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Expected Retail Revenue</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Rs. {totalValuationRetail.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Potential Gross Margin</p>
                <h3 className="text-xl font-bold text-primary mt-0.5">
                  Rs. {potentialProfit.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button 
              onClick={() => setFilterMode('All')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === 'All' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All Items ({products.length})
            </button>
            <button 
              onClick={() => setFilterMode('Low')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === 'Low' ? 'bg-amber-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Low Stock Warnings ({products.filter(p => (Number(p.openingStock) || 0) > 0 && (Number(p.openingStock) || 0) <= (p.minStockAlert || 5)).length})
            </button>
            <button 
              onClick={() => setFilterMode('Out')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === 'Out' ? 'bg-rose-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Out of Stock ({products.filter(p => (Number(p.openingStock) || 0) <= 0).length})
            </button>
          </div>

          {/* Stock Table */}
          <DataTable
            title="Warehouse Stock Ledger"
            data={filteredData}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search inventory by product name or SKU..."
          />

        </div>
      </PageContainer>
    </AppShell>
  );
}