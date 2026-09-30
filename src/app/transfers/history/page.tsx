'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { 
  History, RefreshCw, Eye, Truck, Building2, 
  DollarSign, CheckCircle2, Calendar, PackageCheck, Route
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToastStore } from '../../../lib/store';

export default function TransferHistoryPage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [data, setData] = useState<{
    totalTransfers: number;
    totalTransferredCost: number;
    totalUnitsMoved: number;
    completedCount: number;
    inTransitCount: number;
    pendingCount: number;
    routeBreakdown: Record<string, { count: number; totalCost: number; totalUnits: number }>;
    history: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transfers/history');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Fetch transfer history error:', error);
      addToast('error', 'Fetch Error', 'Failed to retrieve stock transfer logistics history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="success" className="text-[11px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Delivered</Badge>;
      case 'In Transit':
        return <Badge variant="info" className="text-[11px]"><Truck className="h-3 w-3 mr-1" /> In Transit</Badge>;
      case 'Cancelled':
        return <Badge variant="destructive" className="text-[11px]">Cancelled</Badge>;
      default:
        return <Badge variant="warning" className="text-[11px]">Pending</Badge>;
    }
  };

  const columns = [
    {
      header: 'Transfer # / Date',
      accessor: 'transferNumber',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-primary">{row.transferNumber}</span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3" /> {row.date}
          </span>
        </div>
      )
    },
    {
      header: 'Logistics Route',
      accessor: 'fromWarehouseName',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-foreground">{row.fromWarehouseName}</span>
          <span className="text-primary font-bold text-[11px] mt-0.5">➔ {row.toWarehouseName}</span>
        </div>
      )
    },
    {
      header: 'Vehicle & Carrier',
      accessor: 'vehicleNumber',
      render: (row: any) => (
        <div className="flex flex-col text-xs">
          <span className="font-mono font-semibold text-foreground flex items-center gap-1">
            <Truck className="h-3 w-3 text-muted-foreground" /> {row.vehicleNumber || 'Van'}
          </span>
          {row.driverName && <span className="text-[11px] text-muted-foreground">{row.driverName}</span>}
        </div>
      )
    },
    {
      header: 'Units Moved',
      accessor: 'totalQuantity',
      sortable: true,
      render: (row: any) => (
        <span className="font-bold text-xs text-foreground">
          {row.totalQuantity} items
        </span>
      )
    },
    {
      header: 'Total Cargo Cost',
      accessor: 'totalCost',
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-foreground">
          ₹{Number(row.totalCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
            onClick={() => router.push(`/transfers/${row._id}`)}
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="View Delivery Challan"
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
                <History className="h-6 w-6 text-primary" /> Stock Transfers History & Route Flows
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Historical records of inter-branch inventory movements, freight routes, and delivery confirmations.
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
              
              {/* Grand Total Asset Moved */}
              <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/20 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Value Relocated</span>
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-foreground font-mono">
                    ₹{Number(data.totalTransferredCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Combined value of {data.totalUnitsMoved.toLocaleString('en-IN')} units transferred across {data.totalTransfers} consignments.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Completed Deliveries:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {data.completedCount} Deliveries ({Math.round((data.completedCount / (data.totalTransfers || 1)) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Active Route Flows */}
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Route className="h-4 w-4 text-primary" /> Active Logistics Corridors & Route Traffic
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">{Object.keys(data.routeBreakdown || {}).length} Active Routes</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(data.routeBreakdown || {}).map(([routeName, info]) => (
                    <div key={routeName} className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                      <div className="flex justify-between items-start text-xs">
                        <span className="font-semibold text-foreground truncate max-w-[170px]">{routeName}</span>
                        <span className="font-mono font-bold text-primary text-xs">
                          {info.count} trips
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{info.totalUnits} items moved</span>
                        <span className="font-mono font-bold text-foreground">₹{info.totalCost.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Detailed Audit Table */}
          <DataTable
            title="Complete Transfer Consignment Audit Log"
            data={data?.history || []}
            columns={columns}
            searchKey="transferNumber"
            searchPlaceholder="Search transfer ID, route, vehicle..."
          />

        </div>
      </PageContainer>
    </AppShell>
  );
}