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
  PackageCheck, RefreshCw, Printer, Flame, 
  TrendingUp, IndianRupee, AlertCircle, Award
} from 'lucide-react';

export default function ProductPerformanceReportPage() {
  const { addToast } = useToastStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProductPerformance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/products');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      addToast('error', 'Fetch Error', 'Failed to load product performance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductPerformance();
  }, []);

  const performanceList = data?.performanceList || [];

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
      render: (row: any) => <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">{row.category}</span>
    },
    { 
      header: 'Units Sold', 
      accessor: 'unitsSold', 
      sortable: true,
      render: (row: any) => <span className="font-black text-primary text-xs">{row.unitsSold} qty</span>
    },
    { 
      header: 'Revenue Generated (₹)', 
      accessor: 'revenue', 
      sortable: true,
      render: (row: any) => <span className="font-extrabold text-foreground text-xs">₹{Number(row.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
    { 
      header: 'Total Gross Profit (₹)', 
      accessor: 'totalProfit', 
      sortable: true,
      render: (row: any) => <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">₹{Number(row.totalProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
    { 
      header: 'Profit Margin', 
      accessor: 'marginPercent', 
      sortable: true,
      render: (row: any) => <span className="text-xs font-semibold text-foreground">{Number(row.marginPercent).toFixed(1)}%</span>
    },
    { 
      header: 'Stock Velocity', 
      accessor: 'velocity', 
      render: (row: any) => (
        <Badge variant={row.velocity === 'Fast Mover' ? 'success' : row.velocity === 'Steady Mover' ? 'info' : 'warning'}>
          {row.velocity}
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
                <PackageCheck className="h-6 w-6 text-primary" /> Product Performance & Sales Velocity
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Top-selling items, revenue drivers, product gross profit margins, and dead stock analysis.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchProductPerformance} className="h-9 gap-1.5 text-xs font-semibold">
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
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Sold Volume</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{(Number(data?.totalSoldUnits) || 0).toLocaleString()} Units</p>
                  <span className="text-[10px] text-primary font-medium mt-0.5 block">Delivered products</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Flame className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-blue-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Product Turnover</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">₹{(Number(data?.totalProductRevenue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-blue-500 font-medium mt-0.5 block">Gross Sales Value</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-emerald-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Gross Profit</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{(Number(data?.totalProductProfit) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Retail Margin Realized</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-amber-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dead Stock Items</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{data?.deadStockCount || 0}</p>
                  <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">0 units sold</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Revenue Driving Products */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-500" /> Top Revenue Generating Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(data?.topRevenue || []).slice(0, 6).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.unitsSold} units sold</p>
                      </div>
                    </div>
                    <span className="font-bold text-primary">₹{Number(item.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* DataTable */}
          <DataTable
            title="Product Analytics Register"
            data={performanceList}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search by Product Name, SKU, Category..."
          />
        </div>
      </PageContainer>
    </AppShell>
  );
}