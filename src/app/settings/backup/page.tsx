'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToastStore } from '../../../lib/store';
import { 
  Database, Download, RefreshCw, HardDrive, ShieldCheck, 
  Layers, CheckCircle2, Clock, FileArchive, AlertTriangle, Cloud
} from 'lucide-react';

export default function BackupSettingsPage() {
  const { addToast } = useToastStore();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const fetchBackupInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/backup');
      const data = await res.json();
      if (data) {
        setStats(data.databaseStats);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupInfo();
  }, []);

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch('/api/settings/backup', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('success', 'Backup Generated', `Created snapshot ${data.backup.backupId} with ${data.backup.recordsCount} records.`);
        
        // Auto trigger file download
        const blob = new Blob([JSON.stringify(data.backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `POS_ERP_FULL_BACKUP_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        fetchBackupInfo();
      } else {
        addToast('error', 'Backup Failed', data.error || 'Failed to generate database export.');
      }
    } catch {
      addToast('error', 'Network Error', 'Failed to reach database server.');
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none max-w-[1400px] mx-auto pb-12">
          
          {/* Top Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
                  <Database className="h-3.5 w-3.5" />
                  <span>Database Snapshot &amp; Disaster Recovery</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  Backup Database
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Export complete MongoDB schemas, sales histories, ledger books, inventory and customer records into an encrypted offline archive.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchBackupInfo}
                  title="Reload Stats"
                  className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md"
                >
                  <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <Button
                  variant="primary"
                  onClick={handleCreateBackup}
                  disabled={isBackingUp}
                  className="h-11 px-6 rounded-2xl font-bold shadow-lg shadow-indigo-500/25 bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-600 hover:to-cyan-700 text-white cursor-pointer border-0 flex items-center gap-2"
                >
                  <Download className="h-4.5 w-4.5" />
                  <span>{isBackingUp ? 'Generating Snapshot...' : 'Export & Download Backup'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Database Health KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Total Stored Records</span>
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-black font-mono text-foreground mt-1">
                {stats ? stats.totalRecords : '—'}
              </p>
              <p className="text-[11px] text-muted-foreground">Across all MongoDB collections</p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Sales &amp; POS Orders</span>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {stats ? stats.salesCount : '—'}
              </p>
              <p className="text-[11px] text-muted-foreground">Invoices &amp; customer billing entries</p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Inventory &amp; Products</span>
                <HardDrive className="h-4 w-4 text-sky-500" />
              </div>
              <p className="text-3xl font-black font-mono text-sky-600 dark:text-sky-400 mt-1">
                {stats ? stats.productsCount : '—'}
              </p>
              <p className="text-[11px] text-muted-foreground">SKUs &amp; catalogue items</p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Transactions &amp; Accounts</span>
                <Clock className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-3xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1">
                {stats ? (stats.transactionsCount + stats.accountsCount) : '—'}
              </p>
              <p className="text-[11px] text-muted-foreground">Double-entry ledger &amp; audit trails</p>
            </div>
          </div>

          {/* Backup History Table */}
          <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-sm text-foreground">Backup Snapshot History</h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {history.length} snapshots
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-4 px-5">Snapshot ID</th>
                    <th className="py-4 px-5">Timestamp</th>
                    <th className="py-4 px-5">Backup Type</th>
                    <th className="py-4 px-5">Records Saved</th>
                    <th className="py-4 px-5">Archive Size</th>
                    <th className="py-4 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
                          <span className="text-xs font-semibold">Reading Database Statistics...</span>
                        </div>
                      </td>
                    </tr>
                  ) : history.length > 0 ? (
                    history.map((h) => (
                      <tr key={h._id || h.backupId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-foreground">
                          {h.backupId}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[11px] text-muted-foreground">
                          {h.date}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-foreground">
                          {h.type}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-foreground font-bold">
                          {h.recordsCount} items
                        </td>
                        <td className="py-3.5 px-5 font-mono text-muted-foreground">
                          {h.size}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <Badge variant="success" className="text-[10px] py-0.5 px-2 font-semibold">
                            {h.status || 'Success'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Database className="h-10 w-10 text-muted-foreground/30 stroke-1" />
                          <p className="font-bold text-sm text-foreground">No Manual Backups Logged Yet</p>
                          <p className="text-xs text-muted-foreground">Click the button above to generate your first full database archive.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </PageContainer>
    </AppShell>
  );
}