'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftRight, 
  ArrowLeft, 
  Printer, 
  Building2, 
  Truck, 
  Trash2,
  PackageCheck,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function TransferDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToastStore();
  const id = params?.id as string;

  const [transfer, setTransfer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReceiving, setIsReceiving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/transfers/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setTransfer(data);
      })
      .catch(() => {
        fetch('/api/transfers')
          .then(res => res.json())
          .then(list => {
            if (Array.isArray(list)) {
              const found = list.find((t: any) => t._id === id || t.transferNumber === id);
              if (found) setTransfer(found);
            }
          });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleReceive = async () => {
    if (!transfer) return;
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
        setTransfer((t: any) => ({ ...t, status: 'Completed', receivedDate: new Date().toISOString().split('T')[0] }));
      } else {
        const err = await res.json();
        addToast('error', 'Receive Failed', err.error || 'Failed to update stock receipt.');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to communicate with database.');
    } finally {
      setIsReceiving(false);
    }
  };

  const handleDelete = async () => {
    if (!transfer) return;

    try {
      const res = await fetch(`/api/transfers/${transfer._id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Transfer Deleted', `${transfer.transferNumber} removed.`);
        router.push('/transfers');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to delete record.');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (!transfer) {
    return (
      <AppShell>
        <PageContainer>
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-foreground">Stock Transfer Not Found</h2>
            <p className="text-sm text-muted-foreground mt-2">The requested stock transfer challan could not be located.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/transfers')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Transfers
            </Button>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Top Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/transfers')} className="cursor-pointer">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" /> Transfer Challan #{transfer.transferNumber}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="cursor-pointer">
                <Printer className="h-4 w-4 mr-1.5" /> Print Delivery Challan
              </Button>

              {transfer.status !== 'Completed' ? (
                <Button variant="primary" size="sm" onClick={handleReceive} isLoading={isReceiving} className="cursor-pointer">
                  <PackageCheck className="h-4 w-4 mr-1.5" /> Confirm Goods Received
                </Button>
              ) : (
                <Badge variant="success" className="py-1 px-3">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Delivered & Received
                </Badge>
              )}

              <Button variant="outline" size="sm" onClick={handleDelete} className="text-rose-500 hover:bg-rose-500/10 cursor-pointer">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Printable Stock Transfer Challan Document */}
          <div className="bg-card border border-border/80 rounded-2xl shadow-sm p-8 space-y-6 print:border-none print:shadow-none print:p-0">
            
            {/* Header / Brand */}
            <div className="flex justify-between items-start border-b border-border/70 pb-6">
              <div>
                <div className="flex items-center gap-2 text-primary font-black text-2xl tracking-wider">
                  <FileCheck className="h-7 w-7" /> ENTERPRISE ERP
                </div>
                <p className="text-xs text-muted-foreground mt-1">Inter-Warehouse Stock Transfer & Transit Challan</p>
                <p className="text-xs text-muted-foreground">GSTIN: 27AAAAA0000A1Z5 | Internal Stock Movement (Non-Sale)</p>
              </div>

              <div className="text-right">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-wider">STOCK DELIVERY CHALLAN</h2>
                <div className="font-mono text-sm font-bold text-primary mt-1">{transfer.transferNumber}</div>
                <div className="text-xs text-muted-foreground mt-1">Dispatch Date: {transfer.date}</div>
                {transfer.receivedDate && (
                  <div className="text-xs font-semibold text-emerald-600">Delivered Date: {transfer.receivedDate}</div>
                )}
              </div>
            </div>

            {/* Source & Destination Depots */}
            <div className="grid grid-cols-2 gap-8 py-2">
              <div className="space-y-1 text-xs">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] block mb-1">
                  Dispatched From (Origin Depot):
                </span>
                <p className="font-bold text-foreground text-sm flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-primary" /> {transfer.fromWarehouseName}
                </p>
                <p className="text-muted-foreground">Dispatched By: {transfer.initiatedBy || 'Inventory Controller'}</p>
                <p className="text-muted-foreground">Vehicle: <span className="font-mono font-bold text-foreground">{transfer.vehicleNumber || 'Transit Van'}</span></p>
              </div>

              <div className="space-y-1 text-xs text-right">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] block mb-1">
                  Destination Depot (To):
                </span>
                <p className="font-bold text-foreground text-sm flex items-center justify-end gap-1">
                  <Building2 className="h-4 w-4 text-emerald-600" /> {transfer.toWarehouseName}
                </p>
                <p className="text-muted-foreground">Driver: {transfer.driverName || '—'} ({transfer.driverPhone || '—'})</p>
                <div className="pt-2">
                  <Badge variant={transfer.status === 'Completed' ? 'success' : 'info'}>
                    Status: {transfer.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="rounded-xl border border-border/70 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border/60">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">SKU Code</th>
                    <th className="p-3">Product Description</th>
                    <th className="p-3 text-center">Transfer Qty</th>
                    <th className="p-3 text-right">Unit Asset Cost</th>
                    <th className="p-3 text-right">Total Transferred Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(transfer.items || []).map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/5">
                      <td className="p-3 text-muted-foreground">{idx + 1}</td>
                      <td className="p-3 font-mono text-muted-foreground">{item.sku || '—'}</td>
                      <td className="p-3 font-semibold text-foreground">{item.productName}</td>
                      <td className="p-3 text-center font-bold text-foreground">{item.quantity}</td>
                      <td className="p-3 text-right font-mono">₹{Number(item.unitCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        ₹{Number(item.subtotal || (item.quantity * item.unitCost) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/70">
              <div className="space-y-3 text-xs text-muted-foreground">
                <div>
                  <span className="font-bold text-foreground block mb-1">Transit Remarks & Declaration:</span>
                  <p className="bg-muted/20 p-3 rounded-xl border border-border/50">
                    {transfer.notes || 'This stock transfer is an internal movement between company warehouses without any sale consideration.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-right">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Cargo Quantity:</span>
                  <span className="font-bold text-foreground">{transfer.totalQuantity} Units</span>
                </div>
                {transfer.shippingCharge > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Freight / Toll Cost:</span>
                    <span className="font-mono text-foreground">+₹{Number(transfer.shippingCharge).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-black text-foreground pt-3 border-t-2 border-foreground/20">
                  <span>Total Transferred Asset Valuation:</span>
                  <span className="font-mono text-primary text-xl">₹{Number(transfer.totalCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-3 gap-6 pt-12 text-xs text-muted-foreground">
              <div>
                <p>Dispatched By (Origin Depot)</p>
                <div className="border-b border-muted-foreground/40 mt-8"></div>
                <p className="mt-1 text-[11px]">{transfer.initiatedBy || 'Warehouse Officer'}</p>
              </div>
              <div className="text-center">
                <p>Driver / Carrier Handover</p>
                <div className="border-b border-muted-foreground/40 mt-8 mx-auto w-3/4"></div>
                <p className="mt-1 text-[11px]">{transfer.driverName || 'Carrier Representative'}</p>
              </div>
              <div className="text-right">
                <p>Received By (Destination Depot)</p>
                <div className="border-b border-muted-foreground/40 mt-8"></div>
                <p className="mt-1 text-[11px]">{transfer.receivedBy || 'Store Manager'}</p>
              </div>
            </div>

          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}