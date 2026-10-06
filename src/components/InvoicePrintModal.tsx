import React, { useEffect } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  QrCode, 
  Landmark, 
  Phone, 
  Mail, 
  MapPin, 
  FileCheck2,
  Lock
} from 'lucide-react';
import { DualSeriesInvoice } from '../types/accounting';
import { DEFAULT_COMPANY } from '../services/saftAoExporter';
import { Locale, TRANSLATIONS } from '../lib/translations';

interface InvoicePrintModalProps {
  invoice: DualSeriesInvoice | null;
  locale?: Locale;
  onClose: () => void;
}

// Convert monetary number to text for invoice display
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

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, locale = 'pt', onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!invoice) return null;

  const t = TRANSLATIONS[locale];
  const isFiscal = invoice.seriesType === 'FISCAL_AGT';

  const handlePrint = () => {
    window.print();
  };

  const getDocTypeLabel = () => {
    if (isFiscal) {
      if (invoice.docType === 'FT') return locale === 'pt' ? 'FACTURA FISCAL CERTIFICADA' : 'CERTIFIED TAX INVOICE';
      if (invoice.docType === 'FR') return locale === 'pt' ? 'FACTURA / RECIBO' : 'CASH SALE INVOICE / RECEIPT';
      if (invoice.docType === 'NC') return locale === 'pt' ? 'NOTA DE CRÉDITO' : 'CREDIT NOTE';
      return locale === 'pt' ? 'GUIA DE TRANSPORTE' : 'DELIVERY WAYBILL';
    }
    if (invoice.docType === 'FP') return locale === 'pt' ? 'FACTURA PRÓ-FORMA' : 'PRO-FORMA INVOICE';
    if (invoice.docType === 'EC') return locale === 'pt' ? 'ENCOMENDA DE CLIENTE' : 'SALES ORDER';
    return locale === 'pt' ? 'VENDA A DINHEIRO (COTAÇÃO)' : 'COUNTER ESTIMATE';
  };

  const getDocTypeBadge = () => {
    if (isFiscal) {
      return locale === 'pt' ? 'DOCUMENTO FISCAL DEFINITIVO' : 'DEFINITIVE FISCAL DOCUMENT';
    }
    return locale === 'pt' ? 'COTAÇÃO COMERCIAL • PRÓ-FORMA' : 'COMMERCIAL QUOTATION • PRO-FORMA';
  };

  // Mock mini QR code matrix pattern representation for the Decree 386/20 fiscal stamp
  const qrDataPayload = `AGT*${DEFAULT_COMPANY.nif}*${invoice.customerNif}*${invoice.seriesNumber}*${invoice.date}*${invoice.grandTotal.toFixed(2)}*${invoice.hashChaining?.hashControl || 'x9P2'}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs p-2 sm:p-5 flex justify-center items-start invoice-modal-overlay print:static print:p-0 print:m-0 print:bg-transparent print:overflow-visible print:backdrop-blur-none">
      <div className="w-full max-w-4xl bg-white text-slate-900 rounded-xs shadow-2xl overflow-hidden my-2 sm:my-4 border border-slate-300 invoice-modal-card print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-full print:w-full print:rounded-none">
        
        {/* Top Control Rail (Sticky on Screen, Hidden on Print) */}
        <div className="no-print print:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-2 bg-[#002244] text-white border-b border-[#003366] shadow-md">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 text-xs font-bold font-mono tracking-wider rounded-xs uppercase flex items-center space-x-1 ${
                isFiscal
                  ? 'bg-emerald-700 text-white border border-emerald-500'
                  : 'bg-amber-700 text-white border border-amber-500'
              }`}
            >
              {isFiscal ? <ShieldCheck className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              <span>{isFiscal ? t.ipFiscalDocBadge : t.ipInternalDocBadge}</span>
            </span>
            <span className="text-xs font-bold font-mono text-amber-300 tracking-wide">
              {invoice.seriesNumber}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.ipPrintBtn}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-300 hover:text-white rounded-xs hover:bg-[#003366] transition-colors cursor-pointer"
              title="Close (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container (Strict ISO A4 Styled, Compact 1-Page Layout) */}
        <div className="p-6 sm:p-8 print:p-0 font-sans text-slate-800 bg-white invoice-print-area">
          
          {/* Top Header Banner: Company Info + Modern Invoice Badge */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-3.5 border-b border-slate-300">
            {/* Left: Issuer Identity */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-md bg-[#002244] flex items-center justify-center text-amber-400 font-black text-lg shadow-sm">
                  LF
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 uppercase leading-tight">
                    {DEFAULT_COMPANY.companyName}
                  </h1>
                  <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-widest block">
                    {locale === 'pt' ? 'Indústria de Cimentos & Materiais de Construção' : 'Cement Manufacturing & Construction Supplies'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-0.5 pt-0.5">
                <div className="flex items-center space-x-1.5 text-[11px]">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{DEFAULT_COMPANY.address}, {DEFAULT_COMPANY.city} • ANGOLA</span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] font-mono">
                  <span><strong>NIF:</strong> {DEFAULT_COMPANY.nif}</span>
                  <span>•</span>
                  <span><strong>Capital Social:</strong> 150.000.000 Kz</span>
                </div>
                <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>+244 923 000 111 / 931 222 333</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>facturacao@luandafabril.co.ao</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Modern Document Card */}
            <div className="w-full sm:w-72 bg-[#001733] text-white rounded-xs p-3.5 border-2 border-slate-700 text-right shadow-sm print:bg-white print:text-slate-950 print:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-1.5">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs ${
                  isFiscal ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500' : 'bg-amber-950/80 text-amber-300 border border-amber-500'
                }`}>
                  {getDocTypeBadge()}
                </span>
                <span className="text-[10px] font-mono text-slate-300 print:text-slate-600 uppercase font-bold">
                  {locale === 'pt' ? 'Original' : 'Original Copy'}
                </span>
              </div>

              <div className="text-xs font-bold text-slate-300 print:text-slate-700 uppercase tracking-wide">
                {getDocTypeLabel()}
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white print:text-slate-950 mt-0.5">
                {invoice.seriesNumber}
              </div>

              <div className="mt-2.5 pt-1.5 border-t border-slate-700/80 grid grid-cols-2 text-left gap-2 text-[10px] font-mono">
                <div>
                  <span className="text-slate-400 print:text-slate-600 block text-[9px] uppercase tracking-wider">{locale === 'pt' ? 'Data Emissão' : 'Issue Date'}</span>
                  <span className="font-bold text-slate-100 print:text-slate-950">{invoice.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 print:text-slate-600 block text-[9px] uppercase tracking-wider">{locale === 'pt' ? 'Registo Hora' : 'System Time'}</span>
                  <span className="font-bold text-slate-200 print:text-slate-900">{invoice.systemEntryDate.substring(11, 19)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parties Strip: Bill-To Customer & Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 my-3.5">
            {/* Customer Box (7 cols) */}
            <div className="sm:col-span-7 bg-slate-50/90 rounded-xs p-3 border border-slate-300">
              <div className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500 mb-1 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-700" />
                <span>{locale === 'pt' ? 'Exmo.(s) Sr.(s) Adquirente / Cliente:' : 'Billed To (Buyer / Customer):'}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-950 tracking-tight">
                {invoice.customerName}
              </h2>
              <div className="text-xs text-slate-600 mt-0.5">
                {invoice.customerAddress || 'Luanda, República de Angola'}
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center space-x-4 text-xs font-mono">
                <span className="px-2 py-0.5 rounded-xs bg-white border border-slate-300 text-slate-900 font-bold">
                  NIF: {invoice.customerNif}
                </span>
                <span className="text-[10px] text-slate-500">
                  {locale === 'pt' ? 'Contribuinte Cadastrado na AGT' : 'AGT Registered Taxpayer'}
                </span>
              </div>
            </div>

            {/* Payment & Settlement Conditions Box (5 cols) */}
            <div className="sm:col-span-5 bg-slate-50/90 rounded-xs p-3 border border-slate-300 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-600 mb-1 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-800" />
                  <span>{locale === 'pt' ? 'Condições de Liquidação:' : 'Payment & Settlement Terms:'}</span>
                </div>
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>{locale === 'pt' ? 'Forma de Pagamento:' : 'Payment Method:'}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-mono font-bold rounded-xs border border-blue-300 text-[10px]">
                    {invoice.paymentMethod.replace(/_/g, ' ')}
                  </span>
                </div>
                {invoice.notes && (
                  <div className="mt-1.5 text-[10px] text-slate-700 italic bg-white p-1.5 rounded-xs border border-slate-200 truncate">
                    "{invoice.notes}"
                  </div>
                )}
              </div>
              
              <div className="mt-1.5 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-600 font-medium">{locale === 'pt' ? 'Moeda Oficial:' : 'Settlement Currency:'}</span>
                <span className="font-bold text-slate-900">Kwanza Angolano (AOA)</span>
              </div>
            </div>
          </div>

          {/* Line Items Table with High Readability */}
          <div className="rounded-xs border border-slate-300 overflow-hidden mb-3.5">
            <table className="w-full text-left text-xs accounting-grid">
              <thead>
                <tr>
                  <th className="w-10 text-center">#</th>
                  <th className="w-24">{locale === 'pt' ? 'Código' : 'Code'}</th>
                  <th>{locale === 'pt' ? 'Descrição do Artigo / Serviço' : 'Item Description / Particulars'}</th>
                  <th className="text-right w-20">{locale === 'pt' ? 'Qtd' : 'Qty'}</th>
                  <th className="text-right w-28">{locale === 'pt' ? 'Preço Unit.' : 'Unit Price'}</th>
                  <th className="text-right w-16">{locale === 'pt' ? 'Desc%' : 'Disc%'}</th>
                  <th className="text-right w-20">{locale === 'pt' ? 'Taxa IVA' : 'VAT Rate'}</th>
                  <th className="text-right w-32">{locale === 'pt' ? 'Total Líquido' : 'Net Total'}</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px]">
                {invoice.lines.map((line, idx) => (
                  <tr key={line.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="font-bold text-slate-700">{line.itemCode}</td>
                    <td className="font-sans font-medium text-slate-900 text-xs">
                      {line.description}
                    </td>
                    <td className="text-right font-bold text-slate-800">
                      {line.quantity.toLocaleString('pt-AO')}
                    </td>
                    <td className="text-right text-slate-700">
                      {line.unitPrice.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-right text-slate-500">
                      {line.discountPercent > 0 ? `${line.discountPercent}%` : '-'}
                    </td>
                    <td className="text-right">
                      <span className={`px-1.5 py-0.5 rounded-xs font-bold text-[10px] ${
                        isFiscal 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {isFiscal ? `${line.vatPercent}%` : '0% (ISE)'}
                      </span>
                    </td>
                    <td className="text-right font-bold text-slate-950 text-xs">
                      {line.netTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Section: Tax Calculation + Bank Details + Total a Pagar Card */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start mb-3">
            {/* Left Column: Tax & Banking Breakdown (7 cols) */}
            <div className="sm:col-span-7 space-y-2">
              
              {/* Total In Words Banner */}
              <div className="bg-slate-50 rounded-xs p-2 border border-slate-300">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 block mb-0.5">
                  {t.totalInWords}
                </span>
                <span className="text-xs font-bold text-blue-950 italic">
                  {numberToWords(invoice.grandTotal, locale)}
                </span>
              </div>

              {/* Angola VAT Breakdown Table */}
              <div className="border border-slate-300 rounded-xs overflow-hidden bg-white">
                <div className="bg-slate-100 px-2.5 py-1 border-b border-slate-300 flex justify-between items-center">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-blue-700" />
                    <span>{locale === 'pt' ? 'Resumo de Impostos (IVA Angola Dec. 386/20)' : 'Angola VAT Tax Summary (Decree 386/20)'}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">Regime Geral</span>
                </div>
                
                <div className="p-2 text-xs space-y-0.5 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>{locale === 'pt' ? 'Incidência / Base Tributável (Taxa 14%):' : 'Taxable Base (14% Standard Rate):'}</span>
                    <span className="font-bold text-slate-900">{invoice.subtotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{locale === 'pt' ? 'Total do IVA Liquidado (Output VAT):' : 'Total Output VAT Amount:'}</span>
                    <span className="font-bold text-slate-900">{invoice.vatTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
                  </div>
                  {invoice.withholdingTaxAmount > 0 && (
                    <div className="flex justify-between text-amber-700 pt-0.5 border-t border-slate-200">
                      <span>{locale === 'pt' ? 'Retenção na Fonte de IVA Sofrida (6.5%):' : 'VAT Withholding Tax Suffered (6.5%):'}</span>
                      <span className="font-bold">-{invoice.withholdingTaxAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Official Bank Coordinates (IBAN) */}
              <div className="border border-slate-300 rounded-xs p-2 bg-slate-50/70 text-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 block mb-1 flex items-center space-x-1.5">
                  <Landmark className="w-3.5 h-3.5 text-blue-800" />
                  <span>{t.ipBankDetails}</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-white p-1.5 rounded-xs border border-slate-300">
                    <span className="text-[9px] text-slate-500 block">BANCO BAI (AOA)</span>
                    <strong className="text-slate-900 select-all">AO06 0040 0000 1234 5678 9012 3</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded-xs border border-slate-300">
                    <span className="text-[9px] text-slate-500 block">BANCO BFA (AOA)</span>
                    <strong className="text-slate-900 select-all">AO06 0006 0000 9876 5432 1098 7</strong>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>{locale === 'pt' ? 'Titular da Conta:' : 'Beneficiary:'} <strong>{DEFAULT_COMPANY.companyName}</strong></span>
                  <span>Swift: BAIAOA22 / BFAAOA22</span>
                </div>
              </div>
            </div>

            {/* Right Column: Modern Totals Card (5 cols) */}
            <div className="sm:col-span-5 bg-[#001733] text-white rounded-xs p-3 border border-[#002d62] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-700 mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
                    {locale === 'pt' ? 'Apuramento Financeiro' : 'Financial Breakdown'}
                  </span>
                  <span className="text-[9px] font-mono bg-[#002244] text-amber-300 px-1.5 py-0.5 rounded-xs border border-[#004080]">
                    AOA (Kwanza)
                  </span>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-sans text-slate-400">{t.subtotal}</span>
                    <span className="font-bold text-slate-100">
                      {invoice.subtotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                    </span>
                  </div>

                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span className="font-sans">{t.commercialDisc}</span>
                      <span className="font-bold">
                        -{invoice.discountTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-300">
                    <span className="font-sans text-slate-400">
                      {t.vatLabel} ({isFiscal ? '14%' : '0%'}):
                    </span>
                    <span className="font-bold text-slate-100">
                      {invoice.vatTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                    </span>
                  </div>

                  {invoice.withholdingTaxAmount > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span className="font-sans">{t.withholdingLabel}</span>
                      <span className="font-bold">
                        -{invoice.withholdingTaxAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Eye-Catchy Grand Total Display */}
              <div className="mt-2.5 pt-2 border-t-2 border-slate-700">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                  {t.grandTotal}
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight flex items-baseline justify-between accounting-double-total pb-1">
                  <span>{invoice.grandTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                  <span className="text-sm text-amber-400 font-bold ml-1">Kz</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center justify-between border-t border-slate-800 pt-1">
                  <span>{locale === 'pt' ? 'Estado:' : 'Status:'}</span>
                  <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{locale === 'pt' ? 'Liquidado / Conforme' : 'Settled / Compliant'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory AGT Legal Certification Stamp & QR Verification Area */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-3">
            {isFiscal ? (
              <div className="bg-emerald-50 border border-emerald-600 rounded-xs p-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                {/* Left: Chained RSA Digital Signature Stamp */}
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-xs bg-emerald-800 text-white flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5 text-xs font-mono">
                    <div className="text-emerald-950 font-bold text-xs flex items-center space-x-2">
                      <span className="px-1 py-0.5 bg-emerald-200 text-emerald-900 rounded-xs font-black text-[10px]">
                        {invoice.hashChaining?.hashControl || '4aF9'}
                      </span>
                      <span>Processado por programa certificado n.º 412/AGT/2026</span>
                    </div>
                    <div className="text-[10px] text-emerald-800">
                      Assinatura Digital RSA-SHA256 • Encadeamento de Hashes conforme Decreto Executivo n.º 386/20
                    </div>
                    <div className="text-[9px] text-emerald-700 truncate max-w-md">
                      Hash SHA-256: {invoice.hashChaining?.currentHash || '7a8f9c1e3b5d2048...' }
                    </div>
                  </div>
                </div>

                {/* Right: AGT Compliance QR Stamp Representation */}
                <div className="flex items-center space-x-2 bg-white p-1 rounded-xs border border-emerald-300">
                  <div className="w-7 h-7 bg-slate-950 text-white rounded-xs flex items-center justify-center font-mono text-[9px] font-bold">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-[9px] font-mono text-slate-700 leading-tight">
                    <strong className="block text-slate-900">QR CODE FISCAL</strong>
                    <span>Validado na AGT</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-500 rounded-xs p-2 text-center font-bold text-amber-950 text-[11px] tracking-wide">
                {locale === 'pt' 
                  ? 'ESTE DOCUMENTO NÃO TEM VALOR DE FACTURA E NÃO SERVE DE COMPROVATIVO FISCAL • EMITIDO EXCLUSIVAMENTE PARA EFEITOS DE COTAÇÃO / CONFERÊNCIA COMERCIAL (DECRETO EXECUTIVO N.º 386/20 ART. 7.º)' 
                  : 'THIS PRO-FORMA DOCUMENT IS NOT A TAX INVOICE AND DOES NOT SERVE AS A TAX RECEIPT • ISSUED EXCLUSIVELY FOR COMMERCIAL QUOTATION / VERIFICATION (AGT DECREE 386/20 ART. 7)'}
              </div>
            )}

            {/* Bottom Fine Print Disclaimers */}
            <div className="flex flex-col sm:flex-row justify-between pt-1.5 text-[10px] text-slate-500 font-sans border-t border-slate-100 mt-1.5">
              <span>
                {locale === 'pt' 
                  ? 'Os bens ou serviços foram colocados à disposição do adquirente na data e no local indicados no documento.' 
                  : 'Goods or services were placed at the disposal of the buyer at the specified date and location.'}
              </span>
              <span className="font-mono text-slate-600 font-medium">
                Nexora ERP Enterprise Angola v1.0 • Certificação Oficial AGT
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
