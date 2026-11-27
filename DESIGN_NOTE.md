# Technical Design Note: Order-to-Audit Architecture
### Centre for Digital Infrastructure, NIT Tiruchirappalli

**Author:** Candidate Submission  
**System:** Annam Food Products ERP (Packaged South Indian Snacks)  
**Document:** System Design, Mathematical Ledger Mechanics & Costing Methodology  

---

## 1. Entity-Relationship Data Model & Schema

The data model is engineered around immutable movement journals and transactional linkages. No inventory balance is ever stored as a raw overwritten number.

```
┌─────────────────┐       1:N       ┌────────────────────────┐
│   ItemMaster    │────────────────▶│    StockLedgerEntry    │ (Perpetual Journal)
│ (RM / PM / FG)  │                 │  (Receipts & Issues)   │
└────────┬────────┘                 └────────────────────────┘
         │                                       ▲
         │ 1:N                                   │ Triggers movements
         ▼                                       │
┌─────────────────┐       1:N       ┌────────────┴───────────┐
│ BillOfMaterials │────────────────▶│     ProductionRun      │
│ (Standard BOM)  │                 │ (Planned vs Actual Var)│
└─────────────────┘                 └────────────────────────┘
                                                 ▲
                                                 │ Closes the loop
                                                 ▼
┌─────────────────┐       1:N       ┌────────────────────────┐
│    Customer     │────────────────▶│       SalesOrder       │
│ (State / GSTIN) │                 │  (Stock Sufficiency)   │
└────────┬────────┘                 └────────────┬───────────┘
         │                                       │ 1:1
         │ 1:N                                   ▼
         │                          ┌────────────────────────┐
         └─────────────────────────▶│      SalesInvoice      │ (Tax Invoice)
                                    │ (CGST/SGST vs IGST)    │
                                    └────────────┬───────────┘
                                                 │ 1:N
                                                 ▼
                                    ┌────────────────────────┐
                                    │     PaymentReceipt     │ (Collections)
                                    └────────────────────────┘
```

### Core Entities:
1. **ItemMaster**: Code, HSN (e.g. 1905), category (`raw_material`, `packaging`, `finished_goods`), UOM, standard cost, selling price.
2. **BillOfMaterials**: Finished good reference, standard batch expected yield (200 pkts), and component formula with standard quantities and rates.
3. **ProductionRun**: References BOM, records issued materials, actual good output, damaged pouches, carton usage, yield variance, and allocated overheads.
4. **StockLedgerEntry**: Immutable append-only audit trail (`movementType`: `PURCHASE_RECEIPT`, `PRODUCTION_ISSUE`, `PRODUCTION_RECEIPT`, `DISPATCH`). Links directly to `sourceDocId`.
5. **SalesOrder**: Customer reference, item quantities, and real-time stock sufficiency evaluation.
6. **SalesInvoice**: Legal GST tax invoice, place of supply, taxable value, and statutory tax splits (CGST/SGST for intra-state TN, IGST for inter-state KA).

---

## 2. Stock Ledger Mechanics & Balance Derivation

Stock balances are dynamically reconciled from ledger journal entries:

$$\text{Closing Balance} = \text{Opening Balance} + \sum \text{Receipts} - \sum \text{Issues} \pm \sum \text{Adjustments}$$

### Traceability Guarantee:
- Every inward movement has a document link (`sourceDocType: 'PURCHASE_INVOICE'` or `'PRODUCTION_RUN'`).
- Every outward movement has a document link (`sourceDocType: 'PRODUCTION_RUN'` or `'SALES_INVOICE'`).
- A physical stock discrepancy is resolved through an explicit, logged `ADJUSTMENT` journal entry with user, timestamp, and audit remarks.

---

## 3. Recipe-Based Production & Variance Logic

For a production run of $B$ batches with target product BOM:

1. **Standard Quantity Required:**
   $$Q_{\text{std}} = B \times \text{BOM Component Quantity}$$
2. **Material Consumption Variance (%):**
   $$\text{Variance}_{\text{mat}} = \left( \frac{Q_{\text{actual}} - Q_{\text{std}}}{Q_{\text{std}}} \right) \times 100$$
   *Benchmark Check:* Oil standard $10.0\,\text{L}$, actual issued $10.5\,\text{L}$ $\implies +5.0\%$ variance. Flagged as critical since $|+5.0\%| > 3.0\%$ tolerance.

3. **Expected Output vs Actual Yield Variance (%):**
   $$\text{Yield Variance} = \left( \frac{\text{Actual Output} - \text{Expected Yield}}{\text{Expected Yield}} \right) \times 100$$
   *Benchmark Check:* Standard yield $200\,\text{pkts}$, actual good output $188\,\text{pkts}$ $\implies -6.0\%$ variance. Flagged as critical since $|-6.0\%| > 3.0\%$ tolerance.

