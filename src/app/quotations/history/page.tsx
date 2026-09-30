'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { 
  History, RefreshCw, Eye, FileText, 
  DollarSign, CheckCircle2, TrendingUp, Calendar, Sparkles, PieChart, ArrowUpRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToastStore } from '../../../lib/store';

export default function QuotationHistoryPage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [data, setData] = useState<{
    totalQuotedValue: number;
    convertedValue: number;
    acceptedValue: number;
    totalCount: number;
    convertedCount: number;
    conversionRate: number;
    statusCounts: Record<string, number>;
    history: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quotations/history');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Fetch quotation history error:', error);
      addToast('error', 'Fetch Error', 'Failed to retrieve quotation pipeline analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Converted':
        return <Badge variant="success" className="text-[11px]"><Sparkles className="h-3 w-3 mr-1" /> Converted</Badge>;
      case 'Accepted':
        return <Badge variant="success" className="text-[11px]">Accepted</Badge>;
      case 'Sent':
        return <Badge variant="info" className="text-[11px]">Sent</Badge>;
      case 'Declined':
        return <Badge variant="destructive" className="text-[11px]">Declined</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px]">Draft</Badge>;
    }
  };

  const columns = [
    {
      header: 'Quote # / Date',
      accessor: 'quotationNumber',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-primary">{row.quotationNumber}</span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3" /> {row.date}
          </span>
        </div>
      )
    },
    {
      header: 'Client / Company',
      accessor: 'customerName',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{row.customerName}</span>
          <span className="text-[11px] text-muted-foreground">{row.customerPhone || '—'}</span>
        </div>
      )
    },
    {
      header: 'Items Count',
      accessor: 'items',
      render: (row: any) => (
        <span className="text-xs font-semibold text-foreground">
          {(row.items || []).length} items ({(row.items || []).reduce((a: number, i: any) => a + (Number(i.quantity) || 0), 0)} pcs)
        </span>
      )
    },
    {
      header: 'Quoted Grand Total',
      accessor: 'grandTotal',
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-sm text-foreground">
          ₹{Number(row.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row: any) => getStatusBadge(row.status)
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => router.push(`/quotations/${row._id}`)}
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="View Full Quotation Invoice"
          >
            <Eye className="h-4.5 w-4.5" />
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
                <History className="h-6 w-6 text-primary" /> Quotations History & Pipeline Audit
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Historical records of corporate proposals, conversion ratios, and win/loss analytics.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loading} className="cursor-pointer">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>

          {/* Analytics Summary */}
          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Grand Total Quoted */}
              <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/20 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pipeline Quoted Total</span>
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-foreground font-mono">
                    ₹{Number(data.totalQuotedValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cumulative proposal estimates across {data.totalCount} quote records.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Successfully Converted:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    ₹{Number(data.convertedValue || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Status Breakdown list */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <PieChart className="h-4 w-4 text-primary" /> Proposal Status Breakdown & Win Ratio
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {data.conversionRate}% Conversion Rate
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/70 text-center">
                    <span className="text-[11px] text-muted-foreground font-semibold block">Drafts</span>
                    <span className="text-lg font-bold text-foreground mt-1 block">{data.statusCounts?.Draft || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <span className="text-[11px] text-blue-600 font-semibold block">Sent</span>
                    <span className="text-lg font-bold text-blue-600 mt-1 block">{data.statusCounts?.Sent || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-[11px] text-emerald-600 font-semibold block">Accepted</span>
                    <span className="text-lg font-bold text-emerald-600 mt-1 block">{data.statusCounts?.Accepted || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                    <span className="text-[11px] text-indigo-600 font-semibold block">Converted</span>
                    <span className="text-lg font-bold text-indigo-600 mt-1 block">{data.statusCounts?.Converted || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <span className="text-[11px] text-rose-600 font-semibold block">Declined</span>
                    <span className="text-lg font-bold text-rose-600 mt-1 block">{data.statusCounts?.Declined || 0}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Complete History Table */}
          <DataTable
            title="Complete Quotation Audit Trail"
            data={data?.history || []}
            columns={columns}
            searchKey="customerName"
            searchPlaceholder="Search client name or quotation #..."
          />

        </div>
      </PageContainer>
    </AppShell>
  );
}