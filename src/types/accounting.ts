// Core Data Types for Angola AGT Certified Accounting & ERP System

export type DocumentSeriesType = 'FISCAL_AGT' | 'PROFORMA_INTERNAL';

export type FiscalDocType = 
  | 'FT' // Factura
  | 'FR' // Factura/Recibo
  | 'NC' // Nota de Crédito
  | 'ND' // Nota de Débito
  | 'GT' // Guia de Transporte
  | 'GR'; // Guia de Remessa

export type InternalDocType =
  | 'FP' // Factura Pró-Forma
  | 'VD' // Venda a Dinheiro (Gestão Interna)
  | 'EC' // Encomenda / Orçamento
  | 'MI'; // Movimento Interno de Stock

export type DocumentType = FiscalDocType | InternalDocType;

export type VatRateCode = 'NOR' | 'RED' | 'INT' | 'ISE';

export interface TaxConfig {
  code: VatRateCode;
  percentage: number;
  description: string;
  exemptionReasonCode?: string; // M00, M02, M10, etc. (Decree 386/20)
  exemptionReasonText?: string;
}

export interface PgcAccount {
  code: string;
  name: string;
  classNumber: number; // 1 to 8
  type: 'DEBIT' | 'CREDIT' | 'BOTH';
  balance: number;
  parentCode?: string;
  description?: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: 'FINISHED_GOOD' | 'RAW_MATERIAL' | 'TRADING_MERCHANDISE' | 'SERVICE';
  unit: string; // UN, KG, M2, L, TON
  sellingPrice: number; // in AOA
  costPrice: number; // CMP (Custo Médio Ponderado) in AOA
  currentStock: number;
  minStockAlert: number;
  weightKg?: number;
  vatRateCode: VatRateCode;
  warehouseLocation: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  nif: string; // NIF Angolano (Número de Identificação Fiscal)
  address: string;
  city: string;
  province: string; // Luanda, Benguela, Huíla, etc.
  phone: string;
  email: string;
  customerType: 'FORMAL_CORPORATE' | 'INFORMAL_CASH' | 'STATE_ENTITY';
  creditLimit: number;
  currentBalance: number; // Positive = owes money
}

export interface InvoiceLine {
  id: string;
  itemId: string;
  itemCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  vatRateCode: VatRateCode;
  vatPercent: number;
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
}

export interface DualSeriesInvoice {
  id: string;
  seriesType: DocumentSeriesType; // 'FISCAL_AGT' or 'PROFORMA_INTERNAL'
  docType: DocumentType;
  seriesNumber: string; // e.g. "FT AGT2026/0012" or "FP INT2026/0045"
  sequentialNumber: number;
  date: string; // YYYY-MM-DD
  systemEntryDate: string; // ISO 8601
  customerId: string;
  customerName: string;
  customerNif: string;
  customerAddress: string;
  lines: InvoiceLine[];
  subtotal: number;
  discountTotal: number;
  vatTotal: number;
  withholdingTaxPercent: number; // 6.5% if applicable
  withholdingTaxAmount: number;
  grandTotal: number; // Total a Pagar
  paymentMethod: 'CASH' | 'MULTICAIXA_TPA' | 'BANK_TRANSFER_BAI' | 'BANK_TRANSFER_BFA' | 'CREDIT';
  cashReceived?: number;
  changeGiven?: number;
  // AGT Cryptography Fields (Required for FISCAL_AGT)
  hashChaining?: {
    currentHash: string;
    previousHash: string;
    hashControl: string; // 4-char signature stamp: e.g. "x9P2"
    certificateNumber: string; // e.g. "412/AGT/2026"
    fullSignature: string;
  };
  isSaftExported: boolean;
  notes?: string;
  convertedFromProformaId?: string;
}

export interface VoucherLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  costCenter?: string;
  description?: string;
}

export interface JournalVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  voucherType: 'RECEIPT' | 'PAYMENT' | 'JOURNAL' | 'CONTRA' | 'SALES' | 'PURCHASE';
  referenceDoc?: string;
  narration: string;
  lines: VoucherLine[];
  totalAmount: number;
}

// Manufacturing BOM
export interface BomComponent {
  itemId: string;
  itemCode: string;
  name: string;
  quantityRequired: number;
  unit: string;
  unitCost: number;
  scrapPercent: number;
  totalCost: number;
}

export interface BillOfMaterials {
  id: string;
  bomCode: string;
  finishedGoodId: string;
  finishedGoodName: string;
  batchYieldQuantity: number;
  laborCost: number;
  overheadCost: number;
  components: BomComponent[];
  totalUnitCost: number;
  createdAt: string;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  bomId: string;
  finishedGoodName: string;
  quantityToProduce: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  completionDate?: string;
  actualScrapProduced: number;
  totalProductionCost: number;
}

// Landed Cost Import Distribution (SAP B1 style)
export interface LandedCostImport {
  id: string;
  shipmentReference: string; // e.g., "BL-LUANDA-2026-904"
  portOfEntry: string; // Porto de Luanda
  customsBroker: string; // Despachante Oficial
  seaFreightCost: number; // Frete Marítimo (AOA)
  customsDuty: number; // Direitos Aduaneiros (AOA)
  portTerminalFees: number; // Taxas Portuárias DP World Luanda (AOA)
  marineInsurance: number; // Seguro Internacional (AOA)
  totalExtraCost: number;
  allocationMethod: 'BY_VALUE' | 'BY_WEIGHT';
  itemsAllocated: {
    itemId: string;
    itemCode: string;
    itemName: string;
    originalCost: number;
    allocatedCostPerUnit: number;
    newUnitCmpCost: number;
    quantity: number;
  }[];
}
