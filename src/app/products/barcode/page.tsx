'use client';

import React, { useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

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
}