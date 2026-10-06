import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Zap, Calculator, Box, FileText, Layers, ShieldCheck, DollarSign } from 'lucide-react';
import { Locale } from '../lib/translations';

interface CommandPaletteProps {
  isOpen: boolean;
  locale?: Locale;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, locale = 'pt', onClose, onNavigate }) => {
  const [search, setSearch] = useState('');

  const commands = [
    { 
      id: 'checkout', 
      title: locale === 'pt' ? 'Vendas & Facturação Comercial' : 'Sales & Commercial Invoicing', 
      category: locale === 'pt' ? 'Vendas & Facturação' : 'Sales & Invoicing', 
      hotkey: 'V', 
      icon: Zap 
    },
    { 
      id: 'checkout_fiscal', 
      title: locale === 'pt' ? 'Emitir Factura Fiscal Certificada AGT (FT)' : 'Issue AGT Certified Tax Invoice (FT)', 
      category: locale === 'pt' ? 'Fiscal AGT' : 'AGT Compliance', 
      hotkey: 'Alt+F', 
      icon: ShieldCheck 
    },
    { 
      id: 'checkout_internal', 
      title: locale === 'pt' ? 'Emitir Cotação / Factura Pró-Forma (FP)' : 'Issue Commercial Quote / Pro-Forma Invoice (FP)', 
      category: locale === 'pt' ? 'Cotações & Pré-Venda' : 'Quotations & Pre-Sales', 
      hotkey: 'Alt+P', 
      icon: DollarSign 
    },
    { 
      id: 'daybook', 
      title: locale === 'pt' ? 'Diário de Movimentos (Day Book)' : 'General Day Book (Journal Register)', 
      category: locale === 'pt' ? 'Contabilidade' : 'Accounting', 
      hotkey: 'D', 
      icon: FileText 
    },
    { 
      id: 'balance_sheet', 
      title: locale === 'pt' ? 'Balanço Patrimonial & Balancete PGC' : 'Balance Sheet & Trial Balance (PGC)', 
      category: locale === 'pt' ? 'Relatórios Financeiros' : 'Financial Reports', 
      hotkey: 'B', 
      icon: Calculator 
    },
    { 
      id: 'pgc_accounts', 
      title: locale === 'pt' ? 'Plano Geral de Contabilidade de Angola (PGC)' : 'Chart of Accounts (Angola PGC)', 
      category: locale === 'pt' ? 'Contabilidade' : 'Accounting', 
      hotkey: 'P', 
      icon: Layers 
    },
    { 
      id: 'manufacturing', 
      title: locale === 'pt' ? 'Produção Fabril & Ficha Técnica (BOM)' : 'Manufacturing MRP & Bill of Materials (BOM)', 
      category: locale === 'pt' ? 'Manufatura SAP/Odoo' : 'Manufacturing MRP', 
      hotkey: 'M', 
      icon: Box 
    },
    { 
      id: 'landed_cost', 
      title: locale === 'pt' ? 'Custos de Importação & Despacho Porto Luanda' : 'Import Landed Costs & Port of Luanda', 
      category: locale === 'pt' ? 'Trading & Comércio' : 'Trading & Shipping', 
      hotkey: 'L', 
      icon: DollarSign 
    },
    { 
      id: 'saft_ao', 
      title: locale === 'pt' ? 'Exportar Ficheiro SAF-T (AO) Decreto 386/20' : 'Export SAF-T (AO) XML File (Decree 386/20)', 
      category: locale === 'pt' ? 'Conformidade AGT' : 'Tax Authority', 
      hotkey: 'A', 
      icon: ShieldCheck 
    },
    { 
      id: 'inventory', 
      title: locale === 'pt' ? 'Mapa de Existências & Custo Médio (CMP)' : 'Stock Summary & Inventory Valuation (WAC)', 
      category: locale === 'pt' ? 'Stock & Armazém' : 'Warehouse & Stock', 
      hotkey: 'S', 
      icon: Box 
    },
  ];

  const filteredCommands = commands.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.hotkey.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/80 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xs shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Search Input */}
        <div className="flex items-center px-3 py-2 border-b border-[#003366] bg-[#002244] text-white">
          <Search className="w-4 h-4 text-amber-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder={locale === 'pt' ? 'Ir Para (Alt+G): Digite relatório, conta, documento ou tecla de atalho...' : 'Go To (Alt+G): Type report, account, document or shortcut key...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-white placeholder-slate-300 focus:outline-hidden text-xs font-mono"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#001733] text-amber-300 border border-[#002d62] rounded-xs">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-96 overflow-y-auto p-1.5 divide-y divide-slate-800">
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs font-mono">
              {locale === 'pt' ? `Nenhum comando ou relatório encontrado para "${search}"` : `No commands or reports found for "${search}"`}
            </div>
          ) : (
            filteredCommands.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xs hover:bg-[#002d62]/40 text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-xs bg-slate-950 border border-slate-800 group-hover:border-amber-500/50 text-slate-300 group-hover:text-amber-400 transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-200 group-hover:text-amber-300 font-mono">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">{item.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-xs bg-slate-950 text-amber-400 font-mono font-bold border border-slate-800">
                      {item.hotkey}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
