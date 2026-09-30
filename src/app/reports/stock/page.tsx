'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { useToastStore } from '../../../lib/store';
import { 
  Package, RefreshCw, Printer, AlertTriangle, CheckCircle2, 
  IndianRupee, Layers, Tag, ArrowUpRight
} from 'lucide-react';

export default function StockReportPage() {
  const { addToast } = useToastStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');

  const fetchStockReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/stock');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      addToast('error', 'Fetch Error', 'Failed to load stock valuation report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockReport();
  }, []);

  let filteredItems = data?.stockItems || [];
  if (filterType === 'low') {
    filteredItems = filteredItems.filter((i: any) => i.stockStatus === 'Low Stock');
  } else if (filterType === 'out') {
    filteredItems = filteredItems.filter((i: any) => i.stockStatus === 'Out of Stock');
  }

  const columns = [
    { 
      header: 'Product & SKU', 
      accessor: 'name', 
      sortable: true,
      render: (row: any) => (
        <div>
          <p className="font-bold text-foreground text-xs">{row.name}</p>
          <span className="font-mono text-[10px] text-muted-foreground">{row.sku}</span>
        </div>
      )
    },
    { 
      header: 'Category', 
      accessor: 'category', 
      sortable: true,
      render: (row: any) => <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">{row.category}</span>
    },
    { 
      header: 'Current Stock', 
      accessor: 'quantity', 
      sortable: true,
      render: (row: any) => (
        <span className={`font-black text-xs ${row.quantity <= 0 ? 'text-rose-500' : row.quantity <= row.minStockAlert ? 'text-amber-500' : 'text-primary'}`}>
          {row.quantity} {row.unit}
        </span>
      )
    },
    { 
      header: 'Cost Price', 
      accessor: 'costPrice', 
      sortable: true,
      render: (row: any) => <span className="text-xs text-muted-foreground">₹{Number(row.costPrice).toFixed(2)}</span>
    },
    { 
      header: 'Retail Price', 
      accessor: 'sellingPrice', 
      sortable: true,
      render: (row: any) => <span className="text-xs font-semibold text-foreground">₹{Number(row.sellingPrice).toFixed(2)}</span>
    },
    { 
      header: 'Asset Cost Value', 
      accessor: 'totalCostValue', 
      sortable: true,
      render: (row: any) => <span className="font-bold text-foreground text-xs">₹{Number(row.totalCostValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
    { 
      header: 'Asset Retail Value', 
      accessor: 'totalRetailValue', 
      sortable: true,
      render: (row: any) => <span className="font-bold text-primary text-xs">₹{Number(row.totalRetailValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
    { 
      header: 'Status', 
      accessor: 'stockStatus', 
      render: (row: any) => (
        <Badge variant={row.stockStatus === 'In Stock' ? 'success' : row.stockStatus === 'Low Stock' ? 'warning' : 'destructive'}>
          {row.stockStatus}
        </Badge>
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
                <Package className="h-6 w-6 text-primary" /> Inventory Valuation & Stock Report
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time godown inventory assets valuation at cost price vs retail price and stock depletion alerts.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchStockReport} className="h-9 gap-1.5 text-xs font-semibold">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9 gap-1.5 text-xs font-semibold">
                <Printer className="h-3.5 w-3.5" /> Print Report
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Stock Quantity</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{(Number(data?.totalStockQuantity) || 0).toLocaleString()} Units</p>
                  <span className="text-[10px] text-primary font-medium mt-0.5 block">{data?.totalProductCount || 0} Total SKUs</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Layers className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-blue-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset Value (At Cost)</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">₹{(Number(data?.totalStockCostValue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-blue-500 font-medium mt-0.5 block">Procurement Capital</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-emerald-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Retail Value (Selling)</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{(Number(data?.totalStockRetailValue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Estimated Sales Revenue</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Tag className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-amber-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Potential Gross Margin</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">₹{(Number(data?.potentialTotalProfit) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Unrealized Profit</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Ribbon */}
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              All Inventory ({data?.totalProductCount || 0})
            </button>
            <button
              onClick={() => setFilterType('low')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'low'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              Low Stock Warnings ({data?.lowStockCount || 0})
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'out'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              Out of Stock ({data?.outOfStockCount || 0})
            </button>
          </div>

          {/* DataTable */}
          <DataTable
            title="Inventory Asset Register"
            data={filteredItems}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search by Product Name, SKU..."
          />
        </div>
      </PageContainer>
    </AppShell>
  );
}