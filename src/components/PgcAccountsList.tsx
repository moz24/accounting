import React, { useState } from 'react';
import { Layers, Plus, Search } from 'lucide-react';
import { PgcAccount } from '../types/accounting';
import { Locale, TRANSLATIONS } from '../lib/translations';

interface PgcAccountsListProps {
  accounts: PgcAccount[];
  locale?: Locale;
  onOpenQuickCreate: (type: 'CUSTOMER' | 'ITEM' | 'LEDGER') => void;
}

export const PgcAccountsList: React.FC<PgcAccountsListProps> = ({
  accounts,
  locale = 'pt',
  onOpenQuickCreate,
}) => {
  const t = TRANSLATIONS[locale];
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<number>(0);

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.code.includes(searchTerm) ||
      acc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 0 || acc.classNumber === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-3">
      {/* Workstation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#002244] border border-[#003366] rounded-xs px-3 py-2 text-white shadow-xs">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider font-mono">
              {t.pgcTitle}
            </h1>
            <p className="text-[10px] text-slate-300">
              {t.pgcSubtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenQuickCreate('LEDGER')}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer uppercase tracking-wider"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.pgcNewAccount}</span>
        </button>
      </div>

      {/* Desktop Filter Ribbon */}
      <div className="bg-slate-900 border border-slate-700 rounded-xs p-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder={t.pgcSearchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xs pl-8 pr-2.5 py-1 text-slate-100 placeholder-slate-500 text-xs focus:outline-hidden focus:border-amber-400 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px]">{t.pgcFilterClass}:</span>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(parseInt(e.target.value))}
            className="bg-slate-950 text-white border border-slate-700 rounded-xs px-2.5 py-1 text-xs focus:outline-hidden font-medium"
          >
            <option value={0}>{t.pgcAllClasses}</option>
            <option value={1}>{locale === 'pt' ? 'Classe 1: Meios Fixos e Investimentos' : 'Class 1: Fixed Assets & Investments'}</option>
            <option value={2}>{locale === 'pt' ? 'Classe 2: Existências (Stock)' : 'Class 2: Inventory & Stocks'}</option>
            <option value={3}>{locale === 'pt' ? 'Classe 3: Terceiros (Clientes / Fornecedores)' : 'Class 3: Third Parties (Debtors / Creditors)'}</option>
            <option value={4}>{locale === 'pt' ? 'Classe 4: Meios Monetários (Bancos / Caixa)' : 'Class 4: Cash & Bank Accounts'}</option>
            <option value={5}>{locale === 'pt' ? 'Classe 5: Capital Próprio' : 'Class 5: Equity & Reserves'}</option>
            <option value={6}>{locale === 'pt' ? 'Classe 6: Proveitos por Natureza (Vendas)' : 'Class 6: Revenue from Operations'}</option>
            <option value={7}>{locale === 'pt' ? 'Classe 7: Custos por Natureza' : 'Class 7: Operating Expenses'}</option>
            <option value={8}>{locale === 'pt' ? 'Classe 8: Resultados' : 'Class 8: Profit & Loss Statement'}</option>
          </select>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 border border-slate-800 rounded-xs">
            {filteredAccounts.length} conta(s)
          </span>
        </div>
      </div>

      {/* Tally Standard PGC Accounts Grid */}
      <div className="bg-slate-900 border border-slate-700 rounded-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full accounting-grid text-xs">
            <thead>
              <tr>
                <th className="w-28">{t.pgcColCode}</th>
                <th>{t.pgcColName}</th>
                <th className="w-36">{t.pgcColOfficialClass}</th>
                <th className="w-24 text-center">{t.pgcColNature}</th>
                <th className="w-36 text-right">{t.pgcColBalance}</th>
              </tr>
            </thead>
            <tbody className="font-mono-num">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400 font-sans italic">
                    Nenhuma conta PGC encontrada.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.code}>
                    <td className="font-mono text-amber-400 font-bold">
                      {acc.code}
                    </td>
                    <td className="font-sans font-medium text-slate-200">
                      {acc.name}
                    </td>
                    <td className="font-sans text-slate-400">
                      {locale === 'pt' ? `Classe ${acc.classNumber}` : `Class ${acc.classNumber}`}
                    </td>
                    <td className="text-center">
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-xs bg-slate-950 text-slate-300 border border-slate-800">
                        {acc.type}
                      </span>
                    </td>
                    <td className="text-right font-bold text-white">
                      {acc.balance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
