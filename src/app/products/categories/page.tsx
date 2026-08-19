'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { mockCategories } from '../../../lib/mockData';

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
}