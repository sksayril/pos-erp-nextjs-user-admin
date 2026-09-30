'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToastStore } from '../../../lib/store';
import { 
  BarChart3, RefreshCw, Printer, TrendingUp, TrendingDown, 
  IndianRupee, Percent, ShoppingBag, ShoppingCart, Receipt, ShieldCheck
} from 'lucide-react';

export default function ProfitLossReportPage() {
  const { addToast } = useToastStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  const fetchPLReport = async () => {
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

      const res = await fetch(`/api/reports/profit-loss${query}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      addToast('error', 'Fetch Error', 'Failed to load Profit & Loss report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPLReport();
  }, [dateFilter]);

  const isNetPositive = (Number(data?.netProfit) || 0) >= 0;

  return (
    <AppShell>
      <PageContainer>
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between select-none border-b border-border pb-4 gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" /> Profit & Loss Statement (P&L)
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time Gross Profit, Cost of Goods Sold (COGS), Operating Expenses, and Net Profit margin analysis.</p>
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
              <Button variant="outline" size="sm" onClick={fetchPLReport} className="h-9 gap-1.5 text-xs font-semibold">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9 gap-1.5 text-xs font-semibold">
                <Printer className="h-3.5 w-3.5" /> Print P&L
              </Button>
            </div>
          </div>

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Sales Revenue</p>
                  <p className="text-2xl font-bold text-foreground mt-1">₹{(Number(data?.netSalesRevenue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-primary font-medium mt-0.5 block">{data?.salesCount || 0} Total Sales</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-blue-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">COGS / Purchases</p>
                  <p className="text-2xl font-bold text-foreground mt-1">₹{(Number(data?.totalPurchaseCost) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-blue-500 font-medium mt-0.5 block">{data?.purchasesCount || 0} Total Purchases</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-amber-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Profit</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">₹{(Number(data?.grossProfit) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">{(Number(data?.grossMarginPercent) || 0).toFixed(1)}% Gross Margin</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className={`border-border shadow-xs ${isNetPositive ? 'hover:border-emerald-500/40' : 'hover:border-rose-500/40'} transition-colors`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Profit / (Loss)</p>
                  <p className={`text-2xl font-black mt-1 ${isNetPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    ₹{(Number(data?.netProfit) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-[10px] font-bold mt-0.5 block ${isNetPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {(Number(data?.netProfitMarginPercent) || 0).toFixed(1)}% Net Margin
                  </span>
                </div>
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${isNetPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600'}`}>
                  {isNetPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statement Breakdown Sheet */}
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                <span>Income Statement Breakdown</span>
                <span className="text-xs font-normal text-muted-foreground">Currency: INR (₹)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border text-xs">
                {/* 1. Operating Revenue */}
                <div className="p-4 bg-muted/20">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-primary" /> 1. Operating Revenue & Turnover
                  </h4>
                  <div className="space-y-1.5 pl-5 text-muted-foreground">
                    <div className="flex justify-between py-1">
                      <span>Gross Sales Invoices</span>
                      <span className="font-medium text-foreground">₹{(Number(data?.totalSalesRevenue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 text-rose-500">
                      <span>Less: Customer Sales Returns & Allowances</span>
                      <span className="font-medium">- ₹{(Number(data?.totalSalesReturnsValue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold text-foreground border-t border-border pt-2 text-xs">
                      <span>Total Net Revenue</span>
                      <span className="text-primary">₹{(Number(data?.netSalesRevenue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Cost of Sales */}
                <div className="p-4">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShoppingCart className="h-4 w-4 text-blue-600" /> 2. Cost of Goods Sold (COGS)
                  </h4>
                  <div className="space-y-1.5 pl-5 text-muted-foreground">
                    <div className="flex justify-between py-1">
                      <span>Total Inventory Purchases & Freight</span>
                      <span className="font-medium text-foreground">₹{(Number(data?.totalPurchaseCost) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold text-foreground border-t border-border pt-2 text-xs">
                      <span>Gross Profit</span>
                      <span className="text-amber-600 dark:text-amber-400">₹{(Number(data?.grossProfit) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Operating Expenses */}
                <div className="p-4 bg-muted/20">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-rose-500" /> 3. Operating & Administrative Expenses
                  </h4>
                  <div className="space-y-1.5 pl-5 text-muted-foreground">
                    {Object.entries(data?.expenseBreakdown || {}).map(([cat, amt]: any) => (
                      <div key={cat} className="flex justify-between py-1">
                        <span>{cat}</span>
                        <span className="font-medium text-foreground">₹{Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                    {Object.keys(data?.expenseBreakdown || {}).length === 0 && (
                      <div className="py-1 italic text-muted-foreground">No operational expenses recorded for this period.</div>
                    )}
                    <div className="flex justify-between py-1 font-bold text-foreground border-t border-border pt-2 text-xs">
                      <span>Total Operating Expenses</span>
                      <span className="text-rose-500">₹{(Number(data?.totalOperatingExpenses) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Bottom Line Net Profit */}
                <div className={`p-4 ${isNetPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                  <div className="flex justify-between items-center text-sm font-black">
                    <span className="text-foreground uppercase tracking-wide">Net Operating Profit / (Loss)</span>
                    <span className={`text-xl ${isNetPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                      ₹{(Number(data?.netProfit) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}