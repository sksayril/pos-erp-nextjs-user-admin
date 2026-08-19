'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useUIStore, useToastStore, ColorTheme } from '../../../lib/store';
import { Palette, Check, Monitor, LayoutGrid } from 'lucide-react';

export default function SystemSettingsPage() {
  const { colorTheme, setColorTheme } = useUIStore();
  const { addToast } = useToastStore();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'System Configs Saved', 'System configurations successfully updated.');
  };

  const themes: Array<{ id: ColorTheme; name: string; primaryBg: string; secondaryBg: string; desc: string }> = [
    { id: 'purple', name: 'Purple Royal (Default)', primaryBg: 'bg-violet-600', secondaryBg: 'bg-orange-500', desc: 'Vibrant purple headers with warm orange secondary triggers.' },
    { id: 'emerald', name: 'Emerald Mint', primaryBg: 'bg-emerald-600', secondaryBg: 'bg-sky-500', desc: 'Clean fresh green look with cooling sky blue accents.' },
    { id: 'ocean', name: 'Ocean Blue', primaryBg: 'bg-blue-600', secondaryBg: 'bg-rose-500', desc: 'Deep professional blue layout with pink highlight accents.' },
    { id: 'sunset', name: 'Sunset Orange', primaryBg: 'bg-orange-600', secondaryBg: 'bg-violet-600', desc: 'Energetic sunset orange theme paired with royalty purples.' },
    { id: 'rose', name: 'Rose Pink', primaryBg: 'bg-rose-600', secondaryBg: 'bg-emerald-500', desc: 'Premium luxury pink layout with light mint highlights.' }
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="max-w-3xl mx-auto space-y-6 select-none">
          <div className="border-b border-border pb-3 flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Theme & System Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Customize the visual theme layout, sidebar colors, and currency default parameters.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. THEME PICKER PALETTE CONTAINER */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50 bg-zinc-50/50 dark:bg-zinc-900/50">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <LayoutGrid className="h-4.5 w-4.5 text-zinc-500" /> Choose UI Color Theme
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {themes.map((theme) => {
                    const isSelected = colorTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setColorTheme(theme.id)}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 hover:shadow-xs active:scale-[0.99] bg-card ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/20 shadow-xs'
                            : 'border-border hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        {/* Dynamic color circles */}
                        <div className="flex -space-x-2 shrink-0 mt-0.5">
                          <div className={`h-6 w-6 rounded-full border border-card shadow-sm ${theme.primaryBg}`} />
                          <div className={`h-6 w-6 rounded-full border border-card shadow-sm ${theme.secondaryBg}`} />
                        </div>
                        
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground leading-none">{theme.name}</span>
                            {isSelected && (
                              <div className="h-4.5 w-4.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                            {theme.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 2. REGULAR SETTINGS BINDINGS */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border/50 bg-zinc-50/50 dark:bg-zinc-900/50">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Monitor className="h-4.5 w-4.5 text-zinc-500" /> System Variables & Currencies
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-500">Default Currency Unit</label>
                    <input className="h-9 w-full rounded border border-border px-3 text-sm bg-card text-foreground" defaultValue="Rs. (Indian Rupees)" disabled />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-500">System Mode Status</label>
                    <select className="h-9 w-full rounded border border-border px-2 text-sm bg-card text-foreground">
                      <option>Active / Online</option>
                      <option>Maintenance Mode</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" className="h-10 px-6 font-bold shadow-xs">
                Save System Configs
              </Button>
            </div>
          </form>
        </div>
      </PageContainer>
    </AppShell>
  );
}