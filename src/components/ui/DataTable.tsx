'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, ArrowUpDown, ChevronLeft, ChevronRight, 
  Eye, Edit3, Trash2, Download, Printer, Filter, X 
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table';
import { useToastStore } from '../../lib/store';

export interface ColumnConfig<T> {
  header: string;
  accessor: keyof T | string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface FilterConfig {
  name: string;
  key: string;
  options: string[];
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  filters?: FilterConfig[];
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  headerActions?: React.ReactNode;
  title?: string;
}

export function DataTable<T extends { id: string | number; [key: string]: any }>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchKey,
  filters = [],
  onView,
  onEdit,
  onDelete,
  headerActions,
  title,
}: DataTableProps<T>) {
  const { addToast } = useToastStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // 1. Handling Filter Logics
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search filter
      if (searchTerm && searchKey) {
        const val = item[searchKey as string];
        if (val !== undefined && val !== null) {
          const match = String(val).toLowerCase().includes(searchTerm.toLowerCase());
          if (!match) return false;
        }
      } else if (searchTerm) {
        // Global generic search
        const match = Object.values(item).some((v) => 
          v !== null && v !== undefined && String(v).toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (!match) return false;
      }

      // Dropdown active filters
      for (const [key, value] of Object.entries(activeFilters)) {
        if (value) {
          const val = item[key];
          if (String(val) !== value) return false;
        }
      }

      return true;
    });
  }, [data, searchTerm, searchKey, activeFilters]);

  // 2. Sorting Logics
  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (aStr < bStr) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aStr > bStr) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // 3. Pagination Logics
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Actions
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;
    
    // Create header row
    const headers = columns.map(c => c.header).join(',');
    const rows = sortedData.map(item => {
      return columns.map(col => {
        const val = item[col.accessor as string];
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title || 'export'}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addToast('success', 'Export Successful', `${sortedData.length} records exported to CSV.`);
  };

  const handlePrint = () => {
    window.print();
    addToast('info', 'Print Triggered', 'Open system print dialog.');
  };

  return (
    <div className="space-y-4">
      {/* Title & Actions */}
      {(title || headerActions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {title && <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>}
          <div className="flex flex-wrap items-center gap-2">{headerActions}</div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {filters.length > 0 && (
            <Button
              variant={showFiltersPanel || Object.values(activeFilters).some(Boolean) ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="relative"
            >
              <Filter className="h-4 w-4" />
              Filters
              {Object.values(activeFilters).some(Boolean) && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-secondary text-[10px] font-bold text-white flex items-center justify-center">
                  {Object.values(activeFilters).filter(Boolean).length}
                </span>
              )}
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>

          {(searchTerm || Object.values(activeFilters).some(Boolean)) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Filters Box */}
      {showFiltersPanel && filters.length > 0 && (
        <div className="p-4 border border-border/80 bg-card rounded-lg flex flex-wrap gap-4 items-end animate-in fade-in duration-200">
          {filters.map((filter) => (
            <div key={filter.key} className="flex flex-col gap-1.5 w-full sm:w-48">
              <label className="text-xs font-semibold text-muted-foreground">{filter.name}</label>
              <select
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">All {filter.name}s</option>
                {filter.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveFilters({});
              setShowFiltersPanel(false);
            }}
            className="h-9 gap-1 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" /> Close
          </Button>
        </div>
      )}

      {/* Main Table Panel */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx}>
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.accessor as string)}
                      className="flex items-center gap-1.5 hover:text-foreground font-semibold cursor-pointer group"
                    >
                      {col.header}
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
              {(onView || onEdit || onDelete) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <TableRow key={row.id || row._id || `row-${rowIdx}`}>
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx}>
                      {col.render ? col.render(row) : String(row[col.accessor as string] ?? '')}
                    </TableCell>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-600 hover:text-white border border-amber-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="h-4.5 w-4.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + ((onView || onEdit || onDelete) ? 1 : 0)} className="h-36 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <span className="font-semibold text-base text-foreground/80">No results found</span>
                    <span className="text-xs text-muted-foreground">Try adjusting your search filters or add a new record.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Footer controls */}
        {sortedData.length > 0 && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 px-6 py-4 bg-muted/10">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{Math.min(sortedData.length, (currentPage - 1) * pageSize + 1)}</span> to{' '}
              <span className="font-semibold text-foreground">{Math.min(sortedData.length, currentPage * pageSize)}</span> of{' '}
              <span className="font-semibold text-foreground">{sortedData.length}</span> entries
            </div>
            
            <div className="flex items-center gap-4 self-end sm:self-auto">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-muted-foreground">Rows per page</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 rounded border border-border bg-card text-xs text-foreground px-1"
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs font-semibold px-2">
                  Page {currentPage} of {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
