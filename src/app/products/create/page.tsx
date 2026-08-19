'use client';

import React, { useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToastStore } from '../../../lib/store';

const schema = z.object({
  name: z.string().min(3, { message: 'Product Name must be at least 3 characters' }),
  sku: z.string().min(3, { message: 'SKU code is required' }),
  barcode: z.string().min(5, { message: 'Barcode is required' }),
  purchasePrice: z.number().min(0.01, { message: 'Purchase price must be positive' }),
  sellingPrice: z.number().min(0.01, { message: 'Selling price must be positive' }),
  openingStock: z.number().min(0, { message: 'Opening Stock must be 0 or higher' }),
  minStock: z.number().min(0, { message: 'Minimum Stock requirement is required' }),
  status: z.string()
});

export default function CreateProductPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      purchasePrice: 0,
      sellingPrice: 0,
      openingStock: 0,
      minStock: 5,
      status: 'Active'
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('S3 Image Upload failed');
      const data = await res.json();
      setImageUrl(data.url);
      addToast('success', 'Image Uploaded', 'Product image successfully uploaded to AWS S3.');
    } catch (err: any) {
      console.error('Upload Error:', err);
      addToast('error', 'Upload Failed', err.message || 'Could not upload to S3.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    const productPayload = {
      ...data,
      categoryId: 'cat-1',
      unitId: 'un-1',
      image: imageUrl
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit product');
      }

      addToast('success', 'Product Created', `${data.name} saved to MongoDB.`);
      router.push('/products');
    } catch (error: any) {
      console.error('Submit Error:', error);
      addToast('error', 'Error Saving Product', error.message || 'Could not record product to MongoDB.');
    }
  };

  return (
    <AppShell>
      <PageContainer>
        <Card className="max-w-2xl mx-auto shadow-md">
          <CardHeader>
            <CardTitle>Add New Product (Live S3 + MongoDB)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs select-none">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Product Name</label>
                  <input {...register('name')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                  {errors.name && <p className="text-rose-500 text-[10px]">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">SKU</label>
                  <input {...register('sku')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                  {errors.sku && <p className="text-rose-500 text-[10px]">{errors.sku.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Barcode</label>
                  <input {...register('barcode')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                  {errors.barcode && <p className="text-rose-500 text-[10px]">{errors.barcode.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Status</label>
                  <select {...register('status')} className="h-9 w-full rounded border border-border px-2 text-sm focus:outline-none bg-card text-foreground">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Purchase Price (Rs.)</label>
                  <input type="number" step="0.01" {...register('purchasePrice', { valueAsNumber: true })} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                  {errors.purchasePrice && <p className="text-rose-500 text-[10px]">{errors.purchasePrice.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Selling Price (Rs.)</label>
                  <input type="number" step="0.01" {...register('sellingPrice', { valueAsNumber: true })} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                  {errors.sellingPrice && <p className="text-rose-500 text-[10px]">{errors.sellingPrice.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Opening Stock</label>
                  <input type="number" {...register('openingStock', { valueAsNumber: true })} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                  {errors.openingStock && <p className="text-rose-500 text-[10px]">{errors.openingStock.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Min Alert Stock</label>
                  <input type="number" {...register('minStock', { valueAsNumber: true })} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                  {errors.minStock && <p className="text-rose-500 text-[10px]">{errors.minStock.message}</p>}
                </div>
              </div>

              {/* AWS S3 Image Uploader Field */}
              <div className="space-y-1.5 border-t border-border/40 pt-4">
                <label className="font-bold text-zinc-500">Product Image (AWS S3 Upload)</label>
                <div className="flex items-center gap-3 mt-1">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="h-10 w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer bg-card rounded border border-border p-1" 
                  />
                  {uploading && <span className="text-[10px] text-zinc-500 animate-pulse font-bold">Uploading...</span>}
                </div>
                {imageUrl && (
                  <div className="mt-2 h-16 w-16 rounded-lg border border-border overflow-hidden bg-muted shadow-sm">
                    <img src={imageUrl} alt="S3 Upload Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" onClick={() => router.push('/products')}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>Save Product</Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}