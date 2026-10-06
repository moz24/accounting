import React, { useState } from 'react';
import { Box, Plus, Search, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '../types/accounting';
import { Locale, TRANSLATIONS } from '../lib/translations';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  locale?: Locale;
  onOpenQuickCreate: (type: 'CUSTOMER' | 'ITEM' | 'LEDGER') => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  locale = 'pt',
  onOpenQuickCreate,
}) => {
  const t = TRANSLATIONS[locale];
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouseLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalValuation = inventory.reduce((s, i) => s + i.currentStock * i.costPrice, 0);

  return (
    <div className="space-y-3">
      {/* Workstation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#002244] border border-[#003366] rounded-xs px-3 py-2 text-white shadow-xs">
        <div className="flex items-center space-x-2">
          <Box className="w-4 h-4 text-amber-400" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider font-mono">
              {t.stkTitle}
            </h1>
            <p className="text-[10px] text-slate-300">
              {t.stkSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-xs bg-[#001733] px-2.5 py-1 rounded-xs border border-[#002d62] text-slate-300 flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">{t.stkTotalVal}:</span>
            <span className="font-mono-num font-bold text-amber-400">{totalValuation.toLocaleString('pt-AO')} Kz</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenQuickCreate('ITEM')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.stkNewItem}</span>
          </button>
        </div>
      </div>

      {/* Desktop Filter Ribbon */}
      <div className="bg-slate-900 border border-slate-700 rounded-xs p-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder={t.stkSearchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xs pl-8 pr-2.5 py-1 text-slate-100 placeholder-slate-500 text-xs focus:outline-hidden focus:border-amber-400 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px]">{t.stkFilterCategory}:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 text-white border border-slate-700 rounded-xs px-2.5 py-1 text-xs focus:outline-hidden font-medium"
          >
            <option value="ALL">{t.stkCatAll}</option>
            <option value="FINISHED_GOOD">{t.stkCatFinished}</option>
            <option value="TRADING_MERCHANDISE">{t.stkCatTrading}</option>
            <option value="RAW_MATERIAL">{t.stkCatRaw}</option>
            <option value="SERVICE">{t.stkCatService}</option>
          </select>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 border border-slate-800 rounded-xs">
            {filteredItems.length} artigo(s)
          </span>
        </div>
      </div>

      {/* Tally Standard Stock Summary Grid */}
      <div className="bg-slate-900 border border-slate-700 rounded-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full accounting-grid text-xs">
            <thead>
              <tr>
                <th className="w-24">{t.stkColCode}</th>
                <th>{t.stkColDesc}</th>
                <th className="w-32">{t.stkColCat}</th>
                <th className="w-28">{t.stkColWh}</th>
                <th className="w-24 text-right">{t.stkColStock}</th>
                <th className="w-32 text-right">{t.stkColCmpCost}</th>
                <th className="w-32 text-right">{t.stkColPrice}</th>
                <th className="w-36 text-right">{t.stkColTotalVal}</th>
              </tr>
            </thead>
            <tbody className="font-mono-num">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400 font-sans italic">
                    Nenhum artigo encontrado no armazém.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.currentStock <= item.minStockAlert && item.category !== 'SERVICE';
                  const totalVal = item.currentStock * item.costPrice;
                  return (
                    <tr key={item.id}>
                      <td className="font-mono text-white font-bold">{item.code}</td>
                      <td className="font-sans">
                        <div className="font-bold text-slate-200">{item.name}</div>
                        {isLowStock && (
                          <div className="text-[10px] text-amber-400 flex items-center space-x-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{t.stkLowStockAlert} ({item.minStockAlert})</span>
                          </div>
                        )}
                      </td>
                      <td className="font-sans">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-xs bg-slate-950 text-slate-300 font-mono border border-slate-800">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="font-sans text-slate-300">{item.warehouseLocation}</td>
                      <td className="text-right font-bold text-white">
                        {item.category === 'SERVICE' ? '—' : `${item.currentStock.toLocaleString('pt-AO')} ${item.unit}`}
                      </td>
                      <td className="text-right text-slate-300">
                        {item.costPrice.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                      </td>
                      <td className="text-right text-emerald-400 font-semibold">
                        {item.sellingPrice.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                      </td>
                      <td className="text-right font-bold text-white">
                        {item.category === 'SERVICE' ? '—' : `${totalVal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot className="bg-[#001733] font-bold border-t-2 border-slate-600 font-mono-num">
                <tr>
                  <td colSpan={7} className="text-right uppercase font-sans text-slate-300 text-[10px] py-1.5 px-2.5">
                    Valor Total do Inventário em Stock:
                  </td>
                  <td className="text-right text-amber-400 text-sm accounting-double-total py-1.5 px-2.5">
                    {totalValuation.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
