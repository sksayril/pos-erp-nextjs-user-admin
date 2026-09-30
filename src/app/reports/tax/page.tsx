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
  FileSpreadsheet, RefreshCw, Printer, Percent, 
  IndianRupee, ShieldCheck, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';

export default function TaxSummaryReportPage() {
  const { addToast } = useToastStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  const fetchTaxReport = async () => {
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

      const res = await fetch(`/api/reports/tax${query}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      addToast('error', 'Fetch Error', 'Failed to load tax summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxReport();
  }, [dateFilter]);

  const auditRegister = data?.taxAuditRegister || [];

  const columns = [
    { 
      header: 'Tax Type', 
      accessor: 'type', 
      sortable: true,
      render: (row: any) => (
        <Badge variant={row.type.includes('Sales') ? 'success' : 'warning'}>
          {row.type}
        </Badge>
      )
    },
    { 
      header: 'Reference Doc #', 
      accessor: 'refNo', 
      sortable: true,
      render: (row: any) => <span className="font-mono font-bold text-foreground text-xs">{row.refNo}</span>
    },
    { 
      header: 'Party Name', 
      accessor: 'party', 
      sortable: true,
      render: (row: any) => <span className="font-semibold text-foreground text-xs">{row.party}</span>
    },
    { header: 'Date', accessor: 'date', sortable: true },
    { 
      header: 'Taxable Amount (₹)', 
      accessor: 'taxableAmount', 
      sortable: true,
      render: (row: any) => <span className="font-medium text-foreground text-xs">₹{Number(row.taxableAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
    { 
      header: 'GST / Tax (₹)', 
      accessor: 'taxAmount', 
      sortable: true,
      render: (row: any) => (
        <span className={`font-black text-xs ${row.type.includes('Sales') ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
          ₹{Number(row.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      header: 'Invoice Total (₹)', 
      accessor: 'totalAmount', 
      sortable: true,
      render: (row: any) => <span className="font-extrabold text-foreground text-xs">₹{Number(row.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
                <FileSpreadsheet className="h-6 w-6 text-primary" /> Tax & GST Summary Report
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Output GST liability on Sales, Input Tax Credit (ITC) from Purchases, and Net Payable Tax ledger.</p>
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
              <Button variant="outline" size="sm" onClick={fetchTaxReport} className="h-9 gap-1.5 text-xs font-semibold">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9 gap-1.5 text-xs font-semibold">
                <Printer className="h-3.5 w-3.5" /> Print Tax Report
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-xs hover:border-blue-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Output GST (Sales)</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">₹{(Number(data?.totalSalesTax) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-blue-500 font-medium mt-0.5 block">Collected Liability</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-amber-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Input GST / ITC (Purchases)</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">₹{(Number(data?.totalPurchaseTax) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Tax Credit Inward</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net GST Payable</p>
                  <p className="text-2xl font-black text-primary mt-1">₹{(Number(data?.netTaxPayable) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-primary font-medium mt-0.5 block">Output GST minus Input ITC</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-emerald-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Taxable Turnover</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{(Number(data?.totalTaxableSales) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Base Sales Volume</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tax Slabs Breakdown */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Percent className="h-4 w-4 text-primary" /> GST Slab-wise Tax Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(data?.taxBuckets || {}).map(([slab, info]: any) => (
                  <div key={slab} className="p-3 rounded-xl bg-muted/30 border border-border text-xs">
                    <p className="font-bold text-foreground mb-1">{slab}</p>
                    <p className="text-[10px] text-muted-foreground">Taxable: <span className="font-semibold text-foreground">₹{Number(info.taxableAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></p>
                    <p className="text-[10px] text-primary font-bold mt-0.5">Tax: ₹{Number(info.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* DataTable */}
          <DataTable
            title="GST Transactions Audit Log"
            data={auditRegister}
            columns={columns}
            searchKey="party"
            searchPlaceholder="Search by Party, Ref #..."
          />
        </div>
      </PageContainer>
    </AppShell>
  );
}