'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { usePermissionStore, RolePermissions } from '../../../lib/store';
import { useToastStore } from '../../../lib/store';
import {
  Shield, Check, X, Save, RotateCcw, Info,
  LayoutDashboard, ShoppingCart, Package, ShoppingBag,
  CreditCard, Wallet, FileText, ArrowLeftRight, BarChart3,
  Settings, Users, CalendarDays, UsersRound, Building2, FileQuestion,
  ChevronDown, ChevronUp, Crown
} from 'lucide-react';

const ALL_ROLES = [
  'Admin', 'Manager', 'Cashier', 'Accountant',
  'Purchase Manager', 'Sales Manager', 'HR Manager',
  'Warehouse Manager', 'Distributor'
];

interface ModuleMeta {
  key: keyof RolePermissions;
  label: string;
  icon: React.ElementType;
  description: string;
  category: string;
}

const MODULES: ModuleMeta[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'View KPI metrics, charts, and business overview.', category: 'Core' },
  { key: 'pos', label: 'POS Terminal', icon: ShoppingCart, description: 'Access point-of-sale terminal for billing customers.', category: 'Core' },
  { key: 'products', label: 'Products', icon: Package, description: 'Manage products, categories, brands, stock & variants.', category: 'Inventory' },
  { key: 'purchases', label: 'Purchases', icon: ShoppingBag, description: 'Create and manage purchase orders & supplier payments.', category: 'Operations' },
  { key: 'sales', label: 'Sales', icon: CreditCard, description: 'Create and track invoices, payments, and sales history.', category: 'Operations' },
  { key: 'expenses', label: 'Expenses', icon: Wallet, description: 'Log and manage business expenses and categories.', category: 'Finance' },
  { key: 'quotations', label: 'Quotations', icon: FileText, description: 'Create and manage customer price quotations.', category: 'Operations' },
  { key: 'transfers', label: 'Transfers', icon: ArrowLeftRight, description: 'Transfer stock between warehouses.', category: 'Inventory' },
  { key: 'returns', label: 'Returns', icon: ArrowLeftRight, description: 'Process sales and purchase returns & credit/debit notes.', category: 'Operations' },
  { key: 'accounting', label: 'Accounting', icon: Wallet, description: 'Manage accounts, ledgers, journals and payments.', category: 'Finance' },
  { key: 'hrm', label: 'HRM', icon: CalendarDays, description: 'Employee management, attendance, payroll, leaves.', category: 'HR' },
  { key: 'people', label: 'People', icon: UsersRound, description: 'Manage customers and suppliers.', category: 'Core' },
  { key: 'reports', label: 'Reports', icon: BarChart3, description: 'Access all business analytics and reports.', category: 'Analytics' },
  { key: 'settings', label: 'Settings', icon: Settings, description: 'Configure system settings and preferences.', category: 'Admin' },
  { key: 'users', label: 'User Management', icon: Users, description: 'Manage system users, roles, and permissions.', category: 'Admin' },
  { key: 'distributorUsers', label: 'Distributor Users', icon: Building2, description: 'Access distributor user management panel.', category: 'Admin' },
  { key: 'documentation', label: 'Documentation', icon: FileQuestion, description: 'View system documentation and help guides.', category: 'Core' },
];

const CATEGORIES = ['Core', 'Inventory', 'Operations', 'Finance', 'HR', 'Analytics', 'Admin'];

const roleGradients: Record<string, string> = {
  'Admin': 'from-blue-500 to-blue-700',
  'Manager': 'from-indigo-500 to-indigo-700',
  'Cashier': 'from-emerald-500 to-green-600',
  'Accountant': 'from-amber-500 to-yellow-600',
  'Purchase Manager': 'from-orange-500 to-orange-700',
  'Sales Manager': 'from-cyan-500 to-sky-600',
  'HR Manager': 'from-rose-500 to-pink-600',
  'Warehouse Manager': 'from-teal-500 to-teal-700',
  'Distributor': 'from-slate-500 to-slate-700',
};

