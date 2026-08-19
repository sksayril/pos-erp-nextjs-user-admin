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

const debitSchema = z.object({
  noteNo: z.string().min(5, { message: 'Debit Note No is required' }),
  purchaseNo: z.string().min(5, { message: 'Purchase number is required' }),
  supplierName: z.string().min(3, { message: 'Supplier name is required' }),
  debitAmount: z.number().min(1, { message: 'Debit amount must be positive' }),
  reason: z.string().min(5, { message: 'Reason is required' })
});

export default function DebitNotesPage() {
  const { addToast } = useToastStore();
  const [debitNotes, setDebitNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(debitSchema),
    defaultValues: {
      noteNo: 'DN-2026-' + Math.floor(1000 + Math.random() * 9000),
      purchaseNo: 'PUR-2026-',
      supplierName: '',
      debitAmount: 0,
      reason: ''
    }
  });

  const loadNotes = () => {
    setLoading(true);
    fetch('/api/credit-debit-notes')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.debitNotes)) {
          setDebitNotes(data.debitNotes);
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
        type: 'debit',
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
        throw new Error(errData.error || 'Failed to issue debit note');
      }

      addToast('success', 'Debit Note Issued', `Debit Note ${data.noteNo} successfully saved to MongoDB.`);
      setIsModalOpen(false);
      reset({
        noteNo: 'DN-2026-' + Math.floor(1000 + Math.random() * 9000),
        purchaseNo: 'PUR-2026-',
        supplierName: '',
        debitAmount: 0,
        reason: ''
      });
      loadNotes();
    } catch (err: any) {
      addToast('error', 'Debit Note Generation Failed', err.message);
    }
  };

  const columns = [
    { header: 'Note Number', accessor: 'noteNo', sortable: true },
    { header: 'Purchase Reference', accessor: 'purchaseNo', sortable: true },
    { header: 'Supplier Name', accessor: 'supplierName', sortable: true },
    { header: 'Debit Amount (Rs.)', accessor: 'debitAmount', render: (row: any) => <span className="font-extrabold text-foreground">Rs. {row.debitAmount.toFixed(2)}</span> },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Date Issued', accessor: 'date' },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row: any) => (
        <Badge variant={row.status === 'Adjusted' ? 'success' : 'warning'}>
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
                <BadgeAlert className="h-5 w-5 text-primary" /> Debit Notes (Purchase Return)
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage supplier purchase claims, damaged cargo return notes, and discount refunds.</p>
            </div>
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="h-9 font-bold self-start sm:self-auto mt-2 sm:mt-0">
              <Plus className="h-4 w-4" /> Issue Debit Note
            </Button>
          </div>

          <DataTable
            title="Debit Notes Log"
            data={debitNotes}
            columns={columns}
            searchKey="noteNo"
            searchPlaceholder="Search debit notes..."
          />
        </div>

        {/* DEBIT NOTE GENERATOR MODAL */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Issue Debit Note (Purchase Return)"
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
                <label className="font-bold text-zinc-500">Purchase Reference Number</label>
                <input {...register('purchaseNo')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="PUR-2026-XXXX" />
                {errors.purchaseNo && <p className="text-rose-500 text-[10px]">{errors.purchaseNo.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Supplier Name</label>
                <input {...register('supplierName')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="Supplier detail..." />
                {errors.supplierName && <p className="text-rose-500 text-[10px]">{errors.supplierName.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Debit / Claims Amount (Rs.)</label>
                <input type="number" step="0.01" {...register('debitAmount', { valueAsNumber: true })} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                {errors.debitAmount && <p className="text-rose-500 text-[10px]">{errors.debitAmount.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-zinc-500">Reason for Claim / Damaged Goods Details</label>
              <textarea {...register('reason')} className="h-20 w-full rounded border border-border p-3 text-sm focus:outline-none bg-card text-foreground" placeholder="Describe goods discrepancy..." />
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
