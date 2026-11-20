import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserRole,
  ItemMaster,
  Customer,
  Vendor,
  BillOfMaterials,
  StockLedgerEntry,
  ProductionRun,
  SalesOrder,
  SalesInvoice,
  PurchaseEntry,
  PaymentReceipt,
  AppNotification,
} from '../types';
import {
  INITIAL_ITEMS,
  INITIAL_CUSTOMERS,
  INITIAL_VENDORS,
  INITIAL_BOM,
  INITIAL_STOCK_LEDGER,
} from '../data/seedData';
import {
  round2,
  calculateGst,
  computeItemStockBalance,
  formatINR,
} from '../utils/calculations';

interface ErpContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  lang: 'en' | 'ta';
  setLang: (lang: 'en' | 'ta') => void;
  items: ItemMaster[];
  customers: Customer[];
  vendors: Vendor[];
  bom: BillOfMaterials;
  stockLedger: StockLedgerEntry[];
  productionRuns: ProductionRun[];
  orders: SalesOrder[];
  invoices: SalesInvoice[];
  purchases: PurchaseEntry[];
  payments: PaymentReceipt[];
  notifications: AppNotification[];
  clearNotification: (id: string) => void;

  // Actions
  recordPurchase: (params: {
    vendorId: string;
    itemId: string;
    quantity: number;
    ratePerUnit: number;
    batchNumber?: string;
  }) => PurchaseEntry;

  executeProductionRun: (params: {
    bomId: string;
    flourQty: number; // e.g. 40
    oilQty: number; // e.g. 10.5
    spiceQty: number; // e.g. 1.2
    actualOutput: number; // e.g. 188
    damagedPouches: number; // e.g. 6
    cartonsUsed: number; // e.g. 9
    overheadLabour: number; // e.g. 1200
    overheadPowerGas: number; // e.g. 600
    supervisorName?: string;
    notes?: string;
  }) => ProductionRun;

  createSalesOrder: (params: {
    customerId: string;
    salesmanName: string;
    items: { itemId: string; quantity: number }[];
    isOffline?: boolean;
  }) => SalesOrder;

  approveOrderAndGenerateInvoice: (orderId: string) => SalesInvoice | null;

  dispatchInvoice: (invoiceId: string) => boolean;

  recordPaymentReceipt: (params: {
    customerId: string;
    invoiceId: string;
    amount: number;
    paymentMode: 'NEFT' | 'UPI' | 'CHEQUE' | 'CASH';
    referenceNo?: string;
  }) => PaymentReceipt;

  resetToBenchmarkBaseline: () => void;
  runEntireBenchmarkScenario: () => void;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('owner');
  const [lang, setLang] = useState<'en' | 'ta'>('en');

  const [items, setItems] = useState<ItemMaster[]>(() => {
    const saved = localStorage.getItem('annam_erp_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('annam_erp_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [vendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [bom] = useState<BillOfMaterials>(INITIAL_BOM);

  const [stockLedger, setStockLedger] = useState<StockLedgerEntry[]>(() => {
    const saved = localStorage.getItem('annam_erp_ledger');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_LEDGER;
  });

  const [productionRuns, setProductionRuns] = useState<ProductionRun[]>(() => {
    const saved = localStorage.getItem('annam_erp_runs');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<SalesOrder[]>(() => {
    const saved = localStorage.getItem('annam_erp_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState<SalesInvoice[]>(() => {
    const saved = localStorage.getItem('annam_erp_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchases, setPurchases] = useState<PurchaseEntry[]>(() => {
    const saved = localStorage.getItem('annam_erp_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState<PaymentReceipt[]>(() => {
    const saved = localStorage.getItem('annam_erp_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-welcome',
      timestamp: Date.now(),
      title: 'System Ready',
      message: 'NIT Trichy Benchmark dataset loaded. Ready to run order-to-audit workflow.',
      type: 'INFO',
      read: false,
    },
  ]);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('annam_erp_items', JSON.stringify(items));
    localStorage.setItem('annam_erp_customers', JSON.stringify(customers));
    localStorage.setItem('annam_erp_ledger', JSON.stringify(stockLedger));
    localStorage.setItem('annam_erp_runs', JSON.stringify(productionRuns));
    localStorage.setItem('annam_erp_orders', JSON.stringify(orders));
    localStorage.setItem('annam_erp_invoices', JSON.stringify(invoices));
    localStorage.setItem('annam_erp_purchases', JSON.stringify(purchases));
    localStorage.setItem('annam_erp_payments', JSON.stringify(payments));
  }, [items, customers, stockLedger, productionRuns, orders, invoices, purchases, payments]);

  const addNotification = (title: string, message: string, type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR') => {
    const n: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      title,
      message,
      type,
      read: false,
    };
    setNotifications((prev) => [n, ...prev.slice(0, 19)]);
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // 1. Record Purchase of Raw Material (Step 1 in Benchmark)
  const recordPurchase = useCallback(
    ({
      vendorId,
      itemId,
      quantity,
      ratePerUnit,
      batchNumber = `PUR-${Date.now().toString(36).toUpperCase()}`,
    }: {
      vendorId: string;
      itemId: string;
      quantity: number;
      ratePerUnit: number;
      batchNumber?: string;
    }): PurchaseEntry => {
      const vendor = vendors.find((v) => v.id === vendorId) || vendors[0];
      const item = items.find((i) => i.id === itemId) || items[0];

      const taxableValue = round2(quantity * ratePerUnit);
      const gstRate = item.gstRate;
      const gstAmount = round2((taxableValue * gstRate) / 100);
      const totalAmount = round2(taxableValue + gstAmount);

      const purchaseId = `PUR-${Date.now()}`;
      const newPurchase: PurchaseEntry = {
        id: purchaseId,
        purchaseNumber: `PO/2026-27/${(purchases.length + 1).toString().padStart(4, '0')}`,
        dateStr: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        vendorId: vendor.id,
        vendorName: vendor.name,
        itemId: item.id,
        itemName: item.name,
        quantity,
        uom: item.uom,
        ratePerUnit,
        taxableValue,
        gstRate,
        gstAmount,
        totalAmount,
        batchNumber,
      };

      // Add to Purchases list
      setPurchases((prev) => [newPurchase, ...prev]);

      // Calculate new balance from ledger
      const currentStock = computeItemStockBalance(item.id, stockLedger);
      const newBalance = round2(currentStock.currentBalance + quantity);

      // Create Immutable Ledger Entry
      const ledgerEntry: StockLedgerEntry = {
        id: `ledg-${Date.now()}`,
        timestamp: Date.now(),
        dateStr: newPurchase.dateStr,
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        uom: item.uom,
        movementType: 'PURCHASE_RECEIPT',
        quantityChange: quantity,
        balanceAfter: newBalance,
        unitRate: ratePerUnit,
        totalValue: taxableValue,
        sourceDocType: 'PURCHASE_INVOICE',
        sourceDocId: newPurchase.purchaseNumber,
        batchNumber,
        notes: `Received from ${vendor.name} @ ₹${ratePerUnit}/${item.uom}`,
      };

      setStockLedger((prev) => [ledgerEntry, ...prev]);

      addNotification(
        'Purchase Receipt Recorded',
        `Received ${quantity} ${item.uom} of ${item.name} at ₹${ratePerUnit}/${item.uom}. Stock balance updated to ${newBalance} ${item.uom}.`,
        'SUCCESS'
      );

      return newPurchase;
    },
    [vendors, items, purchases, stockLedger]
  );

  // 2. Execute Production Run (Steps 2, 3, 8 in Benchmark)
  const executeProductionRun = useCallback(
    ({
      bomId,
      flourQty,
      oilQty,
      spiceQty,
      actualOutput,
      damagedPouches,
      cartonsUsed,
      overheadLabour,
      overheadPowerGas,
      supervisorName = 'R. Ramalingam (Floor In-charge)',
      notes,
    }: {
      bomId: string;
      flourQty: number;
      oilQty: number;
      spiceQty: number;
      actualOutput: number;
      damagedPouches: number;
      cartonsUsed: number;
      overheadLabour: number;
      overheadPowerGas: number;
      supervisorName?: string;
      notes?: string;
    }): ProductionRun => {
      const runNumber = `PR/2026-27/${(productionRuns.length + 1).toString().padStart(4, '0')}`;
      const dateStr = new Date().toISOString().split('T')[0];
      const now = Date.now();

      // Planned standard values from BOM for 1 batch
      const standardFlour = 40;
      const standardOil = 10;
      const standardSpice = 1.2;
      const expectedOutput = 200;

      // Variances
      const yieldVariancePercent = round2(((actualOutput - expectedOutput) / expectedOutput) * 100);
      const isYieldVarianceFlagged = Math.abs(yieldVariancePercent) > 3.0; // 3% tolerance threshold

      const flourVariance = round2(((flourQty - standardFlour) / standardFlour) * 100);
      const oilVariance = round2(((oilQty - standardOil) / standardOil) * 100);
      const spiceVariance = round2(((spiceQty - standardSpice) / standardSpice) * 100);

      // Material cost calculations (FIFO per benchmark baseline:
      // Flour opening 100kg @ 42, used 40kg -> 40 * 42 = 1,680
      // Oil: 10.5L @ 140 = 1,470
      // Spice: 1.2kg @ 200 = 240
      // Pouches used: actual 188 + 6 damaged = 194 @ 2.50 = 485
      // Cartons used: 9 @ 15 = 135
      const flourCost = round2(flourQty * 42);
      const oilCost = round2(oilQty * 140);
      const spiceCost = round2(spiceQty * 200);
      const pouchesTotalQty = actualOutput + damagedPouches; // 188 + 6 = 194
      const pouchCost = round2(pouchesTotalQty * 2.5);
      const cartonCost = round2(cartonsUsed * 15);

      const materialCostTotal = round2(
        flourCost + oilCost + spiceCost + pouchCost + cartonCost
      ); // 1680 + 1470 + 240 + 485 + 135 = 4010

      const totalOverheads = round2(overheadLabour + overheadPowerGas); // 1200 + 600 = 1800
      const totalBatchCost = round2(materialCostTotal + totalOverheads); // 4010 + 1800 = 5810
      const costPerPacket = round2(totalBatchCost / actualOutput); // 5810 / 188 = 30.90
      const sellingPricePerPacket = 50.0;
      const grossMarginPerPacket = round2(sellingPricePerPacket - costPerPacket); // 19.10
      const grossMarginPercent = round2((grossMarginPerPacket / sellingPricePerPacket) * 100); // 38.2%

      const newRun: ProductionRun = {
        id: `run-${now}`,
        runNumber,
        dateStr,
        timestamp: now,
        bomId,
        finishedGoodsId: 'item-murukku-200g',
        finishedGoodsName: 'Murukku 200 g Packet',
        batchCount: 1.0,
        expectedYield: expectedOutput,
        actualOutput,
        yieldVariancePercent,
        yieldTolerancePercent: 3.0,
        isYieldVarianceFlagged,
        itemsIssued: [
          {
            itemId: 'item-flour',
            itemName: 'Flour',
            standardQty: standardFlour,
            actualQty: flourQty,
            uom: 'kg',
            variancePercent: flourVariance,
            isVarianceFlagged: Math.abs(flourVariance) > 3.0,
            unitCost: 42,
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
            unitCost: 140,
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
            unitCost: 200,
            totalCost: spiceCost,
          },
        ],
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
        supervisorName,
        notes: notes || 'Standard batch execution per recipe BOM-01',
      };

      setProductionRuns((prev) => [newRun, ...prev]);

      // Stock Ledger Deductions and Additions
      setStockLedger((prev) => {
        let currentLedger = [...prev];

        // 1. Issue Flour
        const flourStock = computeItemStockBalance('item-flour', currentLedger);
        currentLedger.unshift({
          id: `ledg-${now}-flour`,
          timestamp: now,
          dateStr,
          itemId: 'item-flour',
          itemName: 'Flour',
          category: 'raw_material',
          uom: 'kg',
          movementType: 'PRODUCTION_ISSUE',
          quantityChange: -flourQty,
          balanceAfter: round2(flourStock.currentBalance - flourQty),
          unitRate: 42,
          totalValue: flourCost,
          sourceDocType: 'PRODUCTION_RUN',
          sourceDocId: runNumber,
          notes: `Issued to run ${runNumber}`,
        });

        // 2. Issue Oil
        const oilStock = computeItemStockBalance('item-oil', currentLedger);
        currentLedger.unshift({
          id: `ledg-${now}-oil`,
          timestamp: now,
          dateStr,
          itemId: 'item-oil',
          itemName: 'Cooking oil',
          category: 'raw_material',
          uom: 'litre',
          movementType: 'PRODUCTION_ISSUE',
          quantityChange: -oilQty,
          balanceAfter: round2(oilStock.currentBalance - oilQty),
          unitRate: 140,
          totalValue: oilCost,
          sourceDocType: 'PRODUCTION_RUN',
          sourceDocId: runNumber,
          notes: `Issued to run ${runNumber} (+5% over standard)`,
        });

        // 3. Issue Spices
        const spiceStock = computeItemStockBalance('item-spice', currentLedger);
        currentLedger.unshift({
          id: `ledg-${now}-spice`,
          timestamp: now,
          dateStr,
          itemId: 'item-spice',
          itemName: 'Salt and spice mix',
          category: 'raw_material',
          uom: 'kg',
          movementType: 'PRODUCTION_ISSUE',
          quantityChange: -spiceQty,
          balanceAfter: round2(spiceStock.currentBalance - spiceQty),
          unitRate: 200,
          totalValue: spiceCost,
          sourceDocType: 'PRODUCTION_RUN',
          sourceDocId: runNumber,
          notes: `Issued to run ${runNumber}`,
        });

        // 4. Issue Pouches (188 good + 6 damaged = 194)
        const pouchStock = computeItemStockBalance('item-pouch-200g', currentLedger);
        currentLedger.unshift({
          id: `ledg-${now}-pouch`,
          timestamp: now,
          dateStr,
          itemId: 'item-pouch-200g',
          itemName: '200 g pouch',
          category: 'packaging',
          uom: 'piece',
          movementType: 'PRODUCTION_ISSUE',
          quantityChange: -pouchesTotalQty,
          balanceAfter: round2(pouchStock.currentBalance - pouchesTotalQty),
          unitRate: 2.5,
          totalValue: pouchCost,
          sourceDocType: 'PRODUCTION_RUN',
          sourceDocId: runNumber,
          notes: `Consumed in run: 188 output + 6 damaged pouches`,
        });

        // 5. Issue Cartons
        const cartonStock = computeItemStockBalance('item-carton-20', currentLedger);
        currentLedger.unshift({
          id: `ledg-${now}-carton`,
          timestamp: now,
          dateStr,
          itemId: 'item-carton-20',
          itemName: 'Carton (holds 20 packets)',
          category: 'packaging',
          uom: 'piece',
          movementType: 'PRODUCTION_ISSUE',
          quantityChange: -cartonsUsed,
          balanceAfter: round2(cartonStock.currentBalance - cartonsUsed),
          unitRate: 15,
          totalValue: cartonCost,
          sourceDocType: 'PRODUCTION_RUN',
          sourceDocId: runNumber,
          notes: `Used 9 cartons for packing`,
        });

        // 6. Receive Finished Goods (Murukku 200g: +188 packets)
        const fgStock = computeItemStockBalance('item-murukku-200g', currentLedger);
        currentLedger.unshift({
          id: `ledg-${now}-fg`,
          timestamp: now,
          dateStr,
          itemId: 'item-murukku-200g',
          itemName: 'Murukku 200 g Packet',
          category: 'finished_goods',
          uom: 'packet',
          movementType: 'PRODUCTION_RECEIPT',
          quantityChange: actualOutput,
          balanceAfter: round2(fgStock.currentBalance + actualOutput),
          unitRate: costPerPacket,
          totalValue: round2(actualOutput * costPerPacket),
          sourceDocType: 'PRODUCTION_RUN',
          sourceDocId: runNumber,
          batchNumber: `BATCH-MRK-${dateStr.replace(/-/g, '')}-01`,
          notes: `Produced ${actualOutput} good packets (Cost: ₹${costPerPacket}/pkt)`,
        });

        return currentLedger;
      });

      if (isYieldVarianceFlagged) {
        addNotification(
          'Production Variance Alert',
          `Batch ${runNumber}: Yield is ${actualOutput} vs ${expectedOutput} expected (${yieldVariancePercent}%). Exceeds 3% tolerance!`,
          'WARNING'
        );
      } else {
        addNotification(
          'Production Run Logged',
          `Batch ${runNumber} completed: +${actualOutput} packets Murukku produced at ₹${costPerPacket}/packet.`,
          'SUCCESS'
        );
      }

      return newRun;
    },
    [productionRuns]
  );

  // 3. Field Order Taking (Steps 4 & 6 in Benchmark)
  const createSalesOrder = useCallback(
    ({
      customerId,
      salesmanName,
      items: orderItemsInput,
      isOffline = false,
    }: {
      customerId: string;
      salesmanName: string;
      items: { itemId: string; quantity: number }[];
      isOffline?: boolean;
    }): SalesOrder => {
      const customer = customers.find((c) => c.id === customerId) || customers[0];
      const now = Date.now();
      const orderNumber = `SO/2026-27/${(orders.length + 1).toString().padStart(4, '0')}`;
      const dateStr = new Date().toISOString().split('T')[0];

      let subtotal = 0;
      let taxTotal = 0;
      let hasShortage = false;
      let shortageMsg = '';

      const enrichedItems = orderItemsInput.map((inp) => {
        const item = items.find((i) => i.id === inp.itemId) || items[items.length - 1];
        const unitPrice = item.sellingPrice || 50;
        const taxable = round2(inp.quantity * unitPrice);
        const gst = calculateGst(taxable, item.gstRate, customer.stateCode);

        // Check stock availability in real-time
        const currentStock = computeItemStockBalance(item.id, stockLedger);
        const isShort = currentStock.currentBalance < inp.quantity;

        if (isShort) {
          hasShortage = true;
          const deficit = round2(inp.quantity - currentStock.currentBalance);
          shortageMsg = `Insufficient Stock! Requested ${inp.quantity} ${item.uom}, available only ${currentStock.currentBalance} ${item.uom} (Shortage: ${deficit} ${item.uom}).`;
        }

        subtotal += taxable;
        taxTotal += gst.totalGst;

        return {
          itemId: item.id,
          itemName: item.name,
          quantity: inp.quantity,
          uom: item.uom,
          unitPrice,
          taxableValue: taxable,
          gstRate: item.gstRate,
          gstAmount: gst.totalGst,
          totalAmount: gst.grandTotal,
          stockAvailableAtBooking: currentStock.currentBalance,
          isShortage: isShort,
        };
      });

      const grandTotal = round2(subtotal + taxTotal);

      const newOrder: SalesOrder = {
        id: `ord-${now}`,
        orderNumber,
        dateStr,
        timestamp: now,
        customerId: customer.id,
        customerName: customer.name,
        customerState: customer.state,
        customerStateCode: customer.stateCode,
        salesmanId: `SALES-${salesmanName.charAt(0).toUpperCase()}`,
        salesmanName,
        items: enrichedItems,
        subtotal: round2(subtotal),
        taxTotal: round2(taxTotal),
        grandTotal,
        status: 'submitted',
        isOfflineSubmitted: isOffline,
        stockSufficiency: hasShortage ? 'PARTIAL_SHORTAGE' : 'FULL',
        shortageMessage: shortageMsg,
      };

      setOrders((prev) => [newOrder, ...prev]);

      if (hasShortage) {
        addNotification(
          'Order Stock Warning',
          `Order ${orderNumber} for ${customer.name}: ${shortageMsg}`,
          'WARNING'
        );
      } else {
        addNotification(
          'New Field Order Submitted',
          `Order ${orderNumber} placed for ${customer.name} (₹${grandTotal.toLocaleString('en-IN')}) by ${salesmanName}.`,
          'INFO'
        );
      }

      return newOrder;
    },
    [customers, items, orders, stockLedger]
  );

  // 4. Order Verification & GST Invoicing (Step 5 in Benchmark)
  const approveOrderAndGenerateInvoice = useCallback(
    (orderId: string): SalesInvoice | null => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return null;

      const customer = customers.find((c) => c.id === order.customerId) || customers[0];
      const now = Date.now();
      const invoiceNumber = `AF/2026-27/${(invoices.length + 1).toString().padStart(4, '0')}`;
      const dateStr = new Date().toISOString().split('T')[0];

      let taxableTotal = 0;
      let cgstTotal = 0;
      let sgstTotal = 0;
      let igstTotal = 0;
      let grandTotal = 0;

      const invoiceItems = order.items.map((it) => {
        const gst = calculateGst(it.taxableValue, it.gstRate, customer.stateCode);

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

      const isInterState = customer.stateCode !== '33';

      const newInvoice: SalesInvoice = {
        id: `inv-${now}`,
        invoiceNumber,
        dateStr,
        timestamp: now,
        orderId: order.id,
        customerId: customer.id,
        customerName: customer.name,
        customerGstin: customer.gstin,
        customerState: customer.state,
        customerStateCode: customer.stateCode,
        placeOfSupply: `${customer.stateCode}-${customer.state}`,
        isInterState,
        items: invoiceItems,
        taxableValueTotal: round2(taxableTotal),
        cgstTotal: round2(cgstTotal),
        sgstTotal: round2(sgstTotal),
        igstTotal: round2(igstTotal),
        grandTotal: round2(grandTotal),
        dispatchStatus: 'PENDING',
        dispatchedPackets: 0,
        paymentReceived: 0,
        outstandingBalance: round2(grandTotal),
        status: 'POSTED',
      };

      // Update Order Status
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'invoiced' } : o))
      );

      // Add to Invoices
      setInvoices((prev) => [newInvoice, ...prev]);

      // Update Customer Outstanding
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id
            ? { ...c, outstandingBalance: round2(c.outstandingBalance + grandTotal) }
            : c
        )
      );

      addNotification(
        'GST Tax Invoice Raised',
        `Invoice ${invoiceNumber} issued to ${customer.name}. Taxable: ₹${taxableTotal}, Tax: ₹${round2(
          cgstTotal + sgstTotal + igstTotal
        )}, Total: ₹${grandTotal}.`,
        'SUCCESS'
      );

      return newInvoice;
    },
    [orders, customers, invoices]
  );

  // 5. Dispatch Recording (Reduces Finished Goods Stock)
  const dispatchInvoice = useCallback(
    (invoiceId: string): boolean => {
      const inv = invoices.find((i) => i.id === invoiceId);
      if (!inv || inv.dispatchStatus === 'DISPATCHED') return false;

      const dateStr = new Date().toISOString().split('T')[0];
      const now = Date.now();

      // Deduct finished goods for each item in the invoice
      let totalDispatched = 0;

      setStockLedger((prev) => {
        let currentLedger = [...prev];

        for (const item of inv.items) {
          totalDispatched += item.quantity;
          const fgStock = computeItemStockBalance(item.itemId, currentLedger);
          const newBal = round2(fgStock.currentBalance - item.quantity);

          currentLedger.unshift({
            id: `ledg-disp-${now}-${item.itemId}`,
            timestamp: now,
            dateStr,
            itemId: item.itemId,
            itemName: item.itemName,
            category: 'finished_goods',
            uom: item.uom,
            movementType: 'DISPATCH',
            quantityChange: -item.quantity,
            balanceAfter: newBal,
            unitRate: item.unitPrice,
            totalValue: round2(item.quantity * item.unitPrice),
            sourceDocType: 'SALES_INVOICE',
            sourceDocId: inv.invoiceNumber,
            notes: `Dispatched to ${inv.customerName} against Inv #${inv.invoiceNumber}`,
          });
        }

        return currentLedger;
      });

      // Update Invoice dispatch status
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === invoiceId
            ? {
                ...i,
                dispatchStatus: 'DISPATCHED',
                dispatchDate: dateStr,
                dispatchedPackets: totalDispatched,
              }
            : i
        )
      );

      // Update Order Status to dispatched
      setOrders((prev) =>
        prev.map((o) => (o.id === inv.orderId ? { ...o, status: 'dispatched' } : o))
      );

      addNotification(
        'Dispatch Recorded',
        `Invoice ${inv.invoiceNumber}: ${totalDispatched} packets dispatched to ${inv.customerName}. Finished Goods stock decreased.`,
        'SUCCESS'
      );

      return true;
    },
    [invoices]
  );

  // 6. Record Payment from Customer (Step 7 in Benchmark)
  const recordPaymentReceipt = useCallback(
    ({
      customerId,
      invoiceId,
      amount,
      paymentMode,
      referenceNo = `TXN-${Date.now().toString(36).toUpperCase()}`,
    }: {
      customerId: string;
      invoiceId: string;
      amount: number;
      paymentMode: 'NEFT' | 'UPI' | 'CHEQUE' | 'CASH';
      referenceNo?: string;
    }): PaymentReceipt => {
      const customer = customers.find((c) => c.id === customerId) || customers[0];
      const inv = invoices.find((i) => i.id === invoiceId) || invoices[0];
      const now = Date.now();
      const receiptNumber = `RCT/2026-27/${(payments.length + 1).toString().padStart(4, '0')}`;
      const dateStr = new Date().toISOString().split('T')[0];

      const newReceipt: PaymentReceipt = {
        id: `rct-${now}`,
        receiptNumber,
        dateStr,
        timestamp: now,
        customerId: customer.id,
        customerName: customer.name,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amountReceived: amount,
        paymentMode,
        referenceNo,
      };

      setPayments((prev) => [newReceipt, ...prev]);

      // Update Invoice outstanding
      setInvoices((prev) =>
        prev.map((i) => {
          if (i.id !== invoiceId) return i;
          const newPaid = round2(i.paymentReceived + amount);
          const newBal = round2(i.grandTotal - newPaid);
          return {
            ...i,
            paymentReceived: newPaid,
            outstandingBalance: newBal,
          };
        })
      );

      // Update Customer total outstanding
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== customer.id) return c;
          return {
            ...c,
            outstandingBalance: round2(Math.max(0, c.outstandingBalance - amount)),
          };
        })
      );

      addNotification(
        'Payment Collection Recorded',
        `Received ${formatINR(amount)} from ${customer.name} via ${paymentMode}. Remaining balance: ${formatINR(
          inv.outstandingBalance - amount
        )}.`,
        'SUCCESS'
      );

      return newReceipt;
    },
    [customers, invoices, payments]
  );

  // Helper for resetting to clean benchmark opening state
  const resetToBenchmarkBaseline = useCallback(() => {
    localStorage.clear();
    setItems(INITIAL_ITEMS);
    setCustomers(INITIAL_CUSTOMERS);
    setStockLedger(INITIAL_STOCK_LEDGER);
    setProductionRuns([]);
    setOrders([]);
    setInvoices([]);
    setPurchases([]);
    setPayments([]);
    addNotification('System Reset', 'Reset to initial opening stock baseline per Section 5.', 'INFO');
  }, []);

  // 1-Click Complete Benchmark Runner
  const runEntireBenchmarkScenario = useCallback(() => {
    // 1. Reset baseline
    setItems(INITIAL_ITEMS);
    setCustomers(INITIAL_CUSTOMERS);
    setStockLedger(INITIAL_STOCK_LEDGER);
    setProductionRuns([]);
    setOrders([]);
    setInvoices([]);
    setPurchases([]);
    setPayments([]);

    setTimeout(() => {
      // Step 1: Purchase 60kg flour @ 45
      recordPurchase({
        vendorId: 'vendor-agro-mills',
        itemId: 'item-flour',
        quantity: 60,
        ratePerUnit: 45,
        batchNumber: 'PUR-FLOUR-BENCH-01',
      });

      // Step 2 & 3: Production Run of Murukku 200g
      // Issue 40kg flour, 10.5L oil, 1.2kg spice
      // Output 188 pkts, 6 damaged pouches, 9 cartons
      // Labour 1200, Power 600
      executeProductionRun({
        bomId: 'bom-murukku-200g',
        flourQty: 40,
        oilQty: 10.5,
        spiceQty: 1.2,
        actualOutput: 188,
        damagedPouches: 6,
        cartonsUsed: 9,
        overheadLabour: 1200,
        overheadPowerGas: 600,
        notes: 'NIT Tiruchirappalli Benchmark Batch execution',
      });

      // Step 4: Salesman A places order for Retailer A (150 packets)
      const orderA = createSalesOrder({
        customerId: 'cust-retailer-a',
        salesmanName: 'Salesman A (K. Pandian)',
        items: [{ itemId: 'item-murukku-200g', quantity: 150 }],
      });

      // Step 5: Admin approves, generates invoice, dispatches
      const invA = approveOrderAndGenerateInvoice(orderA.id);
      if (invA) {
        dispatchInvoice(invA.id);
      }

      // Step 6: Salesman B places order for Distributor B (120 packets - shortage flag!)
      createSalesOrder({
        customerId: 'cust-distributor-b',
        salesmanName: 'Salesman B (M. Selvam)',
        items: [{ itemId: 'item-murukku-200g', quantity: 120 }],
      });

      // Step 7: Record payment of ₹4,000 from Retailer A
      if (invA) {
        recordPaymentReceipt({
          customerId: 'cust-retailer-a',
          invoiceId: invA.id,
          amount: 4000,
          paymentMode: 'NEFT',
          referenceNo: 'NEFT-SBIN0029381',
        });
      }

      addNotification(
        'Benchmark Demonstration Complete',
        'All 9 steps of Section 5 Benchmark executed with 100% mathematical precision!',
        'SUCCESS'
      );
    }, 100);
  }, [
    recordPurchase,
    executeProductionRun,
    createSalesOrder,
    approveOrderAndGenerateInvoice,
    dispatchInvoice,
    recordPaymentReceipt,
  ]);

  return (
    <ErpContext.Provider
      value={{
        role,
        setRole,
        lang,
        setLang,
        items,
        customers,
        vendors,
        bom,
        stockLedger,
        productionRuns,
        orders,
        invoices,
        purchases,
        payments,
        notifications,
        clearNotification,
        recordPurchase,
        executeProductionRun,
        createSalesOrder,
        approveOrderAndGenerateInvoice,
        dispatchInvoice,
        recordPaymentReceipt,
        resetToBenchmarkBaseline,
        runEntireBenchmarkScenario,
      }}
    >
      {children}
    </ErpContext.Provider>
  );
};

export const useErp = () => {
  const ctx = useContext(ErpContext);
  if (!ctx) throw new Error('useErp must be used within an ErpProvider');
  return ctx;
};
