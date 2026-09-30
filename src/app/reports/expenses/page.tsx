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
  Receipt, RefreshCw, Printer, CreditCard, 
  IndianRupee, Tag, PieChart, ArrowUpRight
} from 'lucide-react';

export default function ExpenseReportPage() {
  const { addToast } = useToastStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  const fetchExpenseReport = async () => {
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

      const res = await fetch(`/api/reports/expenses${query}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      addToast('error', 'Fetch Error', 'Failed to load expense report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseReport();
  }, [dateFilter]);

  const expenseList = data?.expenses || [];

  const columns = [
    { 
      header: 'Expense #', 
      accessor: 'expenseNumber', 
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-xs">
          {row.expenseNumber || 'EXP'}
        </span>
      )
    },
    { 
      header: 'Title / Description', 
      accessor: 'title', 
      sortable: true,
      render: (row: any) => (
        <div>
          <p className="font-semibold text-foreground text-xs">{row.title}</p>
          <span className="text-[10px] text-muted-foreground">{row.vendor ? `Vendor: ${row.vendor}` : ''}</span>
        </div>
      )
    },
    { 
      header: 'Category', 
      accessor: 'category', 
      sortable: true,
      render: (row: any) => <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded">{row.category}</span>
    },
    { header: 'Date', accessor: 'date', sortable: true },
    { 
      header: 'Payment Method', 
      accessor: 'paymentMethod',
      render: (row: any) => <span className="text-xs text-muted-foreground">{row.paymentMethod || 'Cash'}</span>
    },
    { 
      header: 'Amount (₹)', 
      accessor: 'amount', 
      sortable: true,
      render: (row: any) => <span className="font-extrabold text-foreground text-xs">₹{Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
    { 
      header: 'Status', 
      accessor: 'paymentStatus', 
      render: (row: any) => (
        <Badge variant={row.paymentStatus === 'Paid' || row.paymentStatus === 'Approved' ? 'success' : 'warning'}>
          {row.paymentStatus || 'Paid'}
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
                <Receipt className="h-6 w-6 text-rose-500" /> Expense & Overhead Report
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Operating expenses, category spending distribution, payment methods, and overhead tracking.</p>
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
              <Button variant="outline" size="sm" onClick={fetchExpenseReport} className="h-9 gap-1.5 text-xs font-semibold">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9 gap-1.5 text-xs font-semibold">
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-border shadow-xs hover:border-rose-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</p>
                  <p className="text-2xl font-bold text-foreground mt-1">₹{(Number(data?.totalExpenseAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-rose-500 font-medium mt-0.5 block">{data?.totalExpenseCount || 0} Entries Recorded</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Receipt className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-blue-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tax on Expenses</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">₹{(Number(data?.totalTaxPaid) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-blue-500 font-medium mt-0.5 block">GST Paid on Bills</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Tag className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Average Expense / Entry</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    ₹{(data?.totalExpenseCount ? (data.totalExpenseAmount / data.totalExpenseCount) : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-primary font-medium mt-0.5 block">Avg ticket size</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-rose-500" /> Category Spending Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(data?.categoryBreakdown || []).map((cat: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border text-xs">
                    <p className="font-bold text-foreground mb-1">{cat.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cat.count} expense bills</p>
                    <p className="text-sm font-black text-rose-500 mt-1">₹{Number(cat.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* DataTable */}
          <DataTable
            title="Expenses Audit Log"
            data={expenseList}
            columns={columns}
            searchKey="title"
            searchPlaceholder="Search by Title, Vendor, Category..."
          />
        </div>
      </PageContainer>
    </AppShell>
  );
}