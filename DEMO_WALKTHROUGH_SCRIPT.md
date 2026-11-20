# Demo Video Walkthrough Script (Max 8 Minutes)
### Centre for Digital Infrastructure, NIT Tiruchirappalli — Internship Task Submission

Use this exact chronological script when recording your unlisted YouTube or Google Drive video demo.

---

### [00:00 - 01:00] Introduction & Problem Context
- **Screen:** Open `http://localhost:5173/` on the Executive Owner Dashboard.
- **What to say:**
  > "Hello evaluators from the Centre for Digital Infrastructure, NIT Tiruchirappalli. I am presenting my solution for the Order-to-Audit system for a packaged South Indian food manufacturer — Annam Food Products in Thuvakudi, Trichy.
  > The core problem is eliminating fragmented WhatsApp orders, paper stock books, and month-end spreadsheet stress. My system solves this by integrating the Sales loop and the Production loop directly through an immutable finished-goods stock ledger."

---

### [01:00 - 02:00] Step 1: Raw Material Purchase
- **Action:** Switch to **Production Floor** role (or open the **Benchmark Demo** console).
- **Click:** Record Purchase of 60 kg Flour at ₹45/kg from Sri Meenakshi Agro Traders.
- **Show:** The raw material flour stock immediately updates from 100 kg to 160 kg in the perpetual stock ledger.

---

### [02:00 - 03:30] Steps 2 & 3: Recipe BOM Issuance, Variances & Costing
- **Action:** In **Production Floor**, show the Bill of Materials (BOM) for Murukku 200g (1 Batch = 200 packets expected).
- **Form Input:**
  - Issue 40 kg flour, 10.5 L cooking oil (highlight the 0.5 L excess), 1.2 kg spices.
  - Enter actual good output: 188 packets, 6 damaged pouches, 9 cartons used.
  - Enter overheads: Labour ₹1,200 and Power/Gas ₹600.
- **Click:** "Save Production Run".
- **Point out to camera:**
  - Raw stock decreased: Flour closing is 120 kg (100 + 60 − 40), Oil is 19.5 L, Pouches is 306.
  - Finished goods increased from 50 to 238 packets.
  - **Yield Variance:** 188 vs 200 expected = −6.0% (flagged in amber exceeding 3% tolerance).
  - **Oil Variance:** +5.0% flagged.
  - **Cost Per Packet:** Direct materials ₹4,010 + Overheads ₹1,800 = ₹5,810 total / 188 pkts = **₹30.90 per packet**! With ₹50 selling price, gross profit margin is **38.2%**.

---

### [03:30 - 04:30] Step 4: Field Salesman Mobile Order Taking
- **Action:** Switch to **Field Salesman** role.
- **Show:** Mobile-optimized interface, offline mode toggle.
- **Selection:** Pick Retailer A (Tamil Nadu), select 150 packets of Murukku 200g.
- **Click:** "Submit Order Directly to Factory Desk". Show order status as `submitted`.

---

### [04:30 - 05:45] Step 5: Factory Admin Verification, GST Tax Invoice & Dispatch
- **Action:** Switch to **Factory Admin** role.
- **Show:** Incoming orders queue. Point out the stock sufficiency check showing stock covers the order (238 pkts available).
- **Click:** "Approve & Generate GST Invoice".
- **Show Modal:** Printable GST Tax Invoice for Retailer A:
  - Intra-state (Place of Supply: 33-Tamil Nadu).
  - Taxable value ₹7,500.00.
  - CGST @ 2.5% = ₹187.50, SGST @ 2.5% = ₹187.50.
  - Grand total = **₹7,875.00**.
- **Click:** "Record Dispatch". Show how Finished Goods stock drops from 238 to **88 packets** in the immutable ledger.

---

### [05:45 - 06:45] Step 6: Salesman B Order & Insufficient Stock Handling
- **Action:** Switch to **Field Salesman** role.
- **Selection:** Salesman B books order for Distributor B (Karnataka) for 120 packets.
- **Action:** Switch to **Factory Admin** desk.
- **Highlight to camera:** The system automatically flags a **Shortage of 32 packets** (120 requested vs 88 in stock). Show that Inter-state IGST 5% (₹300) applies when invoiced.

---

### [06:45 - 07:15] Step 7: Payment Collection & Customer Outstanding
- **Action:** In **Factory Admin**, click "Record Payment" on Retailer A's invoice.
- **Input:** Record ₹4,000 NEFT receipt.
- **Show:** Retailer A's invoice outstanding drops from ₹7,875 to exactly **₹3,875.00**.

---

### [07:15 - 08:00] Step 9: Auditor Reports & Tally XML Export
- **Action:** Switch to **Auditor & Accounts** role.
- **Show 6 Auditor Tabs:**
  1. Sales Register with statutory tax splits.
  2. GSTR-1 & GSTR-3B table summaries.
  3. Purchase Register.
  4. Perpetual Stock Ledger proving zero unverified overwrite.
  5. Production Variance & Yield Report.
  6. Customer Outstanding with Ageing brackets (0-15, 16-30 days).
- **Click:** "Export Tally XML" to show XML voucher generation for TallyPrime.
- **Click:** "Benchmark Demo" to show the automated 29/29 check validation matrix.
- **Conclusion:** "Thank you. Every requirement has been mathematically validated against the NIT Tiruchirappalli benchmark."

