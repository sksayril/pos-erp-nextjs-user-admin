'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { Truck, Plus, FileText, Calendar, Compass } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const waybillSchema = z.object({
  ewayBillNo: z.string().min(5, { message: 'Waybill number is required' }),
  invoiceNo: z.string().min(5, { message: 'Invoice number is required' }),
  customerName: z.string().min(3, { message: 'Customer name is required' }),
  transporterName: z.string().min(3, { message: 'Transporter name is required' }),
  vehicleNo: z.string().min(5, { message: 'Vehicle number is required' }),
  distance: z.number().min(1, { message: 'Distance must be at least 1 km' })
});

export default function WaybillPage() {
  const { addToast } = useToastStore();
  const [waybills, setWaybills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(waybillSchema),
    defaultValues: {
      ewayBillNo: 'EWAY-2026-' + Math.floor(1000 + Math.random() * 9000),
      invoiceNo: 'INV-2026-',
      customerName: '',
      transporterName: '',
      vehicleNo: '',
      distance: 50
    }
  });

  const loadWaybills = () => {
    setLoading(true);
    fetch('/api/waybills')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setWaybills(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWaybills();
  }, []);

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

      addToast('success', 'E-Waybill Generated', `Waybill ${data.ewayBillNo} successfully generated.`);
      setIsModalOpen(false);
      reset({
        ewayBillNo: 'EWAY-2026-' + Math.floor(1000 + Math.random() * 9000),
        invoiceNo: 'INV-2026-',
        customerName: '',
        transporterName: '',
        vehicleNo: '',
        distance: 50
      });
      loadWaybills();
    } catch (err: any) {
      addToast('error', 'Generation Failed', err.message);
    }
  };

  const columns = [
    { header: 'Waybill Number', accessor: 'ewayBillNo', sortable: true },
    { header: 'Invoice Reference', accessor: 'invoiceNo', sortable: true },
    { header: 'Customer Name', accessor: 'customerName', sortable: true },
    { header: 'Transporter', accessor: 'transporterName' },
    { header: 'Vehicle Number', accessor: 'vehicleNo' },
    { header: 'Distance', accessor: 'distance', render: (row: any) => <span>{row.distance} km</span> },
    { header: 'Date Issued', accessor: 'date' },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row: any) => (
        <Badge variant={row.status === 'Active' ? 'success' : row.status === 'Cancelled' ? 'destructive' : 'warning'}>
          {row.status}
        </Badge>
      )
    }
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between select-none border-b border-border pb-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" /> E-Waybill Management
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Generate and monitor transportation E-Waybills linked to invoices.</p>
            </div>
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="h-9 font-bold self-start sm:self-auto mt-2 sm:mt-0">
              <Plus className="h-4 w-4" /> Generate E-Waybill
            </Button>
          </div>

          <DataTable
            title="Active E-Waybills Log"
            data={waybills}
            columns={columns}
            searchKey="ewayBillNo"
            searchPlaceholder="Search E-Waybills..."
          />
        </div>

        {/* E-WAYBILL GENERATOR MODAL */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Generate GST E-Waybill"
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs select-none">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">E-Waybill No (Auto)</label>
                <input {...register('ewayBillNo')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                {errors.ewayBillNo && <p className="text-rose-500 text-[10px]">{errors.ewayBillNo.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Invoice Number</label>
                <input {...register('invoiceNo')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="INV-2026-XXXX" />
                {errors.invoiceNo && <p className="text-rose-500 text-[10px]">{errors.invoiceNo.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-zinc-500">Customer Name</label>
              <input {...register('customerName')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="Enter party name..." />
              {errors.customerName && <p className="text-rose-500 text-[10px]">{errors.customerName.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-zinc-500">Transporter Agency / Courier</label>
              <input {...register('transporterName')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="e.g. DHL, Blue Dart" />
              {errors.transporterName && <p className="text-rose-500 text-[10px]">{errors.transporterName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Vehicle Number</label>
                <input {...register('vehicleNo')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="e.g. WB-02-Y-5421" />
                {errors.vehicleNo && <p className="text-rose-500 text-[10px]">{errors.vehicleNo.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Distance (in KM)</label>
                <input type="number" {...register('distance', { valueAsNumber: true })} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                {errors.distance && <p className="text-rose-500 text-[10px]">{errors.distance.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Generate & Save</Button>
            </div>
          </form>
        </Modal>

      </PageContainer>
    </AppShell>
  );
}
