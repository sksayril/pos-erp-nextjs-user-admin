const fs = require('fs');
const path = require('path');

const srcAppDir = path.join(__dirname, '..', 'src', 'app');

const routes = [
  // POS
  { path: 'pos/held', type: 'pos-held' },
  { path: 'pos/history', type: 'pos-history' },
  { path: 'pos/closing', type: 'pos-closing' },

  // Products
  { path: 'products', type: 'products-list' },
  { path: 'products/create', type: 'products-create' },
  { path: 'products/[id]', type: 'products-view' },
  { path: 'products/[id]/edit', type: 'products-edit' },
  { path: 'products/categories', type: 'products-categories' },
  { path: 'products/brands', type: 'products-brands' },
  { path: 'products/units', type: 'products-units' },
  { path: 'products/variants', type: 'products-variants' },
  { path: 'products/prices', type: 'products-prices' },
  { path: 'products/barcode', type: 'products-barcode' },
  { path: 'products/batches', type: 'products-batches' },
  { path: 'products/stock', type: 'products-stock' },
  { path: 'products/adjustment', type: 'products-adjustment' },

  // Purchases
  { path: 'purchases', type: 'purchases-list' },
  { path: 'purchases/create', type: 'purchases-create' },
  { path: 'purchases/[id]', type: 'purchases-view' },
  { path: 'purchases/orders', type: 'purchases-orders' },
  { path: 'purchases/payments', type: 'purchases-payments' },
  { path: 'purchases/history', type: 'purchases-history' },

  // Sales
  { path: 'sales', type: 'sales-list' },
  { path: 'sales/create', type: 'sales-create' },
  { path: 'sales/[id]', type: 'sales-view' },
  { path: 'sales/invoices', type: 'sales-invoices' },
  { path: 'sales/payments', type: 'sales-payments' },
  { path: 'sales/history', type: 'sales-history' },

  // Returns
  { path: 'returns/sales', type: 'returns-sales' },
  { path: 'returns/purchases', type: 'returns-purchases' },
  { path: 'returns/history', type: 'returns-history' },

  // Quotations
  { path: 'quotations', type: 'quotations-list' },
  { path: 'quotations/create', type: 'quotations-create' },
  { path: 'quotations/[id]', type: 'quotations-view' },
  { path: 'quotations/history', type: 'quotations-history' },

  // Transfers & Warehouses
  { path: 'transfers', type: 'transfers-list' },
  { path: 'transfers/create', type: 'transfers-create' },
  { path: 'transfers/[id]', type: 'transfers-view' },
  { path: 'transfers/history', type: 'transfers-history' },
  { path: 'warehouses', type: 'warehouses' },

  // Expenses
  { path: 'expenses', type: 'expenses-list' },
  { path: 'expenses/create', type: 'expenses-create' },
  { path: 'expenses/categories', type: 'expenses-categories' },
  { path: 'expenses/history', type: 'expenses-history' },

  // Accounting
  { path: 'accounting/accounts', type: 'accounting-accounts' },
  { path: 'accounting/cash', type: 'accounting-cash' },
  { path: 'accounting/bank', type: 'accounting-bank' },
  { path: 'accounting/receivables', type: 'accounting-receivables' },
  { path: 'accounting/payables', type: 'accounting-payables' },
  { path: 'accounting/ledger', type: 'accounting-ledger' },
  { path: 'accounting/journal', type: 'accounting-journal' },
  { path: 'accounting/payments', type: 'accounting-payments' },
  { path: 'accounting/day-book', type: 'accounting-daybook' },

  // HRM
  { path: 'hrm/employees', type: 'hrm-employees' },
  { path: 'hrm/employees/create', type: 'hrm-employees-create' },
  { path: 'hrm/employees/[id]', type: 'hrm-employees-view' },
  { path: 'hrm/attendance', type: 'hrm-attendance' },
  { path: 'hrm/salary', type: 'hrm-salary' },
  { path: 'hrm/leave', type: 'hrm-leave' },
  { path: 'hrm/departments', type: 'hrm-departments' },

  // People
  { path: 'people/customers', type: 'people-customers' },
  { path: 'people/customers/create', type: 'people-customers-create' },
  { path: 'people/customers/[id]', type: 'people-customers-view' },
  { path: 'people/suppliers', type: 'people-suppliers' },
  { path: 'people/suppliers/create', type: 'people-suppliers-create' },
  { path: 'people/suppliers/[id]', type: 'people-suppliers-view' },
  { path: 'people/users', type: 'people-users' },

  // Reports
  { path: 'reports/sales', type: 'reports-sales' },
  { path: 'reports/purchases', type: 'reports-purchases' },
  { path: 'reports/profit-loss', type: 'reports-profitloss' },
  { path: 'reports/stock', type: 'reports-stock' },
  { path: 'reports/tax', type: 'reports-tax' },
  { path: 'reports/expenses', type: 'reports-expenses' },
  { path: 'reports/customers', type: 'reports-customers' },
  { path: 'reports/suppliers', type: 'reports-suppliers' },
  { path: 'reports/payments', type: 'reports-payments' },
  { path: 'reports/products', type: 'reports-products' },

  // Settings
  { path: 'settings/business', type: 'settings-business' },
  { path: 'settings/invoice', type: 'settings-invoice' },
  { path: 'settings/tax', type: 'settings-tax' },
  { path: 'settings/payment-methods', type: 'settings-paymentmethods' },
  { path: 'settings/users', type: 'settings-users' },
  { path: 'settings/roles', type: 'settings-roles' },
  { path: 'settings/permissions', type: 'settings-permissions' },
  { path: 'settings/warehouse', type: 'settings-warehouse' },
  { path: 'settings/printer', type: 'settings-printer' },
  { path: 'settings/backup', type: 'settings-backup' },
  { path: 'settings/system', type: 'settings-system' },

  // Distributor users & Documentation
  { path: 'distributor-users', type: 'distributor-users' },
  { path: 'documentation', type: 'documentation' }
];

