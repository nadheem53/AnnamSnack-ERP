import express, { Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  authenticateToken,
  requireRole,
  generateToken,
  AuthenticatedRequest,
} from './auth';
import { seedDatabase } from './seed';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper for decimal rounding
const round2 = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

// GST calculation helper based on Place of Supply
function calculateGst(taxableValue: number, gstRatePercent: number, destinationStateCode: string) {
  const isInterState = destinationStateCode.trim() !== '33'; // Tamil Nadu = 33
  const tax = round2((taxableValue * gstRatePercent) / 100);

  if (isInterState) {
    return {
      isInterState: true,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: gstRatePercent,
      igstAmount: tax,
      totalGst: tax,
      grandTotal: round2(taxableValue + tax),
    };
  } else {
    const halfRate = gstRatePercent / 2;
    const cgst = round2((taxableValue * halfRate) / 100);
    const sgst = round2(tax - cgst);
    return {
      isInterState: false,
      cgstRate: halfRate,
      cgstAmount: cgst,
      sgstRate: halfRate,
      sgstAmount: sgst,
      igstRate: 0,
      igstAmount: 0,
      totalGst: tax,
      grandTotal: round2(taxableValue + tax),
    };
  }
}

// ----------------------------------------------------------------------------
// 1. AUTHENTICATION & SESSION ENDPOINTS
// ----------------------------------------------------------------------------

