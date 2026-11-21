'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  ArrowLeftRight, Plus, RefreshCw, Eye, FileText, Trash2, 
  Truck, Building2, CheckCircle2, Calendar, PackageCheck, AlertCircle, ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToastStore } from '../../lib/store';

export default function TransfersListPage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTransfer, setPreviewTransfer] = useState<any | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transfers');
      if (res.ok) {
        const data = await res.json();
        setTransfers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Fetch transfers error:', error);
      addToast('error', 'Fetch Error', 'Failed to retrieve stock transfers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleDelete = async (id: string, transferNum: string) => {
    try {
      const res = await fetch(`/api/transfers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Transfer Deleted', `${transferNum} has been removed.`);
        setTransfers(prev => prev.filter(t => t._id !== id));
      } else {
        const err = await res.json();
        addToast('error', 'Delete Failed', err.error || 'Could not delete transfer.');
      }
    } catch (error) {
      addToast('error', 'Error', 'Failed to communicate with database.');
    }
  };

  const handleReceive = async (transfer: any) => {
    if (transfer.status === 'Completed') {
      addToast('info', 'Already Completed', 'This stock transfer is already marked as received.');
      return;
    }

    try {
      setIsReceiving(true);
      const res = await fetch(`/api/transfers/${transfer._id}/receive`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addToast('success', 'Goods Received!', data.message);
        setTransfers(prev => prev.map(t => t._id === transfer._id ? { ...t, status: 'Completed' } : t));
        if (previewTransfer && previewTransfer._id === transfer._id) {
          setPreviewTransfer((p: any) => ({ ...p, status: 'Completed' }));
        }
      } else {
        const err = await res.json();
        addToast('error', 'Receive Failed', err.error || 'Failed to update stock receipt.');
      }
    } catch (error) {
      addToast('error', 'Error', 'Failed to communicate with database.');
    } finally {
      setIsReceiving(false);
    }
  };

  const totalTransfersCost = transfers.reduce((acc, t) => acc + (Number(t.totalCost) || 0), 0);
  const inTransitCount = transfers.filter(t => t.status === 'In Transit').length;
  const completedCount = transfers.filter(t => t.status === 'Completed').length;
  const totalUnits = transfers.reduce((acc, t) => acc + (Number(t.totalQuantity) || 0), 0);

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
      header: 'Transit Route',
      accessor: 'fromWarehouseName',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3 text-muted-foreground" /> {row.fromWarehouseName}
          </span>
          <span className="text-primary font-bold text-[11px] flex items-center gap-1 mt-0.5">
            ➔ {row.toWarehouseName}
          </span>
        </div>
      )
    },
    {
      header: 'Vehicle & Driver',
      accessor: 'vehicleNumber',
      render: (row: any) => (
        <div className="flex flex-col text-xs">
          <span className="font-mono font-semibold text-foreground flex items-center gap-1">
            <Truck className="h-3 w-3 text-muted-foreground" /> {row.vehicleNumber || 'Transit Van'}
          </span>
          {row.driverName && <span className="text-[11px] text-muted-foreground">{row.driverName}</span>}
        </div>
      )
    },
    {
      header: 'Stock Units',
      accessor: 'totalQuantity',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-xs text-foreground">
            {row.totalQuantity} items
          </span>
          <span className="text-[10px] text-muted-foreground">({(row.items || []).length} SKUs)</span>
        </div>
      )
    },
    {
      header: 'Cargo Value',
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
            onClick={() => setPreviewTransfer(row)}
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Preview Challan"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => router.push(`/transfers/${row._id}`)}
            className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Full Delivery Challan Note"
          >
            <FileText className="h-4.5 w-4.5" />
          </button>
          {row.status !== 'Completed' && (
            <button
              onClick={() => handleReceive(row)}
              className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
              title="Confirm Goods Received"
            >
              <PackageCheck className="h-4.5 w-4.5" />
            </button>
          )}
          <button
            onClick={() => handleDelete(row._id, row.transferNumber)}
            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="h-4.5 w-4.5" />
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
                <ArrowLeftRight className="h-6 w-6 text-primary" /> Inter-Warehouse Stock Transfers
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage stock movements across regional depots, retail store replenishment, and transit logistics.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchTransfers} disabled={loading} className="cursor-pointer">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={() => router.push('/transfers/create')} className="cursor-pointer">
                <Plus className="h-4 w-4" /> Create Transfer
              </Button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">In-Transit Freight</span>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Truck className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-blue-600 mt-2">
                {inTransitCount} Active Loads
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Vehicles on transit route</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Completed Receipts</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-emerald-600 mt-2">
                {completedCount} / {transfers.length}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Depots replenished</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Units Moved</span>
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <PackageCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                {totalUnits.toLocaleString('en-IN')} Units
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Relocated inventory stock</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Cargo Cost</span>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                ₹{totalTransfersCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Internal asset transfers</span>
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            data={transfers}
            columns={columns}
            searchKey="transferNumber"
            searchPlaceholder="Search transfer ID, route, vehicle, driver..."
            filters={[
              { name: 'Status', key: 'status', options: ['In Transit', 'Completed', 'Pending', 'Draft', 'Cancelled'] }
            ]}
          />

          {/* Interactive Preview Modal */}
          {previewTransfer && (
            <Modal
              isOpen={Boolean(previewTransfer)}
              onClose={() => setPreviewTransfer(null)}
              title={`Stock Transfer Challan — ${previewTransfer.transferNumber}`}
              size="lg"
            >
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-card border border-border/70 space-y-4">
                  
                  {/* Route Bar */}
                  <div className="flex justify-between items-start pb-3 border-b border-border/60">
                    <div>
                      <span className="text-xs font-bold text-primary font-mono">{previewTransfer.transferNumber}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-foreground text-sm">{previewTransfer.fromWarehouseName}</span>
                        <span className="font-bold text-primary">➔</span>
                        <span className="font-bold text-foreground text-sm">{previewTransfer.toWarehouseName}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        Vehicle: {previewTransfer.vehicleNumber || '—'} • Driver: {previewTransfer.driverName || '—'} ({previewTransfer.driverPhone || '—'})
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(previewTransfer.status)}
                      <div className="text-[11px] text-muted-foreground mt-1">Dispatch: {previewTransfer.date}</div>
                      {previewTransfer.receivedDate && (
                        <div className="text-[11px] font-semibold text-emerald-600">Received: {previewTransfer.receivedDate}</div>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <span className="font-bold text-xs text-foreground block mb-2">Transferred Line Items:</span>
                    <div className="rounded-xl border border-border/70 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-muted/40 text-[11px] font-bold text-muted-foreground border-b border-border/50">
                          <tr>
                            <th className="p-2.5">Product</th>
                            <th className="p-2.5 text-center">Transfer Qty</th>
                            <th className="p-2.5 text-right">Unit Cost</th>
                            <th className="p-2.5 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {(previewTransfer.items || []).map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-muted/10">
                              <td className="p-2.5 font-medium text-foreground">
                                {item.productName}
                                {item.sku && <span className="text-[10px] text-muted-foreground block font-mono">SKU: {item.sku}</span>}
                              </td>
                              <td className="p-2.5 text-center font-bold text-foreground">{item.quantity}</td>
                              <td className="p-2.5 text-right font-mono">₹{Number(item.unitCost).toLocaleString('en-IN')}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-foreground">₹{Number(item.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="flex justify-between items-end pt-3 border-t border-border/60">
                    <div className="max-w-xs text-[11px] text-muted-foreground">
                      <span className="font-bold text-foreground block mb-0.5">Notes / Purpose:</span>
                      <p>{previewTransfer.notes || 'Inter-warehouse standard stock replenishment transfer.'}</p>
                    </div>

                    <div className="w-56 space-y-1.5 text-right text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total Items:</span>
                        <span className="font-bold text-foreground">{previewTransfer.totalQuantity} units</span>
                      </div>
                      {previewTransfer.shippingCharge > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Freight Charge:</span>
                          <span className="font-mono text-foreground">₹{Number(previewTransfer.shippingCharge).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-black text-foreground pt-1.5 border-t border-border">
                        <span>Total Transferred Value:</span>
                        <span className="font-mono text-primary">₹{Number(previewTransfer.totalCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/transfers/${previewTransfer._id}`)}>
                    <FileText className="h-4 w-4" /> Full Delivery Challan
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreviewTransfer(null)}>
                      Close
                    </Button>
                    {previewTransfer.status !== 'Completed' && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleReceive(previewTransfer)} 
                        isLoading={isReceiving}
                      >
                        <PackageCheck className="h-4 w-4" /> Confirm Goods Received
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Modal>
          )}

        </div>
      </PageContainer>
    </AppShell>
  );
}