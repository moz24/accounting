import React, { useState, useEffect } from 'react';
import { X, UserPlus, PackagePlus, FilePlus } from 'lucide-react';
import { Customer, InventoryItem, PgcAccount } from '../types/accounting';
import { Locale, TRANSLATIONS } from '../lib/translations';

interface QuickCreateModalProps {
  isOpen: boolean;
  type: 'CUSTOMER' | 'ITEM' | 'LEDGER';
  locale?: Locale;
  onClose: () => void;
  onSaveCustomer: (cust: Customer) => void;
  onSaveItem: (item: InventoryItem) => void;
  onSaveLedger: (acc: PgcAccount) => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  type,
  locale = 'pt',
  onClose,
  onSaveCustomer,
  onSaveItem,
  onSaveLedger,
}) => {
  const t = TRANSLATIONS[locale];
  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'ITEM' | 'LEDGER'>(type);

  // Sync active tab with incoming type prop
  useEffect(() => {
    setActiveTab(type);
  }, [type]);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Customer Form State
  const [custName, setCustName] = useState('');
  const [custNif, setCustNif] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custType, setCustType] = useState<'FORMAL_CORPORATE' | 'INFORMAL_CASH'>('FORMAL_CORPORATE');

  // Item Form State
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemCategory, setItemCategory] = useState<'FINISHED_GOOD' | 'TRADING_MERCHANDISE' | 'RAW_MATERIAL'>('TRADING_MERCHANDISE');
  const [itemUnit, setItemUnit] = useState('UN');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [itemStock, setItemStock] = useState('0');

  // Ledger Form State
  const [accCode, setAccCode] = useState('');
  const [accName, setAccName] = useState('');
  const [accClass, setAccClass] = useState(3);

  if (!isOpen) return null;

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) return;
    const newCust: Customer = {
      id: `CLI-${Date.now().toString().slice(-4)}`,
      code: `CLI-${Math.floor(Math.random() * 900 + 100)}`,
      name: custName,
      nif: custNif || '999999999',
      address: custAddress || 'Luanda, Angola',
      city: 'Luanda',
      province: 'Luanda',
      phone: custPhone || '+244 9xx xxx xxx',
      email: '',
      customerType: custType,
      creditLimit: 10000000,
      currentBalance: 0,
    };
    onSaveCustomer(newCust);
    onClose();
  };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return;
    const newItem: InventoryItem = {
      id: `ITEM-${Date.now().toString().slice(-4)}`,
      code: itemCode || `SKU-${Math.floor(Math.random() * 900 + 100)}`,
      name: itemName,
      category: itemCategory,
      unit: itemUnit,
      sellingPrice: parseFloat(itemPrice) || 0,
      costPrice: parseFloat(itemCost) || 0,
      currentStock: parseFloat(itemStock) || 0,
      minStockAlert: 10,
      vatRateCode: 'NOR',
      warehouseLocation: 'Armazém Viana',
    };
    onSaveItem(newItem);
    onClose();
  };

  const handleLedgerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName || !accCode) return;
    const newAcc: PgcAccount = {
      code: accCode,
      name: accName,
      classNumber: accClass,
      type: accClass >= 6 ? 'CREDIT' : 'DEBIT',
      balance: 0,
    };
    onSaveLedger(newAcc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xs shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header with Alt+C badge */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#002244] border-b border-[#003366]">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#001733] text-amber-300 border border-[#002d62] rounded-xs">
              Alt+C
            </span>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              {t.qcModalTitle}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-[#001733] px-3 pt-1 gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('CUSTOMER')}
            className={`py-1 px-2.5 text-xs font-bold flex items-center space-x-1.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'CUSTOMER'
                ? 'border-amber-400 text-amber-300 bg-[#002244]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t.qcTabCustomer}</span>
          </button>
          <button
            onClick={() => setActiveTab('ITEM')}
            className={`py-1 px-2.5 text-xs font-bold flex items-center space-x-1.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'ITEM'
                ? 'border-amber-400 text-amber-300 bg-[#002244]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>{t.qcTabItem}</span>
          </button>
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`py-1 px-2.5 text-xs font-bold flex items-center space-x-1.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'LEDGER'
                ? 'border-amber-400 text-amber-300 bg-[#002244]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>{t.qcTabLedger}</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-3">
          {activeTab === 'CUSTOMER' && (
            <form onSubmit={handleCustomerSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcCustName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="ex: Luanda Construções e Empreendimentos Lda"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-amber-400"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcCustNif} *
                  </label>
                  <input
                    type="text"
                    value={custNif}
                    onChange={(e) => setCustNif(e.target.value)}
                    placeholder="ex: 5412093841 ou 999999999"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcCustType}
                  </label>
                  <select
                    value={custType}
                    onChange={(e) => setCustType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden font-medium"
                  >
                    <option value="FORMAL_CORPORATE">{t.qcCustCorporate}</option>
                    <option value="INFORMAL_CASH">{t.qcCustCash}</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcCustAddress}
                  </label>
                  <input
                    type="text"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    placeholder="ex: Estrada de Viana, Km 14, Luanda"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1 rounded-xs bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600 font-bold uppercase cursor-pointer"
                >
                  {t.qcBtnCancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-xs bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  {t.qcBtnSave}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'ITEM' && (
            <form onSubmit={handleItemSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcItemName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="ex: Bloco de Cimento Vibrado 15cm"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-amber-400"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcItemCode}
                  </label>
                  <input
                    type="text"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="ex: BLC-15CM"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcItemCategory}
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden font-medium"
                  >
                    <option value="TRADING_MERCHANDISE">{t.stCatTrading || 'Mercadoria para Revenda'}</option>
                    <option value="FINISHED_GOOD">{t.stCatFinished || 'Produto Acabado (Fabril)'}</option>
                    <option value="RAW_MATERIAL">{t.stCatRaw || 'Matéria-Prima Industrial'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcItemSellingPrice} *
                  </label>
                  <input
                    type="number"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-amber-400 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcItemCostPrice}
                  </label>
                  <input
                    type="number"
                    value={itemCost}
                    onChange={(e) => setItemCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-amber-400 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {locale === 'pt' ? 'Unidade de Medida' : 'Unit of Measure'}
                  </label>
                  <input
                    type="text"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    placeholder="UN, KG, TON, M2"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcItemInitialStock}
                  </label>
                  <input
                    type="number"
                    value={itemStock}
                    onChange={(e) => setItemStock(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-amber-400 font-mono-num"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1 rounded-xs bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600 font-bold uppercase cursor-pointer"
                >
                  {t.qcBtnCancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-xs bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  {t.qcBtnSave}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'LEDGER' && (
            <form onSubmit={handleLedgerSubmit} className="space-y-3">
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcLedgerCode} *
                  </label>
                  <input
                    type="text"
                    required
                    value={accCode}
                    onChange={(e) => setAccCode(e.target.value)}
                    placeholder="ex: 31.1.05 ou 61.2.03"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-amber-400 font-mono-num"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcLedgerName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    placeholder="ex: Clientes Província de Benguela"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                    {t.qcLedgerClass}
                  </label>
                  <select
                    value={accClass}
                    onChange={(e) => setAccClass(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-hidden font-medium"
                  >
                    <option value={1}>{locale === 'pt' ? 'Classe 1: Meios Fixos' : 'Class 1: Fixed Assets'}</option>
                    <option value={2}>{locale === 'pt' ? 'Classe 2: Existências' : 'Class 2: Inventory'}</option>
                    <option value={3}>{locale === 'pt' ? 'Classe 3: Terceiros (Clientes / Fornecedores / Estado)' : 'Class 3: Third Parties (Debtors / Creditors)'}</option>
                    <option value={4}>{locale === 'pt' ? 'Classe 4: Meios Monetários (Bancos / Caixa)' : 'Class 4: Cash & Bank Accounts'}</option>
                    <option value={5}>{locale === 'pt' ? 'Classe 5: Capital Próprio' : 'Class 5: Equity & Reserves'}</option>
                    <option value={6}>{locale === 'pt' ? 'Classe 6: Proveitos por Natureza (Vendas)' : 'Class 6: Revenue from Operations'}</option>
                    <option value={7}>{locale === 'pt' ? 'Classe 7: Custos por Natureza (CMV / FSE)' : 'Class 7: Operating Expenses'}</option>
                    <option value={8}>{locale === 'pt' ? 'Classe 8: Resultados' : 'Class 8: Profit & Loss Statement'}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1 rounded-xs bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600 font-bold uppercase cursor-pointer"
                >
                  {t.qcBtnCancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-xs bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  {t.qcBtnSave}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
