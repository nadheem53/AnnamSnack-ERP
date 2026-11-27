# Order-to-Audit ERP for Packaged South Indian Food Manufacturing
### Centre for Digital Infrastructure, NIT Tiruchirappalli — Internship Task Submission

[![NIT Benchmark](https://img.shields.io/badge/NIT%20Benchmark-45%2F45%20Tests%20Passed-emerald.svg)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Database-Prisma%20ORM%20%7C%20SQLite%20%7C%20PostgreSQL-indigo.svg)](https://www.prisma.io)
[![Authentication](https://img.shields.io/badge/Auth-Bcrypt%20%2B%20JWT%20%2B%20RBAC-red.svg)](https://jwt.io)
[![GST Ready](https://img.shields.io/badge/GST-GSTR--1%20%26%20GSTR--3B-purple.svg)](https://gst.gov.in)
[![Tally XML](https://img.shields.io/badge/Tally%20Export-Prime%20%26%20ERP%209-orange.svg)](https://tallysolutions.com)

> Production-ready ERP prototype for **Annam Food Products (SIDCO Industrial Estate, Thuvakudi, Tiruchirappalli, Tamil Nadu)**, a small-scale manufacturer of packaged South Indian snacks (Murukku, Mixture, Chips, Sweets). Replaces fragmented notebooks, WhatsApp orders, and month-end spreadsheet panic with an integrated, relational database-backed double loop.

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

## 2. Technology Stack & Backend Architecture

The application is engineered with a decoupled client-server architecture backed by a real relational database and cryptographic security:

- **Frontend & App Engine:** React 19, TypeScript 5.7, Tailwind CSS, Vite 6.
  - Sub-second UI responsiveness for mobile salesmen on field networks.
  - Role-adaptive interfaces tailored for Salesmen, Factory Admins, Production Supervisors, Auditors, and Business Owners.
  - Tamil language interface toggle (தமிழ்) for factory floor operators.
- **Backend & REST API:** Node.js, Express, TypeScript.
  - Comprehensive REST endpoints handling authentication, inventory, purchases, production runs, sales orders, invoicing, and payment receipts.
  - Strict input validation and database transaction atomicity.
- **Relational Database & ORM:** Prisma ORM 6.4 with SQLite (`prisma/dev.db`) for zero-config local evaluation and turnkey `docker-compose.yml` for PostgreSQL 16 production deployment.
  - Relational schema modeling `User`, `Item`, `Customer`, `Vendor`, `BillOfMaterials`, `BomComponent`, `StockLedgerEntry`, `ProductionRun`, `ProductionRunItem`, `SalesOrder`, `OrderItem`, `SalesInvoice`, `InvoiceItem`, `PurchaseEntry`, and `PaymentReceipt`.
- **Authentication & RBAC:**
  - Passwords hashed with `bcryptjs` (salt rounds = 10).
  - Cryptographic JSON Web Tokens (JWT) for stateless session authentication.
  - Server-side Role-Based Access Control (`requireRole` middleware) enforcing authorization boundaries. For instance, field salesmen attempting to approve orders or dispatch stock are strictly blocked with `HTTP 403 Forbidden`.
- **Perpetual Immutable Ledger:** Every stock change (purchase, production issue, finished goods receipt, sales dispatch) writes an immutable record to the ledger. Current balances are computed dynamically from `Opening + Inward − Outward = Closing`.
- **Statutory Taxation:** Place of supply calculations matching Indian GST statutes (Intra-state: 2.5% CGST + 2.5% SGST within Tamil Nadu; Inter-state: 5.0% IGST for Karnataka / Kerala).

---

## 3. Evaluator Credentials & Pre-Seeded Roles

The system is pre-seeded with dedicated user accounts representing each actor in the business:

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Factory Admin** | `admin@annamfoods.co.in` | `Admin@123` | Full administrative control: order approval, stock pre-check, GST billing, dispatch, payment recording |
| **Salesman A** | `salesman_a@annamfoods.co.in` | `Sales@123` | Field orders for Retailer A, personal sales metrics, order status tracking (blocked from billing/dispatch) |
| **Salesman B** | `salesman_b@annamfoods.co.in` | `Sales@123` | Field orders for Distributor B (Inter-state KA), order history |
| **Production Supervisor**| `production@annamfoods.co.in` | `Prod@123` | RM intake, BOM batch execution, actual consumption & scrap logging, variance tracking |
| **Auditor / CA** | `auditor@annamfoods.co.in` | `Audit@123` | Read-only financial & inventory audit: GSTR-1, GSTR-3B, perpetual stock ledger, Tally XML export |
| **Owner / Director** | `owner@annamfoods.co.in` | `Owner@123` | Executive KPI dashboard: revenue, margins, stock valuation, outstanding dues |

> **Evaluator Convenience:** On the login screen, 1-click quick-fill buttons are provided for instant evaluation without manual typing.

---

## 4. Mandatory Benchmark Verification Results (Section 5)

Run the automated benchmark test suite locally:
```bash
npm test
```

### Complete Audit Results: 45 Passed, 0 Failed

#### A. Mathematical & Business Logic Checks (29/29)

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

#### B. Express + Prisma Relational Database & Auth Checks (16/16)

| Integration Test Check | Expected Behavior | Result | Status |
| :--- | :--- | :---: | :---: |
| **Relational Database Seeding** | 6 user accounts + opening stock ledgers created in database | Verified | `PASS` |
| **Bcrypt Password Comparison** | Accurate hash verification; incorrect password rejected | Verified | `PASS` |
| **JWT Bearer Token Issuance** | Valid cryptographic token generated upon login | Verified | `PASS` |
| **Salesman RBAC Restriction** | Salesman blocked from approving orders (`HTTP 403 Forbidden`) | Blocked (403) | `PASS` |
| **Admin Authorization** | Admin permitted to approve orders and generate tax invoices | Permitted (200) | `PASS` |
| **Purchase DB Transaction** | Flour purchase updates database ledger balance to 160 kg | Reconciled | `PASS` |
| **Production Run DB Transaction** | Raw material deduction & finished goods addition in database | Reconciled | `PASS` |
| **Tax Invoice DB Transaction** | GST breakdown and grand total ₹7,875.00 stored in database | Reconciled | `PASS` |
| **Dispatch Ledger DB Transaction** | Murukku finished goods stock reduced to 88 pkts in database | Reconciled | `PASS` |
| **Payment Receipt DB Transaction** | Outstanding balance updated to ₹3,875.00 in database | Reconciled | `PASS` |

---

## 5. Scope Boundaries & Transparent Limitations

To provide complete academic transparency regarding stretch goals and implementation boundaries:

1. **Offline Order Synchronization:**
   - *Current Implementation:* Implements client-side transaction queuing (`localStorage` / memory queue) with offline connection detection, visual status indicators, and automatic queue flush upon network restoration.
   - *Boundary Note:* In a full industrial deployment, this would be paired with the browser's ServiceWorker Background Sync API and IndexedDB to guarantee persistence across browser crashes.
2. **Tally ERP 9 / TallyPrime XML Export:**
   - *Current Implementation:* The system exports syntactically valid XML accounting vouchers conforming to Tally's `<ENVELOPE>` and `<VOUCHER>` schema specifications (Sales, Purchase, and Receipt vouchers).
   - *Boundary Note:* Directly importing into a live Tally company requires that the destination Tally chart of accounts contains matching ledger names (e.g., "Sales - Murukku 200g", "CGST Input", "SGST Output", "Sundry Debtors"). End-to-end import verification was not run against an active licensed Tally desktop instance.
3. **Database Dual-Mode Support:**
   - *Default Local Mode:* SQLite via Prisma (`prisma/dev.db`) is configured out-of-the-box so evaluators can run the system immediately without installing external database servers.
   - *Production Mode:* A `docker-compose.yml` file is provided to switch Prisma's datasource provider to PostgreSQL 16 with zero code changes.

---

## 6. Quick Start & Local Execution

### Prerequisites
- Node.js 18+ installed
- npm or pnpm

### Installation & Setup

```bash
# 1. Install dependencies
npm install

# 2. Push Prisma database schema to local SQLite database
npx prisma db push

# 3. Seed user accounts, item masters, and opening stock ledgers
npm run seed

# 4. Run automated test suite (all 45 tests)
npm test

# 5. Start the backend API server (runs on http://localhost:5000)
npm run server

# 6. In a second terminal, launch the frontend development server
npm run dev
```

Visit **`http://localhost:5173/`** in your browser.

To run both concurrently in one command:
```bash
npm run dev:all
```

---

## 7. Assumptions & Accounting Conventions

1. **Inventory Valuation:** First-In, First-Out (FIFO) is strictly followed. For the benchmark batch, the 40 kg flour consumed is issued from the 100 kg opening stock valued at ₹42/kg. The newly purchased 60 kg flour @ ₹45/kg remains in store for future production runs.
2. **Batch Overhead Allocation:** Factory overheads (Direct Labour ₹1,200 + LPG Gas/Power ₹600 = ₹1,800) are absorbed across the 188 commercially salable packets produced, adding ₹9.57/packet overhead to the direct material cost of ₹21.33/packet, producing an exact cost of **₹30.90 per packet**.
3. **Packaging Wastage Accounting:** 6 damaged pouches (scrap during heat-sealing) are charged directly to the batch production cost (194 pouches consumed @ ₹2.50 = ₹485.00), reflecting standard food processing practice.
4. **GST Numbering & Financial Year:** Invoices follow the statutory format `INV/2026-27/0001` with separate line items for CGST (2.5%) and SGST (2.5%) for intra-state supply (Tamil Nadu, State Code 33).
