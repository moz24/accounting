import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Plus, 
  Trash2, 
  Printer, 
  ArrowRightLeft, 
  Check, 
  Search, 
  User, 
  Building2, 
  CreditCard, 
  Banknote, 
  ArrowUpRight, 
  AlertCircle,
  Hash,
  Layers,
  HelpCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { 
  Customer, 
  InventoryItem, 
  DualSeriesInvoice, 
  DocumentSeriesType, 
  DocumentType,
  InvoiceLine,
  VatRateCode 
} from '../types/accounting';
import { generateAgtInvoiceHash } from '../services/cryptoEngine';
import { Locale, TRANSLATIONS } from '../lib/translations';

interface DualSeriesCheckoutProps {
  customers: Customer[];
  inventory: InventoryItem[];
  invoices: DualSeriesInvoice[];
  locale?: Locale;
  onSaveInvoice: (invoice: DualSeriesInvoice) => void;
  onOpenQuickCreate: (type: 'CUSTOMER' | 'ITEM' | 'LEDGER') => void;
  onPrintInvoice: (invoice: DualSeriesInvoice) => void;
  onPromoteToFiscal: (proformaInvoice: DualSeriesInvoice) => void;
}

// Convert monetary number to text (PT and EN)
function numberToWords(num: number, locale: Locale = 'pt'): string {
  const rounded = Math.round(num);
  if (locale === 'en') {
    if (rounded === 0) return 'Zero Kwanzas';
    if (rounded >= 1000000) {
      const millions = (rounded / 1000000).toFixed(2);
      return `${millions} Million Kwanzas`;
    }
    if (rounded >= 1000) {
      const thousands = (rounded / 1000).toFixed(0);
      return `${thousands} Thousand Kwanzas`;
    }
    return `${rounded} Kwanzas`;
  }
  if (rounded === 0) return 'Zero Kwanzas';
  if (rounded >= 1000000) {
    const millions = (rounded / 1000000).toFixed(2);
    return `${millions} Milhões de Kwanzas`;
  }
  if (rounded >= 1000) {
    const thousands = (rounded / 1000).toFixed(0);
    return `${thousands} Mil Kwanzas`;
  }
  return `${rounded} Kwanzas`;
}

