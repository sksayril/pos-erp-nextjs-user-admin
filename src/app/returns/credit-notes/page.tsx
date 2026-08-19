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
import { BadgeAlert, Plus, HelpCircle, FileText, IndianRupee } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const creditSchema = z.object({
  noteNo: z.string().min(5, { message: 'Credit Note No is required' }),
  invoiceNo: z.string().min(5, { message: 'Invoice number is required' }),
  customerName: z.string().min(3, { message: 'Customer name is required' }),
  refundAmount: z.number().min(1, { message: 'Refund amount must be positive' }),
  reason: z.string().min(5, { message: 'Reason is required' })
});

export default function CreditNotesPage() {
  const { addToast } = useToastStore();
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      noteNo: 'CN-2026-' + Math.floor(1000 + Math.random() * 9000),
      invoiceNo: 'INV-2026-',
      customerName: '',
      refundAmount: 0,
      reason: ''
    }
  });

  const loadNotes = () => {
    setLoading(true);
    fetch('/api/credit-debit-notes')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.creditNotes)) {
          setCreditNotes(data.creditNotes);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        type: 'credit',
        data: {
          ...data,
          status: 'Issued',
          date: new Date().toISOString().split('T')[0]
        }
      };

      const res = await fetch('/api/credit-debit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to issue credit note');
      }

      addToast('success', 'Credit Note Issued', `Credit Note ${data.noteNo} recorded to MongoDB.`);
      setIsModalOpen(false);
      reset({
        noteNo: 'CN-2026-' + Math.floor(1000 + Math.random() * 9000),
        invoiceNo: 'INV-2026-',
        customerName: '',
        refundAmount: 0,
        reason: ''
      });
      loadNotes();
    } catch (err: any) {
      addToast('error', 'Issuance Failed', err.message);
    }
  };

  const columns = [
    { header: 'Note Number', accessor: 'noteNo', sortable: true },
    { header: 'Invoice Reference', accessor: 'invoiceNo', sortable: true },
    { header: 'Customer Name', accessor: 'customerName', sortable: true },
    { header: 'Refund Amount (Rs.)', accessor: 'refundAmount', render: (row: any) => <span className="font-extrabold text-foreground">Rs. {row.refundAmount.toFixed(2)}</span> },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Date Issued', accessor: 'date' },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row: any) => (
        <Badge variant={row.status === 'Refunded' ? 'success' : 'warning'}>
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
                <BadgeAlert className="h-5 w-5 text-primary" /> Credit Notes (Sales Return)
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Track sales refunds, customer credit allowances, and return adjustments.</p>
            </div>
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="h-9 font-bold self-start sm:self-auto mt-2 sm:mt-0">
              <Plus className="h-4 w-4" /> Issue Credit Note
            </Button>
          </div>

          <DataTable
            title="Credit Notes Log"
            data={creditNotes}
            columns={columns}
            searchKey="noteNo"
            searchPlaceholder="Search credit notes..."
            isLoading={loading}
          />
        </div>

        {/* CREDIT NOTE GENERATOR MODAL */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Issue Credit Note (Sales Return)"
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs select-none">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Note No (Auto)</label>
                <input {...register('noteNo')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                {errors.noteNo && <p className="text-rose-500 text-[10px]">{errors.noteNo.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Invoice Number Reference</label>
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
                <label className="font-bold text-zinc-500">Refund / Credit Amount (Rs.)</label>
                <input type="number" step="0.01" {...register('refundAmount', { valueAsNumber: true })} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                {errors.refundAmount && <p className="text-rose-500 text-[10px]">{errors.refundAmount.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-zinc-500">Reason for Credit / Return Item Details</label>
              <textarea {...register('reason')} className="h-20 w-full rounded border border-border p-3 text-sm focus:outline-none bg-card text-foreground" placeholder="Describe returned goods and reason..." />
              {errors.reason && <p className="text-rose-500 text-[10px]">{errors.reason.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Issue Note</Button>
            </div>
          </form>
        </Modal>

      </PageContainer>
    </AppShell>
  );
}