export default function PermissionsMatrixPage() {
  const { permissions, loadPermissions, updatePermission, hasPermission } = usePermissionStore();
  const { addToast } = useToastStore();
  const [selectedRole, setSelectedRole] = useState(ALL_ROLES[0]);
  const [localPerms, setLocalPerms] = useState<RolePermissions | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map(c => [c, true]))
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    const rolePerms = permissions[selectedRole];
    if (rolePerms) {
      setLocalPerms({ ...rolePerms });
    } else {
      // Default all false for unrecognized roles
      const defaults = Object.fromEntries(MODULES.map(m => [m.key, false])) as unknown as RolePermissions;
      setLocalPerms(defaults);
    }
    setHasChanges(false);
  }, [selectedRole, permissions]);

  const toggle = (key: keyof RolePermissions) => {
    if (!localPerms) return;
    setLocalPerms(prev => {
      if (!prev) return prev;
      return { ...prev, [key]: !prev[key] };
    });
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    if (!localPerms) return;
    setSaving(true);
    try {
      for (const [key, val] of Object.entries(localPerms)) {
        await updatePermission(selectedRole, key as keyof RolePermissions, val as boolean);
      }
      addToast('success', 'Permissions Saved', `All permissions for "${selectedRole}" have been updated.`);
      setHasChanges(false);
    } catch {
      addToast('error', 'Save Failed', 'Could not save permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const rolePerms = permissions[selectedRole];
    if (rolePerms) setLocalPerms({ ...rolePerms });
    setHasChanges(false);
    addToast('info', 'Reset', 'Changes discarded.');
  };

  const handleGrantAll = () => {
    if (!localPerms) return;
    const all = Object.fromEntries(MODULES.map(m => [m.key, true])) as unknown as RolePermissions;
    setLocalPerms(all);
    setHasChanges(true);
  };

  const handleRevokeAll = () => {
    if (!localPerms) return;
    const none = Object.fromEntries(MODULES.map(m => [m.key, false])) as unknown as RolePermissions;
    setLocalPerms(none);
    setHasChanges(true);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(p => ({ ...p, [cat]: !p[cat] }));
  };

  const grantedCount = localPerms ? Object.values(localPerms).filter(Boolean).length : 0;
  const totalModules = MODULES.length;

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Permissions Matrix</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Configure module access for each user role</p>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" /> Discard
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAll}
                disabled={!hasChanges || saving}
                className={hasChanges ? 'ring-2 ring-primary/30 animate-pulse' : ''}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left — Role Selector */}
            <div className="lg:col-span-1 space-y-3">
              {/* Super Admin Card (locked) */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/40">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-sm text-amber-800 dark:text-amber-300">Super Admin</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">Has all permissions by default. Cannot be restricted.</p>
              </div>

              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Other Roles</div>
              {ALL_ROLES.map(role => {
                const count = permissions[role] ? Object.values(permissions[role]).filter(Boolean).length : 0;
                const gradient = roleGradients[role] || 'from-slate-500 to-slate-700';
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 ${
                      selectedRole === role
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-foreground truncate">{role}</div>
                        <div className="text-xs text-muted-foreground">{count}/{totalModules} modules</div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2.5 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-300`}
                        style={{ width: `${(count / totalModules) * 100}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right — Permissions Panel */}
            <div className="lg:col-span-3 space-y-4">
              {/* Role summary bar */}
              <Card className="shadow-sm border-border/60">
                <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${roleGradients[selectedRole] || 'from-primary to-primary'} flex items-center justify-center shadow-sm`}>
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{selectedRole}</div>
                      <div className="text-xs text-muted-foreground">{grantedCount} of {totalModules} modules enabled</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRevokeAll}>
                      <X className="h-3.5 w-3.5 text-destructive" /> Revoke All
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleGrantAll}>
                      <Check className="h-3.5 w-3.5 text-emerald-500" /> Grant All
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Info notice */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/30 border border-border/40">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Changes take effect after clicking <strong>Save Changes</strong>. Users must log out and back in to see updated permissions.</span>
              </div>

              {/* Modules by category */}
              {CATEGORIES.map(category => {
                const catModules = MODULES.filter(m => m.category === category);
                const isOpen = expandedCategories[category];
                const catGranted = localPerms ? catModules.filter(m => localPerms[m.key]).length : 0;

                return (
                  <Card key={category} className="shadow-sm border-border/60 overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full px-5 py-3.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{category}</span>
                        <span className="text-xs text-muted-foreground">({catGranted}/{catModules.length} enabled)</span>
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {isOpen && (
                      <div className="divide-y divide-border/40">
                        {catModules.map(mod => {
                          const Icon = mod.icon;
                          const isEnabled = localPerms ? localPerms[mod.key] : false;
                          return (
                            <div
                              key={mod.key}
                              className={`flex items-center justify-between px-5 py-4 transition-colors ${isEnabled ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-card'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'}`}>
                                  <Icon className={`h-4 w-4 ${isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-foreground">{mod.label}</div>
                                  <div className="text-xs text-muted-foreground">{mod.description}</div>
                                </div>
                              </div>

                              {/* Toggle Switch */}
                              <button
                                onClick={() => toggle(mod.key)}
                                className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none ${isEnabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
                                title={isEnabled ? 'Click to revoke access' : 'Click to grant access'}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 flex items-center justify-center ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                                >
                                  {isEnabled
                                    ? <Check className="h-2.5 w-2.5 text-emerald-500" />
                                    : <X className="h-2.5 w-2.5 text-muted-foreground" />
                                  }
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}