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
import { ShieldCheck, Plus, FileText, MapPin, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const deliverySchema = z.object({
  challanNo: z.string().min(5, { message: 'Challan number is required' }),
  invoiceNo: z.string().min(5, { message: 'Invoice number is required' }),
  customerName: z.string().min(3, { message: 'Customer name is required' }),
  shippingAddress: z.string().min(10, { message: 'Full shipping address is required' }),
  courierName: z.string().min(2, { message: 'Courier name is required' })
});

export default function DeliveryPage() {
  const { addToast } = useToastStore();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      challanNo: 'CHAL-2026-' + Math.floor(1000 + Math.random() * 9000),
      invoiceNo: 'INV-2026-',
      customerName: '',
      shippingAddress: '',
      courierName: ''
    }
  });

  const loadDeliveries = () => {
    setLoading(true);
    fetch('/api/deliveries')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDeliveries(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        status: 'Shipped',
        deliveryDate: new Date().toISOString().split('T')[0]
      };

      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate delivery challan');
      }

      addToast('success', 'Challan Created', `Delivery challan ${data.challanNo} successfully registered.`);
      setIsModalOpen(false);
      reset({
        challanNo: 'CHAL-2026-' + Math.floor(1000 + Math.random() * 9000),
        invoiceNo: 'INV-2026-',
        customerName: '',
        shippingAddress: '',
        courierName: ''
      });
      loadDeliveries();
    } catch (err: any) {
      addToast('error', 'Challan Generation Failed', err.message);
    }
  };

  const columns = [
    { header: 'Challan Number', accessor: 'challanNo', sortable: true },
    { header: 'Invoice Reference', accessor: 'invoiceNo', sortable: true },
    { header: 'Customer Name', accessor: 'customerName', sortable: true },
    { header: 'Courier Agency', accessor: 'courierName' },
    { header: 'Shipping Address', accessor: 'shippingAddress', render: (row: any) => <span className="truncate max-w-[180px] inline-block">{row.shippingAddress}</span> },
    { header: 'Date Shipped', accessor: 'deliveryDate' },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row: any) => (
        <Badge variant={row.status === 'Delivered' ? 'success' : row.status === 'Cancelled' ? 'destructive' : 'warning'}>
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
                <ShieldCheck className="h-5 w-5 text-primary" /> Delivery Challans
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage product delivery dispatches, courier logs, and shipping records.</p>
            </div>
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="h-9 font-bold self-start sm:self-auto mt-2 sm:mt-0">
              <Plus className="h-4 w-4" /> Create Challan
            </Button>
          </div>

          <DataTable
            title="Dispatch Challans Log"
            data={deliveries}
            columns={columns}
            searchKey="challanNo"
            searchPlaceholder="Search challans..."
            isLoading={loading}
          />
        </div>

        {/* DELIVERY CHALLAN GENERATOR MODAL */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Dispatch Challan"
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs select-none">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Challan No (Auto)</label>
                <input {...register('challanNo')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                {errors.challanNo && <p className="text-rose-500 text-[10px]">{errors.challanNo.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Invoice Number</label>
                <input {...register('invoiceNo')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="INV-2026-XXXX" />
                {errors.invoiceNo && <p className="text-rose-500 text-[10px]">{errors.invoiceNo.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Customer Name</label>
                <input {...register('customerName')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="Customer detail..." />
                {errors.customerName && <p className="text-rose-500 text-[10px]">{errors.customerName.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Courier Partner</label>
                <input {...register('courierName')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="e.g. DHL, Fedex" />
                {errors.courierName && <p className="text-rose-500 text-[10px]">{errors.courierName.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-zinc-500">Shipping Delivery Address</label>
              <textarea {...register('shippingAddress')} className="h-20 w-full rounded border border-border p-3 text-sm focus:outline-none bg-card text-foreground" placeholder="Enter recipient complete address details..." />
              {errors.shippingAddress && <p className="text-rose-500 text-[10px]">{errors.shippingAddress.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Register Challan</Button>
            </div>
          </form>
        </Modal>

      </PageContainer>
    </AppShell>
  );
}
