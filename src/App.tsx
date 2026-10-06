import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Search, 
  Plus, 
  Moon,
  Sun,
  Globe, 
  HelpCircle, 
  Layers, 
  Box, 
  FileText, 
  Zap, 
  Calculator, 
  Archive, 
  DollarSign, 
  Printer, 
  Command,
  Sliders,
  Settings,
  Calendar
} from 'lucide-react';
import { 
  Customer, 
  InventoryItem, 
  PgcAccount, 
  DualSeriesInvoice, 
  BillOfMaterials, 
  LandedCostImport 
} from './types/accounting';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_INVENTORY, 
  INITIAL_PGC_ACCOUNTS, 
  INITIAL_INVOICES,
  INITIAL_BOM,
  INITIAL_LANDED_COST 
} from './data/angolaPgcData';
import { DEFAULT_COMPANY } from './services/saftAoExporter';
import { generateAgtInvoiceHash } from './services/cryptoEngine';

// Components
import { CommandPalette } from './components/CommandPalette';
import { QuickCreateModal } from './components/QuickCreateModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { DualSeriesCheckout } from './components/DualSeriesCheckout';
import { Gateway } from './components/Gateway';
import { DrillDownBalanceSheet } from './components/DrillDownBalanceSheet';
import { ManufacturingBOM } from './components/ManufacturingBOM';
import { LandedCostDistribution } from './components/LandedCostDistribution';
import { SaftAoInspector } from './components/SaftAoInspector';
import { InventoryManager } from './components/InventoryManager';
import { DayBook } from './components/DayBook';
import { PgcAccountsList } from './components/PgcAccountsList';
import { Locale, TRANSLATIONS } from './lib/translations';

