'use client';

import React from 'react';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageContainer } from '../../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToastStore } from '../../../../lib/store';

const schema = z.object({
  titleName: z.string().min(3, { message: 'Required field (min 3 chars)' }),
  referenceCode: z.string().min(2, { message: 'Reference key is required' }),
  amountVal: z.number().min(0, { message: 'Amount cannot be negative' }),
  notes: z.string().optional()
});

export default function CreatePage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      titleName: '',
      referenceCode: 'REF-' + Math.floor(100 + Math.random() * 900),
      amountVal: 0,
      notes: ''
    }
  });

  const onSubmit = (data: any) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        addToast('success', 'Form Saved Successfully', `${data.titleName} has been recorded.`);
        router.back();
        resolve();
      }, 800);
    });
  };

  return (
    <AppShell>
      <PageContainer>
        <Card className="max-w-xl mx-auto shadow-md">
          <CardHeader>
            <CardTitle>Create Form Wizard</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs select-none">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Name / Description Header</label>
                <input {...register('titleName')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="Enter title detail..." />
                {errors.titleName && <p className="text-rose-500 text-[10px]">{errors.titleName.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Reference ID</label>
                  <input {...register('referenceCode')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                  {errors.referenceCode && <p className="text-rose-500 text-[10px]">{errors.referenceCode.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Estimated Value (Rs.)</label>
                  <input type="number" step="0.01" {...register('amountVal', { valueAsNumber: true })} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                  {errors.amountVal && <p className="text-rose-500 text-[10px]">{errors.amountVal.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Notes / Internal Comments</label>
                <textarea {...register('notes')} className="h-20 w-full rounded border border-border p-3 text-sm focus:outline-none bg-card text-foreground" placeholder="Add remarks..." />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>Submit Details</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}