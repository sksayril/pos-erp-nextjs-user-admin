'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToastStore } from '../../../lib/store';

export default function WarehouseSettingsPage() {
  const { addToast } = useToastStore();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Settings Saved', 'Warehouse configs successfully updated.');
  };

  return (
    <AppShell>
      <PageContainer>
        <Card className="max-w-2xl mx-auto shadow-sm">
          <CardHeader>
            <CardTitle>Warehouse Settings Configuration</CardTitle>
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
}