export default function App() {
  // Theme State (Dark Workstation / Light Accounting)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Language State (Portuguese Angola 🇦🇴 / English 🇬🇧)
  const [locale, setLocale] = useState<Locale>('pt');
  const t = TRANSLATIONS[locale];

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('checkout');

  // Core ERP State
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [accounts, setAccounts] = useState<PgcAccount[]>(INITIAL_PGC_ACCOUNTS);
  const [invoices, setInvoices] = useState<DualSeriesInvoice[]>(INITIAL_INVOICES);

  // Modals State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<'CUSTOMER' | 'ITEM' | 'LEDGER'>('CUSTOMER');
  const [activePrintInvoice, setActivePrintInvoice] = useState<DualSeriesInvoice | null>(null);

  // Global Keyboard Shortcuts (Alt+G, Alt+C, Alt+L, F-Keys)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Alt+G or Ctrl+K -> Command Palette
      if ((e.altKey && (e.key === 'g' || e.key === 'G')) || (e.ctrlKey && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Alt+C -> Inline Quick Create
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setQuickCreateType('CUSTOMER');
        setIsQuickCreateOpen(true);
      }
      // Alt+L -> Toggle Language (PT <-> EN)
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setLocale((prev) => (prev === 'pt' ? 'en' : 'pt'));
      }
      // F4 -> Day Book / Contra
      if (e.key === 'F4') {
        e.preventDefault();
        setCurrentView('daybook');
      }
      // F8 -> Sales Voucher (Dual Series)
      if (e.key === 'F8') {
        e.preventDefault();
        setCurrentView('checkout');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Save New Invoice
  const handleSaveInvoice = (newInvoice: DualSeriesInvoice) => {
    setInvoices([newInvoice, ...invoices]);

    // Update physical inventory stock accurately (summing all lines for each item)
    setInventory((prev) =>
      prev.map((item) => {
        if (item.category === 'SERVICE') return item;
        const totalQtyDeducted = newInvoice.lines
          .filter((l) => l.itemId === item.id)
          .reduce((sum, l) => sum + l.quantity, 0);
        if (totalQtyDeducted > 0) {
          return {
            ...item,
            currentStock: Math.max(0, item.currentStock - totalQtyDeducted),
          };
        }
        return item;
      })
    );

    // Update Customer Balance if CREDIT sale
    if (newInvoice.paymentMethod === 'CREDIT') {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === newInvoice.customerId
            ? { ...c, currentBalance: c.currentBalance + newInvoice.grandTotal }
            : c
        )
      );
    }

    // Update PGC Accounts (Double-Entry Ledger Balancing)
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.code === '61.1') {
          return { ...acc, balance: acc.balance + newInvoice.subtotal };
        }
        if (acc.code === '34.2' && newInvoice.seriesType === 'FISCAL_AGT' && newInvoice.vatTotal > 0) {
          return { ...acc, balance: acc.balance + newInvoice.vatTotal };
        }
        if (acc.code === '34.5' && newInvoice.withholdingTaxAmount > 0) {
          return { ...acc, balance: acc.balance + newInvoice.withholdingTaxAmount };
        }
        if (newInvoice.paymentMethod === 'CASH' && acc.code === '45.9') {
          return { ...acc, balance: acc.balance + newInvoice.grandTotal };
        }
        if (newInvoice.paymentMethod === 'BANK_TRANSFER_BAI' && acc.code === '43.1') {
          return { ...acc, balance: acc.balance + newInvoice.grandTotal };
        }
        if ((newInvoice.paymentMethod === 'BANK_TRANSFER_BFA' || newInvoice.paymentMethod === 'MULTICAIXA_TPA') && acc.code === '43.2') {
          return { ...acc, balance: acc.balance + newInvoice.grandTotal };
        }
        if (newInvoice.paymentMethod === 'CREDIT' && acc.code === '31.1') {
          return { ...acc, balance: acc.balance + newInvoice.grandTotal };
        }
        return acc;
      })
    );
  };

  // 1-Click Promote Pro-Forma to Fiscal AGT Invoice
  const handlePromoteToFiscal = async (proforma: DualSeriesInvoice) => {
    const fiscalCount = invoices.filter((i) => i.seriesType === 'FISCAL_AGT').length;
    const nextSeq = fiscalCount + 1;
    const now = new Date();
    const invoiceDate = now.toISOString().split('T')[0];
    const systemEntryDate = now.toISOString().replace('Z', '');
    const seriesNumber = `FT AGT2026/${nextSeq.toString().padStart(4, '0')}`;

    const linesWithVat = proforma.lines.map((l) => {
      const vatAmount = l.netTotal * 0.14;
      return {
        ...l,
        vatRateCode: 'NOR' as const,
        vatPercent: 14,
        vatAmount,
        grossTotal: l.netTotal + vatAmount,
      };
    });

    const subtotal = linesWithVat.reduce((s, l) => s + l.netTotal, 0);
    const vatTotal = linesWithVat.reduce((s, l) => s + l.vatAmount, 0);
    const grandTotal = subtotal + vatTotal;

    const sortedFiscal = invoices
      .filter((i) => i.seriesType === 'FISCAL_AGT')
      .sort((a, b) => a.sequentialNumber - b.sequentialNumber);
    const lastFiscal = sortedFiscal[sortedFiscal.length - 1];
    const previousHash = lastFiscal?.hashChaining?.currentHash || '';

    const hashRes = await generateAgtInvoiceHash({
      invoiceDate,
      systemEntryDate,
      invoiceNo: seriesNumber,
      grossTotal: grandTotal,
      previousHash,
    });

    const promotedFiscalInvoice: DualSeriesInvoice = {
      ...proforma,
      id: `INV-PROM-${Date.now()}`,
      seriesType: 'FISCAL_AGT',
      docType: 'FT',
      seriesNumber,
      date: invoiceDate,
      systemEntryDate,
      lines: linesWithVat,
      subtotal,
      vatTotal,
      withholdingTaxPercent: 0,
      withholdingTaxAmount: 0,
      grandTotal,
      paymentMethod: proforma.paymentMethod,
      hashChaining: {
        currentHash: hashRes.signatureBase64,
        previousHash: hashRes.previousHash,
        hashControl: hashRes.hashControl,
        certificateNumber: '412/AGT/2026',
        fullSignature: hashRes.signatureBase64,
      },
      isSaftExported: false,
      notes: `Factura Fiscal emitida em conversão da Pró-Forma interna ${proforma.seriesNumber}. Sem duplicação de baixa de stock físico.`,
      convertedFromProformaId: proforma.id,
    };

    // Update Output VAT liability in General Ledger PGC account 34.2
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.code === '34.2') {
          return { ...acc, balance: acc.balance + vatTotal };
        }
        return acc;
      })
    );

    setInvoices([promotedFiscalInvoice, ...invoices]);
    setActivePrintInvoice(promotedFiscalInvoice);
  };

  // Execute Production Order from Manufacturing BOM
  const handleExecuteProduction = (bom: BillOfMaterials, quantityProduced: number) => {
    const multiplier = quantityProduced / bom.batchYieldQuantity;

    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === bom.finishedGoodId) {
          return {
            ...item,
            currentStock: item.currentStock + quantityProduced,
            costPrice: bom.totalUnitCost,
          };
        }
        const comp = bom.components.find((c) => c.itemId === item.id);
        if (comp) {
          const used = comp.quantityRequired * multiplier;
          return {
            ...item,
            currentStock: Math.max(0, item.currentStock - used),
          };
        }
        return item;
      })
    );
  };

  // Apply Landed Cost Import
  const handleApplyLandedCost = (landedCost: LandedCostImport) => {
    setInventory((prev) =>
      prev.map((item) => {
        const alloc = landedCost.itemsAllocated.find((a) => a.itemId === item.id);
        if (alloc) {
          return {
            ...item,
            costPrice: alloc.newUnitCmpCost,
          };
        }
        return item;
      })
    );
  };

  // F-Key buttons bar items
  const functionKeys = [
    { key: 'F2', label: t.f2, action: () => {} },
    { key: 'F4', label: t.f4, action: () => setCurrentView('daybook') },
    { key: 'F5', label: t.f5, action: () => setCurrentView('daybook') },
    { key: 'F6', label: t.f6, action: () => setCurrentView('daybook') },
    { key: 'F7', label: t.f7, action: () => setCurrentView('daybook') },
    { key: 'F8', label: t.f8, action: () => setCurrentView('checkout'), highlight: true },
    { key: 'F9', label: t.f9, action: () => setCurrentView('daybook') },
    { key: 'F10', label: t.f10, action: () => setCurrentView('landed_cost') },
    { key: 'Alt+G', label: t.fAltG, action: () => setIsCommandPaletteOpen(true) },
    { key: 'Alt+C', label: t.fAltC, action: () => { setQuickCreateType('CUSTOMER'); setIsQuickCreateOpen(true); } },
    { key: 'Alt+L', label: locale === 'pt' ? 'Idioma EN' : 'Lang PT', action: () => setLocale(l => l === 'pt' ? 'en' : 'pt'), highlight: true },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'theme-dark bg-[#070d1e] text-slate-100' : 'theme-light bg-[#f1f5f9] text-slate-900'} flex flex-col font-sans transition-colors duration-150`}>
      {/* Tally Classic Top Enterprise Header */}
      <header className="bg-[#002244] border-b border-[#003366] text-white no-print">
        <div className="px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-2">
          {/* Company Title */}
          <div className="flex items-center space-x-3">
            <div className="px-2 py-0.5 bg-[#004080] border border-blue-400/40 text-amber-300 font-mono font-bold text-xs uppercase tracking-wider">
              {t.editionBadge}
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide uppercase">
                {DEFAULT_COMPANY.companyName}
              </div>
              <div className="text-[10px] text-blue-200 font-mono">
                NIF: {DEFAULT_COMPANY.nif} • {t.certBadge}
              </div>
            </div>
          </div>

          {/* Top Quick Actions + Theme Switcher + Prominent Language Switcher */}
          <div className="flex items-center space-x-2 text-xs">
            {/* THEME SELECTOR (DARK / LIGHT) */}
            <div className="flex items-center bg-[#001733] border border-blue-500/40 rounded-xs p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-2 py-1 text-xs font-mono font-bold rounded-xs transition-colors cursor-pointer flex items-center space-x-1 ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={t.themeToggleDark}
              >
                <Moon className="w-3 h-3 text-sky-300" />
                <span>{t.themeDark}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-2 py-1 text-xs font-mono font-bold rounded-xs transition-colors cursor-pointer flex items-center space-x-1 ${
                  theme === 'light'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={t.themeToggleLight}
              >
                <Sun className="w-3 h-3 text-amber-400" />
                <span>{t.themeLight}</span>
              </button>
            </div>

            {/* PROMINENT LANGUAGE SWITCHER (Guaranteed 100% Contrast) */}
            <div className="flex items-center bg-[#001733] border-2 border-amber-400 rounded-xs p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setLocale('pt')}
                className={`px-2.5 py-1 text-xs font-mono rounded-xs transition-colors cursor-pointer flex items-center space-x-1 ${
                  locale === 'pt'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'bg-[#001733] text-white hover:bg-[#002d62] font-bold'
                }`}
                title="Português de Angola (Alt+L)"
              >
                <span>🇦🇴 PT</span>
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2.5 py-1 text-xs font-mono rounded-xs transition-colors cursor-pointer flex items-center space-x-1 ${
                  locale === 'en'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'bg-[#001733] text-white hover:bg-[#002d62] font-bold'
                }`}
                title="English International (Alt+L)"
              >
                <span>🇬🇧 EN</span>
              </button>
            </div>

            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="px-2.5 py-1 bg-[#003366] hover:bg-[#004080] border border-blue-400/40 rounded-xs font-mono font-bold text-amber-300 flex items-center space-x-1 cursor-pointer"
            >
              <Search className="w-3 h-3 text-amber-400" />
              <span>{t.goTo}</span>
            </button>
            <button
              onClick={() => { setQuickCreateType('CUSTOMER'); setIsQuickCreateOpen(true); }}
              className="px-2.5 py-1 bg-[#003366] hover:bg-[#004080] border border-blue-400/40 rounded-xs font-mono font-bold text-amber-300 flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-amber-400" />
              <span>{t.createMaster}</span>
            </button>

            {/* CURRENCY & DATE BADGE (Bulletproof Contrast via .currency-badge) */}
            <div className="currency-badge text-xs flex items-center space-x-1.5" title="Moeda Operacional & Data Fiscal">
              <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="font-mono">05-Oct-2026</span>
              <span className="text-amber-500 font-bold">|</span>
              <span className="font-bold">{t.currencyLabel}</span>
            </div>
          </div>
        </div>

        {/* Accounting Navigation Ribbon (Tally Workstation Tabs) */}
        <div className="bg-[#0b1736] border-t border-[#002d62] px-4 py-1 flex space-x-1 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setCurrentView('gateway')}
            className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
              currentView === 'gateway' ? 'bg-[#004080] text-amber-300 font-bold border-b-2 border-amber-400' : 'text-slate-200 hover:text-white'
            }`}
          >
            <span className="hotkey-u">G</span>ateway
          </button>
          <button
            onClick={() => setCurrentView('checkout')}
            className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
              currentView === 'checkout' ? 'bg-emerald-700 text-white font-bold border-b-2 border-emerald-300' : 'text-slate-200 hover:text-white'
            }`}
          >
            <span className="hotkey-u">V</span>ouchers
          </button>
          <button
            onClick={() => setCurrentView('daybook')}
            className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
              currentView === 'daybook' ? 'bg-[#004080] text-amber-300 font-bold border-b-2 border-amber-400' : 'text-slate-200 hover:text-white'
            }`}
          >
            <span className="hotkey-u">D</span>ay Book
          </button>
          <button
            onClick={() => setCurrentView('balance_sheet')}
            className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
              currentView === 'balance_sheet' ? 'bg-[#004080] text-amber-300 font-bold border-b-2 border-amber-400' : 'text-slate-200 hover:text-white'
            }`}
          >
            <span className="hotkey-u">B</span>alance Sheet
          </button>
          <button
            onClick={() => setCurrentView('manufacturing')}
            className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
              currentView === 'manufacturing' ? 'bg-[#004080] text-amber-300 font-bold border-b-2 border-amber-400' : 'text-slate-200 hover:text-white'
            }`}
          >
            <span className="hotkey-u">M</span>anufacturing BOM
          </button>
          <button
            onClick={() => setCurrentView('landed_cost')}
            className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
              currentView === 'landed_cost' ? 'bg-[#004080] text-amber-300 font-bold border-b-2 border-amber-400' : 'text-slate-200 hover:text-white'
            }`}
          >
            <span className="hotkey-u">L</span>anded Costs
          </button>
          <button
            onClick={() => setCurrentView('inventory')}
            className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
              currentView === 'inventory' ? 'bg-[#004080] text-amber-300 font-bold border-b-2 border-amber-400' : 'text-slate-200 hover:text-white'
            }`}
          >
            <span className="hotkey-u">S</span>tock Summary
          </button>
          <button
            onClick={() => setCurrentView('pgc_accounts')}
            className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
              currentView === 'pgc_accounts' ? 'bg-[#004080] text-amber-300 font-bold border-b-2 border-amber-400' : 'text-slate-200 hover:text-white'
            }`}
          >
            <span className="hotkey-u">P</span>GC Accounts
          </button>
          <button
            onClick={() => setCurrentView('saft_ao')}
            className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
              currentView === 'saft_ao' ? 'bg-[#004080] text-amber-300 font-bold border-b-2 border-amber-400' : 'text-slate-200 hover:text-white'
            }`}
          >
            S<span className="hotkey-u">A</span>F-T (AO)
          </button>
        </div>
      </header>

      {/* Main Workspace Layout with Right F-Key Function Toolbar */}
      <div className="flex-1 flex overflow-hidden no-print">
        {/* Main Operational View */}
        <main className="flex-1 overflow-y-auto p-4 max-w-7xl mx-auto w-full">
          {currentView === 'gateway' && (
            <Gateway
              invoices={invoices}
              inventory={inventory}
              accounts={accounts}
              locale={locale}
              onNavigate={(id) => setCurrentView(id)}
              onOpenQuickCreate={(type) => {
                setQuickCreateType(type);
                setIsQuickCreateOpen(true);
              }}
            />
          )}

          {currentView === 'checkout' && (
            <DualSeriesCheckout
              customers={customers}
              inventory={inventory}
              invoices={invoices}
              locale={locale}
              onSaveInvoice={handleSaveInvoice}
              onOpenQuickCreate={(type) => {
                setQuickCreateType(type);
                setIsQuickCreateOpen(true);
              }}
              onPrintInvoice={(inv) => setActivePrintInvoice(inv)}
              onPromoteToFiscal={handlePromoteToFiscal}
            />
          )}

          {currentView === 'daybook' && (
            <DayBook
              invoices={invoices}
              locale={locale}
              onOpenInvoicePrint={(inv) => setActivePrintInvoice(inv)}
            />
          )}

          {currentView === 'balance_sheet' && (
            <DrillDownBalanceSheet
              accounts={accounts}
              invoices={invoices}
              locale={locale}
              onOpenInvoicePrint={(inv) => setActivePrintInvoice(inv)}
            />
          )}

          {currentView === 'manufacturing' && (
            <ManufacturingBOM
              inventory={inventory}
              locale={locale}
              onExecuteProduction={handleExecuteProduction}
            />
          )}

          {currentView === 'landed_cost' && (
            <LandedCostDistribution
              inventory={inventory}
              locale={locale}
              onApplyLandedCost={handleApplyLandedCost}
            />
          )}

          {currentView === 'inventory' && (
            <InventoryManager
              inventory={inventory}
              locale={locale}
              onOpenQuickCreate={(type) => {
                setQuickCreateType(type);
                setIsQuickCreateOpen(true);
              }}
            />
          )}

          {currentView === 'pgc_accounts' && (
            <PgcAccountsList
              accounts={accounts}
              locale={locale}
              onOpenQuickCreate={(type) => {
                setQuickCreateType(type);
                setIsQuickCreateOpen(true);
              }}
            />
          )}

          {currentView === 'saft_ao' && (
            <SaftAoInspector
              invoices={invoices}
              customers={customers}
              inventory={inventory}
              accounts={accounts}
              locale={locale}
            />
          )}
        </main>

        {/* Tally Right-Hand Function Key Rail (F-Keys Bar) */}
        <aside className="w-20 bg-[#001733] border-l border-[#002d62] p-1.5 flex flex-col space-y-1.5 shrink-0 hidden md:flex no-print">
          {functionKeys.map((fk) => (
            <button
              key={fk.key}
              onClick={fk.action}
              className={`fkey-btn ${
                fk.highlight ? 'border-emerald-500 bg-emerald-950/60 text-white' : ''
              }`}
            >
              <span className={`fkey-label ${fk.highlight ? 'text-emerald-400' : ''}`}>
                {fk.key}
              </span>
              <span className="text-[10px] leading-tight truncate w-full">
                {fk.label}
              </span>
            </button>
          ))}
        </aside>
      </div>

      {/* Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        locale={locale}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(viewId) => {
          if (viewId === 'checkout_fiscal' || viewId === 'checkout_internal') {
            setCurrentView('checkout');
          } else {
            setCurrentView(viewId);
          }
        }}
      />

      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        type={quickCreateType}
        locale={locale}
        onClose={() => setIsQuickCreateOpen(false)}
        onSaveCustomer={(c) => setCustomers([...customers, c])}
        onSaveItem={(i) => setInventory([...inventory, i])}
        onSaveLedger={(l) => setAccounts([...accounts, l])}
      />

      <InvoicePrintModal
        invoice={activePrintInvoice}
        locale={locale}
        onClose={() => setActivePrintInvoice(null)}
      />

      {/* Professional Footer Bar */}
      <footer className="bg-[#001733] border-t border-[#002d62] py-1.5 px-4 text-[11px] text-slate-400 flex justify-between items-center no-print">
        <div className="flex items-center space-x-3">
          <span className="text-white font-bold font-mono">Nexora TallyPrime Angola</span>
          <span>•</span>
          <span>Certificado AGT 412/AGT/2026</span>
          <span>•</span>
          <span>Decreto Executivo n.º 386/20</span>
        </div>
        <div className="flex items-center space-x-4 font-mono text-[10px]">
          <span>{locale === 'pt' ? 'SÉRIE A - FACTURAS: ATIVA (FT)' : 'SERIES A - INVOICES: ACTIVE (FT)'}</span>
          <span>{locale === 'pt' ? 'SÉRIE P - PRÓ-FORMAS: ATIVA (FP)' : 'SERIES P - PRO-FORMAS: ACTIVE (FP)'}</span>
          <span className="text-emerald-400">● RSA-2048 OK</span>
        </div>
      </footer>
    </div>
  );
}