---

## 4. Costing & Valuation Methodology

### Inventory Valuation Method: First-In, First-Out (FIFO)
- Flour issued for the benchmark run ($40\,\text{kg}$) is drawn from the oldest available batch: the opening stock of $100\,\text{kg}$ valued at ₹42.00/kg.
  $$\text{Flour Cost} = 40\,\text{kg} \times ₹42.00 = ₹1,680.00$$
- Cooking Oil: $10.5\,\text{L} \times ₹140.00 = ₹1,470.00$
- Salt and Spice Mix: $1.2\,\text{kg} \times ₹200.00 = ₹240.00$
- Packaging Pouches (including 6 damaged/scrap pouches): $194\,\text{pcs} \times ₹2.50 = ₹485.00$
- Corrugated Cartons: $9\,\text{pcs} \times ₹15.00 = ₹135.00$
- **Total Direct Material Cost:** $₹1,680 + ₹1,470 + ₹240 + ₹485 + ₹135 = ₹4,010.00$

### Direct Overheads Allocation:
- Direct Floor Labour: ₹1,200.00
- Energy (LPG Frying Gas & Power): ₹600.00
- **Total Production Overheads:** ₹1,800.00

### Unit Economics Per Packet:
$$\text{Total Batch Cost} = \text{Direct Materials} + \text{Overheads} = ₹4,010.00 + ₹1,800.00 = ₹5,810.00$$

$$\text{Cost Per Packet} = \frac{\text{Total Batch Cost}}{\text{Good Packets Produced}} = \frac{₹5,810.00}{188\,\text{packets}} = \mathbf{₹30.90\,\text{per packet}}$$

$$\text{Gross Profit Margin} = \left( \frac{\text{Selling Price} - \text{Cost}}{\text{Selling Price}} \right) \times 100 = \left( \frac{₹50.00 - ₹30.90}{₹50.00} \right) \times 100 = \mathbf{38.20\%}$$

---

## 5. Statutory GST Architecture (Place of Supply)

Tax calculations strictly adhere to Section 7 and Section 8 of the IGST Act, 2017:
- **Intra-State Supply (Tamil Nadu Code 33 to Tamil Nadu Code 33):**
  - CGST @ 2.5% + SGST @ 2.5% (Total 5.0%)
  - *Benchmark:* Retailer A ($150\,\text{pkts} \times ₹50 = ₹7,500$ Taxable). CGST = ₹187.50, SGST = ₹187.50. Total Invoice = ₹7,875.00.
- **Inter-State Supply (Tamil Nadu Code 33 to Karnataka Code 29):**
  - Integrated GST (IGST) @ 5.0%
  - *Benchmark:* Distributor B ($120\,\text{pkts} \times ₹50 = ₹6,000$ Taxable). IGST = ₹300.00.


---

## 6. Backend API, Relational Schema & Security Architecture

### 6.1 Database Schema (Prisma ORM)
The backend uses Prisma ORM with SQLite for instant local zero-config testing and PostgreSQL for production deployments:
- **`User`**: `id`, `name`, `email`, `passwordHash` (bcrypt), `role` (`salesman`, `admin`, `production`, `auditor`, `owner`).
- **`Item`**: Master records with category tags (`raw_material`, `packaging`, `finished_goods`), standard valuation cost, and selling rates.
- **`StockLedgerEntry`**: Immutable relational records linking every movement to a `movementType`, `sourceDocType`, and `sourceDocId`.
- **`BillOfMaterials` & `BomComponent`**: Relational standard recipe formulas.
- **`ProductionRun` & `ProductionRunItem`**: Relational capture of actual consumption, scrap pouches, cartons, output, and allocated overheads.
- **`SalesOrder` & `OrderItem`**: Relational order tracking with status lifecycle (`submitted`, `approved`, `invoiced`, `dispatched`, `rejected`).
- **`SalesInvoice` & `InvoiceItem`**: Legal tax invoices storing taxable amount, CGST, SGST, IGST, and payment balance.
- **`PaymentReceipt`**: Collection records linked to specific invoices with payment mode, reference number, and audit timestamp.

### 6.2 Authentication & Role-Based Access Control (RBAC)
- Passwords are never stored in plaintext; they are hashed with `bcryptjs` using 10 salt rounds.
- Sessions authenticate via standard HTTP `Authorization: Bearer <jwt_token>` headers signed with an HMAC-SHA256 secret.
- Endpoints enforce the `requireRole(allowedRoles)` middleware:
  - Route `/api/orders/:id/approve`: Restricted to `admin` and `owner`. Salesman accounts requesting this endpoint receive `HTTP 403 Forbidden`.
  - Route `/api/invoices/:id/dispatch`: Restricted to `admin`.
  - Route `/api/production/run`: Restricted to `production` and `admin`.
