import {
  INITIAL_ITEMS,
  INITIAL_STOCK_LEDGER,
  INITIAL_CUSTOMERS,
  INITIAL_BOM,
} from '../data/seedData';
import {
  round2,
  calculateGst,
  computeItemStockBalance,
} from '../utils/calculations';
import { StockLedgerEntry } from '../types';

export interface TestSuiteResult {
  passed: number;
  failed: number;
  log: string[];
}

export async function runBenchmarkVerificationSuite(): Promise<TestSuiteResult> {
  const result: TestSuiteResult = { passed: 0, failed: 0, log: [] };

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      result.passed++;
      result.log.push(`  ✅ PASS: ${testName} ${details ? `(${details})` : ''}`);
    } else {
      result.failed++;
      result.log.push(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    }
  }

  result.log.push('=== [NIT TIRUCHIRAPPALLI BENCHMARK VERIFICATION SUITE] ===\n');

  // Initial State Check
  result.log.push('--- [CHECK 0: Opening Baseline Inventory Verification] ---');
  let simulatedLedger: StockLedgerEntry[] = [...INITIAL_STOCK_LEDGER];

  const openFlour = computeItemStockBalance('item-flour', simulatedLedger);
  const openOil = computeItemStockBalance('item-oil', simulatedLedger);
  const openSpice = computeItemStockBalance('item-spice', simulatedLedger);
  const openPouches = computeItemStockBalance('item-pouch-200g', simulatedLedger);
  const openCartons = computeItemStockBalance('item-carton-20', simulatedLedger);
  const openMurukku = computeItemStockBalance('item-murukku-200g', simulatedLedger);

  assert(openFlour.currentBalance === 100, 'Opening Flour Stock', `${openFlour.currentBalance} kg == 100 kg`);
  assert(openOil.currentBalance === 30, 'Opening Oil Stock', `${openOil.currentBalance} L == 30 L`);
  assert(openSpice.currentBalance === 5, 'Opening Spice Stock', `${openSpice.currentBalance} kg == 5 kg`);
  assert(openPouches.currentBalance === 500, 'Opening Pouches Stock', `${openPouches.currentBalance} pcs == 500 pcs`);
  assert(openCartons.currentBalance === 30, 'Opening Cartons Stock', `${openCartons.currentBalance} pcs == 30 pcs`);
  assert(openMurukku.currentBalance === 50, 'Opening Finished Murukku', `${openMurukku.currentBalance} pkts == 50 pkts`);

  // Step 1: Purchase 60 kg flour @ ₹45/kg
  result.log.push('\n--- [CHECK 1: Step 1 - Purchase 60 kg Flour @ ₹45] ---');
  const purchaseQty = 60;
  const purchaseRate = 45;
  const flourPostPurchase = openFlour.currentBalance + purchaseQty;

  simulatedLedger.unshift({
    id: 'test-pur-flour',
    timestamp: Date.now(),
    dateStr: '2026-11-20',
    itemId: 'item-flour',
    itemName: 'Flour',
    category: 'raw_material',
    uom: 'kg',
    movementType: 'PURCHASE_RECEIPT',
    quantityChange: purchaseQty,
    balanceAfter: flourPostPurchase,
    unitRate: purchaseRate,
    totalValue: purchaseQty * purchaseRate,
    sourceDocType: 'PURCHASE_INVOICE',
    sourceDocId: 'PO-001',
  });

  const flourAfterPurCheck = computeItemStockBalance('item-flour', simulatedLedger);
  assert(flourAfterPurCheck.currentBalance === 160, 'Flour Stock after Purchase', `${flourAfterPurCheck.currentBalance} kg == 160 kg`);

  // Step 2 & 3: Production Run (Issue 40 kg flour, 10.5 L oil, 1.2 kg spices; Output 188 pkts, 6 damaged pouches, 9 cartons)
  result.log.push('\n--- [CHECK 2: Step 2 & 3 - Production Run Execution & Variances] ---');
  const actualFlourIssued = 40;
  const actualOilIssued = 10.5;
  const actualSpiceIssued = 1.2;
  const actualOutput = 188;
  const expectedOutput = 200;
  const damagedPouches = 6;
  const totalPouchesUsed = actualOutput + damagedPouches; // 194
  const cartonsUsed = 9;

  // Deduct Raw Materials in Ledger
  simulatedLedger.unshift({
    id: 'test-issue-flour',
    timestamp: Date.now(),
    dateStr: '2026-11-20',
    itemId: 'item-flour',
    itemName: 'Flour',
    category: 'raw_material',
    uom: 'kg',
    movementType: 'PRODUCTION_ISSUE',
    quantityChange: -actualFlourIssued,
    balanceAfter: 120,
    unitRate: 42,
    totalValue: actualFlourIssued * 42,
    sourceDocType: 'PRODUCTION_RUN',
    sourceDocId: 'PR-001',
  });

  simulatedLedger.unshift({
    id: 'test-issue-oil',
    timestamp: Date.now(),
    dateStr: '2026-11-20',
    itemId: 'item-oil',
    itemName: 'Cooking oil',
    category: 'raw_material',
    uom: 'litre',
    movementType: 'PRODUCTION_ISSUE',
    quantityChange: -actualOilIssued,
    balanceAfter: 19.5,
    unitRate: 140,
    totalValue: actualOilIssued * 140,
    sourceDocType: 'PRODUCTION_RUN',
    sourceDocId: 'PR-001',
  });

  simulatedLedger.unshift({
    id: 'test-issue-spice',
    timestamp: Date.now(),
    dateStr: '2026-11-20',
    itemId: 'item-spice',
    itemName: 'Salt and spice mix',
    category: 'raw_material',
    uom: 'kg',
    movementType: 'PRODUCTION_ISSUE',
    quantityChange: -actualSpiceIssued,
    balanceAfter: 3.8,
    unitRate: 200,
    totalValue: actualSpiceIssued * 200,
    sourceDocType: 'PRODUCTION_RUN',
    sourceDocId: 'PR-001',
  });

  simulatedLedger.unshift({
    id: 'test-issue-pouch',
    timestamp: Date.now(),
    dateStr: '2026-11-20',
    itemId: 'item-pouch-200g',
    itemName: '200 g pouch',
    category: 'packaging',
    uom: 'piece',
    movementType: 'PRODUCTION_ISSUE',
    quantityChange: -totalPouchesUsed,
    balanceAfter: 306,
    unitRate: 2.5,
    totalValue: totalPouchesUsed * 2.5,
    sourceDocType: 'PRODUCTION_RUN',
    sourceDocId: 'PR-001',
  });

  simulatedLedger.unshift({
    id: 'test-issue-carton',
    timestamp: Date.now(),
    dateStr: '2026-11-20',
    itemId: 'item-carton-20',
    itemName: 'Carton (holds 20 packets)',
    category: 'packaging',
    uom: 'piece',
    movementType: 'PRODUCTION_ISSUE',
    quantityChange: -cartonsUsed,
    balanceAfter: 21,
    unitRate: 15,
    totalValue: cartonsUsed * 15,
    sourceDocType: 'PRODUCTION_RUN',
    sourceDocId: 'PR-001',
  });

  // Credit Finished Goods (+188 packets)
  simulatedLedger.unshift({
    id: 'test-rec-murukku',
    timestamp: Date.now(),
    dateStr: '2026-11-20',
    itemId: 'item-murukku-200g',
    itemName: 'Murukku 200 g Packet',
    category: 'finished_goods',
    uom: 'packet',
    movementType: 'PRODUCTION_RECEIPT',
    quantityChange: actualOutput,
    balanceAfter: 238,
    unitRate: 30.9,
    totalValue: actualOutput * 30.9,
    sourceDocType: 'PRODUCTION_RUN',
    sourceDocId: 'PR-001',
  });

  // Verify Closing Balances per NIT Rubric
  const flourBalPostRun = computeItemStockBalance('item-flour', simulatedLedger).currentBalance;
  assert(flourBalPostRun === 120, 'Flour closing balance (100 + 60 − 40 = 120 kg)', `Expected 120, got ${flourBalPostRun}`);

  const oilBalPostRun = computeItemStockBalance('item-oil', simulatedLedger).currentBalance;
  assert(oilBalPostRun === 19.5, 'Oil closing balance (30 − 10.5 = 19.5 L)', `Expected 19.5, got ${oilBalPostRun}`);

  const pouchBalPostRun = computeItemStockBalance('item-pouch-200g', simulatedLedger).currentBalance;
  assert(pouchBalPostRun === 306, 'Pouches closing balance (500 − 194 = 306)', `Expected 306, got ${pouchBalPostRun}`);

  const fgBalPostRun = computeItemStockBalance('item-murukku-200g', simulatedLedger).currentBalance;
  assert(fgBalPostRun === 238, 'Finished goods after run (50 + 188 = 238 packets)', `Expected 238, got ${fgBalPostRun}`);

  // Variances Check
  const yieldVariance = round2(((actualOutput - expectedOutput) / expectedOutput) * 100);
  assert(yieldVariance === -6.0, 'Yield variance is -6%', `Expected -6%, got ${yieldVariance}%`);
  assert(Math.abs(yieldVariance) > 3.0, 'Yield variance flagged beyond 3% tolerance', 'Flagged as TRUE');

  const oilVariance = round2(((actualOilIssued - 10.0) / 10.0) * 100);
  assert(oilVariance === 5.0, 'Oil consumption variance is +5%', `Expected +5%, got ${oilVariance}%`);
  assert(Math.abs(oilVariance) > 3.0, 'Oil variance flagged beyond 3% tolerance', 'Flagged as TRUE');

  // Costing Check
  const matCost = round2(
    actualFlourIssued * 42 +
    actualOilIssued * 140 +
    actualSpiceIssued * 200 +
    totalPouchesUsed * 2.5 +
    cartonsUsed * 15
  );
  assert(matCost === 4010, 'Direct Material Cost is ₹4,010.00', `Got ₹${matCost}`);

  const labourOverhead = 1200;
  const powerOverhead = 600;
  const totalBatchCost = matCost + labourOverhead + powerOverhead;
  assert(totalBatchCost === 5810, 'Total Batch Cost (Material + Overheads) is ₹5,810.00', `Got ₹${totalBatchCost}`);

  const costPerPacket = round2(totalBatchCost / actualOutput);
  assert(costPerPacket === 30.9, 'Cost per packet is ₹30.90', `Expected 30.90, got ${costPerPacket}`);

  // Step 4 & 5: Salesman A order for Retailer A (150 pkts, TN) & Invoice
  result.log.push('\n--- [CHECK 3: Step 4 & 5 - Retailer A Order & GST Invoicing] ---');
  const orderA_qty = 150;
  const sellingPrice = 50;
  const taxableValA = round2(orderA_qty * sellingPrice); // 7,500
  const gstCalcA = calculateGst(taxableValA, 5, '33'); // Tamil Nadu

  assert(taxableValA === 7500, 'Retailer A Taxable Value is ₹7,500.00', `Got ₹${taxableValA}`);
  assert(gstCalcA.cgstAmount === 187.5, 'Retailer A CGST @ 2.5% is ₹187.50', `Got ₹${gstCalcA.cgstAmount}`);
  assert(gstCalcA.sgstAmount === 187.5, 'Retailer A SGST @ 2.5% is ₹187.50', `Got ₹${gstCalcA.sgstAmount}`);
  assert(gstCalcA.igstAmount === 0, 'Retailer A IGST is ₹0 (Intra-state TN)', `Got ₹${gstCalcA.igstAmount}`);
  assert(gstCalcA.grandTotal === 7875, 'Retailer A Grand Total is ₹7,875.00', `Got ₹${gstCalcA.grandTotal}`);

  // Dispatch Retailer A
  simulatedLedger.unshift({
    id: 'test-disp-retailer-a',
    timestamp: Date.now(),
    dateStr: '2026-11-20',
    itemId: 'item-murukku-200g',
    itemName: 'Murukku 200 g Packet',
    category: 'finished_goods',
    uom: 'packet',
    movementType: 'DISPATCH',
    quantityChange: -orderA_qty,
    balanceAfter: 88,
    unitRate: 50,
    totalValue: taxableValA,
    sourceDocType: 'SALES_INVOICE',
    sourceDocId: 'INV-001',
  });

  const fgBalPostDispatch = computeItemStockBalance('item-murukku-200g', simulatedLedger).currentBalance;
  assert(fgBalPostDispatch === 88, 'Finished goods after Retailer A dispatch (238 − 150 = 88 packets)', `Expected 88, got ${fgBalPostDispatch}`);

  // Step 6: Salesman B order for Distributor B (120 pkts, Karnataka)
  result.log.push('\n--- [CHECK 4: Step 6 - Distributor B Order & Shortage Detection] ---');
  const orderB_qty = 120;
  const availableStock = fgBalPostDispatch; // 88
  const shortage = round2(orderB_qty - availableStock); // 32
  const hasShortage = availableStock < orderB_qty;

  assert(hasShortage === true, 'Distributor B stock shortage detected', 'Flagged as TRUE');
  assert(shortage === 32, 'Distributor B shortage is exactly 32 packets (120 − 88)', `Expected 32, got ${shortage}`);

  const gstCalcB = calculateGst(orderB_qty * sellingPrice, 5, '29'); // Karnataka (inter-state)
  assert(gstCalcB.isInterState === true, 'Inter-state transaction identified (Karnataka)', 'IGST applies');
  assert(gstCalcB.igstAmount === 300, 'IGST on Distributor B order @ 5% is ₹300.00', `Taxable ₹6,000 * 5% = ₹${gstCalcB.igstAmount}`);

  // Step 7: Record payment of ₹4,000 from Retailer A
  result.log.push('\n--- [CHECK 5: Step 7 - Payment & Outstanding Balance] ---');
  const paymentA = 4000;
  const retailerAOutstanding = round2(gstCalcA.grandTotal - paymentA);
  assert(retailerAOutstanding === 3875, 'Retailer A Outstanding Balance is ₹3,875.00 (7,875 − 4,000)', `Expected ₹3,875.00, got ₹${retailerAOutstanding}`);

  return result;
}

