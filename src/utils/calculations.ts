import { UnitOfMeasure, StockLedgerEntry, SalesInvoice, Customer } from '../types';

/**
 * Currency & Tax precision utilities.
 * Avoids IEEE-754 floating point rounding drift by rounding to 2 decimal places strictly.
 */
export const round2 = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatQty = (qty: number, uom: UnitOfMeasure): string => {
  const rounded = Math.round((qty + Number.EPSILON) * 100) / 100;
  return `${rounded.toLocaleString('en-IN')} ${uom}`;
};

/**
 * GST Calculation based on Place of Supply.
 * Origin Factory: Tamil Nadu (State Code '33')
 */
export const calculateGst = (
  taxableValue: number,
  gstRatePercent: number,
  destinationStateCode: string
): {
  isInterState: boolean;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalGst: number;
  grandTotal: number;
} => {
  const isInterState = destinationStateCode.trim() !== '33';
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
    // Split equally into CGST and SGST
    const halfRate = gstRatePercent / 2;
    const cgst = round2((taxableValue * halfRate) / 100);
    const sgst = round2(tax - cgst); // Ensure sum matches total tax exactly

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
};

/**
 * Reconciles and computes closing balances directly from the immutable movement ledger.
 * This satisfies the core NIT requirement:
 * "Stock balances must be derived from, or reconciled against, a ledger of movements,
 * never just a number someone overwrites."
 */
export const computeItemStockBalance = (
  itemId: string,
  ledgerEntries: StockLedgerEntry[]
): {
  currentBalance: number;
  openingBalance: number;
  totalReceipts: number;
  totalIssues: number;
  totalAdjustments: number;
} => {
  const itemEntries = ledgerEntries.filter((e) => e.itemId === itemId);
  let opening = 0;
  let receipts = 0;
  let issues = 0;
  let adjustments = 0;

  for (const entry of itemEntries) {
    if (entry.movementType === 'OPENING') {
      opening += entry.quantityChange;
    } else if (
      entry.movementType === 'PURCHASE_RECEIPT' ||
      entry.movementType === 'PRODUCTION_RECEIPT'
    ) {
      receipts += entry.quantityChange;
    } else if (
      entry.movementType === 'PRODUCTION_ISSUE' ||
      entry.movementType === 'DISPATCH' ||
      entry.movementType === 'DAMAGE_SCRAP'
    ) {
      issues += Math.abs(entry.quantityChange);
    } else if (entry.movementType === 'ADJUSTMENT') {
      adjustments += entry.quantityChange;
    }
  }

  const currentBalance = round2(opening + receipts - issues + adjustments);

  return {
    currentBalance,
    openingBalance: round2(opening),
    totalReceipts: round2(receipts),
    totalIssues: round2(issues),
    totalAdjustments: round2(adjustments),
  };
};

/**
 * Generates a Tally ERP 9 / TallyPrime XML import payload for posted sales invoices.
 */
export const generateTallyXml = (invoices: SalesInvoice[]): string => {
  const vouchersXml = invoices
    .map(
      (inv) => `
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
      <VOUCHER VCHTYPE="Sales" ACTION="Create">
        <DATE>${inv.dateStr.replace(/-/g, '')}</DATE>
        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${inv.invoiceNumber}</VOUCHERNUMBER>
        <PARTYLEDGERNAME>${inv.customerName}</PARTYLEDGERNAME>
        <ISINVOICE>Yes</ISINVOICE>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${inv.customerName}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${inv.grandTotal.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Sales - GST 5%</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${inv.taxableValueTotal.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        ${
          !inv.isInterState
            ? `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Output CGST 2.5%</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${inv.cgstTotal.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Output SGST 2.5%</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${inv.sgstTotal.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
            : `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Output IGST 5%</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${inv.igstTotal.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
        }
      </VOUCHER>
    </TALLYMESSAGE>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        ${vouchersXml}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
};

/**
 * Computes Ageing bucket for outstanding receivables.
 */
export const computeAgeingCategory = (
  invoiceDateStr: string,
  creditDays: number = 15
): 'Current (0-15 days)' | 'Due (16-30 days)' | 'Overdue (31-60 days)' | 'Critical (60+ days)' => {
  const invTime = new Date(invoiceDateStr).getTime();
  const diffDays = Math.max(0, Math.floor((Date.now() - invTime) / (1000 * 60 * 60 * 24)));

  if (diffDays <= creditDays) return 'Current (0-15 days)';
  if (diffDays <= 30) return 'Due (16-30 days)';
  if (diffDays <= 60) return 'Overdue (31-60 days)';
  return 'Critical (60+ days)';
};

