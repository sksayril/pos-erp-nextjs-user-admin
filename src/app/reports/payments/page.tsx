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
  CreditCard, RefreshCw, Printer, ArrowDownLeft, ArrowUpRight, 
  IndianRupee, Activity, ShieldCheck, Layers
} from 'lucide-react';

export default function PaymentsAuditReportPage() {
  const { addToast } = useToastStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inflow' | 'outflow'>('all');

  const fetchPaymentsReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/payments');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      addToast('error', 'Fetch Error', 'Failed to load payments audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsReport();
  }, []);

  let paymentList = data?.payments || [];
  if (directionFilter === 'inflow') {
    paymentList = paymentList.filter((p: any) => p.direction === 'Inflow');
  } else if (directionFilter === 'outflow') {
    paymentList = paymentList.filter((p: any) => p.direction === 'Outflow');
  }

  const columns = [
    { 
      header: 'Cash Flow', 
      accessor: 'direction', 
      sortable: true,
      render: (row: any) => (
        <Badge variant={row.direction === 'Inflow' ? 'success' : 'destructive'}>
          {row.direction === 'Inflow' ? (
            <span className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3" /> Inflow (Receipt)</span>
          ) : (
            <span className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Outflow (Payment)</span>
          )}
        </Badge>
      )
    },
    { 
      header: 'Ref / Voucher #', 
      accessor: 'ref', 
      sortable: true,
      render: (row: any) => <span className="font-mono font-bold text-foreground text-xs">{row.ref}</span>
    },
    { 
      header: 'Party / Account', 
      accessor: 'party', 
      sortable: true,
      render: (row: any) => <span className="font-semibold text-foreground text-xs">{row.party}</span>
    },
    { 
      header: 'Transaction Type', 
      accessor: 'type',
      render: (row: any) => <span className="text-xs text-muted-foreground">{row.type}</span>
    },
    { header: 'Date', accessor: 'date', sortable: true },
    { 
      header: 'Payment Mode', 
      accessor: 'method',
      render: (row: any) => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded">
          <CreditCard className="h-3 w-3 text-muted-foreground" /> {row.method}
        </span>
      )
    },
    { 
      header: 'Amount (₹)', 
      accessor: 'amount', 
      sortable: true,
      render: (row: any) => (
        <span className={`font-black text-xs ${row.direction === 'Inflow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
          {row.direction === 'Inflow' ? '+' : '-'} ₹{Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
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
                <Activity className="h-6 w-6 text-primary" /> Payments & Cash Flow Audit Log
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Audit all inflow receipts (sales) and outflow disbursements (purchases, expenses, transfers).</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchPaymentsReport} className="h-9 gap-1.5 text-xs font-semibold">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9 gap-1.5 text-xs font-semibold">
                <Printer className="h-3.5 w-3.5" /> Print Audit
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-xs hover:border-emerald-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cash Inflow</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{(Number(data?.totalInflow) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Customer Receipts</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-rose-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cash Outflow</p>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">₹{(Number(data?.totalOutflow) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-rose-500 font-medium mt-0.5 block">Vendor Bills & Expenses</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Cash Flow</p>
                  <p className="text-2xl font-black text-primary mt-1">₹{(Number(data?.netCashFlow) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-primary font-medium mt-0.5 block">Net Operating Liquidity</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-blue-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Audit Transactions</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{data?.totalTransactionsCount || 0}</p>
                  <span className="text-[10px] text-blue-500 font-medium mt-0.5 block">Verified Ledger Records</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Layers className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Ribbon */}
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <button
              onClick={() => setDirectionFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                directionFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              All Cash Transactions ({data?.totalTransactionsCount || 0})
            </button>
            <button
              onClick={() => setDirectionFilter('inflow')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                directionFilter === 'inflow'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 hover:bg-emerald-500/10'
              }`}
            >
              Inflow Receipts Only
            </button>
            <button
              onClick={() => setDirectionFilter('outflow')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                directionFilter === 'outflow'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 hover:bg-rose-500/10'
              }`}
            >
              Outflow Payments Only
            </button>
          </div>

          {/* DataTable */}
          <DataTable
            title="Transactions Audit Trail"
            data={paymentList}
            columns={columns}
            searchKey="party"
            searchPlaceholder="Search by Party, Voucher #..."
          />
        </div>
      </PageContainer>
    </AppShell>
  );
}