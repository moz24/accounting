import React, { useState } from 'react';
import { FileText, Search, Printer, ShieldCheck, Filter, Download } from 'lucide-react';
import { DualSeriesInvoice } from '../types/accounting';
import { Locale, TRANSLATIONS } from '../lib/translations';

interface DayBookProps {
  invoices: DualSeriesInvoice[];
  locale?: Locale;
  onOpenInvoicePrint: (invoice: DualSeriesInvoice) => void;
}

export const DayBook: React.FC<DayBookProps> = ({
  invoices,
  locale = 'pt',
  onOpenInvoicePrint,
}) => {
  const t = TRANSLATIONS[locale];
  const [searchTerm, setSearchTerm] = useState('');
  const [seriesFilter, setSeriesFilter] = useState<string>('ALL');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.seriesNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerNif.includes(searchTerm);
    const matchesSeries =
      seriesFilter === 'ALL' || inv.seriesType === seriesFilter;
    return matchesSearch && matchesSeries;
  });

  const totalDebit = filteredInvoices.reduce((s, i) => s + i.grandTotal, 0);

  return (
    <div className="space-y-3">
      {/* Workstation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#002244] border border-[#003366] rounded-xs px-3 py-2 text-white shadow-xs">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider font-mono">
              {t.dbTitle}
            </h1>
            <p className="text-[10px] text-slate-300">
              {t.dbSubtitle}
            </p>
          </div>
        </div>

        <div className="text-xs bg-[#001733] px-3 py-1 border border-[#002d62] text-slate-200 flex items-center space-x-2 rounded-xs">
          <span className="text-[10px] uppercase text-slate-400 font-bold">{t.dbTotalTurnover}:</span>
          <span className="font-mono-num font-bold text-amber-400 text-sm">{totalDebit.toLocaleString('pt-AO')} Kz</span>
        </div>
      </div>

      {/* Desktop Filter Ribbon */}
      <div className="bg-slate-900 border border-slate-700 rounded-xs p-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder={t.dbSearchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xs pl-8 pr-2.5 py-1 text-slate-100 placeholder-slate-500 text-xs focus:outline-hidden focus:border-amber-400 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Filtrar Série:</span>
          <select
            value={seriesFilter}
            onChange={(e) => setSeriesFilter(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-700 rounded-xs px-2.5 py-1 text-xs focus:outline-hidden font-medium"
          >
            <option value="ALL">{t.dbFilterAll}</option>
            <option value="FISCAL_AGT">{t.dbFilterFiscal}</option>
            <option value="PROFORMA_INTERNAL">{t.dbFilterInternal}</option>
          </select>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 border border-slate-800 rounded-xs">
            {filteredInvoices.length} doc(s)
          </span>
        </div>
      </div>

      {/* Tally Standard Day Book Table */}
      <div className="bg-slate-900 border border-slate-700 rounded-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full accounting-grid text-xs">
            <thead>
              <tr>
                <th className="w-24">Data</th>
                <th className="w-36">N.º Documento</th>
                <th className="w-36">Regime / Série</th>
                <th>Cliente / Adquirente</th>
                <th className="w-32 text-right">Valor Ilíquido</th>
                <th className="w-28 text-right">IVA Liquidado</th>
                <th className="w-36 text-right">Total Factura</th>
                <th className="w-24 text-center">Hash Chained</th>
                <th className="w-24 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="font-mono-num">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-slate-400 font-sans italic">
                    Nenhum documento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isFisc = inv.seriesType === 'FISCAL_AGT';
                  return (
                    <tr key={inv.id}>
                      <td className="text-slate-300">{inv.date}</td>
                      <td className="font-bold text-white">{inv.seriesNumber}</td>
                      <td className="font-sans">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-xs border ${
                            isFisc
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border-amber-800'
                          }`}
                        >
                          {isFisc ? 'SÉRIE FISCAL AGT' : 'PRÓ-FORMA INTERNA'}
                        </span>
                      </td>
                      <td className="font-sans">
                        <div className="font-bold text-slate-100">{inv.customerName}</div>
                        <div className="text-[10px] font-mono text-slate-400">NIF: {inv.customerNif}</div>
                      </td>
                      <td className="text-right text-slate-300">
                        {inv.subtotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                      </td>
                      <td className="text-right text-slate-300">
                        {inv.vatTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                      </td>
                      <td className="text-right font-bold text-white">
                        {inv.grandTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                      </td>
                      <td className="text-center text-[10px]">
                        {inv.hashChaining ? (
                          <span className="px-1.5 py-0.5 bg-slate-950 text-emerald-400 font-bold border border-slate-800 rounded-xs">
                            {inv.hashChaining.hashControl}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="text-right font-sans">
                        <button
                          type="button"
                          onClick={() => onOpenInvoicePrint(inv)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xs cursor-pointer"
                        >
                          Imprimir
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredInvoices.length > 0 && (
              <tfoot className="bg-[#001733] font-bold border-t-2 border-slate-600 font-mono-num">
                <tr>
                  <td colSpan={6} className="text-right uppercase font-sans text-slate-300 text-[11px] py-1.5 px-2.5">
                    Total do Livro de Vendas:
                  </td>
                  <td className="text-right text-amber-400 text-sm accounting-double-total py-1.5 px-2.5">
                    {totalDebit.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
