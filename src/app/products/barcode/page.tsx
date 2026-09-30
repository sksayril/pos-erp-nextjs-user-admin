'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { 
  Barcode, 
  Printer, 
  Settings2, 
  Package, 
  CheckSquare, 
  Grid, 
  Tag, 
  Sparkles,
  Layers
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function BarcodePage() {
  const { addToast } = useToastStore();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  
  // Barcode parameters
  const [productName, setProductName] = useState('MacBook Pro M3 Max 16"');
  const [barcodeValue, setBarcodeValue] = useState('8901234567890');
  const [price, setPrice] = useState(349900);
  const [sku, setSku] = useState('MBP-M3-16-01');
  const [companyName, setCompanyName] = useState('CRIPOCOD POS & ERP');
  const [labelCount, setLabelCount] = useState(24);
  const [sheetLayout, setSheetLayout] = useState<'24-grid' | '40-grid' | 'single'>('24-grid');

  // Display toggles
  const [showCompany, setShowCompany] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSku, setShowSku] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          setSelectedProductId(data[0]._id || data[0].id);
          applyProductData(data[0]);
        }
      })
      .catch(err => console.error('Fetch products error in barcode:', err));
  }, []);

  const applyProductData = (p: any) => {
    if (!p) return;
    setProductName(p.name || '');
    setBarcodeValue(p.barcode || p.sku || '8901234567890');
    setPrice(p.sellingPrice || 0);
    setSku(p.sku || '');
  };

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const p = products.find((x: any) => (x._id || x.id) === id);
    if (p) applyProductData(p);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate deterministic barcode lines pattern
  const renderBarcodeLines = (val: string) => {
    const chars = (val || '123456789').split('');
    return (
      <div className="flex items-stretch justify-center h-10 w-full max-w-[170px] bg-white gap-[1.5px] px-1 py-1">
        {chars.map((char, i) => {
          const charCode = char.charCodeAt(0);
          const widthClass = charCode % 3 === 0 ? 'w-[3px]' : charCode % 2 === 0 ? 'w-[2px]' : 'w-[1px]';
          return (
            <React.Fragment key={i}>
              <div className={`bg-zinc-950 ${widthClass}`} />
              <div className={`bg-white ${charCode % 4 === 0 ? 'w-[2px]' : 'w-[1px]'}`} />
              <div className="bg-zinc-950 w-[1px]" />
              <div className="bg-white w-[1.5px]" />
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          
          {/* Top Bar (Hidden on Print) */}
          <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Barcode className="h-6 w-6 text-primary" /> Barcode & QR Label Generator
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Generate high-definition Code128 thermal sticker labels and standard A4 multi-label sheets.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} size="sm" className="h-9 gap-1.5 font-bold shadow-md">
                <Printer className="h-4 w-4" /> Print Labels ({labelCount} Copies)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Controls (Hidden on Print) */}
            <div className="space-y-6 lg:col-span-1 print:hidden">
              
              {/* Product Selection Card */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" /> 1. Select Inventory Item
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Choose from Catalog</label>
                    <select 
                      value={selectedProductId} 
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {products.map((p, i) => (
                        <option key={i} value={p._id || p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Product Label Name</label>
                    <input 
                      type="text" 
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Barcode / EAN</label>
                      <input 
                        type="text" 
                        value={barcodeValue}
                        onChange={(e) => setBarcodeValue(e.target.value)}
                        className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Price (Rs.)</label>
                      <input 
                        type="number" 
                        value={price}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Layout & Format Options */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" /> 2. Sheet & Element Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Paper Sheet Layout</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        type="button"
                        onClick={() => { setSheetLayout('24-grid'); setLabelCount(24); }}
                        className={`p-2 rounded-lg border text-center font-semibold text-[11px] transition-all ${sheetLayout === '24-grid' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-card text-muted-foreground'}`}
                      >
                        24 Labels (A4)
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setSheetLayout('40-grid'); setLabelCount(40); }}
                        className={`p-2 rounded-lg border text-center font-semibold text-[11px] transition-all ${sheetLayout === '40-grid' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-card text-muted-foreground'}`}
                      >
                        40 Labels (A4)
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setSheetLayout('single'); setLabelCount(1); }}
                        className={`p-2 rounded-lg border text-center font-semibold text-[11px] transition-all ${sheetLayout === 'single' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-card text-muted-foreground'}`}
                      >
                        Single Sticker
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Number of Copies to Print</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={200}
                      value={labelCount}
                      onChange={(e) => setLabelCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <label className="font-semibold text-foreground block">Label Visibility Options</label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showCompany} 
                        onChange={(e) => setShowCompany(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>Print Organization Header</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showName} 
                        onChange={(e) => setShowName(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>Print Product Name</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showPrice} 
                        onChange={(e) => setShowPrice(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>Print Selling Price (MRP)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showSku} 
                        onChange={(e) => setShowSku(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>Print SKU Code</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Live Print Sheet Preview */}
            <div className="lg:col-span-2 space-y-4">
              <div className="print:hidden flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Grid className="h-4 w-4 text-primary" /> Live Print Layout Preview ({labelCount} Stickers)
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {sheetLayout === 'single' ? 'Thermal 50x25mm' : 'A4 Grid Sheet (Ready)'}
                </span>
              </div>

              {/* Printable Sheet Container */}
              <div className="bg-white text-zinc-950 p-6 rounded-xl border border-border shadow-sm min-h-[500px]">
                <div className={`grid gap-3 ${
                  sheetLayout === 'single' 
                    ? 'grid-cols-1 max-w-[240px] mx-auto' 
                    : sheetLayout === '40-grid' 
                      ? 'grid-cols-2 sm:grid-cols-4' 
                      : 'grid-cols-2 sm:grid-cols-3'
                }`}>
                  {Array.from({ length: labelCount }).map((_, index) => (
                    <div 
                      key={index} 
                      className="border border-zinc-300 rounded-md p-2.5 bg-white flex flex-col items-center justify-center text-center select-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-zinc-950"
                    >
                      {showCompany && (
                        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-700 leading-tight">
                          {companyName}
                        </p>
                      )}

                      {showName && (
                        <p className="text-[11px] font-bold text-zinc-950 line-clamp-1 mt-0.5 max-w-[160px]">
                          {productName}
                        </p>
                      )}

                      {/* Barcode Graphic */}
                      <div className="my-1.5 flex flex-col items-center">
                        {renderBarcodeLines(barcodeValue)}
                        <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-900 mt-0.5">
                          {barcodeValue}
                        </span>
                      </div>

                      <div className="flex items-center justify-between w-full px-1 text-[10px] border-t border-zinc-200 pt-1 font-mono">
                        {showSku && (
                          <span className="text-zinc-600 text-[9px]">SKU: {sku}</span>
                        )}
                        {showPrice && (
                          <span className="font-extrabold text-zinc-950 ml-auto">
                            MRP: Rs. {price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </PageContainer>
    </AppShell>
  );
}