function getTemplateCode(route) {
  const segmentsCount = route.path.split('/').length;
  const upDir = '../'.repeat(segmentsCount + 1); // Dynamically calculates prefix back to src/

  const title = route.path
    .split('/')
    .pop()
    .replace(/-/g, ' ')
    .replace(/\[\w+\]/g, 'Details')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Check prefix groupings for route-type bindings
  if (route.path.endsWith('/create') || route.path.endsWith('/edit') || route.path.endsWith('/adjustment')) {
    const isProductCreate = route.type === 'products-create';
    
    if (isProductCreate) {
      return `'use client';

import React, { useState } from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '${upDir}components/ui/Card';
import { Button } from '${upDir}components/ui/Button';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToastStore } from '${upDir}lib/store';

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

      addToast('success', 'Product Created', \`\${data.name} saved to MongoDB.\`);
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
}`;
    }

    return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '${upDir}components/ui/Card';
import { Button } from '${upDir}components/ui/Button';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToastStore } from '${upDir}lib/store';

const schema = z.object({
  titleName: z.string().min(3, { message: 'Required field (min 3 chars)' }),
  referenceCode: z.string().min(2, { message: 'Reference key is required' }),
  amountVal: z.number().min(0, { message: 'Amount cannot be negative' }),
  notes: z.string().optional()
});

export default function ${title.replace(/\s+/g, '')}Page() {
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
        addToast('success', 'Form Saved Successfully', \`\${data.titleName} has been recorded.\`);
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
            <CardTitle>${title} Form Wizard</CardTitle>
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
}`;
  }

  if (route.path.startsWith('settings/')) {
    return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '${upDir}components/ui/Card';
import { Button } from '${upDir}components/ui/Button';
import { useToastStore } from '${upDir}lib/store';

export default function ${title.replace(/\s+/g, '')}SettingsPage() {
  const { addToast } = useToastStore();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Settings Saved', '${title} configs successfully updated.');
  };

  return (
    <AppShell>
      <PageContainer>
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardHeader>
            <CardTitle>${title} Settings Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4 text-xs select-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Option Param 01</label>
                  <input className="h-9 w-full rounded border border-border px-3 text-sm bg-card text-foreground" defaultValue="Default Value A" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Option Param 02</label>
                  <input className="h-9 w-full rounded border border-border px-3 text-sm bg-card text-foreground" defaultValue="Default Value B" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">System Status Override</label>
                <select className="h-9 w-full rounded border border-border px-2 text-sm bg-card text-foreground">
                  <option>Enabled / Active</option>
                  <option>Disabled / Maintenance</option>
                </select>
              </div>

              <div className="flex justify-end pt-4 border-t border-border/50">
                <Button type="submit" variant="primary">Save Configs</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}`;
  }

  if (route.path.startsWith('reports/')) {
    return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { Card, CardContent } from '${upDir}components/ui/Card';
import { DataTable } from '${upDir}components/ui/DataTable';
import { mockSales } from '${upDir}lib/mockData';

export default function ${title.replace(/\s+/g, '')}ReportPage() {
  const columns = [
    { header: 'Reference', accessor: 'invoiceNumber', sortable: true },
    { header: 'Party / Client', accessor: 'customerName', sortable: true },
    { header: 'Transaction Date', accessor: 'date' },
    { header: 'Amount (Rs.)', accessor: 'grandTotal', render: (row: any) => <span className="font-bold">Rs. \${row.grandTotal.toFixed(2)}</span> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
          <Card className="p-4 bg-primary/5 border-primary/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Report Summary Total</span>
            <h3 className="text-xl font-extrabold text-primary mt-1">Rs. 45,230.12</h3>
          </Card>
          <Card className="p-4 bg-success/5 border-success/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Paid Volume</span>
            <h3 className="text-xl font-extrabold text-success mt-1">Rs. 43,980.12</h3>
          </Card>
          <Card className="p-4 bg-orange/5 border-orange/20">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Due Balance</span>
            <h3 className="text-xl font-extrabold text-orange-500 mt-1">Rs. 1,250.00</h3>
          </Card>
        </div>
        <DataTable
          title="${title} Audit Trail"
          data={mockSales}
          columns={columns}
          searchKey="customerName"
          searchPlaceholder="Search audit trails..."
        />
      </PageContainer>
    </AppShell>
  );
}`;
  }

  switch (route.type) {
    case 'products-list':
      return `'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { Badge } from '${upDir}components/ui/Badge';
import { Button } from '${upDir}components/ui/Button';
import { mockProducts } from '${upDir}lib/mockData';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export default function ProductsListPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>(mockProducts);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch((err) => console.error('Error fetching live products:', err));
  }, []);

  const columns = [
    { 
      header: 'Product Image', 
      accessor: 'image',
      render: (row: any) => (
        row.image ? (
          <div className="h-10 w-10 rounded border border-border overflow-hidden bg-muted">
            <img src={row.image} alt={row.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-10 w-10 rounded border border-border bg-muted flex items-center justify-center text-muted-foreground text-[10px]">
            No Img
          </div>
        )
      )
    },
    { header: 'Product Name', accessor: 'name', sortable: true },
    { header: 'SKU', accessor: 'sku', sortable: true },
    { header: 'Barcode', accessor: 'barcode' },
    { 
      header: 'Purchase Price', 
      accessor: 'purchasePrice',
      render: (row: any) => <span>Rs. \${row.purchasePrice.toFixed(2)}</span>
    },
    { 
      header: 'Selling Price', 
      accessor: 'sellingPrice',
      render: (row: any) => <span>Rs. \${row.sellingPrice.toFixed(2)}</span>
    },
    { 
      header: 'Stock Qty', 
      accessor: 'openingStock',
      render: (row: any) => {
        const isLow = row.openingStock <= row.minStock;
        return <span className={isLow ? "text-rose-600 font-extrabold" : "font-bold text-foreground"}>{row.openingStock}</span>;
      }
    },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'destructive'}>{row.status}</Badge>
    }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Products Catalog"
          data={products}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search product by name..."
          headerActions={
            <Button variant="primary" onClick={() => router.push('/products/create')} className="h-9 font-bold">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          }
          onView={(row: any) => router.push(\`/products/\${row.id || row._id}\`)}
          onEdit={(row: any) => router.push(\`/products/\${row.id || row._id}/edit\`)}
          onDelete={(row: any) => alert('Delete triggered for item ' + row.sku)}
        />
      </PageContainer>
    </AppShell>
  );
}`;

    case 'purchases-list':
      return `'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { Badge } from '${upDir}components/ui/Badge';
import { Button } from '${upDir}components/ui/Button';
import { mockPurchases } from '${upDir}lib/mockData';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export default function PurchasesListPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<any[]>(mockPurchases);

  useEffect(() => {
    fetch('/api/purchases')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPurchases(data);
        }
      })
      .catch((err) => console.error('Error fetching purchases:', err));
  }, []);

  const columns = [
    { header: 'Purchase No', accessor: 'purchaseNumber', sortable: true },
    { header: 'Supplier Name', accessor: 'supplierName', sortable: true },
    { header: 'Order Date', accessor: 'date' },
    { 
      header: 'Total Cost', 
      accessor: 'grandTotal',
      render: (row: any) => <span className="font-bold text-foreground">Rs. \${row.grandTotal.toFixed(2)}</span>
    },
    { 
      header: 'Paid Amount', 
      accessor: 'paidAmount',
      render: (row: any) => <span>Rs. \${row.paidAmount.toFixed(2)}</span>
    },
    { 
      header: 'Due Amount', 
      accessor: 'dueAmount',
      render: (row: any) => <span className={row.dueAmount > 0 ? "text-orange-500 font-semibold" : "text-success"}>Rs. \${row.dueAmount.toFixed(2)}</span>
    },
    { 
      header: 'Payment Status', 
      accessor: 'paymentStatus',
      render: (row: any) => <Badge variant={row.paymentStatus === 'Paid' ? 'success' : 'warning'}>{row.paymentStatus}</Badge>
    }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Stock Purchases"
          data={purchases}
          columns={columns}
          searchKey="purchaseNumber"
          searchPlaceholder="Search by purchase number..."
          headerActions={
            <Button variant="primary" onClick={() => router.push('/purchases/create')} className="h-9 font-bold">
              <Plus className="h-4 w-4" /> Add Purchase
            </Button>
          }
          onView={(row: any) => router.push(\`/purchases/\${row.id || row._id}\`)}
          onEdit={(row: any) => router.push(\`/purchases/\${row.id || row._id}/edit\`)}
        />
      </PageContainer>
    </AppShell>
  );
}`;

    case 'sales-list':
      return `'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { Badge } from '${upDir}components/ui/Badge';
import { Button } from '${upDir}components/ui/Button';
import { mockSales } from '${upDir}lib/mockData';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export default function SalesListPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>(mockSales);

  useEffect(() => {
    fetch('/api/sales')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSales(data);
        }
      })
      .catch((err) => console.error('Error fetching sales:', err));
  }, []);

  const columns = [
    { header: 'Invoice Number', accessor: 'invoiceNumber', sortable: true },
    { header: 'Customer', accessor: 'customerName', sortable: true },
    { header: 'Sale Date', accessor: 'date' },
    { 
      header: 'Grand Total', 
      accessor: 'grandTotal',
      render: (row: any) => <span className="font-extrabold text-foreground">Rs. \${row.grandTotal.toFixed(2)}</span>
    },
    { 
      header: 'Paid', 
      accessor: 'paidAmount',
      render: (row: any) => <span>Rs. \${row.paidAmount.toFixed(2)}</span>
    },
    { 
      header: 'Due', 
      accessor: 'dueAmount',
      render: (row: any) => <span className={row.dueAmount > 0 ? "text-orange-500 font-semibold" : "text-success"}>Rs. \${row.dueAmount.toFixed(2)}</span>
    },
    { 
      header: 'Payment Status', 
      accessor: 'paymentStatus',
      render: (row: any) => <Badge variant={row.paymentStatus === 'Paid' ? 'success' : 'warning'}>{row.paymentStatus}</Badge>
    }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Sales History"
          data={sales}
          columns={columns}
          searchKey="invoiceNumber"
          searchPlaceholder="Search by invoice number..."
          headerActions={
            <Button variant="primary" onClick={() => router.push('/sales/create')} className="h-9 font-bold">
              <Plus className="h-4 w-4" /> Create Sale
            </Button>
          }
          onView={(row: any) => router.push(\`/sales/\${row.id || row._id}\`)}
          onEdit={(row: any) => router.push(\`/sales/\${row.id || row._id}/edit\`)}
        />
      </PageContainer>
    </AppShell>
  );
}`;

    case 'people-customers':
      return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { Badge } from '${upDir}components/ui/Badge';
import { mockCustomers } from '${upDir}lib/mockData';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
  const router = useRouter();

  const columns = [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Phone Number', accessor: 'phone' },
    { header: 'Credit Limit', accessor: 'creditLimit', render: (row: any) => <span>Rs. \${row.creditLimit.toFixed(2)}</span> },
    { header: 'Balance Receivable', accessor: 'outstandingBalance', render: (row: any) => <span className="font-bold text-red-500">Rs. \${row.outstandingBalance.toFixed(2)}</span> },
    { header: 'Status', accessor: 'status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'destructive'}>{row.status}</Badge> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Customers Registry"
          data={mockCustomers}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search customers by name..."
        />
      </PageContainer>
    </AppShell>
  );
}`;

    case 'people-suppliers':
      return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { Badge } from '${upDir}components/ui/Badge';
import { mockSuppliers } from '${upDir}lib/mockData';

export default function SuppliersPage() {
  const columns = [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Phone Number', accessor: 'phone' },
    { header: 'Balance Payable', accessor: 'outstandingPayable', render: (row: any) => <span className="font-bold text-orange-500">Rs. \${row.outstandingPayable.toFixed(2)}</span> },
    { header: 'Status', accessor: 'status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'destructive'}>{row.status}</Badge> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Suppliers Directory"
          data={mockSuppliers}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search suppliers..."
        />
      </PageContainer>
    </AppShell>
  );
}`;

    case 'hrm-employees':
      return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { Badge } from '${upDir}components/ui/Badge';
import { mockEmployees } from '${upDir}lib/mockData';

export default function EmployeesPage() {
  const columns = [
    { header: 'Employee ID', accessor: 'employeeId', sortable: true },
    { header: 'Full Name', accessor: 'name', sortable: true },
    { header: 'Department', accessor: 'department', sortable: true },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Monthly Salary', accessor: 'salary', render: (row: any) => <span>Rs. \${row.salary.toLocaleString()}</span> },
    { header: 'Status', accessor: 'status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'destructive'}>{row.status}</Badge> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Employee HRM Board"
          data={mockEmployees}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search employees by name..."
        />
      </PageContainer>
    </AppShell>
  );
}`;

    case 'products-categories':
      return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { mockCategories } from '${upDir}lib/mockData';

export default function CategoriesPage() {
  const columns = [
    { header: 'Category Name', accessor: 'name', sortable: true },
    { header: 'Category Code', accessor: 'code', sortable: true },
    { header: 'Registered Products Count', accessor: 'productCount' }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Product Categories"
          data={mockCategories}
          columns={columns}
          searchKey="name"
        />
      </PageContainer>
    </AppShell>
  );
}`;

    case 'products-brands':
      return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { mockBrands } from '${upDir}lib/mockData';

export default function BrandsPage() {
  const columns = [
    { header: 'Brand Name', accessor: 'name', sortable: true },
    { header: 'Brand Code', accessor: 'code', sortable: true }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Manufacturer Brands"
          data={mockBrands}
          columns={columns}
          searchKey="name"
        />
      </PageContainer>
    </AppShell>
  );
}`;

    case 'products-units':
      return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { mockUnits } from '${upDir}lib/mockData';

export default function UnitsPage() {
  const columns = [
    { header: 'Unit Name', accessor: 'name', sortable: true },
    { header: 'Symbol / Short Name', accessor: 'shortName', sortable: true },
    { header: 'Base Equivalent', accessor: 'baseUnit', render: (row: any) => <span>{row.baseUnit || 'Base Unit'}</span> },
    { header: 'Multiplier Operator', accessor: 'operator', render: (row: any) => <span>{row.operator || '1'}</span> },
    { header: 'Ratio Value', accessor: 'operationValue', render: (row: any) => <span>{row.operationValue || '1'}</span> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Inventory Units of Measure"
          data={mockUnits}
          columns={columns}
          searchKey="name"
        />
      </PageContainer>
    </AppShell>
  );
}`;

    case 'warehouses':
      return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { Badge } from '${upDir}components/ui/Badge';
import { mockWarehouses } from '${upDir}lib/mockData';

export default function WarehousesPage() {
  const columns = [
    { header: 'Warehouse Name', accessor: 'name', sortable: true },
    { header: 'Branch Code', accessor: 'code', sortable: true },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Status', accessor: 'status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'destructive'}>{row.status}</Badge> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Warehouse Storage Sites"
          data={mockWarehouses}
          columns={columns}
          searchKey="name"
        />
      </PageContainer>
    </AppShell>
  );
}`;

    case 'accounting-accounts':
      return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { Badge } from '${upDir}components/ui/Badge';
import { mockAccounts } from '${upDir}lib/mockData';

export default function AccountsPage() {
  const columns = [
    { header: 'Account Title', accessor: 'name', sortable: true },
    { header: 'Classification Type', accessor: 'type', sortable: true },
    { header: 'Opening Balance', accessor: 'openingBalance', render: (row: any) => <span>Rs. \${row.openingBalance.toFixed(2)}</span> },
    { header: 'Current Balance', accessor: 'currentBalance', render: (row: any) => <span className="font-bold text-primary">Rs. \${row.currentBalance.toFixed(2)}</span> },
    { header: 'Status', accessor: 'status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'destructive'}>{row.status}</Badge> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Chart of Accounts Ledger"
          data={mockAccounts}
          columns={columns}
          searchKey="name"
        />
      </PageContainer>
    </AppShell>
  );
}`;

    case 'expenses-list':
      return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { mockExpenses } from '${upDir}lib/mockData';

export default function ExpensesListPage() {
  const columns = [
    { header: 'Expense Category', accessor: 'category', sortable: true },
    { header: 'Paid Amount', accessor: 'amount', sortable: true, render: (row: any) => <span className="font-bold text-rose-500">Rs. \${row.amount.toFixed(2)}</span> },
    { header: 'Billing Date', accessor: 'date' },
    { header: 'Payment Method', accessor: 'paymentMethod' },
    { header: 'Description', accessor: 'description' }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Operating Expenses Ledger"
          data={mockExpenses}
          columns={columns}
          searchKey="category"
        />
      </PageContainer>
    </AppShell>
  );
}`;

    case 'products-barcode':
      return `'use client';

import React, { useState } from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '${upDir}components/ui/Card';
import { Button } from '${upDir}components/ui/Button';

export default function BarcodePage() {
  const [barcodeText, setBarcodeText] = useState('978020137962');

  return (
    <AppShell>
      <PageContainer>
        <Card className="max-w-md mx-auto shadow-sm select-none">
          <CardHeader>
            <CardTitle>SKU Barcode Label Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="space-y-1 w-full text-xs">
              <label className="font-bold text-zinc-500">Type Barcode Value / SKU</label>
              <input
                type="text"
                value={barcodeText}
                onChange={(e) => setBarcodeText(e.target.value)}
                className="h-10 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground"
              />
            </div>
            
            {/* Mock SVG Barcode Canvas */}
            <div className="border border-border/80 p-6 bg-white rounded-lg flex flex-col items-center space-y-2">
              <div className="h-14 w-60 bg-zinc-950 flex gap-1 px-3 py-1 items-stretch">
                {[...Array(30)].map((_, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white flex-1" 
                    style={{ 
                      opacity: (idx % 2 === 0 && idx % 3 !== 0) ? 0 : 1,
                      width: (idx % 4 === 0) ? '3px' : '1px' 
                    }} 
                  />
                ))}
              </div>
              <span className="text-xs font-mono font-bold tracking-widest text-zinc-900">{barcodeText}</span>
            </div>

            <Button onClick={() => window.print()} className="w-full">
              Print Barcode Sticker Labels
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}`;

    case 'documentation':
      return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '${upDir}components/ui/Card';

export default function DocumentationPage() {
  return (
    <AppShell>
      <PageContainer>
        <Card className="max-w-3xl mx-auto shadow-md">
          <CardHeader>
            <CardTitle>POS ERP Documentation Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 select-none">
            <h3 className="font-bold text-foreground text-base">Getting Started</h3>
            <p>
              Welcome to the POS ERP frontend application! This system manages your point of sale registers,
              product catalog inventories, supplier orders, cash ledgers, accounting journals, and employee HRM attendances.
            </p>
            <h4 className="font-bold text-foreground text-sm mt-3">Simulation Capabilities</h4>
            <p>
              Use the top-right cashier avatar icon dropdown menu to switch roles. Different options let you view
              how screens present based on cashier vs super admin permissions.
            </p>
            <h4 className="font-bold text-foreground text-sm mt-3">POS Workflows</h4>
            <p>
              Head over to <strong>POS Billing</strong>. Add products, configure discount rates, scan simulated barcodes
              using the top panel scanner input, and trigger checkout modals.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}`;

    default:
      // General fall-back matching list databases using mockSales as secondary mock trail
      return `'use client';

import React from 'react';
import { AppShell } from '${upDir}components/layout/AppShell';
import { PageContainer } from '${upDir}components/layout/PageContainer';
import { DataTable } from '${upDir}components/ui/DataTable';
import { mockSales } from '${upDir}lib/mockData';

export default function ${title.replace(/\s+/g, '')}Page() {
  const columns = [
    { header: 'Reference', accessor: 'invoiceNumber', sortable: true },
    { header: 'Registered Name', accessor: 'customerName', sortable: true },
    { header: 'Date Created', accessor: 'date' },
    { header: 'Total Value (Rs.)', accessor: 'grandTotal', render: (row: any) => <span>Rs. \${row.grandTotal.toFixed(2)}</span> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="${title} Module"
          data={mockSales}
          columns={columns}
          searchKey="customerName"
          searchPlaceholder="Search listings..."
        />
      </PageContainer>
    </AppShell>
  );
}`;
  }
}

routes.forEach((route) => {
  const routeDir = path.join(srcAppDir, ...route.path.split('/'));
  
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }

  const pageFile = path.join(routeDir, 'page.tsx');
  const code = getTemplateCode(route);
  
  fs.writeFileSync(pageFile, code, 'utf-8');
});

console.log('All 80+ POS ERP routes generated with custom layouts, mock datasets, and react form hooks successfully.');
