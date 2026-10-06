import { DualSeriesInvoice, Customer, InventoryItem, PgcAccount } from '../types/accounting';

export interface CompanyInfo {
  companyName: string;
  nif: string;
  address: string;
  city: string;
  fiscalYear: number;
}

export const DEFAULT_COMPANY: CompanyInfo = {
  companyName: "LUANDA FABRIL & COMÉRCIO GERAL LDA",
  nif: "5412093841",
  address: "Estrada de Catete, Km 24, Polo Industrial de Viana",
  city: "Luanda",
  fiscalYear: 2026,
};

/**
 * Generates an official SAF-T (AO) XML file compliant with AGT Decree 386/20
 * Note: Only 'FISCAL_AGT' series invoices are included! Pro-forma / internal sales are omitted.
 */
export function generateSaftAoXml(
  invoices: DualSeriesInvoice[],
  customers: Customer[],
  products: InventoryItem[],
  accounts: PgcAccount[],
  company: CompanyInfo = DEFAULT_COMPANY
): string {
  // Filter ONLY Fiscal series documents (Série A - AGT Certificada) and sort sequentially
  const fiscalInvoices = invoices
    .filter((inv) => inv.seriesType === 'FISCAL_AGT')
    .sort((a, b) => a.sequentialNumber - b.sequentialNumber);

  const totalCredit = fiscalInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const currentDate = new Date().toISOString().split('T')[0];

  const escapeXml = (unsafe: string) => {
    return (unsafe || '').replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const xmlParts: string[] = [];

  xmlParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  xmlParts.push(`<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`);
  
  // Header
  xmlParts.push(`  <Header>`);
  xmlParts.push(`    <AuditFileVersion>1.01_01</AuditFileVersion>`);
  xmlParts.push(`    <CompanyID>${escapeXml(company.nif)}</CompanyID>`);
  xmlParts.push(`    <TaxRegistrationNumber>${escapeXml(company.nif)}</TaxRegistrationNumber>`);
  xmlParts.push(`    <TaxAccountingBasis>F</TaxAccountingBasis>`);
  xmlParts.push(`    <CompanyName>${escapeXml(company.companyName)}</CompanyName>`);
  xmlParts.push(`    <BusinessName>${escapeXml(company.companyName)}</BusinessName>`);
  xmlParts.push(`    <CompanyAddress>`);
  xmlParts.push(`      <AddressDetail>${escapeXml(company.address)}</AddressDetail>`);
  xmlParts.push(`      <City>${escapeXml(company.city)}</City>`);
  xmlParts.push(`      <Country>AO</Country>`);
  xmlParts.push(`    </CompanyAddress>`);
  xmlParts.push(`    <FiscalYear>${company.fiscalYear}</FiscalYear>`);
  xmlParts.push(`    <StartDate>${company.fiscalYear}-01-01</StartDate>`);
  xmlParts.push(`    <EndDate>${company.fiscalYear}-12-31</EndDate>`);
  xmlParts.push(`    <CurrencyCode>AOA</CurrencyCode>`);
  xmlParts.push(`    <DateCreated>${currentDate}</DateCreated>`);
  xmlParts.push(`    <TaxEntity>Global</TaxEntity>`);
  xmlParts.push(`    <ProductCompanyTaxID>${escapeXml(company.nif)}</ProductCompanyTaxID>`);
  xmlParts.push(`    <SoftwareValidationNumber>412/AGT/2026</SoftwareValidationNumber>`);
  xmlParts.push(`    <ProductID>Nexora ERP Angola</ProductID>`);
  xmlParts.push(`    <ProductVersion>1.0.0</ProductVersion>`);
  xmlParts.push(`  </Header>`);

  // MasterFiles
  xmlParts.push(`  <MasterFiles>`);
  
  // General Ledger Accounts (Plano Geral de Contabilidade de Angola)
  xmlParts.push(`    <GeneralLedgerAccounts>`);
  for (const acc of accounts) {
    xmlParts.push(`      <Account>`);
    xmlParts.push(`        <AccountID>${escapeXml(acc.code)}</AccountID>`);
    xmlParts.push(`        <AccountDescription>${escapeXml(acc.name)}</AccountDescription>`);
    xmlParts.push(`        <OpeningDebitBalance>0.00</OpeningDebitBalance>`);
    xmlParts.push(`        <OpeningCreditBalance>0.00</OpeningCreditBalance>`);
    xmlParts.push(`        <ClosingDebitBalance>${acc.type === 'DEBIT' ? acc.balance.toFixed(2) : '0.00'}</ClosingDebitBalance>`);
    xmlParts.push(`        <ClosingCreditBalance>${acc.type === 'CREDIT' ? acc.balance.toFixed(2) : '0.00'}</ClosingCreditBalance>`);
    xmlParts.push(`        <GroupingCategory>GR</GroupingCategory>`);
    xmlParts.push(`      </Account>`);
  }
  xmlParts.push(`    </GeneralLedgerAccounts>`);

  // Customers
  for (const cust of customers) {
    xmlParts.push(`    <Customer>`);
    xmlParts.push(`      <CustomerID>${escapeXml(cust.code)}</CustomerID>`);
    xmlParts.push(`      <AccountID>31.1</AccountID>`);
    xmlParts.push(`      <CustomerTaxID>${escapeXml(cust.nif || '999999999')}</CustomerTaxID>`);
    xmlParts.push(`      <CompanyName>${escapeXml(cust.name)}</CompanyName>`);
    xmlParts.push(`      <BillingAddress>`);
    xmlParts.push(`        <AddressDetail>${escapeXml(cust.address || 'Luanda')}</AddressDetail>`);
    xmlParts.push(`        <City>${escapeXml(cust.city || 'Luanda')}</City>`);
    xmlParts.push(`        <Country>AO</Country>`);
    xmlParts.push(`      </BillingAddress>`);
    xmlParts.push(`      <SelfBillingIndicator>0</SelfBillingIndicator>`);
    xmlParts.push(`    </Customer>`);
  }

  // Products
  for (const prod of products) {
    xmlParts.push(`    <Product>`);
    xmlParts.push(`      <ProductType>${prod.category === 'SERVICE' ? 'S' : 'P'}</ProductType>`);
    xmlParts.push(`      <ProductCode>${escapeXml(prod.code)}</ProductCode>`);
    xmlParts.push(`      <ProductGroup>${escapeXml(prod.category)}</ProductGroup>`);
    xmlParts.push(`      <ProductDescription>${escapeXml(prod.name)}</ProductDescription>`);
    xmlParts.push(`      <ProductNumberCode>${escapeXml(prod.code)}</ProductNumberCode>`);
    xmlParts.push(`    </Product>`);
  }

  // Tax Table (IVA Angola)
  xmlParts.push(`    <TaxTable>`);
  xmlParts.push(`      <TaxTableEntry>`);
  xmlParts.push(`        <TaxType>IVA</TaxType>`);
  xmlParts.push(`        <TaxCountryRegion>AO</TaxCountryRegion>`);
  xmlParts.push(`        <TaxCode>NOR</TaxCode>`);
  xmlParts.push(`        <Description>Taxa Geral de IVA (14%)</Description>`);
  xmlParts.push(`        <TaxPercentage>14.00</TaxPercentage>`);
  xmlParts.push(`      </TaxTableEntry>`);
  xmlParts.push(`      <TaxTableEntry>`);
  xmlParts.push(`        <TaxType>IVA</TaxType>`);
  xmlParts.push(`        <TaxCountryRegion>AO</TaxCountryRegion>`);
  xmlParts.push(`        <TaxCode>RED</TaxCode>`);
  xmlParts.push(`        <Description>Taxa Reduzida (7%)</Description>`);
  xmlParts.push(`        <TaxPercentage>7.00</TaxPercentage>`);
  xmlParts.push(`      </TaxTableEntry>`);
  xmlParts.push(`      <TaxTableEntry>`);
  xmlParts.push(`        <TaxType>IVA</TaxType>`);
  xmlParts.push(`        <TaxCountryRegion>AO</TaxCountryRegion>`);
  xmlParts.push(`        <TaxCode>ISE</TaxCode>`);
  xmlParts.push(`        <Description>Isento de IVA Art. 12.º</Description>`);
  xmlParts.push(`        <TaxPercentage>0.00</TaxPercentage>`);
  xmlParts.push(`      </TaxTableEntry>`);
  xmlParts.push(`    </TaxTable>`);
  xmlParts.push(`  </MasterFiles>`);

  // Source Documents (Sales Invoices)
  xmlParts.push(`  <SourceDocuments>`);
  xmlParts.push(`    <SalesInvoices>`);
  xmlParts.push(`      <NumberOfEntries>${fiscalInvoices.length}</NumberOfEntries>`);
  xmlParts.push(`      <TotalDebit>0.00</TotalDebit>`);
  xmlParts.push(`      <TotalCredit>${totalCredit.toFixed(2)}</TotalCredit>`);

  for (const inv of fiscalInvoices) {
    const monthPeriod = new Date(inv.date).getMonth() + 1;
    xmlParts.push(`      <Invoice>`);
    xmlParts.push(`        <InvoiceNo>${escapeXml(inv.seriesNumber)}</InvoiceNo>`);
    xmlParts.push(`        <DocumentStatus>`);
    xmlParts.push(`          <InvoiceStatus>N</InvoiceStatus>`);
    xmlParts.push(`          <InvoiceStatusDate>${inv.systemEntryDate}</InvoiceStatusDate>`);
    xmlParts.push(`          <SourceID>Admin</SourceID>`);
    xmlParts.push(`          <SourceBilling>P</SourceBilling>`);
    xmlParts.push(`        </DocumentStatus>`);
    xmlParts.push(`        <Hash>${inv.hashChaining?.fullSignature || 'HASH_PLACEHOLDER'}</Hash>`);
    xmlParts.push(`        <HashControl>${inv.hashChaining?.hashControl || '0000'}</HashControl>`);
    xmlParts.push(`        <Period>${monthPeriod}</Period>`);
    xmlParts.push(`        <InvoiceDate>${inv.date}</InvoiceDate>`);
    xmlParts.push(`        <InvoiceType>${inv.docType}</InvoiceType>`);
    xmlParts.push(`        <SpecialRegimes>`);
    xmlParts.push(`          <SelfBillingIndicator>0</SelfBillingIndicator>`);
    xmlParts.push(`          <CashVATSchemeIndicator>0</CashVATSchemeIndicator>`);
    xmlParts.push(`          <ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>`);
    xmlParts.push(`        </SpecialRegimes>`);
    xmlParts.push(`        <SourceID>Admin</SourceID>`);
    xmlParts.push(`        <SystemEntryDate>${inv.systemEntryDate}</SystemEntryDate>`);
    xmlParts.push(`        <CustomerID>${escapeXml(inv.customerId)}</CustomerID>`);

    // Invoice Lines
    inv.lines.forEach((line, idx) => {
      xmlParts.push(`        <Line>`);
      xmlParts.push(`          <LineNumber>${idx + 1}</LineNumber>`);
      xmlParts.push(`          <ProductCode>${escapeXml(line.itemCode)}</ProductCode>`);
      xmlParts.push(`          <ProductDescription>${escapeXml(line.description)}</ProductDescription>`);
      xmlParts.push(`          <Quantity>${line.quantity.toFixed(2)}</Quantity>`);
      xmlParts.push(`          <UnitOfMeasure>UN</UnitOfMeasure>`);
      xmlParts.push(`          <UnitPrice>${line.unitPrice.toFixed(2)}</UnitPrice>`);
      xmlParts.push(`          <TaxPointDate>${inv.date}</TaxPointDate>`);
      xmlParts.push(`          <Description>${escapeXml(line.description)}</Description>`);
      xmlParts.push(`          <CreditAmount>${line.netTotal.toFixed(2)}</CreditAmount>`);
      xmlParts.push(`          <Tax>`);
      xmlParts.push(`            <TaxType>IVA</TaxType>`);
      xmlParts.push(`            <TaxCountryRegion>AO</TaxCountryRegion>`);
      xmlParts.push(`            <TaxCode>${line.vatRateCode}</TaxCode>`);
      xmlParts.push(`            <TaxPercentage>${line.vatPercent.toFixed(2)}</TaxPercentage>`);
      xmlParts.push(`          </Tax>`);
      xmlParts.push(`        </Line>`);
    });

    // Document Totals
    xmlParts.push(`        <DocumentTotals>`);
    xmlParts.push(`          <TaxPayable>${inv.vatTotal.toFixed(2)}</TaxPayable>`);
    xmlParts.push(`          <NetTotal>${inv.subtotal.toFixed(2)}</NetTotal>`);
    xmlParts.push(`          <GrossTotal>${inv.grandTotal.toFixed(2)}</GrossTotal>`);
    xmlParts.push(`        </DocumentTotals>`);
    xmlParts.push(`      </Invoice>`);
  }

  xmlParts.push(`    </SalesInvoices>`);
  xmlParts.push(`  </SourceDocuments>`);
  xmlParts.push(`</AuditFile>`);

  return xmlParts.join('\n');
}
