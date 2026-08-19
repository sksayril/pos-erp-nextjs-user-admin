'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { mockBrands } from '../../../lib/mockData';

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
}