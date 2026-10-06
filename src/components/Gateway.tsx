import React, { useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  Layers, 
  Box, 
  FileText, 
  Calculator, 
  Archive, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Landmark,
  Wallet,
  Receipt
} from 'lucide-react';
import { DualSeriesInvoice, InventoryItem, PgcAccount } from '../types/accounting';
import { DEFAULT_COMPANY } from '../services/saftAoExporter';
import { Locale, TRANSLATIONS } from '../lib/translations';

interface GatewayProps {
  invoices: DualSeriesInvoice[];
  inventory: InventoryItem[];
  accounts: PgcAccount[];
  locale?: Locale;
  onNavigate: (viewId: string) => void;
  onOpenQuickCreate: (type: 'CUSTOMER' | 'ITEM' | 'LEDGER') => void;
}

export const Gateway: React.FC<GatewayProps> = ({
  invoices,
  inventory,
  accounts,
  locale = 'pt',
  onNavigate,
  onOpenQuickCreate,
}) => {
  const t = TRANSLATIONS[locale];

  // Financial calculations
  const fiscalInvoices = invoices.filter((i) => i.seriesType === 'FISCAL_AGT');
  const internalInvoices = invoices.filter((i) => i.seriesType === 'PROFORMA_INTERNAL');

  const declaredTurnover = fiscalInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const internalTurnover = internalInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalRealTurnover = declaredTurnover + internalTurnover;

  const totalVat = fiscalInvoices.reduce((s, i) => s + i.vatTotal, 0);
  const totalStockValuation = inventory.reduce((s, i) => s + (i.currentStock * i.costPrice), 0);

  const bankBai = accounts.find((a) => a.code === '43.1')?.balance || 0;
  const cashBalcao = accounts.find((a) => a.code === '45.9')?.balance || 0;

  // Single-key hotkey listener when in Gateway screen (Classic Tally Behavior)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const key = e.key.toUpperCase();
      switch (key) {
        case 'V':
          onNavigate('checkout');
          break;
        case 'D':
          onNavigate('daybook');
          break;
        case 'B':
          onNavigate('balance_sheet');
          break;
        case 'M':
          onNavigate('manufacturing');
          break;
        case 'L':
          onNavigate('landed_cost');
          break;
        case 'S':
          onNavigate('inventory');
          break;
        case 'P':
          onNavigate('pgc_accounts');
          break;
        case 'T':
        case 'A':
          onNavigate('saft_ao');
          break;
        case 'C':
          onOpenQuickCreate('CUSTOMER');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, onOpenQuickCreate]);

  return (
    <div className="space-y-4">
      {/* Tally Classic Split Screen: Left Company & Period Pane + Right Gateway Menu */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Pane (Col 5): Company Info & Live Financial Position */}
        <div className="lg:col-span-5 bg-slate-900 border-2 border-slate-700 rounded-xs shadow-md overflow-hidden text-xs tally-content">
          {/* Period & Date Bar */}
          <div className="bg-[#002244] p-3 border-b-2 border-[#003366] text-white grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-blue-200 block font-bold uppercase tracking-wider text-[10px]">{t.gwCurrentPeriod}</span>
              <span className="font-mono-num font-bold text-amber-300">01-Jan-2026 to 31-Dec-2026</span>
            </div>
            <div>
              <span className="text-blue-200 block font-bold uppercase tracking-wider text-[10px]">{t.gwCurrentDate}</span>
              <span className="font-mono-num font-bold text-white">Monday, 05-Oct-2026</span>
            </div>
          </div>

          {/* Selected Company Details */}
          <div className="p-4 border-b border-slate-700 bg-slate-950/70 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t.gwSelectedCompanies}
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-white tracking-tight">
                {DEFAULT_COMPANY.companyName}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/90 px-2 py-0.5 border border-emerald-600 rounded-xs">
                ACTIVE
              </span>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>{t.gwNif} <strong className="text-white font-mono-num font-bold">{DEFAULT_COMPANY.nif}</strong></span>
              <span>{t.gwLastEntry} <strong className="text-white font-mono-num font-bold">05-Oct-2026</strong></span>
            </div>
          </div>

          {/* AGT Certification Status Block */}
          <div className="p-4 border-b border-slate-700 bg-slate-950/80 space-y-2 text-[11px]">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">{t.gwAgtStatus}</span>
              </span>
              <span className="font-mono text-[10px] bg-[#001733] text-amber-300 px-2 py-0.5 border border-amber-500/60 font-bold rounded-xs">
                DEC. EXECUTIVO 386/20
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
              <div>{t.gwSoftwareCert} <strong className="text-white font-mono font-bold">412/AGT/2026</strong></div>
              <div>{t.gwCrypto} <strong className="text-white font-mono font-bold">RSA SHA-256</strong></div>
              <div>{t.gwDualMode} <strong className="text-emerald-400 font-bold">{locale === 'pt' ? 'CONFORME DEC. 386/20' : 'DECREE 386/20 READY'}</strong></div>
              <div>{t.gwSaftExport} <strong className="text-emerald-400 font-bold">VALID (100%)</strong></div>
            </div>
          </div>

          {/* Financial Summary Ledger */}
          <div className="p-4 space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>{t.gwLedgerSummary}</span>
              <span className="font-mono text-[9px] text-slate-500">AOA / Kwanza</span>
            </div>

            <div className="space-y-1.5 font-mono-num text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-sans">{t.gwFiscalTurnover}</span>
                <span className="font-bold text-white">{declaredTurnover.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-sans">{t.gwInternalTurnover}</span>
                <span className="font-bold text-amber-400">{internalTurnover.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
              </div>
              <div className="flex justify-between py-1.5 border-b-2 border-slate-700 font-bold bg-[#001733] px-2 text-white accounting-double-total">
                <span className="font-sans text-amber-300">{t.gwTotalRealTurnover}</span>
                <span className="text-emerald-400 text-xs">{totalRealTurnover.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-sans">{t.gwVatPayable}</span>
                <span className="text-blue-400 font-bold">{totalVat.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-sans">{t.gwBankBai}</span>
                <span className="text-white font-medium">{bankBai.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-sans">{t.gwCashDesk}</span>
                <span className="text-emerald-400 font-bold">{cashBalcao.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-sans">{t.gwStockVal}</span>
                <span className="text-purple-300 font-medium">{totalStockValuation.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane (Col 7): Centered Gateway of Tally Menu */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="w-full max-w-xl mx-auto bg-slate-900 border-2 border-slate-600 rounded-xs tally-window-frame overflow-hidden">
            {/* Gateway Menu Header */}
            <div className="bg-[#002d62] text-white px-4 py-2.5 text-center border-b-2 border-slate-700">
              <h2 className="text-sm font-bold tracking-wider uppercase font-mono text-amber-300 flex items-center justify-center space-x-2">
                <span>GATEWAY OF TALLY • ANGOLA</span>
              </h2>
              <div className="text-[10px] text-blue-200 font-mono tracking-wide mt-0.5">
                {DEFAULT_COMPANY.companyName}
              </div>
            </div>

            {/* Menu Items with Tally Yellow Hotkeys */}
            <div className="p-4 space-y-4 text-xs font-medium">
              {/* Masters Section */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                  {t.gwMasters}
                </div>
                <div className="pl-2 space-y-1 pt-1">
                  <button
                    onClick={() => onOpenQuickCreate('CUSTOMER')}
                    className="w-full text-left py-1 px-2 hover:bg-[#002d62]/50 hover:text-white rounded-xs flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <span><strong className="text-amber-400 font-bold group-hover:underline">C</strong>reate ({locale === 'pt' ? 'Criar Cliente / Artigo / Conta' : 'New Customer / Item / Ledger'})</span>
                    <kbd className="font-mono text-[10px] text-slate-500 group-hover:text-amber-300 font-bold">C</kbd>
                  </button>
                  <button
                    onClick={() => onNavigate('pgc_accounts')}
                    className="w-full text-left py-1 px-2 hover:bg-[#002d62]/50 hover:text-white rounded-xs flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <span><strong className="text-amber-400 font-bold group-hover:underline">A</strong>lter ({locale === 'pt' ? 'Plano Geral de Contabilidade - PGC' : 'Chart of Accounts - PGC'})</span>
                    <kbd className="font-mono text-[10px] text-slate-500 group-hover:text-amber-300 font-bold">A / P</kbd>
                  </button>
                </div>
              </div>

              {/* Transactions Section */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                  {t.gwTransactions}
                </div>
                <div className="pl-2 space-y-1 pt-1">
                  <button
                    onClick={() => onNavigate('checkout')}
                    className="w-full text-left py-1.5 px-2 bg-emerald-950/60 border border-emerald-600 hover:bg-emerald-900/80 hover:text-white rounded-xs flex items-center justify-between group cursor-pointer transition-colors shadow-xs"
                  >
                    <span className="text-white font-bold flex items-center space-x-1.5">
                      <strong className="text-emerald-400 font-black group-hover:underline">V</strong>
                      <span>ouchers ({locale === 'pt' ? 'Facturas Fiscais FT/FR e Pró-Formas FP' : 'Sales Invoices FT/FR & Pro-Formas FP'})</span>
                    </span>
                    <kbd className="font-mono text-[10px] font-black text-emerald-300 bg-emerald-900 px-1.5 py-0.5 border border-emerald-500 rounded-xs">V / F8</kbd>
                  </button>
                  <button
                    onClick={() => onNavigate('daybook')}
                    className="w-full text-left py-1 px-2 hover:bg-[#002d62]/50 hover:text-white rounded-xs flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <span><strong className="text-amber-400 font-bold group-hover:underline">D</strong>ay Book ({locale === 'pt' ? 'Diário de Movimentos Cronológico' : 'Chronological Audit Trail'})</span>
                    <kbd className="font-mono text-[10px] text-slate-500 group-hover:text-amber-300 font-bold">D / F4</kbd>
                  </button>
                </div>
              </div>

              {/* Manufacturing & Trading Section */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                  {t.gwManufacturingHeading}
                </div>
                <div className="pl-2 space-y-1 pt-1">
                  <button
                    onClick={() => onNavigate('manufacturing')}
                    className="w-full text-left py-1 px-2 hover:bg-[#002d62]/50 hover:text-white rounded-xs flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <span><strong className="text-amber-400 font-bold group-hover:underline">M</strong>anufacturing BOM ({locale === 'pt' ? 'Ficha Técnica Fabril & Ordens de Fabrico' : 'Bill of Materials & Work Orders'})</span>
                    <kbd className="font-mono text-[10px] text-slate-500 group-hover:text-amber-300 font-bold">M</kbd>
                  </button>
                  <button
                    onClick={() => onNavigate('landed_cost')}
                    className="w-full text-left py-1 px-2 hover:bg-[#002d62]/50 hover:text-white rounded-xs flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <span><strong className="text-amber-400 font-bold group-hover:underline">L</strong>anded Costs ({locale === 'pt' ? 'Custos de Despacho & Porto de Luanda' : 'Port of Luanda Import Clearance'})</span>
                    <kbd className="font-mono text-[10px] text-slate-500 group-hover:text-amber-300 font-bold">L / F10</kbd>
                  </button>
                </div>
              </div>

              {/* Reports & Utilities */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                  {t.gwReportsHeading}
                </div>
                <div className="pl-2 space-y-1 pt-1">
                  <button
                    onClick={() => onNavigate('balance_sheet')}
                    className="w-full text-left py-1 px-2 hover:bg-[#002d62]/50 hover:text-white rounded-xs flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <span><strong className="text-amber-400 font-bold group-hover:underline">B</strong>alance Sheet ({locale === 'pt' ? 'Balanço PGC com Drill-Down Contabilístico' : 'Trial Balance & Financial Statement'})</span>
                    <kbd className="font-mono text-[10px] text-slate-500 group-hover:text-amber-300 font-bold">B</kbd>
                  </button>
                  <button
                    onClick={() => onNavigate('inventory')}
                    className="w-full text-left py-1 px-2 hover:bg-[#002d62]/50 hover:text-white rounded-xs flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <span><strong className="text-amber-400 font-bold group-hover:underline">S</strong>tock Summary ({locale === 'pt' ? 'Mapa de Existências com Custo Médio CMP' : 'Inventory Valuation with WAC'})</span>
                    <kbd className="font-mono text-[10px] text-slate-500 group-hover:text-amber-300 font-bold">S</kbd>
                  </button>
                  <button
                    onClick={() => onNavigate('saft_ao')}
                    className="w-full text-left py-1 px-2 hover:bg-[#002d62]/50 hover:text-white rounded-xs flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <span>Expor<strong className="text-amber-400 font-bold group-hover:underline">T</strong> SAF-T (AO) ({locale === 'pt' ? 'Decreto Executivo 386/20' : 'Executive Decree 386/20 XML'})</span>
                    <kbd className="font-mono text-[10px] text-slate-500 group-hover:text-amber-300 font-bold">T / A</kbd>
                  </button>
                </div>
              </div>

              {/* Quit Section */}
              <div className="space-y-1 pt-1 border-t border-slate-800">
                <div className="pl-2">
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="w-full text-left py-1 px-2 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded-xs flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <span><strong className="text-rose-400 font-bold group-hover:underline">Q</strong>uit</span>
                    <kbd className="font-mono text-[10px] text-slate-500 group-hover:text-rose-300 font-bold">Esc / Q</kbd>
                  </button>
                </div>
              </div>
            </div>

            {/* Gateway Footer Instructions */}
            <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
              <span>{t.gwPressKeyHint}</span>
              <span className="font-mono">Alt+G: Go To • Esc: Back</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
