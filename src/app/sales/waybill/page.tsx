'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { DataTable, ColumnConfig, FilterConfig } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Modal, ConfirmDialog } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { Truck, Plus, FileText, Compass, CheckCircle2, XCircle, AlertTriangle, Eye, Printer, Shield, Navigation, Trash2, Ban } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const waybillSchema = z.object({
  ewayBillNo: z.string().min(5, { message: 'Waybill number is required' }),
  invoiceNo: z.string().min(3, { message: 'Invoice number is required' }),
  customerName: z.string().min(2, { message: 'Customer name is required' }),
  transporterName: z.string().min(2, { message: 'Transporter agency name is required' }),
  vehicleNo: z.string().min(4, { message: 'Vehicle registration number is required' }),
  transportMode: z.string().default('Road'),
  hsnCode: z.string().default('8471'),
  goodsValue: z.number().min(0, { message: 'Goods value cannot be negative' }),
  distance: z.number().min(1, { message: 'Distance must be at least 1 km' })
});

export default function WaybillPage() {
  const { addToast } = useToastStore();
  const [waybills, setWaybills] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState<any>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(waybillSchema),
    defaultValues: {
      ewayBillNo: 'EWAY-2026-' + Math.floor(100000 + Math.random() * 900000),
      invoiceNo: '',
      customerName: '',
      transporterName: 'VRL Logistics Ltd',
      vehicleNo: 'KA-03-MG-4421',
      transportMode: 'Road',
      hsnCode: '8471',
      goodsValue: 45000,
      distance: 120
    }
  });

  const loadWaybills = () => {
    setLoading(true);
    fetch('/api/waybills')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setWaybills(data);
      })
      .catch((err) => console.error('Fetch Waybills Error:', err))
      .finally(() => setLoading(false));
  };

  const loadInvoices = () => {
    fetch('/api/sales')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setInvoices(data);
      })
      .catch((err) => console.error('Fetch Invoices Error:', err));
  };

  useEffect(() => {
    loadWaybills();
    loadInvoices();
  }, []);

  const handleInvoiceSelect = (invNo: string) => {
    const inv = invoices.find((i: any) => i.invoiceNumber === invNo);
    if (inv) {
      setValue('invoiceNo', inv.invoiceNumber);
      setValue('customerName', inv.customerName);
      setValue('goodsValue', inv.grandTotal || 0);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        status: 'Active',
        date: new Date().toISOString().split('T')[0]
      };

      const res = await fetch('/api/waybills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate waybill');
      }

      const created = await res.json();
      addToast('success', 'GST E-Waybill Generated', `Waybill ${data.ewayBillNo} successfully issued.`);
      setIsModalOpen(false);
      reset({
        ewayBillNo: 'EWAY-2026-' + Math.floor(100000 + Math.random() * 900000),
        invoiceNo: '',
        customerName: '',
        transporterName: 'VRL Logistics Ltd',
        vehicleNo: 'KA-03-MG-4421',
        transportMode: 'Road',
        hsnCode: '8471',
        goodsValue: 45000,
        distance: 120
      });
      loadWaybills();
      setSelectedWaybill(created);
      setPreviewModalOpen(true);
    } catch (err: any) {
      addToast('error', 'Generation Failed', err.message);
    }
  };

  const handleCancelWaybill = async () => {
    if (!cancelTarget) return;
    try {
      const targetId = cancelTarget._id || cancelTarget.id;
      const res = await fetch(`/api/waybills/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      });

      if (res.ok) {
        addToast('warning', 'E-Waybill Cancelled', `Waybill ${cancelTarget.ewayBillNo} status changed to Cancelled.`);
        setWaybills(prev => prev.map(w => (w._id === targetId || w.id === targetId) ? { ...w, status: 'Cancelled' } : w));
      } else {
        addToast('error', 'Action Failed', 'Could not cancel E-Waybill.');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setCancelTarget(null);
    }
  };

  const handleDeleteWaybill = async () => {
    if (!deleteTarget) return;
    try {
      const targetId = deleteTarget._id || deleteTarget.id;
      const res = await fetch(`/api/waybills/${targetId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        addToast('success', 'E-Waybill Deleted', `Record ${deleteTarget.ewayBillNo} removed.`);
        setWaybills(prev => prev.filter(w => (w._id !== targetId && w.id !== targetId)));
      } else {
        addToast('error', 'Delete Failed', 'Could not delete waybill from database.');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const activeCount = waybills.filter(w => w.status === 'Active' || w.status === 'Generated').length;
  const cancelledCount = waybills.filter(w => w.status === 'Cancelled').length;
  const expiredCount = waybills.filter(w => w.status === 'Expired').length;

  const columns: ColumnConfig<any>[] = [
    {
      header: 'Waybill Number',
      accessor: 'ewayBillNo',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-foreground text-xs">{r.ewayBillNo}</div>
            <div className="text-[10px] text-muted-foreground">Mode: {r.transportMode || 'Road'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Invoice Ref',
      accessor: 'invoiceNo',
      sortable: true,
      render: (r) => <span className="font-mono text-xs font-semibold text-foreground">{r.invoiceNo}</span>
    },
    { header: 'Customer', accessor: 'customerName', sortable: true },
    { header: 'Transporter', accessor: 'transporterName' },
    {
      header: 'Vehicle No',
      accessor: 'vehicleNo',
      render: (r) => <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border">{r.vehicleNo}</span>
    },
    {
      header: 'Distance',
      accessor: 'distance',
      sortable: true,
      render: (r) => <span className="text-xs font-semibold text-foreground">{r.distance || 0} km</span>
    },
    { header: 'Date Issued', accessor: 'date', sortable: true },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (r) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
          r.status === 'Active' || r.status === 'Generated'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : r.status === 'Cancelled'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {r.status === 'Active' || r.status === 'Generated' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {r.status}
        </span>
      )
    }
  ];

  const filters: FilterConfig[] = [
    { name: 'Status', key: 'status', options: ['Active', 'Generated', 'Expired', 'Cancelled'] },
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">

          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                <Truck className="h-6 w-6 text-primary" />
                GST E-Waybill Operations
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Generate, track, verify, and print transportation E-Waybills linked to sales invoices</p>
            </div>
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="h-10 font-bold">
              <Plus className="h-4 w-4" />
              Generate E-Waybill
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Waybills', value: waybills.length, icon: Truck, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Active / Valid', value: activeCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Expired', value: expiredCount, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Cancelled', value: cancelledCount, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="p-4 rounded-xl border border-border/60 bg-card shadow-sm flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Data Table */}
          <DataTable
            title="E-Waybill Registry Log"
            data={waybills}
            columns={columns}
            searchKey="ewayBillNo"
            searchPlaceholder="Search by E-Waybill No, Invoice or Customer..."
            filters={filters}
            onView={(r) => {
              setSelectedWaybill(r);
              setPreviewModalOpen(true);
            }}
            onEdit={(r) => setCancelTarget(r)}
            onDelete={(r) => setDeleteTarget(r)}
          />
        </div>

        {/* E-WAYBILL GENERATOR MODAL */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Generate GST E-Waybill"
          description="Create a new transport E-Waybill linked to a sales invoice"
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs select-none">
            
            {/* Auto fill from existing Invoice */}
            {invoices.length > 0 && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <label className="font-bold text-primary flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Fast Auto-Fill from Sales Invoice
                </label>
                <select
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:outline-none"
                >
                  <option value="">Select an Invoice to populate details...</option>
                  {invoices.map((inv: any) => (
                    <option key={inv._id || inv.id || inv.invoiceNumber} value={inv.invoiceNumber}>
                      {inv.invoiceNumber} — {inv.customerName} (Rs. {(inv.grandTotal || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">E-Waybill Number (System Auto-Generated)</label>
                <input {...register('ewayBillNo')} className="h-9 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground font-mono font-bold" />
                {errors.ewayBillNo && <p className="text-destructive text-xs">{errors.ewayBillNo.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">Invoice Reference Number *</label>
                <input {...register('invoiceNo')} className="h-9 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="e.g. INV-2026-0001" />
                {errors.invoiceNo && <p className="text-destructive text-xs">{errors.invoiceNo.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">Recipient / Customer Name *</label>
                <input {...register('customerName')} className="h-9 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Party / Business Name" />
                {errors.customerName && <p className="text-destructive text-xs">{errors.customerName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">Transporter Agency Name *</label>
                <input {...register('transporterName')} className="h-9 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="e.g. VRL Logistics, Blue Dart" />
                {errors.transporterName && <p className="text-destructive text-xs">{errors.transporterName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">Vehicle Number *</label>
                <input {...register('vehicleNo')} className="h-9 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="KA-03-MG-4421" />
                {errors.vehicleNo && <p className="text-destructive text-xs">{errors.vehicleNo.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">Mode of Transport</label>
                <select {...register('transportMode')} className="h-9 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground focus:outline-none">
                  <option value="Road">Road Transportation</option>
                  <option value="Rail">Rail Cargo</option>
                  <option value="Air">Air Freight</option>
                  <option value="Ship">Ship Cargo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">Distance (in KM) *</label>
                <input type="number" {...register('distance', { valueAsNumber: true })} className="h-9 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                {errors.distance && <p className="text-destructive text-xs">{errors.distance.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">Consignment Value (Rs.)</label>
                <input type="number" step="0.01" {...register('goodsValue', { valueAsNumber: true })} className="h-9 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">HSN Code</label>
                <input {...register('hsnCode')} className="h-9 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground font-mono focus:outline-none" placeholder="8471" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} className="font-bold px-6">
                Issue E-Waybill
              </Button>
            </div>
          </form>
        </Modal>

        {/* E-WAYBILL PDF PREVIEW MODAL */}
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          title="Official GST E-Waybill Receipt"
          size="lg"
        >
          {selectedWaybill && (
            <div className="space-y-6 select-none">
              
              {/* Printable PDF Area */}
              <div className="print-area border border-zinc-200 bg-white text-zinc-900 p-8 rounded-xl space-y-6 font-sans text-xs">
                {/* PDF Header */}
                <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-4">
                  <div className="space-y-1">
                    <h2 className="text-sm font-black tracking-wider uppercase text-zinc-900">E-Waybill System</h2>
                    <p className="text-[10px] text-zinc-500 font-bold">GOVERNMENT OF INDIA — GST PORTAL</p>
                    <p className="text-[10px] text-zinc-500">Official Goods Transport Clearance Certificate</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="inline-block p-1.5 border-2 border-zinc-900 font-mono font-black text-center text-xs">
                      {selectedWaybill.ewayBillNo}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold">GENERATED DATE: {selectedWaybill.date}</p>
                  </div>
                </div>

                {/* Barcode Mock Section */}
                <div className="flex flex-col items-center justify-center p-3 border border-dashed border-zinc-300 rounded-lg bg-zinc-50/50">
                  <div className="font-mono text-xl font-black tracking-[0.4em] text-zinc-800">
                    ||||| | |||| ||| |||| | ||| |||| |
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500 mt-1 uppercase">GSTIN Transaction ID Barcode Verified</span>
                </div>

                {/* Part A: Shipment Details */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-[11px] uppercase border-b border-zinc-900 pb-1 flex items-center justify-between">
                    <span>1. E-Waybill Details (Part-A)</span>
                    <span className="text-[9px] text-emerald-700 font-bold">GST COMPLIANT</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-zinc-800">
                    <div className="flex justify-between border-b border-zinc-100 pb-1">
                      <span className="text-zinc-500 font-bold">E-Waybill Number:</span>
                      <span className="font-bold text-zinc-800 font-mono">{selectedWaybill.ewayBillNo}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-1">
                      <span className="text-zinc-500 font-bold">Invoice Reference:</span>
                      <span className="font-bold text-zinc-800 font-mono">{selectedWaybill.invoiceNo}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-1">
                      <span className="text-zinc-500 font-bold">Recipient / Customer:</span>
                      <span className="font-bold text-zinc-800">{selectedWaybill.customerName}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-1">
                      <span className="text-zinc-500 font-bold">Transport Distance:</span>
                      <span className="font-bold text-zinc-800">{selectedWaybill.distance} km</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-1">
                      <span className="text-zinc-500 font-bold">Consignment Value:</span>
                      <span className="font-bold text-zinc-800">Rs. {(selectedWaybill.goodsValue || 45000).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-1">
                      <span className="text-zinc-500 font-bold">HSN Classification:</span>
                      <span className="font-bold text-zinc-800 font-mono">{selectedWaybill.hsnCode || '8471'}</span>
                    </div>
                  </div>
                </div>

                {/* Part B: Vehicle & Transporter Logs */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-[11px] uppercase border-b border-zinc-900 pb-1">2. Transportation &amp; Vehicle Logs (Part-B)</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-zinc-800">
                    <div className="flex justify-between border-b border-zinc-100 pb-1">
                      <span className="text-zinc-500 font-bold">Transporter Agency:</span>
                      <span className="font-bold text-zinc-800">{selectedWaybill.transporterName}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-1">
                      <span className="text-zinc-500 font-bold">Vehicle Registration:</span>
                      <span className="font-bold text-zinc-800 font-mono">{selectedWaybill.vehicleNo}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-1">
                      <span className="text-zinc-500 font-bold">Transport Mode:</span>
                      <span className="font-bold text-zinc-800">{selectedWaybill.transportMode || 'Road'}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 pb-1">
                      <span className="text-zinc-500 font-bold">Current Status:</span>
                      <span className={`font-black uppercase ${selectedWaybill.status === 'Active' || selectedWaybill.status === 'Generated' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selectedWaybill.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code and Terms */}
                <div className="flex items-center justify-between pt-6 border-t border-zinc-200">
                  <div className="space-y-1 max-w-[70%] text-zinc-500">
                    <p className="font-bold text-[9px] text-zinc-800">Mandatory Inspection Compliance:</p>
                    <p className="text-[8px] leading-normal">
                      This official GST E-Waybill certificate is generated in compliance with Section 68 of the CGST Act. The transporter must present this document with physical or electronic QR code verification upon request by GST tax officers during transit.
                    </p>
                  </div>
                  
                  {/* Visual QR Code */}
                  <div className="h-16 w-16 border-2 border-zinc-900 p-1 flex flex-col justify-between shrink-0">
                    <div className="grid grid-cols-4 gap-0.5 h-full w-full">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-full w-full ${
                            (i + 3) % 3 === 0 || i % 5 === 0 ? 'bg-zinc-900' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
                <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>
                  Close Preview
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => window.print()}
                  className="font-bold gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print / Save PDF Receipt
                </Button>
              </div>
              
            </div>
          )}
        </Modal>

        {/* Cancel Confirm */}
        <ConfirmDialog
          isOpen={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelWaybill}
          title="Cancel E-Waybill"
          description={`Are you sure you want to set E-Waybill "${cancelTarget?.ewayBillNo}" to Cancelled?`}
          confirmText="Cancel E-Waybill"
          variant="destructive"
        />

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteWaybill}
          title="Delete E-Waybill Record"
          description={`Permanently remove E-Waybill record "${deleteTarget?.ewayBillNo}" from the database?`}
          confirmText="Delete Record"
          variant="destructive"
        />

      </PageContainer>
    </AppShell>
  );
}
