export type UserRole = 'salesman' | 'admin' | 'production' | 'auditor' | 'owner';

export type UnitOfMeasure = 'kg' | 'g' | 'litre' | 'ml' | 'piece' | 'packet' | 'carton';

export type ItemCategory = 'raw_material' | 'packaging' | 'finished_goods' | 'wip';

export interface ItemMaster {
  id: string;
  code: string;
  name: string;
  nameTamil?: string;
  category: ItemCategory;
  uom: UnitOfMeasure;
  hsnCode: string;
  gstRate: number; // e.g. 5 for 5%
  standardCost: number; // Valuation rate in INR
  sellingPrice?: number; // For finished goods in INR (e.g. 50 for Murukku 200g)
  reorderLevel: number;
  packSizeGrams?: number; // e.g. 200 for 200g
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: 'retailer' | 'distributor';
  contactPerson: string;
  phone: string;
  city: string;
  state: string; // e.g. 'Tamil Nadu' or 'Karnataka'
  stateCode: string; // e.g. '33' for TN, '29' for KA
  gstin?: string;
  creditLimit: number;
  creditDays: number;
  outstandingBalance: number;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  stateCode: string;
  gstin: string;
  phone: string;
}

export interface BomComponent {
  itemId: string;
  itemName: string;
  quantityPerBatch: number;
  uom: UnitOfMeasure;
  standardRate: number;
  isPackaging?: boolean;
}

export interface BillOfMaterials {
  id: string;
  finishedGoodsId: string;
  finishedGoodsName: string;
  batchSizeExpected: number; // e.g. 200 packets
  batchUom: UnitOfMeasure; // packet
  description: string;
  components: BomComponent[];
}

export interface StockLedgerEntry {
  id: string;
  timestamp: number;
  dateStr: string;
  itemId: string;
  itemName: string;
  category: ItemCategory;
  uom: UnitOfMeasure;
  movementType: 'OPENING' | 'PURCHASE_RECEIPT' | 'PRODUCTION_ISSUE' | 'PRODUCTION_RECEIPT' | 'DISPATCH' | 'DAMAGE_SCRAP' | 'ADJUSTMENT';
  quantityChange: number; // Positive for inflow, negative for outflow
  balanceAfter: number;
  unitRate: number;
  totalValue: number;
  sourceDocType: 'INITIAL_STOCK' | 'PURCHASE_INVOICE' | 'PRODUCTION_RUN' | 'SALES_INVOICE' | 'WASTAGE_NOTE';
  sourceDocId: string;
  batchNumber?: string;
  notes?: string;
}

export interface ProductionRun {
  id: string;
  runNumber: string;
  dateStr: string;
  timestamp: number;
  bomId: string;
  finishedGoodsId: string;
  finishedGoodsName: string;
  batchCount: number; // usually 1.0 batch
  expectedYield: number; // e.g. 200 packets
  actualOutput: number; // e.g. 188 packets
  yieldVariancePercent: number; // -6.0%
  yieldTolerancePercent: number; // 3.0%
  isYieldVarianceFlagged: boolean;

  // Material consumption tracking
  itemsIssued: {
    itemId: string;
    itemName: string;
    standardQty: number;
    actualQty: number;
    uom: UnitOfMeasure;
    variancePercent: number;
    isVarianceFlagged: boolean;
    unitCost: number;
    totalCost: number;
  }[];

  // Scrap and damaged materials
  damagedPouches: number; // e.g. 6 damaged
  cartonsUsed: number; // e.g. 9 cartons
  scrapDetails?: string;

  // Costing breakdown
  materialCostTotal: number;
  overheadLabour: number; // ₹1,200
  overheadPowerGas: number; // ₹600
  totalBatchCost: number; // ₹5,810
  costPerPacket: number; // ₹30.90
  sellingPricePerPacket: number; // ₹50.00
  grossMarginPerPacket: number; // ₹19.10
  grossMarginPercent: number; // 38.2%
  valuationMethod: 'FIFO' | 'WEIGHTED_AVERAGE';

  supervisorName: string;
  notes?: string;
}

export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  uom: UnitOfMeasure;
  unitPrice: number; // before tax
  taxableValue: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  stockAvailableAtBooking: number;
  isShortage: boolean;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  dateStr: string;
  timestamp: number;
  customerId: string;
  customerName: string;
  customerState: string;
  customerStateCode: string;
  salesmanId: string;
  salesmanName: string;
  items: OrderItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  status: 'submitted' | 'approved' | 'invoiced' | 'dispatched' | 'rejected';
  isOfflineSubmitted?: boolean;
  stockSufficiency: 'FULL' | 'PARTIAL_SHORTAGE' | 'CRITICAL';
  shortageMessage?: string;
  adminNotes?: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string; // e.g. AF/2026-27/0001
  dateStr: string;
  timestamp: number;
  orderId: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  customerState: string;
  customerStateCode: string;
  placeOfSupply: string;
  isInterState: boolean; // Tamil Nadu to others = true (IGST)
  
  items: {
    itemId: string;
    itemName: string;
    hsnCode: string;
    quantity: number;
    uom: UnitOfMeasure;
    unitPrice: number;
    taxableValue: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
    totalAmount: number;
  }[];

  taxableValueTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  
  dispatchStatus: 'PENDING' | 'DISPATCHED';
  dispatchDate?: string;
  dispatchedPackets: number;

  paymentReceived: number;
  outstandingBalance: number;
  status: 'POSTED' | 'CANCELLED';
}

export interface PurchaseEntry {
  id: string;
  purchaseNumber: string;
  dateStr: string;
  timestamp: number;
  vendorId: string;
  vendorName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  uom: UnitOfMeasure;
  ratePerUnit: number;
  taxableValue: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  batchNumber: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  dateStr: string;
  timestamp: number;
  customerId: string;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  amountReceived: number;
  paymentMode: 'NEFT' | 'UPI' | 'CHEQUE' | 'CASH';
  referenceNo?: string;
}

export interface AppNotification {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  read: boolean;
}