export const DualSeriesCheckout: React.FC<DualSeriesCheckoutProps> = ({
  customers,
  inventory,
  invoices,
  locale = 'pt',
  onSaveInvoice,
  onOpenQuickCreate,
  onPrintInvoice,
  onPromoteToFiscal,
}) => {
  const t = TRANSLATIONS[locale];
  // Option 1 Dual-Series Engine: Fiscal AGT vs Internal Pro-Forma
  const [seriesType, setSeriesType] = useState<DocumentSeriesType>('FISCAL_AGT');
  const [docType, setDocType] = useState<DocumentType>('FT');

  // Customer / Party Details
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Voucher Line Items (Tally Particulars Grid)
  const [lines, setLines] = useState<InvoiceLine[]>([
    {
      id: 'L-1',
      itemId: inventory[0]?.id || '',
      itemCode: inventory[0]?.code || '',
      description: inventory[0]?.name || '',
      quantity: 10,
      unitPrice: inventory[0]?.sellingPrice || 0,
      discountPercent: 0,
      vatRateCode: 'NOR',
      vatPercent: 14,
      netTotal: (inventory[0]?.sellingPrice || 0) * 10,
      vatAmount: (inventory[0]?.sellingPrice || 0) * 10 * 0.14,
      grossTotal: (inventory[0]?.sellingPrice || 0) * 10 * 1.14,
    },
  ]);

  // Payment, Narration & Settlement
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MULTICAIXA_TPA' | 'BANK_TRANSFER_BAI' | 'BANK_TRANSFER_BFA' | 'CREDIT'>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [applyWithholding, setApplyWithholding] = useState(false); // 6.5% Retenção na fonte
  const [narration, setNarration] = useState('Fornecimento de materiais de construção civil com expedição imediata.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Item Quick Add Row
  const [addItemId, setAddItemId] = useState<string>(inventory[0]?.id || '');
  const [addQty, setAddQty] = useState<number>(1);

  // Numbering Sequences
  const fiscalCount = invoices.filter((i) => i.seriesType === 'FISCAL_AGT').length;
  const internalCount = invoices.filter((i) => i.seriesType === 'PROFORMA_INTERNAL').length;

  const nextFiscalSeq = fiscalCount + 1;
  const nextInternalSeq = internalCount + 1;

  const currentVoucherNumber = seriesType === 'FISCAL_AGT'
    ? `${docType} AGT2026/${nextFiscalSeq.toString().padStart(4, '0')}`
    : `${docType} INT2026/${nextInternalSeq.toString().padStart(4, '0')}`;

  // Handle Document Type change (FT, FR, FP, EC, NC, GT)
  const handleSelectDocType = (newDocType: DocumentType) => {
    setDocType(newDocType);
    const isFiscal = ['FT', 'FR', 'NC', 'GT'].includes(newDocType);
    const newSeries: DocumentSeriesType = isFiscal ? 'FISCAL_AGT' : 'PROFORMA_INTERNAL';
    setSeriesType(newSeries);

    if (isFiscal) {
      setLines((prev) =>
        prev.map((l) => {
          const vatP = 14;
          const net = l.quantity * l.unitPrice * (1 - l.discountPercent / 100);
          const vat = net * (vatP / 100);
          return {
            ...l,
            vatRateCode: 'NOR',
            vatPercent: vatP,
            netTotal: net,
            vatAmount: vat,
            grossTotal: net + vat,
          };
        })
      );
    } else {
      setLines((prev) =>
        prev.map((l) => {
          const net = l.quantity * l.unitPrice * (1 - l.discountPercent / 100);
          return {
            ...l,
            vatRateCode: 'ISE',
            vatPercent: 0,
            netTotal: net,
            vatAmount: 0,
            grossTotal: net,
          };
        })
      );
    }
  };

  // Keyboard shortcut listener: F8 toggles between FT and FP
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault();
        handleSelectDocType(seriesType === 'FISCAL_AGT' ? 'FP' : 'FT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [seriesType]);

  // Update line item
  const updateLine = (index: number, updates: Partial<InvoiceLine>) => {
    setLines((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], ...updates };

      const net = target.quantity * target.unitPrice * (1 - target.discountPercent / 100);
      const isInternal = seriesType === 'PROFORMA_INTERNAL';
      const vatP = isInternal ? 0 : target.vatPercent;
      const vat = net * (vatP / 100);

      copy[index] = {
        ...target,
        vatPercent: vatP,
        netTotal: Math.round(net * 100) / 100,
        vatAmount: Math.round(vat * 100) / 100,
        grossTotal: Math.round((net + vat) * 100) / 100,
      };
      return copy;
    });
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const addLine = () => {
    const item = inventory.find((i) => i.id === addItemId) || inventory[0];
    const isInternal = seriesType === 'PROFORMA_INTERNAL';
    const vatP = isInternal ? 0 : 14;
    const net = addQty * item.sellingPrice;
    const vat = isInternal ? 0 : net * 0.14;

    const newLine: InvoiceLine = {
      id: `L-${Date.now().toString().slice(-4)}`,
      itemId: item.id,
      itemCode: item.code,
      description: item.name,
      quantity: addQty,
      unitPrice: item.sellingPrice,
      discountPercent: 0,
      vatRateCode: isInternal ? 'ISE' : 'NOR',
      vatPercent: vatP,
      netTotal: net,
      vatAmount: vat,
      grossTotal: net + vat,
    };

    setLines((prev) => [...prev, newLine]);
    setAddQty(1);
  };

  // Grand Totals Calculation
  const grossSubtotal = lines.reduce((s, l) => s + (l.quantity * l.unitPrice), 0);
  const discountTotal = lines.reduce((s, l) => s + (l.quantity * l.unitPrice * (l.discountPercent / 100)), 0);
  const subtotal = lines.reduce((s, l) => s + l.netTotal, 0); // Net Taxable Base
  const vatTotal = lines.reduce((s, l) => s + l.vatAmount, 0);
  const withholdingTaxPercent = applyWithholding ? 6.5 : 0;
  const withholdingTaxAmount = applyWithholding ? (subtotal * 0.065) : 0;
  const grandTotal = Math.max(0, subtotal + vatTotal - withholdingTaxAmount);

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = tenderedNum > grandTotal ? tenderedNum - grandTotal : 0;

  // Authentic Tally Accept Modal State
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  // Submit Voucher Execution Engine
  const executeAcceptVoucher = async () => {
    if (lines.length === 0 || !currentCustomer) return;
    setIsSubmitting(true);

    const now = new Date();
    const invoiceDate = now.toISOString().split('T')[0];
    const systemEntryDate = now.toISOString().replace('Z', '');

    let hashChainingData = undefined;

    if (seriesType === 'FISCAL_AGT') {
      const sortedFiscal = invoices
        .filter((i) => i.seriesType === 'FISCAL_AGT')
        .sort((a, b) => a.sequentialNumber - b.sequentialNumber);
      const lastFiscal = sortedFiscal[sortedFiscal.length - 1];
      const previousHash = lastFiscal?.hashChaining?.currentHash || '';

      const hashResult = await generateAgtInvoiceHash({
        invoiceDate,
        systemEntryDate,
        invoiceNo: currentVoucherNumber,
        grossTotal: grandTotal,
        previousHash,
      });

      hashChainingData = {
        currentHash: hashResult.signatureBase64,
        previousHash: hashResult.previousHash,
        hashControl: hashResult.hashControl,
        certificateNumber: '412/AGT/2026',
        fullSignature: hashResult.signatureBase64,
      };
    }

    const newInvoice: DualSeriesInvoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      seriesType,
      docType,
      seriesNumber: currentVoucherNumber,
      sequentialNumber: seriesType === 'FISCAL_AGT' ? nextFiscalSeq : nextInternalSeq,
      date: invoiceDate,
      systemEntryDate,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerNif: currentCustomer.nif,
      customerAddress: currentCustomer.address,
      lines,
      subtotal,
      discountTotal,
      vatTotal,
      withholdingTaxPercent,
      withholdingTaxAmount,
      grandTotal,
      paymentMethod,
      cashReceived: tenderedNum || undefined,
      changeGiven: changeDue || undefined,
      hashChaining: hashChainingData,
      isSaftExported: false,
      notes: narration || undefined,
    };

    onSaveInvoice(newInvoice);
    setIsSubmitting(false);

    // Prompt print
    onPrintInvoice(newInvoice);
  };

  const handleAcceptVoucher = () => {
    if (lines.length === 0 || !currentCustomer) return;
    setShowAcceptModal(true);
  };

  // Tally Keyboard Shortcut Listener: Ctrl+A to trigger Accept, Y/N to confirm/cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (lines.length > 0 && currentCustomer) {
          setShowAcceptModal(true);
        }
      }
      if (showAcceptModal) {
        if (e.key === 'y' || e.key === 'Y' || e.key === 'Enter') {
          e.preventDefault();
          setShowAcceptModal(false);
          executeAcceptVoucher();
        } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
          e.preventDefault();
          setShowAcceptModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAcceptModal, lines, currentCustomer, grandTotal]);

  return (
    <div className="space-y-4">
      {/* Tally Classic Voucher Frame */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xs shadow-xl overflow-hidden">
        {/* Top Header: Voucher Title Bar */}
        <div className="bg-[#002d62] text-white px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
              {t.voucherTitle}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-xs font-bold text-white uppercase">
              {seriesType === 'FISCAL_AGT' ? t.salesFiscal : t.salesInternal}
            </span>
          </div>

          {/* Document Status & Quick Toggle */}
          <div className="flex items-center space-x-2">
            {seriesType === 'FISCAL_AGT' ? (
              <div className="flex items-center space-x-1.5">
                <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-xs bg-emerald-950/90 text-emerald-300 border border-emerald-600/80 flex items-center space-x-1.5 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.badgeFiscal}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectDocType('FP')}
                  className="px-2.5 py-1 text-xs font-mono font-bold rounded-xs bg-[#001f3f] hover:bg-[#003366] text-amber-300 border border-blue-400/40 transition-colors cursor-pointer"
                  title="F8: Mudar para Cotação / Pró-Forma"
                >
                  <span className="text-amber-400 font-bold">F8:</span> {locale === 'pt' ? 'Cotação (FP)' : 'Quote (FP)'}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-xs bg-amber-950/90 text-amber-300 border border-amber-600/80 flex items-center space-x-1.5 shadow-xs">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.badgeProforma}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectDocType('FT')}
                  className="px-2.5 py-1 text-xs font-mono font-bold rounded-xs bg-[#001f3f] hover:bg-[#003366] text-emerald-300 border border-blue-400/40 transition-colors cursor-pointer"
                  title="F8: Mudar para Factura Fiscal Certificada"
                >
                  <span className="text-emerald-400 font-bold">F8:</span> {locale === 'pt' ? 'Factura (FT)' : 'Invoice (FT)'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Voucher Meta Strip: No, Reference, Date */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono-num">
          <div>
            <span className="text-slate-400 block text-[10px]">{t.voucherNo}</span>
            <span className="font-bold text-white text-sm">{currentVoucherNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">{t.docType}</span>
            <select
              value={docType}
              onChange={(e) => handleSelectDocType(e.target.value as any)}
              className="bg-slate-900 text-white border border-slate-700 rounded-xs px-2 py-0.5 text-xs focus:outline-hidden font-medium"
            >
              <optgroup label={locale === 'pt' ? 'Documentos Fiscais Definitivos (AGT)' : 'Definitive Fiscal Documents (AGT)'}>
                <option value="FT">{locale === 'pt' ? 'FT - Factura Fiscal Certificada' : 'FT - Certified Fiscal Invoice'}</option>
                <option value="FR">{locale === 'pt' ? 'FR - Factura / Recibo' : 'FR - Cash Sale Invoice / Receipt'}</option>
                <option value="NC">{locale === 'pt' ? 'NC - Nota de Crédito' : 'NC - Credit Note'}</option>
                <option value="GT">{locale === 'pt' ? 'GT - Guia de Transporte' : 'GT - Delivery Note / Waybill'}</option>
              </optgroup>
              <optgroup label={locale === 'pt' ? 'Documentos Provisórios & Cotações' : 'Provisional & Quotation Documents'}>
                <option value="FP">{locale === 'pt' ? 'FP - Factura Pró-Forma (Cotação Comercial)' : 'FP - Pro-Forma Invoice (Commercial Quote)'}</option>
                <option value="EC">{locale === 'pt' ? 'EC - Encomenda de Cliente' : 'EC - Customer Sales Order'}</option>
                <option value="VD">{locale === 'pt' ? 'VD - Venda a Dinheiro Balcão' : 'VD - Cash Counter Sale'}</option>
              </optgroup>
            </select>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">{t.issueDate}</span>
            <span className="font-bold text-slate-200">05-Oct-2026</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">{t.taxRegime}</span>
            <span className={seriesType === 'FISCAL_AGT' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {seriesType === 'FISCAL_AGT' ? t.regimeNormal : t.regimeExempt}
            </span>
          </div>
        </div>

        {/* Party Details & Accounting Ledgers (Tally Party Box) */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
          {/* Party A/c Name */}
          <div className="md:col-span-6 space-y-1">
            <div className="flex justify-between items-baseline">
              <label className="text-[11px] font-bold text-slate-300">
                {t.partyAccount}
              </label>
              <button
                type="button"
                onClick={() => onOpenQuickCreate('CUSTOMER')}
                className="text-amber-400 hover:underline font-mono text-[10px] font-bold"
              >
                {t.quickNewClient}
              </button>
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xs px-2.5 py-1.5 focus:outline-hidden focus:border-amber-400 font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (NIF: {c.nif})
                </option>
              ))}
            </select>
            <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
              <span>{t.currentBalance} <strong className="text-slate-200 font-mono-num">{currentCustomer.currentBalance.toLocaleString('pt-AO')} Kz Dr</strong></span>
              <span>{t.nifLabel} <strong className="text-slate-200 font-mono-num">{currentCustomer.nif}</strong></span>
            </div>
          </div>

          {/* Sales Account & Payment Mode */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">
              {t.salesLedger}
            </label>
            <input
              type="text"
              readOnly
              value={t.salesLedgerValue}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xs px-2.5 py-1.5 font-mono-num text-[11px]"
            />
            <div className="text-[10px] text-slate-400">{t.salesLedgerClass}</div>
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">
              {t.paymentMode}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xs px-2.5 py-1.5 focus:outline-hidden font-medium"
            >
              <option value="CASH">{t.payCash}</option>
              <option value="MULTICAIXA_TPA">{t.payMulticaixa}</option>
              <option value="BANK_TRANSFER_BAI">{t.payBai}</option>
              <option value="BANK_TRANSFER_BFA">{t.payBfa}</option>
              <option value="CREDIT">{t.payCredit}</option>
            </select>
          </div>
        </div>

        {/* Quick Add Particulars Bar */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 grid grid-cols-12 gap-2 items-center text-xs">
          <div className="col-span-7">
            <select
              value={addItemId}
              onChange={(e) => setAddItemId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2 py-1 text-slate-100 text-xs focus:outline-hidden"
            >
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.code}] {item.name} — {item.sellingPrice.toLocaleString('pt-AO')} Kz (Stock: {item.currentStock} {item.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <input
              type="number"
              min="1"
              value={addQty}
              onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2 py-1 text-center font-mono-num text-xs text-white focus:outline-hidden"
            />
          </div>
          <div className="col-span-3 flex space-x-2">
            <button
              type="button"
              onClick={addLine}
              className="w-full py-1 px-3 bg-[#004080] hover:bg-[#0055aa] text-white font-bold rounded-xs text-xs flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Artigo</span>
            </button>
          </div>
        </div>

        {/* Authentic Tally Spreadsheet Table Grid */}
        <div className="overflow-x-auto bg-slate-900">
          <table className="w-full accounting-grid text-xs">
            <thead>
              <tr>
                <th className="w-12 text-center">{t.colSlNo}</th>
                <th>{t.colItem}</th>
                <th className="w-36">{t.colWarehouse}</th>
                <th className="w-24 text-right">{t.colQty}</th>
                <th className="w-32 text-right">{t.colRate}</th>
                <th className="w-20 text-center">{t.colPer}</th>
                <th className="w-20 text-right">{t.colDisc}</th>
                <th className="w-20 text-right">{t.colTax}</th>
                <th className="w-36 text-right">{t.colAmount}</th>
                <th className="w-10 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const invItem = inventory.find((i) => i.id === line.itemId);
                return (
                  <tr key={line.id} className="font-mono-num">
                    <td className="text-center text-slate-400">{idx + 1}</td>
                    <td className="font-sans">
                      <div className="font-bold text-white">{line.description}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{line.itemCode}</div>
                    </td>
                    <td className="font-sans text-slate-300 text-[11px]">
                      {invItem?.warehouseLocation || 'Armazém Viana'}
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, { quantity: parseFloat(e.target.value) || 1 })}
                        className="w-20 bg-slate-950 border border-slate-700 px-1 py-0.5 text-right font-mono-num text-white rounded-xs focus:outline-hidden"
                      />
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-28 bg-slate-950 border border-slate-700 px-1 py-0.5 text-right font-mono-num text-white rounded-xs focus:outline-hidden"
                      />
                    </td>
                    <td className="text-center font-sans text-slate-400">
                      {invItem?.unit || 'UN'}
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={line.discountPercent}
                        onChange={(e) => updateLine(idx, { discountPercent: parseFloat(e.target.value) || 0 })}
                        className="w-14 bg-slate-950 border border-slate-700 px-1 py-0.5 text-right font-mono-num text-white rounded-xs focus:outline-hidden"
                      />
                    </td>
                    <td className="text-right font-bold text-slate-300">
                      {seriesType === 'FISCAL_AGT' ? `${line.vatPercent}%` : '0%'}
                    </td>
                    <td className="text-right font-bold text-white text-sm">
                      {line.grossTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length === 1}
                        className="text-slate-500 hover:text-rose-400 disabled:opacity-20 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Voucher Bottom: Narration on Left, Exact Accounting Calculations on Right */}
        <div className="bg-slate-950 p-4 border-t-2 border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
          {/* Narration & In-Words (Left 7 Cols) */}
          <div className="md:col-span-7 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {t.totalInWords}
              </span>
              <div className="total-in-words-box">
                {numberToWords(grandTotal, locale)}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {t.narration}
              </label>
              <textarea
                rows={2}
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder={locale === 'pt' ? 'Introduza a narrativa para registo no Diário Geral PGC...' : 'Enter narration for General Journal ledger posting...'}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 text-xs rounded-xs focus:outline-hidden focus:border-amber-400"
              />
            </div>

            {/* Cash Settlement Troco Box */}
            {paymentMethod === 'CASH' && (
              <div className="p-2.5 bg-slate-900 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">{t.cashReceived}</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder="0.00 Kz"
                    className="w-full bg-slate-950 border border-slate-700 px-2 py-1 text-right font-mono-num text-white rounded-xs text-xs mt-0.5"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{t.changeDue}</span>
                  <div className="text-sm font-bold font-mono-num text-emerald-400 mt-1">
                    {changeDue.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Totals Breakdown (Right 5 Cols) */}
          <div className="md:col-span-5 bg-slate-900 border border-slate-800 p-4 rounded-xs space-y-2 font-mono-num text-xs">
            {discountTotal > 0 ? (
              <>
                <div className="flex justify-between text-slate-300">
                  <span className="font-sans">{locale === 'pt' ? 'Total Ilíquido:' : 'Gross Amount:'}</span>
                  <span>{grossSubtotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span className="font-sans">{t.commercialDisc}</span>
                  <span>-{discountTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-medium">
                  <span className="font-sans">{locale === 'pt' ? 'Base Tributável (Líquida):' : 'Taxable Base:'}</span>
                  <span>{subtotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-300">
                <span className="font-sans">{t.subtotal}</span>
                <span>{subtotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
              </div>
            )}

            <div className="flex justify-between text-slate-300">
              <span className="font-sans">
                {t.vatLabel} ({seriesType === 'FISCAL_AGT' ? 'Taxa Normal 14%' : '0% Isento'}):
              </span>
              <span>{vatTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
            </div>

            {/* Withholding tax checkbox */}
            <div className="pt-1.5 border-t border-slate-800 font-sans flex items-center justify-between text-[11px]">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyWithholding}
                  onChange={(e) => setApplyWithholding(e.target.checked)}
                  className="accent-amber-400"
                />
                <span className="text-slate-300">{t.withholdingLabel}</span>
              </label>
              {applyWithholding && (
                <span className="font-mono-num text-amber-400">
                  -{withholdingTaxAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                </span>
              )}
            </div>

            {/* Grand Total */}
            <div className="pt-2 border-t-2 border-slate-700 flex justify-between items-baseline font-bold accounting-double-total">
              <span className="font-sans text-slate-200 uppercase text-xs">{t.grandTotal}</span>
              <span className="text-xl text-white">
                {grandTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
              </span>
            </div>

            {/* Accept? Yes / No Buttons (Authentic Tally Finish) */}
            <div className="pt-3 border-t border-slate-800 flex space-x-2">
              <button
                type="button"
                onClick={handleAcceptVoucher}
                disabled={isSubmitting || lines.length === 0}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xs shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                title="Pressione Ctrl+A ou clique para Gravar"
              >
                <Check className="w-4 h-4" />
                <span>{t.acceptBtn} (Ctrl+A)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Authentic Tally Accept Modal Prompt */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#002244] border-2 border-amber-400 text-white rounded-xs shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="text-xl font-bold font-mono tracking-wider text-amber-300 uppercase">
              Accept?
            </div>
            <div className="text-sm font-semibold text-slate-200">
              Yes or No (Y / N)
            </div>
            <div className="bg-[#001733] border border-blue-400/40 p-3 rounded-xs text-xs font-mono space-y-1">
              <div className="text-amber-400 font-bold">{currentVoucherNumber}</div>
              <div className="text-slate-300 font-sans truncate">{currentCustomer?.name}</div>
              <div className="text-emerald-400 font-bold text-base pt-1">
                {grandTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
              </div>
            </div>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setShowAcceptModal(false);
                  executeAcceptVoucher();
                }}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black font-mono text-sm uppercase rounded-xs border border-emerald-400 cursor-pointer shadow-md"
              >
                Yes (Y)
              </button>
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="px-6 py-2 bg-rose-700 hover:bg-rose-600 text-white font-black font-mono text-sm uppercase rounded-xs border border-rose-500 cursor-pointer shadow-md"
              >
                No (N)
              </button>
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              Pressione <kbd className="text-amber-300 font-bold px-1 bg-slate-900 border border-slate-700 rounded-xs">Y / Enter</kbd> para Gravar, <kbd className="text-amber-300 font-bold px-1 bg-slate-900 border border-slate-700 rounded-xs">N / Esc</kbd> para Cancelar
            </div>
          </div>
        </div>
      )}

      {/* List of Previous Vouchers with 1-Click Promote */}
      <div className="bg-slate-900 border border-slate-800 rounded-xs overflow-hidden text-xs">
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
          <span className="font-bold uppercase tracking-wider text-slate-300 font-mono text-[11px]">
            {t.previousVouchers}
          </span>
          <span className="text-slate-400 text-[10px]">Total: {invoices.length} vouchers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full accounting-grid">
            <thead>
              <tr>
                <th>{t.dbColVoucher}</th>
                <th>{t.dbColType}</th>
                <th>{t.dbColDate}</th>
                <th>{t.dbColCustomer}</th>
                <th className="text-right">{t.dbColTotal}</th>
                <th className="text-center">{t.dbColAgtSig}</th>
                <th className="text-right">{t.dbColActions}</th>
              </tr>
            </thead>
            <tbody className="font-mono-num">
              {invoices.map((inv) => {
                const isFisc = inv.seriesType === 'FISCAL_AGT';
                return (
                  <tr key={inv.id}>
                    <td className="font-bold text-white">{inv.seriesNumber}</td>
                    <td className="font-sans">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs ${
                          isFisc
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {isFisc ? (locale === 'pt' ? 'Factura Fiscal (FT)' : 'Tax Invoice (FT)') : (locale === 'pt' ? 'Cotação / Pró-Forma (FP)' : 'Quote / Pro-Forma (FP)')}
                      </span>
                    </td>
                    <td className="text-slate-300">{inv.date}</td>
                    <td className="font-sans text-slate-200 font-medium">{inv.customerName}</td>
                    <td className="text-right font-bold text-white">
                      {inv.grandTotal.toLocaleString('pt-AO')} Kz
                    </td>
                    <td className="text-center">
                      {isFisc ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-slate-950 px-1 border border-slate-800">
                          {inv.hashChaining?.hashControl || 'OK'}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="text-right space-x-2">
                      {!isFisc && (
                        <button
                          type="button"
                          onClick={() => onPromoteToFiscal(inv)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-emerald-900 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 cursor-pointer"
                        >
                          {t.promoteToFiscal}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onPrintInvoice(inv)}
                        className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                      >
                        {t.printBtn}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
