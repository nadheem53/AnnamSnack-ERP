# Order-to-Audit ERP for Packaged South Indian Food Manufacturing
### Centre for Digital Infrastructure, NIT Tiruchirappalli — Internship Task Submission

[![NIT Benchmark](https://img.shields.io/badge/NIT%20Benchmark-29%2F29%20Checks%20Passed-emerald.svg)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev)
[![GST Ready](https://img.shields.io/badge/GST-GSTR--1%20%26%20GSTR--3B-purple.svg)](https://gst.gov.in)
[![Tally XML](https://img.shields.io/badge/Tally%20Export-Prime%20%26%20ERP%209-orange.svg)](https://tallysolutions.com)

> Prototype for **Annam Food Products (SIDCO Industrial Estate, Thuvakudi, Tiruchirappalli, Tamil Nadu)**, a small-scale manufacturer of packaged South Indian snacks (Murukku, Mixture, Chips, Sweets). Designed to replace fragmented notebooks, WhatsApp orders, and month-end spreadsheet panic with a single-entry, ledger-backed double loop.

---

## 1. System Architecture & The Two Loops

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ANNAM FOOD PRODUCTS ERP                                │
└────────────────────────────────────────────────────────────────────────────────────────┘

    SALES LOOP (Outward):
    Salesman Mobile Order ──▶ Admin Verify (Stock Pre-Check) ──▶ GST Tax Invoice (PDF)
                                                                       │
                                              ┌────────────────────────┘
                                              ▼
                                         Dispatch ───(Stock −150 pkts)───┐
                                              │                          │
                                              ▼                          │
                                      Payments & Ageing                  │
                                                                         ▼
    PRODUCTION LOOP (Inward):                                   FINISHED GOODS LEDGER
    Raw Material Purchase (60kg flour @ 45)                              ▲
            │                                                            │
            ▼                                                            │
    Raw Material Store ──(Issued per BOM)──▶ Production Run ──(Stock +188 pkts)──┘
                                                 │
                                                 ▼
                                     Planned vs Actual Variance & Costing

    ALL LEDGERS ──▶ Monthly Auditor Reports (GSTR-1, GSTR-3B, Stock Summary, Tally XML)
```

---

## 2. Technology Stack & Justification

- **Frontend & App Engine:** React 19, TypeScript 5.7, Tailwind CSS, Vite 6.
  - *Justification:* Instant sub-second response time for mobile salesmen on 2G/3G networks, zero server round-trip latency for field order entry, and seamless role switching across mobile, desktop, and tablet viewports.
- **Data Integrity & Arithmetic:** Fixed-precision integer/decimal rounding arithmetic (`round2()`) with zero floating-point drift for monetary transactions, tax amounts, and fractional kilograms/litres.
- **Stock Accounting:** Strictly perpetual, movement-based immutable ledger (`StockLedgerEntry`). Balances are computed mathematically from `Opening + Receipts − Issues ± Adjustments = Closing`, preventing unverified manual overwrite errors.
- **Statutory Taxes:** Place of Supply logic strictly mapping Indian GST rules (Intra-state: 2.5% CGST + 2.5% SGST within Tamil Nadu; Inter-state: 5.0% IGST for Karnataka / Kerala).

---

## 3. Mandatory Benchmark Verification Results (Section 5)

Run the automated benchmark test suite locally:
```bash
npm test
```

### Direct Comparison Against NIT Tiruchirappalli Rubric

| Benchmark Check Item | Expected Result | System Result | Status | Verification Note / Formula |
| :--- | :--- | :--- | :---: | :--- |
| **Flour Closing Balance** | **120 kg** | **120 kg** | `PASS` | 100 opening + 60 purchase − 40 issued |
| **Cooking Oil Closing Balance** | **19.5 L** | **19.5 L** | `PASS` | 30 opening − 10.5 issued (0.5L excess) |
| **200g Pouches Closing Balance** | **306 pcs** | **306 pcs** | `PASS` | 500 opening − (188 output + 6 scrap) |
| **Finished Goods Post-Run** | **238 pkts** | **238 pkts** | `PASS` | 50 opening + 188 actual run output |
| **Finished Goods Post-Dispatch** | **88 pkts** | **88 pkts** | `PASS` | 238 post-run − 150 dispatched to Retailer A |
| **Yield Variance** | **−6.0%** | **−6.0%** | `PASS` | 188 vs 200 expected; flagged > 3% threshold |
| **Oil Consumption Variance** | **+5.0%** | **+5.0%** | `PASS` | 10.5L vs 10.0L std; flagged > 3% threshold |
| **Retailer A GST Tax Invoice** | **₹7,875.00** | **₹7,875.00** | `PASS` | ₹7,500 taxable + ₹187.50 CGST + ₹187.50 SGST |
| **Retailer A Outstanding Balance** | **₹3,875.00** | **₹3,875.00** | `PASS` | ₹7,875 invoice total − ₹4,000 NEFT receipt |
| **Distributor B Order Shortage** | **32 pkts shortage** | **32 pkts** | `PASS` | 120 ordered vs 88 stock; IGST 5% identified |
| **Cost Per Packet (with Overheads)** | **₹30.90 / pkt** | **₹30.90 / pkt** | `PASS` | Material ₹4,010 + Overheads ₹1,800 = ₹5,810 / 188 |
| **Gross Margin Per Packet** | **₹19.10 (38.2%)** | **₹19.10 (38.2%)** | `PASS` | Selling ₹50.00 − Cost ₹30.90 = ₹19.10 margin |

---

## 4. Features Built by Tier (Section 6)

### Must-Have (Minimum Tier) — 100% Implemented
- [x] Multi-role login & view switcher (Salesman, Factory Admin, Production Floor, Auditor, Owner)
- [x] Item masters (Raw materials, Packaging, Finished Goods), Customer masters, Vendor masters, and BOM master
- [x] Mobile-optimized field order taking with price list auto-fill
- [x] Admin approval with live stock-coverage pre-check
- [x] GST Tax Invoices in printable PDF layout with GSTIN, HSN 1905, and statutory tax breakdown
- [x] Production runs updating raw material and finished goods stocks automatically
- [x] Planned vs actual consumption and yield variance with threshold alarms
- [x] Stock summary and perpetual stock ledger
- [x] Exportable sales register and stock reports in CSV

### Should-Have — 100% Implemented
- [x] Raw material purchases and supplier ledgers (Vendor PO entries)
- [x] Customer payment collections, outstanding balances, and ageing analysis (0–15, 16–30, 31–60 days)
- [x] FIFO cost per packet calculation with labour and power/gas overheads allocation
- [x] Statutory GST outward supplies report mapped to GSTR-1 & GSTR-3B
- [x] Real-time variance alerts beyond 3% tolerance threshold
- [x] Executive Factory Owner dashboard with revenue, stock health, and margin analytics

### Stretch Goals — Completed
- [x] **1-Click Interactive Benchmark Walkthrough Console** (allows instant end-to-end audit demonstration)
- [x] **Offline Order Capture Mode** with simulated offline queue and sync indicator
- [x] **Tally ERP 9 / TallyPrime XML Export** (generates ready-to-import `<VOUCHER>` XML payloads)
- [x] **Tamil Language Interface Toggle (தமிழ்)** for floor staff and supervisors
- [x] **Printable GST Tax Invoice & Auditor Report Pack**

---

## 5. Quick Start & Local Execution

```bash
# Clone the repository
git clone https://github.com/your-username/annam-food-erp.git
cd annam-food-erp

# Install dependencies
npm install

# Run automated verification test suite
npm test

# Launch development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 6. Assumptions & Documented Choices

1. **Valuation Method:** First-In, First-Out (FIFO) is utilized. For the benchmark batch, the 40 kg flour issued is consumed from the 100 kg opening stock valued at ₹42/kg. The newly purchased 60 kg flour @ ₹45/kg remains in stock for subsequent batches.
2. **Overheads Rule:** Direct overheads (Labour ₹1,200 + LPG Gas/Power ₹600 = ₹1,800) are allocated across the 188 usable good packets produced in the run, giving an overhead cost of ₹9.57/packet, combined with direct material cost of ₹21.33/packet to yield ₹30.90/packet total cost.
3. **Packaging Wastage:** Damaged pouches (6 pcs) are charged directly to batch cost (194 pouches total @ ₹2.50 = ₹485.00), as food industry pouch leakage/damage during heat-sealing is a direct operating scrap cost.

