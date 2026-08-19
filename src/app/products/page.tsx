'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { mockProducts } from '../../lib/mockData';
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
      render: (row: any) => <span>Rs. ${row.purchasePrice.toFixed(2)}</span>
    },
    { 
      header: 'Selling Price', 
      accessor: 'sellingPrice',
      render: (row: any) => <span>Rs. ${row.sellingPrice.toFixed(2)}</span>
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
          onView={(row: any) => router.push(`/products/${row.id || row._id}`)}
          onEdit={(row: any) => router.push(`/products/${row.id || row._id}/edit`)}
          onDelete={(row: any) => alert('Delete triggered for item ' + row.sku)}
        />
      </PageContainer>
    </AppShell>
  );
}