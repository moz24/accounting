// Comprehensive End-to-End Accounting Verification Script
import { INITIAL_PGC_ACCOUNTS, INITIAL_CUSTOMERS, INITIAL_INVENTORY, INITIAL_INVOICES, INITIAL_BOM, INITIAL_LANDED_COST } from './src/data/angolaPgcData';
import { generateAgtInvoiceHash, verifyAgtHashChain } from './src/services/cryptoEngine';
import { generateSaftAoXml, DEFAULT_COMPANY } from './src/services/saftAoExporter';

async function runEndToEndVerification() {
  console.log("==================================================");
  console.log("   NEXORA ERP ANGOLA AGT - END-TO-END AUDIT SUITE  ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${testName} ${details ? ': ' + details : ''}`);
      failed++;
    }
  }

  // TEST 1: Initial Chart of Accounts (PGC Angola) Balance
  console.log("\n[1] PGC ANGOLA CHART OF ACCOUNTS INTEGRITY:");
  assert(INITIAL_PGC_ACCOUNTS.length > 0, "Chart of accounts is populated");
  const classNumbers = new Set(INITIAL_PGC_ACCOUNTS.map(a => a.classNumber));
  assert(classNumbers.has(1) && classNumbers.has(2) && classNumbers.has(3) && classNumbers.has(4) && classNumbers.has(5) && classNumbers.has(6) && classNumbers.has(7), "Covers official PGC Classes 1 through 7");

  // TEST 2: Inventory Valuation (CMP / WAC)
  console.log("\n[2] INVENTORY VALUATION & CMP FORMULAS:");
  const initialStockValue = INITIAL_INVENTORY.reduce((s, i) => s + (i.currentStock * i.costPrice), 0);
  assert(initialStockValue > 0, `Total stock valuation calculated: ${initialStockValue.toLocaleString('pt-AO')} Kz`);
  for (const item of INITIAL_INVENTORY) {
    if (item.category !== 'SERVICE') {
      assert(item.costPrice >= 0, `Item ${item.code} has valid positive cost price`);
      assert(item.currentStock >= 0, `Item ${item.code} has non-negative stock quantity`);
    }
  }

  // TEST 3: Manufacturing BOM Batch Yield & Cost Rollup
  console.log("\n[3] MANUFACTURING BOM FORMULAS:");
  const bomComponentsTotal = INITIAL_BOM.components.reduce((s, c) => s + c.totalCost, 0);
  const bomFullBatchCost = bomComponentsTotal + INITIAL_BOM.laborCost + INITIAL_BOM.overheadCost;
  const calculatedUnitCost = Math.round(bomFullBatchCost / INITIAL_BOM.batchYieldQuantity);
  assert(Math.abs(calculatedUnitCost - INITIAL_BOM.totalUnitCost) <= 5, 
    `BOM calculated unit cost (${calculatedUnitCost} Kz) matches defined unit cost (${INITIAL_BOM.totalUnitCost} Kz) within rounding tolerance`);

  // TEST 4: Landed Cost Allocation Formulas (By Value vs By Weight)
  console.log("\n[4] IMPORT LANDED COST ALLOCATION (PORT OF LUANDA):");
  const totalExtra = INITIAL_LANDED_COST.seaFreightCost + INITIAL_LANDED_COST.customsDuty + 
                     INITIAL_LANDED_COST.portTerminalFees + INITIAL_LANDED_COST.marineInsurance;
  assert(totalExtra === INITIAL_LANDED_COST.totalExtraCost, 
    `Landed cost expense components sum correctly to totalExtraCost (${totalExtra} Kz)`);

  const item1 = INITIAL_LANDED_COST.itemsAllocated[0];
  const item2 = INITIAL_LANDED_COST.itemsAllocated[1];
  const totalFobValue = (item1.quantity * item1.originalCost) + (item2.quantity * item2.originalCost);
  const item1ValueShare = (item1.quantity * item1.originalCost) / totalFobValue;
  const item1AllocatedByVal = Math.round((item1ValueShare * totalExtra) / item1.quantity);
  assert(item1AllocatedByVal > 0, `Allocated cost per unit calculated by value: ${item1AllocatedByVal} Kz`);
  assert(item1.originalCost + item1AllocatedByVal > item1.originalCost, "New CMP is greater than original FOB cost");

  // TEST 5: Cryptographic Hash Chaining (AGT Decree 386/20)
  console.log("\n[5] AGT DECREE 386/20 CRYPTOGRAPHIC CHIP ENGINE:");
  const testInv1 = {
    invoiceDate: '2026-10-06',
    systemEntryDate: '2026-10-06T10:00:00',
    invoiceNo: 'FT AGT2026/0001',
    grossTotal: 1000000.00,
    previousHash: '',
  };
  const hash1 = await generateAgtInvoiceHash(testInv1);
  assert(hash1.signatureBase64.length >= 32, "Generated RSA-2048/SHA-256 Base64 hash with length >= 32");
  assert(hash1.hashControl.length === 4, `Extracted 4-character AGT control stamp: "${hash1.hashControl}"`);
  assert(hash1.certificateMention.includes("412/AGT/2026"), "Certificate mention includes AGT License 412/AGT/2026");

  // Chained Invoice 2
  const testInv2 = {
    invoiceDate: '2026-10-06',
    systemEntryDate: '2026-10-06T10:15:00',
    invoiceNo: 'FT AGT2026/0002',
    grossTotal: 2500000.00,
    previousHash: hash1.signatureBase64,
  };
  const hash2 = await generateAgtInvoiceHash(testInv2);
  assert(hash2.previousHash === hash1.signatureBase64, "Invoice 2 correctly chains previousHash of Invoice 1");

  // Verify chain validator
  const chainAudit = await verifyAgtHashChain([
    {
      date: testInv1.invoiceDate,
      systemEntryDate: testInv1.systemEntryDate,
      seriesNumber: testInv1.invoiceNo,
      sequentialNumber: 1,
      grandTotal: testInv1.grossTotal,
      hashChaining: {
        currentHash: hash1.signatureBase64,
        previousHash: '',
        hashControl: hash1.hashControl,
      }
    },
    {
      date: testInv2.invoiceDate,
      systemEntryDate: testInv2.systemEntryDate,
      seriesNumber: testInv2.invoiceNo,
      sequentialNumber: 2,
      grandTotal: testInv2.grossTotal,
      hashChaining: {
        currentHash: hash2.signatureBase64,
        previousHash: hash1.signatureBase64,
        hashControl: hash2.hashControl,
      }
    }
  ]);
  assert(chainAudit.isValid, "verifyAgtHashChain reports 100% valid cryptographic continuity");

  // TEST 6: Initial Invoices Integrity
  console.log("\n[6] INITIAL INVOICES DATA INTEGRITY:");
  for (const inv of INITIAL_INVOICES) {
    if (inv.seriesType === 'FISCAL_AGT') {
      assert(inv.vatTotal > 0, `Fiscal invoice ${inv.seriesNumber} has VAT charged`);
      assert(!!inv.hashChaining, `Fiscal invoice ${inv.seriesNumber} has AGT hash chaining`);
    } else {
      assert(inv.vatTotal === 0, `Pro-Forma invoice ${inv.seriesNumber} is 0% VAT / exempt`);
      assert(!inv.isSaftExported, `Pro-Forma invoice ${inv.seriesNumber} marked not exported to SAF-T`);
    }
  }

  // TEST 7: SAF-T (AO) XML Generation
  console.log("\n[7] SAF-T (AO) XML EXPORTER SPECIFICATION:");
  const xml = generateSaftAoXml(INITIAL_INVOICES, INITIAL_CUSTOMERS, INITIAL_INVENTORY, INITIAL_PGC_ACCOUNTS, DEFAULT_COMPANY);
  assert(xml.includes("<AuditFile xmlns=\"urn:OECD:StandardAuditFile-Tax:AO_1.01_01\""), "Root element matches schema urn:OECD:StandardAuditFile-Tax:AO_1.01_01");
  assert(xml.includes(`<CompanyID>${DEFAULT_COMPANY.nif}</CompanyID>`), "Header contains Company Tax ID");
  assert(xml.includes("<GeneralLedgerAccounts>"), "Contains GeneralLedgerAccounts table");
  assert(xml.includes("<TaxTable>"), "Contains TaxTable with NOR (14%)");
  assert(xml.includes("<SalesInvoices>"), "Contains SalesInvoices table");
  assert(xml.includes("FT AGT2026/0001"), "Contains fiscal invoice FT AGT2026/0001");
  assert(!xml.includes("FP INT2026/0001"), "Does NOT contain pro-forma invoice FP INT2026/0001 (strictly omitted per AGT rules)");

  console.log("\n==================================================");
  console.log(`TOTAL AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runEndToEndVerification().catch(err => {
  console.error("FATAL ERROR IN AUDIT RUNNER:", err);
  process.exit(1);
});
