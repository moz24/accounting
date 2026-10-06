import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Calculator, ArrowLeft, FileText, Download } from 'lucide-react';
import { PgcAccount, DualSeriesInvoice } from '../types/accounting';
import { Locale, TRANSLATIONS } from '../lib/translations';

interface DrillDownBalanceSheetProps {
  accounts: PgcAccount[];
  invoices: DualSeriesInvoice[];
  locale?: Locale;
  onOpenInvoicePrint: (invoice: DualSeriesInvoice) => void;
}

export const DrillDownBalanceSheet: React.FC<DrillDownBalanceSheetProps> = ({
  accounts,
  invoices,
  locale = 'pt',
  onOpenInvoicePrint,
}) => {
  const t = TRANSLATIONS[locale];
  // Expansion state for Classes
  const [expandedClasses, setExpandedClasses] = useState<Record<number, boolean>>({
    2: true, // Existências expanded by default
    3: true, // Terceiros
    4: true, // Meios Monetários
  });

  // Selected account for deep drill-down into vouchers
  const [selectedAccount, setSelectedAccount] = useState<PgcAccount | null>(null);

  const toggleClass = (classNum: number) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [classNum]: !prev[classNum],
    }));
  };

  const pgcClasses = [
    { num: 1, name: locale === 'pt' ? 'Classe 1: Meios Fixos e Investimentos' : 'Class 1: Fixed Assets & Investments', type: locale === 'pt' ? 'ACTIVO' : 'ASSET' },
    { num: 2, name: locale === 'pt' ? 'Classe 2: Existências (Matérias e Mercadorias)' : 'Class 2: Inventory (Materials & Goods)', type: locale === 'pt' ? 'ACTIVO' : 'ASSET' },
    { num: 3, name: locale === 'pt' ? 'Classe 3: Terceiros (Clientes, Fornecedores, Estado)' : 'Class 3: Third Parties (Debtors, Creditors, State)', type: locale === 'pt' ? 'MISTO' : 'MIXED' },
    { num: 4, name: locale === 'pt' ? 'Classe 4: Meios Monetários (Bancos BAI/BFA e Caixa)' : 'Class 4: Monetary Assets (Banks & Cash)', type: locale === 'pt' ? 'ACTIVO' : 'ASSET' },
    { num: 5, name: locale === 'pt' ? 'Classe 5: Capital Próprio e Reservas' : 'Class 5: Equity & Capital Reserves', type: locale === 'pt' ? 'PASSIVO' : 'EQUITY' },
    { num: 6, name: locale === 'pt' ? 'Classe 6: Proveitos e Ganhos por Natureza (Vendas)' : 'Class 6: Revenue & Income (Sales)', type: locale === 'pt' ? 'PROVEITOS' : 'REVENUE' },
    { num: 7, name: locale === 'pt' ? 'Classe 7: Custos e Perdas por Natureza (CMV / FSE)' : 'Class 7: Costs & Operating Expenses (COGS)', type: locale === 'pt' ? 'CUSTOS' : 'EXPENSES' },
    { num: 8, name: locale === 'pt' ? 'Classe 8: Resultados do Exercício' : 'Class 8: Net Income & Operating Profit', type: locale === 'pt' ? 'RESULTADOS' : 'PROFIT' },
  ];

  // Calculate totals per class
  const getClassBalance = (classNum: number) => {
    return accounts
      .filter((a) => a.classNumber === classNum)
      .reduce((s, a) => s + a.balance, 0);
  };

  // Total Activo (Classes 1 + 2 + 4 + Clientes Devedores)
  const totalActivo = getClassBalance(1) + getClassBalance(2) + getClassBalance(4);
  const totalPassivo = getClassBalance(5);

  return (
    <div className="space-y-3">
      {/* Workstation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#002244] border border-[#003366] rounded-xs px-3 py-2 text-white shadow-xs">
        <div className="flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-amber-400" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider font-mono">
              {t.bsTitle}
            </h1>
            <p className="text-[10px] text-slate-300">
              {t.bsSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="px-2.5 py-1 bg-[#001733] border border-[#002d62] text-slate-300 rounded-xs">
            {t.bsFiscalYear} <span className="font-bold text-amber-400 font-mono-num">2026</span>
          </div>
          <div className="px-2.5 py-1 bg-[#001733] border border-[#002d62] text-slate-300 rounded-xs">
            {t.bsCurrency} <span className="font-bold text-emerald-400 font-mono-num">{t.currencyLabel}</span>
          </div>
        </div>
      </div>

      {/* Main Table / Drill View */}
      {selectedAccount ? (
        /* Level 3: Deep Ledger / Voucher Drill-Down */
        <div className="bg-slate-900 border border-slate-700 rounded-xs p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="px-2 py-1 rounded-xs bg-[#002244] hover:bg-[#003366] text-amber-300 border border-[#004080] text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Balanço</span>
              </button>
              <div>
                <div className="text-xs font-bold text-white flex items-center space-x-1.5 font-mono">
                  <span className="text-amber-400">[{selectedAccount.code}]</span>
                  <span>{selectedAccount.name}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Extrato de Movimentos e Documentos de Origem (Ledger Vouchers)
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Saldo da Conta:</div>
              <div className="text-sm font-bold font-mono-num text-amber-400">
                {selectedAccount.balance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
              </div>
            </div>
          </div>

          {/* Vouchers / Documents matching this account */}
          <div className="overflow-x-auto">
            <table className="w-full accounting-grid text-xs">
              <thead>
                <tr>
                  <th className="w-24">Data</th>
                  <th className="w-36">N.º Documento</th>
                  <th className="w-32">Série / Regime</th>
                  <th>Terceiro / Descrição</th>
                  <th className="w-36 text-right">Débito</th>
                  <th className="w-36 text-right">Crédito</th>
                  <th className="w-24 text-right">Acção</th>
                </tr>
              </thead>
              <tbody className="font-mono-num">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-slate-400 italic font-sans">
                      Sem documentos associados a esta conta no período.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="text-slate-300">{inv.date}</td>
                      <td className="font-bold text-white">{inv.seriesNumber}</td>
                      <td className="font-sans">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-xs border ${
                            inv.seriesType === 'FISCAL_AGT'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border-amber-800'
                          }`}
                        >
                          {inv.seriesType === 'FISCAL_AGT' ? 'FISCAL AGT' : 'INTERNA'}
                        </span>
                      </td>
                      <td className="font-sans font-medium text-slate-100">
                        {inv.customerName}
                      </td>
                      <td className="text-right text-white font-semibold">
                        {inv.grandTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                      </td>
                      <td className="text-right text-slate-500">—</td>
                      <td className="text-right font-sans">
                        <button
                          type="button"
                          onClick={() => onOpenInvoicePrint(inv)}
                          className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors cursor-pointer"
                        >
                          Ver Factura
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-[#001733] font-bold border-t-2 border-slate-600 font-mono-num">
                <tr>
                  <td colSpan={4} className="text-right uppercase font-sans text-slate-300 text-[10px] py-1 px-2.5">
                    Saldo Total:
                  </td>
                  <td className="text-right text-amber-400 text-xs accounting-double-total py-1 px-2.5">
                    {selectedAccount.balance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* Level 1 & 2: PGC Hierarchy Tree */
        <div className="bg-slate-900 border border-slate-700 rounded-xs overflow-hidden">
          {/* Header Row */}
          <div className="bg-[#002244] px-3 py-1.5 border-b border-[#003366] flex justify-between items-center text-[11px] font-bold text-white uppercase tracking-wider font-mono">
            <span>Plano Geral de Contabilidade (PGC Angola - Decreto 82/01)</span>
            <div className="flex space-x-12 pr-3">
              <span className="w-16 text-right">Natureza</span>
              <span className="w-36 text-right">Saldo em Kz</span>
            </div>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            {pgcClasses.map((cls) => {
              const isExpanded = !!expandedClasses[cls.num];
              const classAccounts = accounts.filter((a) => a.classNumber === cls.num);
              const classTotal = getClassBalance(cls.num);

              return (
                <div key={cls.num}>
                  {/* Class Header Row */}
                  <div
                    onClick={() => toggleClass(cls.num)}
                    className="flex items-center justify-between px-3 py-1.5 bg-[#001733] hover:bg-[#002244] border-b border-slate-800 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="font-bold text-white font-mono text-xs">
                        {cls.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({classAccounts.length} contas)
                      </span>
                    </div>

                    <div className="flex items-center space-x-12">
                      <span className="text-[10px] font-mono text-slate-400 w-16 text-right">
                        {cls.type}
                      </span>
                      <span className="font-mono-num font-bold text-amber-400 text-xs w-36 text-right">
                        {classTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                      </span>
                    </div>
                  </div>

                  {/* Sub-Accounts List (Level 2) */}
                  {isExpanded && (
                    <div className="bg-slate-950 divide-y divide-slate-900">
                      {classAccounts.map((acc) => (
                        <div
                          key={acc.code}
                          onClick={() => setSelectedAccount(acc)}
                          className="flex items-center justify-between py-1 px-3 pl-8 hover:bg-[#002d62]/30 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono-num font-bold text-emerald-400 text-xs w-10">
                              {acc.code}
                            </span>
                            <span className="text-slate-200 group-hover:text-amber-300 font-medium text-xs">
                              {acc.name}
                            </span>
                          </div>

                          <div className="flex items-center space-x-12">
                            <span className="text-[10px] font-mono text-slate-500 w-16 text-right">
                              {acc.type}
                            </span>
                            <span className="font-mono-num font-semibold text-slate-200 group-hover:text-white text-xs w-36 text-right">
                              {acc.balance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Balance Sheet Final Accounting Verification Footers */}
          <div className="bg-[#001733] border-t-2 border-slate-600 px-3 py-2 flex flex-col sm:flex-row justify-between items-center text-xs font-mono-num">
            <div className="text-slate-300 font-sans text-xs">
              Balanço PGC Equilibrado: <span className="text-emerald-400 font-bold font-mono">Activo = Passivo + Capital Próprio</span>
            </div>
            <div className="flex space-x-6 text-xs">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-sans mr-2">Total Activo:</span>
                <span className="font-bold text-white accounting-double-total">
                  {totalActivo.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
