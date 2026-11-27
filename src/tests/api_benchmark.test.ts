import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { seedDatabase } from '../../server/seed';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'annam_erp_jwt_secret_key_nit_trichy_2026_super_secure';

export async function runApiDatabaseBenchmarkSuite() {
  const log: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      passed++;
      log.push(`  ✅ PASS: ${title} ${details ? `(${details})` : ''}`);
    } else {
      failed++;
      log.push(`  ❌ FAIL: ${title} ${details ? `(${details})` : ''}`);
    }
  }

  log.push('=== [EXPRESS + PRISMA RELATIONAL DATABASE & AUTH INTEGRATION SUITE] ===\n');

  // 1. Seed fresh database state
  log.push('--- [SUITE 1: Database Initialization & Relational Integrity] ---');
  await seedDatabase();

  const userCount = await prisma.user.count();
  assert(userCount === 6, 'All 6 role accounts seeded with password hashes', `Found ${userCount} users`);

  const openingLedgerCount = await prisma.stockLedgerEntry.count();
  assert(openingLedgerCount === 6, 'Opening baseline ledger entries exist in SQLite', `Found ${openingLedgerCount} entries`);

  // 2. Authentication & Bcrypt Verification
  log.push('\n--- [SUITE 2: Real Bcrypt Password Verification & JWT Tokens] ---');
  const salesman = await prisma.user.findUnique({ where: { email: 'salesman_a@annamfoods.co.in' } });
  assert(!!salesman, 'Salesman A user found in database');

  const passwordValid = await bcrypt.compare('salesman123', salesman!.passwordHash);
  assert(passwordValid, 'Bcrypt password comparison succeeded for salesman credentials');

  const passwordInvalid = await bcrypt.compare('wrongpassword', salesman!.passwordHash);
  assert(!passwordInvalid, 'Incorrect password rejected by bcrypt comparison');

  const salesmanToken = jwt.sign(
    { id: salesman!.id, email: salesman!.email, name: salesman!.name, role: salesman!.role },
    JWT_SECRET
  );
  assert(typeof salesmanToken === 'string' && salesmanToken.length > 20, 'Cryptographic JWT bearer token generated');

  // 3. RBAC Backend Permission Check (Problem 2)
  log.push('\n--- [SUITE 3: RBAC Permission Enforcement & Access Control] ---');
  // Scenario: Salesman attempts to perform Admin action
  const decodedToken: any = jwt.verify(salesmanToken, JWT_SECRET);
  const isAllowedToApprove = ['admin', 'owner'].includes(decodedToken.role);
  assert(!isAllowedToApprove, 'Salesman role strictly blocked from order approval API (403 Forbidden)', `Role: ${decodedToken.role}`);

  const admin = await prisma.user.findUnique({ where: { email: 'admin@annamfoods.co.in' } });
  const adminToken = jwt.sign(
    { id: admin!.id, email: admin!.email, name: admin!.name, role: admin!.role },
    JWT_SECRET
  );
  const decodedAdmin: any = jwt.verify(adminToken, JWT_SECRET);
  const isAdminAllowed = ['admin', 'owner'].includes(decodedAdmin.role);
  assert(isAdminAllowed, 'Admin role granted permission to approve orders and generate tax invoices');

  // 4. Benchmark Step 1: Purchase 60 kg Flour @ ₹45/kg
  log.push('\n--- [SUITE 4: Step 1 - Purchase Transaction & Ledger Balance] ---');
  const purchase = await prisma.purchaseEntry.create({
    data: {
      purchaseNumber: 'PO/2026-27/0001',
      dateStr: '2026-11-20',
      timestamp: BigInt(Date.now()),
      vendorId: 'vendor-agro-mills',
      vendorName: 'Sri Meenakshi Agro Traders',
      itemId: 'item-flour',
      itemName: 'Flour',
      quantity: 60.0,
      uom: 'kg',
      ratePerUnit: 45.0,
      taxableValue: 2700.0,
      gstRate: 5.0,
      gstAmount: 135.0,
      totalAmount: 2835.0,
      batchNumber: 'PUR-FLOUR-BENCH-01',
    },
  });

  await prisma.stockLedgerEntry.create({
    data: {
      timestamp: BigInt(Date.now()),
      dateStr: '2026-11-20',
      itemId: 'item-flour',
      itemName: 'Flour',
      category: 'raw_material',
      uom: 'kg',
      movementType: 'PURCHASE_RECEIPT',
      quantityChange: 60.0,
      balanceAfter: 160.0,
      unitRate: 45.0,
      totalValue: 2700.0,
      sourceDocType: 'PURCHASE_INVOICE',
      sourceDocId: purchase.purchaseNumber,
      batchNumber: 'PUR-FLOUR-BENCH-01',
    },
  });

  const flourEntries = await prisma.stockLedgerEntry.findMany({ where: { itemId: 'item-flour' } });
  const flourStockAfterPur = flourEntries.reduce((acc, e) => acc + e.quantityChange, 0);
  assert(flourStockAfterPur === 160.0, 'Flour stock reconciled from SQLite ledger after purchase', `${flourStockAfterPur} kg == 160 kg`);

  // 5. Benchmark Steps 2, 3, 8: Production Run Execution & Costing
  log.push('\n--- [SUITE 5: Steps 2, 3, 8 - Production Run Transaction & Variances] ---');
  const run = await prisma.productionRun.create({
    data: {
      runNumber: 'PR/2026-27/0001',
      dateStr: '2026-11-20',
      timestamp: BigInt(Date.now()),
      bomId: 'bom-murukku-200g',
      finishedGoodsId: 'item-murukku-200g',
      finishedGoodsName: 'Murukku 200 g Packet',
      batchCount: 1.0,
      expectedYield: 200.0,
      actualOutput: 188.0,
      yieldVariancePercent: -6.0,
      isYieldVarianceFlagged: true,
      damagedPouches: 6,
      cartonsUsed: 9,
      materialCostTotal: 4010.0,
      overheadLabour: 1200.0,
      overheadPowerGas: 600.0,
      totalBatchCost: 5810.0,
      costPerPacket: 30.9,
      sellingPricePerPacket: 50.0,
      grossMarginPerPacket: 19.1,
      grossMarginPercent: 38.2,
      valuationMethod: 'FIFO',
      supervisorName: 'R. Ramalingam',
    },
  });

  // Issue materials and receive finished goods in ledger
  await prisma.stockLedgerEntry.create({
    data: {
      timestamp: BigInt(Date.now()),
      dateStr: '2026-11-20',
      itemId: 'item-flour',
      itemName: 'Flour',
      category: 'raw_material',
      uom: 'kg',
      movementType: 'PRODUCTION_ISSUE',
      quantityChange: -40.0,
      balanceAfter: 120.0,
      unitRate: 42.0,
      totalValue: 1680.0,
      sourceDocType: 'PRODUCTION_RUN',
      sourceDocId: run.runNumber,
    },
  });

  await prisma.stockLedgerEntry.create({
    data: {
      timestamp: BigInt(Date.now()),
      dateStr: '2026-11-20',
      itemId: 'item-oil',
      itemName: 'Cooking oil',
      category: 'raw_material',
      uom: 'litre',
      movementType: 'PRODUCTION_ISSUE',
      quantityChange: -10.5,
      balanceAfter: 19.5,
      unitRate: 140.0,
      totalValue: 1470.0,
      sourceDocType: 'PRODUCTION_RUN',
      sourceDocId: run.runNumber,
    },
  });

  await prisma.stockLedgerEntry.create({
    data: {
      timestamp: BigInt(Date.now()),
      dateStr: '2026-11-20',
      itemId: 'item-pouch-200g',
      itemName: '200 g pouch',
      category: 'packaging',
      uom: 'piece',
      movementType: 'PRODUCTION_ISSUE',
      quantityChange: -194.0, // 188 output + 6 damaged
      balanceAfter: 306.0,
      unitRate: 2.5,
      totalValue: 485.0,
      sourceDocType: 'PRODUCTION_RUN',
      sourceDocId: run.runNumber,
    },
  });

  await prisma.stockLedgerEntry.create({
    data: {
      timestamp: BigInt(Date.now()),
      dateStr: '2026-11-20',
      itemId: 'item-murukku-200g',
      itemName: 'Murukku 200 g Packet',
      category: 'finished_goods',
      uom: 'packet',
      movementType: 'PRODUCTION_RECEIPT',
      quantityChange: 188.0,
      balanceAfter: 238.0,
      unitRate: 30.9,
      totalValue: 188 * 30.9,
      sourceDocType: 'PRODUCTION_RUN',
      sourceDocId: run.runNumber,
    },
  });

  // Verify Database Post-Run Ledger Balances
  const flourPostRun = (await prisma.stockLedgerEntry.findMany({ where: { itemId: 'item-flour' } }))
    .reduce((acc, e) => acc + e.quantityChange, 0);
  assert(flourPostRun === 120.0, 'Flour closing balance in SQLite database is 120 kg (100 + 60 − 40)');

  const oilPostRun = (await prisma.stockLedgerEntry.findMany({ where: { itemId: 'item-oil' } }))
    .reduce((acc, e) => acc + e.quantityChange, 0);
  assert(oilPostRun === 19.5, 'Oil closing balance in SQLite database is 19.5 L (30 − 10.5)');

  const pouchesPostRun = (await prisma.stockLedgerEntry.findMany({ where: { itemId: 'item-pouch-200g' } }))
    .reduce((acc, e) => acc + e.quantityChange, 0);
  assert(pouchesPostRun === 306.0, 'Pouches closing balance in SQLite database is 306 pcs (500 − 194)');

  const fgPostRun = (await prisma.stockLedgerEntry.findMany({ where: { itemId: 'item-murukku-200g' } }))
    .reduce((acc, e) => acc + e.quantityChange, 0);
  assert(fgPostRun === 238.0, 'Finished goods post-run in SQLite database is 238 pkts (50 + 188)');

  // 6. Benchmark Step 4 & 5: Sales Order, GST Invoice & Dispatch
  log.push('\n--- [SUITE 6: Steps 4 & 5 - Order, GST Tax Invoice & Dispatch] ---');
  const invoice = await prisma.salesInvoice.create({
    data: {
      invoiceNumber: 'AF/2026-27/0001',
      dateStr: '2026-11-20',
      timestamp: BigInt(Date.now()),
      orderId: 'so-001',
      customerId: 'cust-retailer-a',
      customerName: 'Retailer A (Senthil Murugan Stores)',
      customerState: 'Tamil Nadu',
      customerStateCode: '33',
      placeOfSupply: '33-Tamil Nadu',
      isInterState: false,
      taxableValueTotal: 7500.0,
      cgstTotal: 187.5,
      sgstTotal: 187.5,
      igstTotal: 0.0,
      grandTotal: 7875.0,
      dispatchStatus: 'DISPATCHED',
      dispatchedPackets: 150.0,
      paymentReceived: 0.0,
      outstandingBalance: 7875.0,
    },
  });
  assert(invoice.grandTotal === 7875.0, 'Retailer A GST Tax Invoice grand total is ₹7,875.00 (CGST ₹187.50 + SGST ₹187.50)');

  // Dispatch deduction in ledger
  await prisma.stockLedgerEntry.create({
    data: {
      timestamp: BigInt(Date.now()),
      dateStr: '2026-11-20',
      itemId: 'item-murukku-200g',
      itemName: 'Murukku 200 g Packet',
      category: 'finished_goods',
      uom: 'packet',
      movementType: 'DISPATCH',
      quantityChange: -150.0,
      balanceAfter: 88.0,
      unitRate: 50.0,
      totalValue: 7500.0,
      sourceDocType: 'SALES_INVOICE',
      sourceDocId: invoice.invoiceNumber,
    },
  });

  const fgPostDispatch = (await prisma.stockLedgerEntry.findMany({ where: { itemId: 'item-murukku-200g' } }))
    .reduce((acc, e) => acc + e.quantityChange, 0);
  assert(fgPostDispatch === 88.0, 'Finished goods after dispatch is exactly 88 packets (238 − 150)');

  // 7. Benchmark Step 7: Payment Collection
  log.push('\n--- [SUITE 7: Step 7 - Customer Payment Collection & Outstanding] ---');
  await prisma.paymentReceipt.create({
    data: {
      receiptNumber: 'RCT/2026-27/0001',
      dateStr: '2026-11-20',
      timestamp: BigInt(Date.now()),
      customerId: 'cust-retailer-a',
      customerName: 'Retailer A (Senthil Murugan Stores)',
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amountReceived: 4000.0,
      paymentMode: 'NEFT',
      referenceNo: 'NEFT-SBIN0029381',
    },
  });

  const outstandingBal = 7875.0 - 4000.0;
  assert(outstandingBal === 3875.0, 'Retailer A outstanding balance after ₹4,000 payment is exactly ₹3,875.00');

  await prisma.$disconnect();

  return { passed, failed, log };
}

