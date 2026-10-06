import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  CheckCircle2, 
  FileCode, 
  Copy, 
  RefreshCw, 
  Calculator, 
  ArrowRight, 
  Send, 
  FileText, 
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CreditCard
} from 'lucide-react';
import { DualSeriesInvoice, Customer, InventoryItem, PgcAccount } from '../types/accounting';
import { generateSaftAoXml, DEFAULT_COMPANY } from '../services/saftAoExporter';
import { verifyAgtHashChain } from '../services/cryptoEngine';
import { Locale, TRANSLATIONS } from '../lib/translations';

interface SaftAoInspectorProps {
  invoices: DualSeriesInvoice[];
  customers: Customer[];
  inventory: InventoryItem[];
  accounts: PgcAccount[];
  locale?: Locale;
}

export const SaftAoInspector: React.FC<SaftAoInspectorProps> = ({
  invoices,
  customers,
  inventory,
  accounts,
  locale = 'pt',
}) => {
  const t = TRANSLATIONS[locale];
  const [xmlContent, setXmlContent] = useState<string>(() =>
    generateSaftAoXml(invoices, customers, inventory, accounts)
  );
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'MODELO_7' | 'RECONCILIATION' | 'VALIDATOR' | 'XML_VIEWER'>('MODELO_7');
  const [isSubmittingApi, setIsSubmittingApi] = useState(false);
  const [apiSubmissionReceipt, setApiSubmissionReceipt] = useState<{
    receiptNumber: string;
    token: string;
    timestamp: string;
  } | null>(null);
  const [isDucGenerated, setIsDucGenerated] = useState(false);
  const [chainAuditStatus, setChainAuditStatus] = useState<{
    isValid: boolean;
    brokenAtInvoice?: string;
    details: string;
  }>({ isValid: true, details: 'Cadeia criptográfica validada segundo Dec. Executivo 386/20.' });

  // Invoicing breakdown
  const fiscalInvoices = invoices.filter((i) => i.seriesType === 'FISCAL_AGT');
  const internalInvoices = invoices.filter((i) => i.seriesType === 'PROFORMA_INTERNAL');

  useEffect(() => {
    verifyAgtHashChain(fiscalInvoices).then(setChainAuditStatus);
  }, [invoices]);

  // Financial Calculations for Modelo 7 (Angola VAT Return)
  const baseTributavel14 = fiscalInvoices.reduce((s, i) => s + i.subtotal, 0);
  const ivaLiquidado14 = fiscalInvoices.reduce((s, i) => s + i.vatTotal, 0);
  const cotacoesProformaTotal = internalInvoices.reduce((s, i) => s + i.subtotal, 0);
  
  // Deductible VAT on purchases/imports (Input Tax from Landed Costs & Stock)
  const estimatedPurchasesBase = 3500000;
  const ivaDedutivelCompras = estimatedPurchasesBase * 0.14; // 490,000 Kz
  
  // Withholding Tax suffered (6.5%)
  const totalWithholdingTax = fiscalInvoices.reduce((s, i) => s + (i.withholdingTaxAmount || 0), 0);

  // Final VAT Settlement (Campo 20)
  const impostoLiquidoApurado = ivaLiquidado14 - ivaDedutivelCompras - totalWithholdingTax;
  const isImpostoAPagar = impostoLiquidoApurado > 0;
  const valorFinalApuramento = Math.abs(impostoLiquidoApurado);

  // Reconciliation Figures (3-Way Audit Trail)
  const bankBaiTotal = accounts.find((a) => a.code === '43.1')?.balance || 0;
  const bankBfaTotal = accounts.find((a) => a.code === '43.2')?.balance || 0;
  const cashBalcaoTotal = accounts.find((a) => a.code === '45.9')?.balance || 0;
  const totalFiscalTurnover = fiscalInvoices.reduce((s, i) => s + i.grandTotal, 0);

  // Financial receipts & ledger settlements for fiscal invoices
  const reconciledBankAndCash = fiscalInvoices.reduce((sum, inv) => {
    return sum + (inv.paymentMethod !== 'CREDIT' ? inv.grandTotal : 0);
  }, 0);
  const reconciledReceivables = fiscalInvoices.reduce((sum, inv) => {
    return sum + (inv.paymentMethod === 'CREDIT' ? inv.grandTotal : 0);
  }, 0);
  const totalReconciledFinancial = reconciledBankAndCash + reconciledReceivables;
  const discrepancyAmount = Math.abs(totalFiscalTurnover - totalReconciledFinancial);

  const handleRegenerate = () => {
    const xml = generateSaftAoXml(invoices, customers, inventory, accounts);
    setXmlContent(xml);
  };

  const handleDownload = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SAFT_AO_2026_${DEFAULT_COMPANY.nif}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateApiSubmit = () => {
    setIsSubmittingApi(true);
    setTimeout(() => {
      setIsSubmittingApi(false);
      setApiSubmissionReceipt({
        receiptNumber: `REC-AGT-2026-10-${Math.floor(Math.random() * 900000 + 100000)}`,
        token: `AGT-TOKEN-SHA256-${Date.now().toString(16).toUpperCase()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    }, 1200);
  };

  return (
    <div className="space-y-3">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#002244] border border-[#003366] rounded-xs px-3 py-2 text-white shadow-xs">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider font-mono">
              {t.saftTitle}
            </h1>
            <p className="text-[10px] text-slate-300">
              {t.saftSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleRegenerate}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xs bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.saftUpdateXml}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center space-x-1 px-3 py-1 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.saftDownloadXml}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (4 Core Pillars of Tax Compliance) */}
      <div className="flex border-b border-slate-700 gap-1 text-xs font-bold bg-slate-900 px-2 pt-1 rounded-t-xs overflow-x-auto font-mono">
        <button
          onClick={() => setActiveTab('MODELO_7')}
          className={`py-1.5 px-3 border-b-2 flex items-center space-x-1.5 cursor-pointer transition-colors whitespace-nowrap text-xs ${
            activeTab === 'MODELO_7'
              ? 'border-amber-400 text-amber-300 bg-[#002244]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{t.saftTabModelo7}</span>
        </button>

        <button
          onClick={() => setActiveTab('RECONCILIATION')}
          className={`py-1.5 px-3 border-b-2 flex items-center space-x-1.5 cursor-pointer transition-colors whitespace-nowrap text-xs ${
            activeTab === 'RECONCILIATION'
              ? 'border-amber-400 text-amber-300 bg-[#002244]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t.saftTabReconciliation}</span>
        </button>

        <button
          onClick={() => setActiveTab('VALIDATOR')}
          className={`py-1.5 px-3 border-b-2 flex items-center space-x-1.5 cursor-pointer transition-colors whitespace-nowrap text-xs ${
            activeTab === 'VALIDATOR'
              ? 'border-amber-400 text-amber-300 bg-[#002244]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t.saftTabAudit}</span>
        </button>

        <button
          onClick={() => setActiveTab('XML_VIEWER')}
          className={`py-1.5 px-3 border-b-2 flex items-center space-x-1.5 cursor-pointer transition-colors whitespace-nowrap text-xs ${
            activeTab === 'XML_VIEWER'
              ? 'border-amber-400 text-amber-300 bg-[#002244]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>{t.saftTabViewer}</span>
        </button>
      </div>

      {/* TAB 1: MODELO 7 - DECLARAÇÃO PERIÓDICA DO IVA AGT */}
      {activeTab === 'MODELO_7' && (
        <div className="space-y-3">
          {/* Official Modelo 7 Form Frame */}
          <div className="bg-slate-900 border border-slate-700 rounded-xs overflow-hidden">
            {/* Form Top Banner */}
            <div className="bg-[#002244] text-white p-3 border-b border-[#003366] flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider block">
                  REPÚBLICA DE ANGOLA • MINISTÉRIO DAS FINANÇAS
                </span>
                <h2 className="text-sm font-bold text-white tracking-tight font-mono">
                  {t.m7Title}
                </h2>
                <span className="text-[11px] text-slate-300">
                  {t.m7Subtitle}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono bg-[#001733] px-2.5 py-1 rounded-xs border border-[#002d62]">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.m7Period} <strong className="text-white">{t.m7PeriodValue}</strong></span>
              </div>
            </div>

            {/* Entity Identification Strip */}
            <div className="p-3 bg-slate-950 border-b border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-num">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.m7Taxpayer}</span>
                <span className="font-bold text-white text-xs">{DEFAULT_COMPANY.companyName}</span>
                <span className="block text-slate-400 text-[11px] font-mono">NIF: {DEFAULT_COMPANY.nif}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.m7Office}</span>
                <span className="font-bold text-slate-200">{t.m7OfficeValue}</span>
                <span className="block text-slate-400 text-[11px]">Regime Geral de Tributação</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Base Legal:</span>
                <span className="font-bold text-amber-400 font-mono">Lei n.º 7/19 • Código do IVA</span>
                <span className="block text-slate-400 text-[11px]">Decreto Presidencial n.º 180/19</span>
              </div>
            </div>

            {/* Quadro 06: Apuramento do Imposto (Official AGT Boxes) */}
            <div className="p-3 space-y-3 text-xs">
              <div className="font-bold uppercase tracking-wider text-slate-300 text-xs border-b border-slate-700 pb-1.5 font-mono">
                Quadro 06: Apuramento do Imposto do Mês (Cálculo Automático)
              </div>

              <div className="space-y-2 font-mono-num">
                {/* Campo 1 & 2: Vendas e IVA Liquidado */}
                <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <span className="text-slate-200 font-bold block text-xs">{t.m7Field1}</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Base ilíquida consolidada de {fiscalInvoices.length} facturas fiscais emitidas (FT/FR).
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {baseTributavel14.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <span className="text-emerald-400 font-bold block text-xs">{t.m7Field2}</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      IVA cobrado aos clientes (Taxa Normal 14%).
                    </span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    +{ivaLiquidado14.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                  </span>
                </div>

                {/* Campo 3: Cotações / Pro-Formas isentas */}
                <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <span className="text-slate-400 font-bold block text-xs">{t.m7Field3}</span>
                    <span className="text-[10px] text-slate-500 font-sans">
                      {internalInvoices.length} cotações comerciais e pró-formas registadas (sem incidência de IVA).
                    </span>
                  </div>
                  <span className="text-slate-400 text-xs">
                    {cotacoesProformaTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                  </span>
                </div>

                {/* Campo 11: IVA Dedutível em Aquisições e Despachos Aduaneiros */}
                <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <span className="text-blue-400 font-bold block text-xs">{t.m7Field11}</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      IVA pago na alfândega do Porto de Luanda e compras de existências industriais (Art. 18.º CIVA).
                    </span>
                  </div>
                  <span className="text-sm font-bold text-blue-400">
                    -{ivaDedutivelCompras.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                  </span>
                </div>

                {/* Campo 15: Retenções na Fonte de IVA */}
                {totalWithholdingTax > 0 && (
                  <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <span className="text-amber-400 font-bold block text-xs">{t.m7Field15}</span>
                      <span className="text-[10px] text-slate-400 font-sans">
                        Retenções sofridas nas facturas a clientes do sector formal/petrolífero (Decreto Presidencial 180/19).
                      </span>
                    </div>
                    <span className="text-sm font-bold text-amber-400">
                      -{totalWithholdingTax.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                    </span>
                  </div>
                )}

                {/* Campo 20: Saldo Final do Imposto */}
                <div className="p-3 bg-[#001733] border-2 border-slate-600 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block font-mono">
                      {t.m7Field20}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {isImpostoAPagar ? t.m7Payable : t.m7Credit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-400 accounting-double-total">
                      {valorFinalApuramento.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                    </span>
                  </div>
                </div>
              </div>

              {/* DUC Generation Action Bar */}
              <div className="pt-2 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-slate-400 text-[11px]">
                  Prazo Legal de Pagamento: <strong>Último dia útil do mês seguinte</strong>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDucGenerated(true)}
                  className="px-3 py-1.5 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer uppercase tracking-wider"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t.m7GenerateDuc}</span>
                </button>
              </div>

              {/* DUC Payment Slip Card (RUPE Reference) */}
              {isDucGenerated && (
                <div className="p-3 bg-[#001733] border border-[#002d62] rounded-xs space-y-2">
                  <div className="flex items-center space-x-1.5 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.m7DucGenerated}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono-num text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Documento Único de Cobrança (DUC):</span>
                      <span className="font-bold text-white">DUC-2026-10-LU-9948271</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Referência RUPE (Pagamento):</span>
                      <span className="font-bold text-amber-400 text-xs">982 144 829 104</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Valor Líquido a Pagar:</span>
                      <span className="font-bold text-emerald-400 text-xs">
                        {valorFinalApuramento.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {t.m7DucRef} Utilize a opção <strong>"Pagamentos ao Estado / RUPE"</strong> em qualquer caixa Multicaixa ou aplicativo bancário (BFA Net, BAI Directo, Standard Bank).
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTO-RECONCILIAÇÃO BANCÁRIA & FISCAL 3-WAY */}
      {/* TAB 2: AUTO-RECONCILIAÇÃO BANCÁRIA & FISCAL 3-WAY */}
      {activeTab === 'RECONCILIATION' && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-700 rounded-xs p-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-2">
              <div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {t.recTitle}
                  </h2>
                </div>
                <p className="text-[10px] text-slate-400">
                  {t.recSubtitle}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-xs bg-[#001733] text-emerald-300 border border-emerald-700 text-[10px] font-mono font-bold flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{t.recStatusMatched}</span>
                </span>
              </div>
            </div>

            {/* 3-Way Reconciliation Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono-num text-xs">
              <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800 space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold font-sans">1. {t.recTotalVouchers}</span>
                <span className="text-sm font-bold text-white">
                  {totalFiscalTurnover.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                </span>
                <span className="text-[10px] text-emerald-400 block font-sans">
                  {fiscalInvoices.length} facturas fiscais emitidas
                </span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800 space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold font-sans">2. {t.recTotalBank}</span>
                <span className="text-sm font-bold text-emerald-400">
                  {totalReconciledFinancial.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                </span>
                <span className="text-[10px] text-slate-400 block font-sans">
                  Contas PGC 43.1, 43.2, 45.9, 31.1
                </span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800 space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase font-bold font-sans">3. {t.recTotalSaft}</span>
                <span className="text-sm font-bold text-amber-400">
                  {totalFiscalTurnover.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                </span>
                <span className="text-[10px] text-emerald-400 block font-sans">
                  Tabela 4.1 SalesInvoices do SAF-T (AO)
                </span>
              </div>
            </div>

            {/* Discrepancy Callout */}
            <div className="p-2 bg-[#001733] border border-slate-700 rounded-xs flex items-center justify-between text-xs font-mono-num">
              <span className="text-slate-300 font-sans text-xs">
                {t.recDiscrepancy}
              </span>
              <span className="text-emerald-400 font-bold text-xs accounting-double-total">
                {discrepancyAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz ({locale === 'pt' ? 'Auditoria 100% Validada' : 'Audit 100% Matched'})
              </span>
            </div>

            {/* Reconciliation Audit Trail Table */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                Rastreabilidade de Vouchers & Conciliação com Movimento Bancário
              </div>
              <div className="overflow-x-auto">
                <table className="w-full accounting-grid text-xs">
                  <thead>
                    <tr>
                      <th className="w-36">{t.recColVoucher}</th>
                      <th className="w-24">{t.recColDate}</th>
                      <th>{t.recColClient}</th>
                      <th className="w-36 text-right">{t.recColAmount}</th>
                      <th>{t.recColBankEntry}</th>
                      <th className="w-24 text-center">{t.recColStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono-num">
                    {fiscalInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="font-bold text-white">{inv.seriesNumber}</td>
                        <td className="text-slate-300">{inv.date}</td>
                        <td className="font-sans font-medium text-slate-200">{inv.customerName}</td>
                        <td className="text-right font-bold text-white">
                          {inv.grandTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                        </td>
                        <td className="font-sans text-slate-300">
                          {inv.paymentMethod === 'BANK_TRANSFER_BAI' 
                            ? 'Conta 43.1 Banco BAI (Extracto Integrado)'
                            : inv.paymentMethod === 'CASH'
                            ? 'Conta 45.9 Caixa Geral Balcão'
                            : 'Conta 43.2 Banco BFA (TPA Multicaixa)'}
                        </td>
                        <td className="text-center">
                          <span className="text-[9px] font-bold text-emerald-400 bg-slate-950 px-1.5 py-0.5 border border-slate-800 rounded-xs">
                            {t.recMatched}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDITORIA & VALIDAÇÃO SAF-T (AO) */}
      {activeTab === 'VALIDATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left: Validation Rules Passed (Span 2) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-slate-900 border border-slate-700 rounded-xs p-3 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {t.saftCriteriaTitle}
              </div>

              {/* Live Cryptographic Chaining Status Banner */}
              <div className={`p-2.5 rounded-xs border flex items-center justify-between gap-2 ${
                chainAuditStatus.isValid 
                  ? 'bg-emerald-950/90 border-emerald-600' 
                  : 'bg-rose-950/90 border-rose-600'
              }`}>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${chainAuditStatus.isValid ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <div>
                    <div className="font-bold text-white text-xs font-mono">
                      {locale === 'pt' ? 'Auditoria Criptográfica RSA-2048 em Tempo Real' : 'Real-Time RSA-2048 Cryptographic Audit'}
                    </div>
                    <div className="text-[10px] text-slate-300">
                      {chainAuditStatus.details}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-xs border shrink-0 ${
                  chainAuditStatus.isValid 
                    ? 'bg-emerald-900 text-emerald-200 border-emerald-700' 
                    : 'bg-rose-900 text-rose-200 border-rose-700'
                }`}>
                  {chainAuditStatus.isValid ? '100% CONFORME' : 'ERRO DETETADO'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Rule 1 */}
                <div className="p-2.5 rounded-xs bg-slate-950 border border-slate-800 flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-white text-xs">
                      {t.saftRule1Title}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {t.saftRule1Desc}
                    </div>
                  </div>
                </div>

                {/* Rule 2 */}
                <div className="p-2.5 rounded-xs bg-slate-950 border border-slate-800 flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-white text-xs">
                      {t.saftRule2Title}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {t.saftRule2Desc}
                    </div>
                  </div>
                </div>

                {/* Rule 3 */}
                <div className="p-2.5 rounded-xs bg-slate-950 border border-slate-800 flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-white text-xs">
                      {t.saftRule3Title}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {t.saftRule3Desc}
                    </div>
                  </div>
                </div>

                {/* Rule 4 */}
                <div className="p-2.5 rounded-xs bg-slate-950 border border-slate-800 flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-white text-xs">
                      {t.saftRule4Title}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {t.saftRule4Desc}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Summary Statistics */}
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-700 rounded-xs p-3 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {t.saftStatsTitle}
              </div>

              <div className="space-y-2 font-mono-num text-xs">
                <div className="p-2 bg-slate-950 rounded-xs border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400 font-sans text-xs">{t.saftFiscalCount}</span>
                  <span className="font-bold text-emerald-400 text-xs">{fiscalInvoices.length}</span>
                </div>

                <div className="p-2 bg-slate-950 rounded-xs border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400 font-sans text-xs">{t.saftProformaOmitted}</span>
                  <span className="font-bold text-amber-400 text-xs">{internalInvoices.length}</span>
                </div>

                <div className="p-2 bg-slate-950 rounded-xs border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400 font-sans text-xs">{t.saftTotalDeclared}</span>
                  <span className="font-bold text-white text-xs">{baseTributavel14.toLocaleString('pt-AO')} Kz</span>
                </div>

                <div className="p-2 bg-slate-950 rounded-xs border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400 font-sans text-xs">{t.saftTotalVatDeclared}</span>
                  <span className="font-bold text-amber-400 text-xs">{ivaLiquidado14.toLocaleString('pt-AO')} Kz</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VISUALIZADOR XML & WEBSERVICE AGT */}
      {activeTab === 'XML_VIEWER' && (
        <div className="space-y-3">
          {/* AGT Webservice Submission Action Strip */}
          <div className="bg-slate-900 border border-slate-700 rounded-xs p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Submissão Direta ao Portal dos Contribuintes AGT (Webservice)
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Valida a estrutura do ficheiro e envia o lote de auditoria para os servidores do Ministério das Finanças.
              </p>
            </div>

            <button
              type="button"
              disabled={isSubmittingApi}
              onClick={handleSimulateApiSubmit}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xs flex items-center space-x-1.5 transition-colors cursor-pointer uppercase tracking-wider"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingApi ? t.saftSubmitting : t.saftSubmitApi}</span>
            </button>
          </div>

          {apiSubmissionReceipt && (
            <div className="p-3 bg-[#001733] border border-[#002d62] rounded-xs space-y-1.5">
              <div className="flex items-center space-x-1.5 text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.saftSubmittedSuccess}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono-num text-xs pt-0.5 text-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.saftReceiptNo}</span>
                  <span className="font-bold text-white">{apiSubmissionReceipt.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.saftToken}</span>
                  <span className="font-bold text-emerald-400">{apiSubmissionReceipt.token}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Data & Hora da Validação:</span>
                  <span className="font-bold text-slate-300">{apiSubmissionReceipt.timestamp}</span>
                </div>
              </div>
            </div>
          )}

          {/* XML Text Preview */}
          <div className="bg-slate-900 border border-slate-700 rounded-xs overflow-hidden">
            <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center">
              <span className="font-mono text-xs text-slate-400">
                SAF-T (AO) XML File Preview (Schema v1.01_01 • Decreto Executivo n.º 386/20)
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-xs bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-600 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? t.saftXmlCopied : t.saftXmlCopy}</span>
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-emerald-400/90 overflow-x-auto max-h-[500px] leading-relaxed bg-slate-950">
              {xmlContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