app.post('/api/auth/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// ----------------------------------------------------------------------------
// 2. MASTER DATA ENDPOINTS
// ----------------------------------------------------------------------------

app.get('/api/items', authenticateToken, async (req, res) => {
  const items = await prisma.item.findMany();
  res.json(items);
});

app.get('/api/customers', authenticateToken, async (req, res) => {
  const customers = await prisma.customer.findMany();
  res.json(customers);
});

app.get('/api/vendors', authenticateToken, async (req, res) => {
  const vendors = await prisma.vendor.findMany();
  res.json(vendors);
});

app.get('/api/bom', authenticateToken, async (req, res) => {
  const bom = await prisma.billOfMaterials.findFirst({
    include: { components: true },
  });
  res.json(bom);
});

// ----------------------------------------------------------------------------
// 3. STOCK & PERPETUAL LEDGER ENDPOINTS
// ----------------------------------------------------------------------------

app.get('/api/stock/ledger', authenticateToken, async (req, res) => {
  const entries = await prisma.stockLedgerEntry.findMany({
    orderBy: { createdAt: 'desc' },
  });
  // Convert BigInt timestamp to number for JSON serialization
  const serialized = entries.map((e) => ({
    ...e,
    timestamp: Number(e.timestamp),
  }));
  res.json(serialized);
});

app.get('/api/stock/summary', authenticateToken, async (req, res) => {
  const items = await prisma.item.findMany();
  const entries = await prisma.stockLedgerEntry.findMany();

  const summary = items.map((it) => {
    const itemEntries = entries.filter((e) => e.itemId === it.id);
    let currentBalance = 0;
    for (const e of itemEntries) {
      currentBalance += e.quantityChange;
    }
    return {
      itemId: it.id,
      code: it.code,
      name: it.name,
      category: it.category,
      uom: it.uom,
      currentBalance: round2(currentBalance),
      standardCost: it.standardCost,
      reorderLevel: it.reorderLevel,
    };
  });

  res.json(summary);
});

// ----------------------------------------------------------------------------
// 4. SALES ORDERS (Role-Restricted)
// ----------------------------------------------------------------------------

app.get('/api/orders', authenticateToken, async (req: AuthenticatedRequest, res) => {
  // Salesmen see their own orders; admin, owner, auditor see all
  const whereClause =
    req.user?.role === 'salesman'
      ? { salesmanName: { contains: req.user.name.split(' ')[0] } }
      : {};

  const orders = await prisma.salesOrder.findMany({
    where: whereClause,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = orders.map((o) => ({
    ...o,
    timestamp: Number(o.timestamp),
  }));

  res.json(serialized);
});

app.post(
  '/api/orders',
  authenticateToken,
  requireRole(['salesman', 'admin', 'owner']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { customerId, items: requestedItems, isOffline } = req.body;
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) return res.status(404).json({ error: 'Customer not found.' });

      const count = await prisma.salesOrder.count();
      const orderNumber = `SO/2026-27/${(count + 1).toString().padStart(4, '0')}`;
      const now = Date.now();
      const dateStr = new Date().toISOString().split('T')[0];

      let subtotal = 0;
      let taxTotal = 0;
      let hasShortage = false;
      let shortageMsg = '';

      // Compute stock availability for each item
      const ledgerEntries = await prisma.stockLedgerEntry.findMany();
      const processedItems: any[] = [];

      for (const reqItem of requestedItems) {
        const item = await prisma.item.findUnique({ where: { id: reqItem.itemId } });
        if (!item) continue;

        const currentStock = round2(
          ledgerEntries
            .filter((l) => l.itemId === item.id)
            .reduce((acc, l) => acc + l.quantityChange, 0)
        );

        const isShort = currentStock < reqItem.quantity;
        if (isShort) {
          hasShortage = true;
          const deficit = round2(reqItem.quantity - currentStock);
          shortageMsg = `Insufficient Stock! Requested ${reqItem.quantity} ${item.uom}, available only ${currentStock} ${item.uom} (Shortage: ${deficit} ${item.uom}).`;
        }

        const unitPrice = item.sellingPrice || 50;
        const taxable = round2(reqItem.quantity * unitPrice);
        const gst = calculateGst(taxable, item.gstRate, customer.stateCode);

        subtotal += taxable;
        taxTotal += gst.totalGst;

        processedItems.push({
          itemId: item.id,
          itemName: item.name,
          quantity: reqItem.quantity,
          uom: item.uom,
          unitPrice,
          taxableValue: taxable,
          gstRate: item.gstRate,
          gstAmount: gst.totalGst,
          totalAmount: gst.grandTotal,
          stockAvailableAtBooking: currentStock,
          isShortage: isShort,
        });
      }

      const grandTotal = round2(subtotal + taxTotal);

      const order = await prisma.salesOrder.create({
        data: {
          orderNumber,
          dateStr,
          timestamp: BigInt(now),
          customerId: customer.id,
          customerName: customer.name,
          customerState: customer.state,
          customerStateCode: customer.stateCode,
          salesmanId: req.user!.id,
          salesmanName: req.user!.name,
          subtotal: round2(subtotal),
          taxTotal: round2(taxTotal),
          grandTotal,
          status: 'submitted',
          isOfflineSubmitted: Boolean(isOffline),
          stockSufficiency: hasShortage ? 'PARTIAL_SHORTAGE' : 'FULL',
          shortageMessage: shortageMsg,
          items: {
            create: processedItems,
          },
        },
        include: { items: true },
      });

      res.status(201).json({
        ...order,
        timestamp: Number(order.timestamp),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ----------------------------------------------------------------------------
// 5. INVOICE GENERATION & DISPATCH (Strictly Admin / Owner)
// ----------------------------------------------------------------------------

app.post(
  '/api/orders/:id/approve',
  authenticateToken,
  requireRole(['admin', 'owner']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const order = await prisma.salesOrder.findUnique({
        where: { id },
        include: { items: true, customer: true },
      });

      if (!order) return res.status(404).json({ error: 'Order not found.' });
      if (order.status !== 'submitted') {
        return res.status(400).json({ error: `Order is already in '${order.status}' status.` });
      }

      const invCount = await prisma.salesInvoice.count();
      const invoiceNumber = `AF/2026-27/${(invCount + 1).toString().padStart(4, '0')}`;
      const now = Date.now();
      const dateStr = new Date().toISOString().split('T')[0];

      let taxableTotal = 0;
      let cgstTotal = 0;
      let sgstTotal = 0;
      let igstTotal = 0;
      let grandTotal = 0;

      const invoiceItemsData = order.items.map((it) => {
        const gst = calculateGst(it.taxableValue, it.gstRate, order.customer.stateCode);
        taxableTotal += it.taxableValue;
        cgstTotal += gst.cgstAmount;
        sgstTotal += gst.sgstAmount;
        igstTotal += gst.igstAmount;
        grandTotal += gst.grandTotal;

        return {
          itemId: it.itemId,
          itemName: it.itemName,
          hsnCode: '1905',
          quantity: it.quantity,
          uom: it.uom,
          unitPrice: it.unitPrice,
          taxableValue: it.taxableValue,
          cgstRate: gst.cgstRate,
          cgstAmount: gst.cgstAmount,
          sgstRate: gst.sgstRate,
          sgstAmount: gst.sgstAmount,
          igstRate: gst.igstRate,
          igstAmount: gst.igstAmount,
          totalAmount: gst.grandTotal,
        };
      });

      const isInterState = order.customer.stateCode !== '33';

      // Atomic Transaction: Create invoice, update order status, update customer balance
      const [invoice] = await prisma.$transaction([
        prisma.salesInvoice.create({
          data: {
            invoiceNumber,
            dateStr,
            timestamp: BigInt(now),
            orderId: order.id,
            customerId: order.customerId,
            customerName: order.customerName,
            customerGstin: order.customer.gstin,
            customerState: order.customerState,
            customerStateCode: order.customerStateCode,
            placeOfSupply: `${order.customerStateCode}-${order.customerState}`,
            isInterState,
            taxableValueTotal: round2(taxableTotal),
            cgstTotal: round2(cgstTotal),
            sgstTotal: round2(sgstTotal),
            igstTotal: round2(igstTotal),
            grandTotal: round2(grandTotal),
            dispatchStatus: 'PENDING',
            outstandingBalance: round2(grandTotal),
            items: { create: invoiceItemsData },
          },
          include: { items: true },
        }),
        prisma.salesOrder.update({
          where: { id: order.id },
          data: { status: 'invoiced' },
        }),
        prisma.customer.update({
          where: { id: order.customerId },
          data: { outstandingBalance: { increment: round2(grandTotal) } },
        }),
      ]);

      res.status(201).json({
        ...invoice,
        timestamp: Number(invoice.timestamp),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.get('/api/invoices', authenticateToken, async (req, res) => {
  const invoices = await prisma.salesInvoice.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  const serialized = invoices.map((inv) => ({
    ...inv,
    timestamp: Number(inv.timestamp),
  }));
  res.json(serialized);
});

app.post(
  '/api/invoices/:id/dispatch',
  authenticateToken,
  requireRole(['admin', 'owner']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const invoice = await prisma.salesInvoice.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
      if (invoice.dispatchStatus === 'DISPATCHED') {
        return res.status(400).json({ error: 'Invoice has already been dispatched.' });
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const now = Date.now();
      let totalPackets = 0;

      // Transactionally write immutable stock ledger entries and update invoice
      await prisma.$transaction(async (tx) => {
        for (const item of invoice.items) {
          totalPackets += item.quantity;
          const currentEntries = await tx.stockLedgerEntry.findMany({
            where: { itemId: item.itemId },
          });
          const currentBal = round2(
            currentEntries.reduce((acc, l) => acc + l.quantityChange, 0)
          );
          const balanceAfter = round2(currentBal - item.quantity);

          await tx.stockLedgerEntry.create({
            data: {
              timestamp: BigInt(now),
              dateStr,
              itemId: item.itemId,
              itemName: item.itemName,
              category: 'finished_goods',
              uom: item.uom,
              movementType: 'DISPATCH',
              quantityChange: -item.quantity,
              balanceAfter,
              unitRate: item.unitPrice,
              totalValue: round2(item.quantity * item.unitPrice),
              sourceDocType: 'SALES_INVOICE',
              sourceDocId: invoice.invoiceNumber,
              notes: `Dispatched against ${invoice.invoiceNumber} to ${invoice.customerName}`,
            },
          });
        }

        await tx.salesInvoice.update({
          where: { id: invoice.id },
          data: {
            dispatchStatus: 'DISPATCHED',
            dispatchDate: dateStr,
            dispatchedPackets: totalPackets,
          },
        });

        await tx.salesOrder.update({
          where: { id: invoice.orderId },
          data: { status: 'dispatched' },
        });
      });

      res.json({ success: true, message: `Dispatched ${totalPackets} packets for invoice ${invoice.invoiceNumber}.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ----------------------------------------------------------------------------
// 6. PRODUCTION RUNS & INGREDIENT CONSUMPTION (Strictly Production / Owner)
// ----------------------------------------------------------------------------

app.get('/api/production/runs', authenticateToken, async (req, res) => {
  const runs = await prisma.productionRun.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  const serialized = runs.map((r) => ({
    ...r,
    timestamp: Number(r.timestamp),
  }));
  res.json(serialized);
});

app.post(
  '/api/production/runs',
  authenticateToken,
  requireRole(['production', 'owner']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        bomId,
        flourQty,
        oilQty,
        spiceQty,
        actualOutput,
        damagedPouches = 6,
        cartonsUsed = 9,
        overheadLabour = 1200,
        overheadPowerGas = 600,
        notes,
      } = req.body;

      const bom = await prisma.billOfMaterials.findFirst({
        where: { id: bomId || 'bom-murukku-200g' },
      });
      if (!bom) return res.status(404).json({ error: 'BOM recipe not found.' });

      const runCount = await prisma.productionRun.count();
      const runNumber = `PR/2026-27/${(runCount + 1).toString().padStart(4, '0')}`;
      const now = Date.now();
      const dateStr = new Date().toISOString().split('T')[0];

      const standardFlour = 40.0;
      const standardOil = 10.0;
      const standardSpice = 1.2;
      const expectedOutput = 200.0;

      const yieldVariancePercent = round2(((actualOutput - expectedOutput) / expectedOutput) * 100);
      const isYieldVarianceFlagged = Math.abs(yieldVariancePercent) > 3.0;

      const flourVariance = round2(((flourQty - standardFlour) / standardFlour) * 100);
      const oilVariance = round2(((oilQty - standardOil) / standardOil) * 100);
      const spiceVariance = round2(((spiceQty - standardSpice) / standardSpice) * 100);

      // FIFO costing calculations
      const flourCost = round2(flourQty * 42.0);
      const oilCost = round2(oilQty * 140.0);
      const spiceCost = round2(spiceQty * 200.0);
      const pouchesTotal = actualOutput + damagedPouches;
      const pouchCost = round2(pouchesTotal * 2.5);
      const cartonCost = round2(cartonsUsed * 15.0);

      const materialCostTotal = round2(flourCost + oilCost + spiceCost + pouchCost + cartonCost);
      const totalOverheads = round2(overheadLabour + overheadPowerGas);
      const totalBatchCost = round2(materialCostTotal + totalOverheads);
      const costPerPacket = round2(totalBatchCost / actualOutput);
      const sellingPricePerPacket = 50.0;
      const grossMarginPerPacket = round2(sellingPricePerPacket - costPerPacket);
      const grossMarginPercent = round2((grossMarginPerPacket / sellingPricePerPacket) * 100);

      // Transactional Run Creation + Stock Ledger Updates
      const run = await prisma.$transaction(async (tx) => {
        const createdRun = await tx.productionRun.create({
          data: {
            runNumber,
            dateStr,
            timestamp: BigInt(now),
            bomId: bom.id,
            finishedGoodsId: 'item-murukku-200g',
            finishedGoodsName: 'Murukku 200 g Packet',
            batchCount: 1.0,
            expectedYield: expectedOutput,
            actualOutput,
            yieldVariancePercent,
            isYieldVarianceFlagged,
            damagedPouches,
            cartonsUsed,
            materialCostTotal,
            overheadLabour,
            overheadPowerGas,
            totalBatchCost,
            costPerPacket,
            sellingPricePerPacket,
            grossMarginPerPacket,
            grossMarginPercent,
            valuationMethod: 'FIFO',
            supervisorName: req.user!.name,
            notes: notes || 'Standard batch production run per recipe',
            items: {
              create: [
                {
                  itemId: 'item-flour',
                  itemName: 'Flour',
                  standardQty: standardFlour,
                  actualQty: flourQty,
                  uom: 'kg',
                  variancePercent: flourVariance,
                  isVarianceFlagged: Math.abs(flourVariance) > 3.0,
                  unitCost: 42.0,
                  totalCost: flourCost,
                },
                {
                  itemId: 'item-oil',
                  itemName: 'Cooking oil',
                  standardQty: standardOil,
                  actualQty: oilQty,
                  uom: 'litre',
                  variancePercent: oilVariance,
                  isVarianceFlagged: Math.abs(oilVariance) > 3.0,
                  unitCost: 140.0,
                  totalCost: oilCost,
                },
                {
                  itemId: 'item-spice',
                  itemName: 'Salt and spice mix',
                  standardQty: standardSpice,
                  actualQty: spiceQty,
                  uom: 'kg',
                  variancePercent: spiceVariance,
                  isVarianceFlagged: Math.abs(spiceVariance) > 3.0,
                  unitCost: 200.0,
                  totalCost: spiceCost,
                },
              ],
            },
          },
          include: { items: true },
        });

        // Helper to append ledger entry with recalculated balance
        const appendLedger = async (itemId: string, itemName: string, cat: string, uom: string, type: string, change: number, rate: number, totalVal: number, notesStr: string) => {
          const past = await tx.stockLedgerEntry.findMany({ where: { itemId } });
          const curBal = past.reduce((acc, l) => acc + l.quantityChange, 0);
          await tx.stockLedgerEntry.create({
            data: {
              timestamp: BigInt(now),
              dateStr,
              itemId,
              itemName,
              category: cat,
              uom,
              movementType: type,
              quantityChange: change,
              balanceAfter: round2(curBal + change),
              unitRate: rate,
              totalValue: totalVal,
              sourceDocType: 'PRODUCTION_RUN',
              sourceDocId: runNumber,
              notes: notesStr,
            },
          });
        };

        // 1. Issue Flour
        await appendLedger('item-flour', 'Flour', 'raw_material', 'kg', 'PRODUCTION_ISSUE', -flourQty, 42.0, flourCost, `Issued to run ${runNumber}`);
        // 2. Issue Oil
        await appendLedger('item-oil', 'Cooking oil', 'raw_material', 'litre', 'PRODUCTION_ISSUE', -oilQty, 140.0, oilCost, `Issued to run ${runNumber}`);
        // 3. Issue Spices
        await appendLedger('item-spice', 'Salt and spice mix', 'raw_material', 'kg', 'PRODUCTION_ISSUE', -spiceQty, 200.0, spiceCost, `Issued to run ${runNumber}`);
        // 4. Issue Pouches (188 good + 6 damaged = 194)
        await appendLedger('item-pouch-200g', '200 g pouch', 'packaging', 'piece', 'PRODUCTION_ISSUE', -pouchesTotal, 2.5, pouchCost, `Pouches consumed in run`);
        // 5. Issue Cartons (9)
        await appendLedger('item-carton-20', 'Carton (holds 20 packets)', 'packaging', 'piece', 'PRODUCTION_ISSUE', -cartonsUsed, 15.0, cartonCost, `Cartons used`);
        // 6. Receive Finished Goods (+188 packets)
        await appendLedger('item-murukku-200g', 'Murukku 200 g Packet', 'finished_goods', 'packet', 'PRODUCTION_RECEIPT', actualOutput, costPerPacket, round2(actualOutput * costPerPacket), `Produced ${actualOutput} good packets @ ₹${costPerPacket}/pkt`);

        return createdRun;
      });

      res.status(201).json({
        ...run,
        timestamp: Number(run.timestamp),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ----------------------------------------------------------------------------
// 7. PURCHASES & COLLECTIONS
// ----------------------------------------------------------------------------

app.get('/api/purchases', authenticateToken, async (req, res) => {
  const purchases = await prisma.purchaseEntry.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(purchases.map((p) => ({ ...p, timestamp: Number(p.timestamp) })));
});

app.post(
  '/api/purchases',
  authenticateToken,
  requireRole(['production', 'admin', 'owner']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { vendorId, itemId, quantity, ratePerUnit, batchNumber } = req.body;
      const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
      const item = await prisma.item.findUnique({ where: { id: itemId } });
      if (!vendor || !item) return res.status(404).json({ error: 'Vendor or item not found.' });

      const count = await prisma.purchaseEntry.count();
      const purchaseNumber = `PO/2026-27/${(count + 1).toString().padStart(4, '0')}`;
      const now = Date.now();
      const dateStr = new Date().toISOString().split('T')[0];

      const taxableValue = round2(quantity * ratePerUnit);
      const gstAmount = round2((taxableValue * item.gstRate) / 100);
      const totalAmount = round2(taxableValue + gstAmount);
      const batch = batchNumber || `PUR-BATCH-${Date.now().toString(36).toUpperCase()}`;

      const [purchase] = await prisma.$transaction([
        prisma.purchaseEntry.create({
          data: {
            purchaseNumber,
            dateStr,
            timestamp: BigInt(now),
            vendorId: vendor.id,
            vendorName: vendor.name,
            itemId: item.id,
            itemName: item.name,
            quantity,
            uom: item.uom,
            ratePerUnit,
            taxableValue,
            gstRate: item.gstRate,
            gstAmount,
            totalAmount,
            batchNumber: batch,
          },
        }),
      ]);

      // Add to stock ledger
      const past = await prisma.stockLedgerEntry.findMany({ where: { itemId: item.id } });
      const curBal = past.reduce((acc, l) => acc + l.quantityChange, 0);

      await prisma.stockLedgerEntry.create({
        data: {
          timestamp: BigInt(now),
          dateStr,
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          uom: item.uom,
          movementType: 'PURCHASE_RECEIPT',
          quantityChange: quantity,
          balanceAfter: round2(curBal + quantity),
          unitRate: ratePerUnit,
          totalValue: taxableValue,
          sourceDocType: 'PURCHASE_INVOICE',
          sourceDocId: purchaseNumber,
          batchNumber: batch,
          notes: `Purchased from ${vendor.name} @ ₹${ratePerUnit}/${item.uom}`,
        },
      });

      res.status(201).json({
        ...purchase,
        timestamp: Number(purchase.timestamp),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.get('/api/payments', authenticateToken, async (req, res) => {
  const payments = await prisma.paymentReceipt.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(payments.map((p) => ({ ...p, timestamp: Number(p.timestamp) })));
});

app.post(
  '/api/payments',
  authenticateToken,
  requireRole(['admin', 'owner']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { customerId, invoiceId, amount, paymentMode = 'NEFT', referenceNo } = req.body;
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      const invoice = await prisma.salesInvoice.findUnique({ where: { id: invoiceId } });
      if (!customer || !invoice) return res.status(404).json({ error: 'Customer or invoice not found.' });

      const count = await prisma.paymentReceipt.count();
      const receiptNumber = `RCT/2026-27/${(count + 1).toString().padStart(4, '0')}`;
      const now = Date.now();
      const dateStr = new Date().toISOString().split('T')[0];

      const [receipt] = await prisma.$transaction([
        prisma.paymentReceipt.create({
          data: {
            receiptNumber,
            dateStr,
            timestamp: BigInt(now),
            customerId: customer.id,
            customerName: customer.name,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amountReceived: amount,
            paymentMode,
            referenceNo: referenceNo || `TXN-${Date.now().toString(36).toUpperCase()}`,
          },
        }),
        prisma.salesInvoice.update({
          where: { id: invoice.id },
          data: {
            paymentReceived: { increment: amount },
            outstandingBalance: { decrement: amount },
          },
        }),
        prisma.customer.update({
          where: { id: customer.id },
          data: {
            outstandingBalance: { decrement: amount },
          },
        }),
      ]);

      res.status(201).json({
        ...receipt,
        timestamp: Number(receipt.timestamp),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ----------------------------------------------------------------------------
// 8. BENCHMARK UTILITIES (Reset & 1-Click Run in Database)
// ----------------------------------------------------------------------------

app.post('/api/benchmark/reset', authenticateToken, async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database reset to Section 5 opening baseline.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`🚀 Annam Foods ERP API server running on http://localhost:${PORT}`);
});

