import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  formatINR,
  formatQty,
  computeItemStockBalance,
  generateTallyXml,
  computeAgeingCategory,
} from '../../utils/calculations';
import { FACTORY_INFO } from '../../data/seedData';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Layers,
  ShoppingBag,
  Factory,
  Receipt,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowDownToLine,
} from 'lucide-react';

export const AuditorView: React.FC = () => {
  const {
    invoices,
    purchases,
    stockLedger,
    productionRuns,
    customers,
    items,
    payments,
    lang,
  } = useErp();

  const [activeTab, setActiveTab] = useState<
    'sales' | 'gst' | 'purchases' | 'stock' | 'production' | 'receivables'
  >('sales');

  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-30');

  // Export CSV handler
  const handleExportCsv = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Tally XML Handler
  const handleDownloadTallyXml = () => {
    const xml = generateTallyXml(invoices);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tally_Sales_Vouchers_${new Date().toISOString().split('T')[0]}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Sales Register CSV Generator
  const generateSalesCsv = () => {
    const headers = 'Invoice No,Date,Customer,State,GSTIN,Taxable Value,CGST,SGST,IGST,Grand Total,Dispatch Status\n';
    const rows = invoices
      .map(
        (i) =>
          `"${i.invoiceNumber}","${i.dateStr}","${i.customerName}","${i.customerState}","${i.customerGstin || 'Unregistered'}",${i.taxableValueTotal},${i.cgstTotal},${i.sgstTotal},${i.igstTotal},${i.grandTotal},"${i.dispatchStatus}"`
      )
      .join('\n');
    handleExportCsv('Sales_Register', headers + rows);
  };

  // 2. Stock Ledger CSV Generator
  const generateStockLedgerCsv = () => {
    const headers = 'Date,Doc No,Item,Category,UOM,Movement Type,Qty Change,Balance After,Unit Rate,Total Value\n';
    const rows = stockLedger
      .map(
        (l) =>
          `"${l.dateStr}","${l.sourceDocId}","${l.itemName}","${l.category}","${l.uom}","${l.movementType}",${l.quantityChange},${l.balanceAfter},${l.unitRate},${l.totalValue}`
      )
      .join('\n');
    handleExportCsv('Stock_Ledger', headers + rows);
  };

  // GSTR-1 Mapping Totals
  const totalTaxable = invoices.reduce((acc, i) => acc + i.taxableValueTotal, 0);
  const totalCgst = invoices.reduce((acc, i) => acc + i.cgstTotal, 0);
  const totalSgst = invoices.reduce((acc, i) => acc + i.sgstTotal, 0);
  const totalIgst = invoices.reduce((acc, i) => acc + i.igstTotal, 0);
  const totalGrand = invoices.reduce((acc, i) => acc + i.grandTotal, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {lang === 'en' ? 'Statutory Auditor & Financial Reports Hub' : 'தணிக்கையாளர் மற்றும் நிதி அறிக்கைகள் மையம்'}
              <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                GSTR-1 & Tally Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Monthly sales registers, GSTR-1 outward supplies, immutable stock ledgers, and customer ageing reports.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTallyXml}
            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            title="Download Tally ERP 9 / TallyPrime XML Voucher Import File"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span className="hidden sm:inline">Export Tally XML</span>
            <span className="sm:hidden">Tally XML</span>
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Auditor Pack</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigator */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none text-xs">
        {[
          { id: 'sales', label: '1. Sales Register', count: invoices.length },
          { id: 'gst', label: '2. GST Summary (GSTR-1/3B)' },
          { id: 'purchases', label: '3. Purchase Register', count: purchases.length },
          { id: 'stock', label: '4. Stock Ledger & Summary', count: stockLedger.length },
          { id: 'production', label: '5. Production & Variance', count: productionRuns.length },
          { id: 'receivables', label: '6. Outstanding & Ageing', count: customers.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === t.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-950/60">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: Sales Register */}
      {activeTab === 'sales' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Monthly Outward Sales Register (Section 4.6)
              </h3>
              <p className="text-xs text-slate-400">Complete itemized invoice log with taxable values and statutory tax splits.</p>
            </div>
            <button
              onClick={generateSalesCsv}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-2">Date</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-2">POS</th>
                  <th className="py-2.5 px-2 text-right">Taxable</th>
                  <th className="py-2.5 px-2 text-right">CGST (2.5%)</th>
                  <th className="py-2.5 px-2 text-right">SGST (2.5%)</th>
                  <th className="py-2.5 px-2 text-right">IGST (5%)</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 font-sans">
                      No invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-850">
                      <td className="py-2.5 px-3 font-bold text-brand-300">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-2 text-slate-400">{inv.dateStr}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">{inv.customerName}</td>
                      <td className="py-2.5 px-2 text-slate-400">{inv.customerStateCode}</td>
                      <td className="py-2.5 px-2 text-right">{formatINR(inv.taxableValueTotal)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-300">{formatINR(inv.cgstTotal)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-300">{formatINR(inv.sgstTotal)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-300">{formatINR(inv.igstTotal)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-100">{formatINR(inv.grandTotal)}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {inv.dispatchStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-950 font-mono font-bold text-slate-200 border-t border-slate-700">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 uppercase text-[11px]">Total Outward Supplies:</td>
                  <td className="py-2.5 px-2 text-right text-brand-300">{formatINR(totalTaxable)}</td>
                  <td className="py-2.5 px-2 text-right">{formatINR(totalCgst)}</td>
                  <td className="py-2.5 px-2 text-right">{formatINR(totalSgst)}</td>
                  <td className="py-2.5 px-2 text-right">{formatINR(totalIgst)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">{formatINR(totalGrand)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GST Summary (GSTR-1 & GSTR-3B Mappings) */}
      {activeTab === 'gst' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Statutory GST Outward Summary (GSTR-1 / GSTR-3B Mappings)
            </h3>
            <p className="text-xs text-slate-400">Structured strictly per the Goods and Services Tax Network (GSTN) returns architecture.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 uppercase text-[10px] block">Table 4: B2B Taxable Supplies</span>
              <div className="text-lg font-bold text-slate-100 mt-1">{formatINR(totalTaxable)}</div>
              <div className="text-[11px] text-slate-400 mt-1">Total Invoices: {invoices.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 uppercase text-[10px] block">Total Output Tax Liability</span>
              <div className="text-lg font-bold text-brand-300 mt-1">{formatINR(totalCgst + totalSgst + totalIgst)}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                CGST: {formatINR(totalCgst)} • SGST: {formatINR(totalSgst)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 uppercase text-[10px] block">HSN 1905 Summary (Murukku)</span>
              <div className="text-lg font-bold text-emerald-400 mt-1">5.0% GST</div>
              <div className="text-[11px] text-slate-400 mt-1">Dispatched Packets: {invoices.reduce((acc, i) => acc + i.dispatchedPackets, 0)} pkts</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Purchase Register */}
      {activeTab === 'purchases' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Raw Material Purchase Register (Section 4.6)
              </h3>
              <p className="text-xs text-slate-400">Auditor log of all supplier bills, rates, and input raw materials.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">PO Number</th>
                  <th className="py-2.5 px-2">Date</th>
                  <th className="py-2.5 px-3">Supplier Name</th>
                  <th className="py-2.5 px-3">Material Item</th>
                  <th className="py-2.5 px-2 text-right">Quantity</th>
                  <th className="py-2.5 px-2 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Taxable Value</th>
                  <th className="py-2.5 px-2">Batch #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850">
                    <td className="py-2.5 px-3 font-bold text-amber-300">{p.purchaseNumber}</td>
                    <td className="py-2.5 px-2 text-slate-400">{p.dateStr}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">{p.vendorName}</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.itemName}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-slate-200">{p.quantity} {p.uom}</td>
                    <td className="py-2.5 px-2 text-right">₹{p.ratePerUnit.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-100">{formatINR(p.taxableValue)}</td>
                    <td className="py-2.5 px-2 text-[10px] text-slate-500">{p.batchNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Stock Ledger & Summary (Core requirement) */}
      {activeTab === 'stock' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Perpetual Stock Ledger & Inventory Audit Trail
              </h3>
              <p className="text-xs text-slate-400">
                Opening Balance + Receipts − Issues = Closing Balance. Every row links to an immutable source document.
              </p>
            </div>
            <button
              onClick={generateStockLedgerCsv}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger CSV</span>
            </button>
          </div>

          {/* Current Stock Balances Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 font-mono text-xs pb-3 border-b border-slate-800">
            {items.map((it) => {
              const bal = computeItemStockBalance(it.id, stockLedger).currentBalance;
              return (
                <div key={it.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block truncate">{it.name}</span>
                  <div className="text-sm font-bold text-brand-300 mt-0.5">{bal} {it.uom}</div>
                </div>
              );
            })}
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-2">Movement Type</th>
                  <th className="py-2.5 px-2 text-right">Qty Change</th>
                  <th className="py-2.5 px-2 text-right">Balance After</th>
                  <th className="py-2.5 px-2">Source Doc</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {stockLedger.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-850">
                    <td className="py-2 px-3 text-slate-400">{l.dateStr}</td>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-200">{l.itemName}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          l.quantityChange > 0
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {l.movementType}
                      </span>
                    </td>
                    <td
                      className={`py-2 px-2 text-right font-bold ${
                        l.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {l.quantityChange > 0 ? `+${l.quantityChange}` : l.quantityChange} {l.uom}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-slate-200">
                      {l.balanceAfter} {l.uom}
                    </td>
                    <td className="py-2 px-2 text-slate-300 font-semibold">{l.sourceDocId}</td>
                    <td className="py-2 px-3 text-slate-500 font-sans truncate max-w-[200px]">{l.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Production Variance Report */}
      {activeTab === 'production' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Production Variance & Recipe Yield Audit (Section 4.3 & 4.6)
            </h3>
            <p className="text-xs text-slate-400">Compares planned recipe vs actual factory consumption and flags wastage.</p>
          </div>

          <div className="space-y-4">
            {productionRuns.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-300">{r.runNumber} • {r.finishedGoodsName}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      r.isYieldVarianceFlagged
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}
                  >
                    Yield Variance: {r.yieldVariancePercent}% (Output: {r.actualOutput} vs {r.expectedYield} std)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Raw Material Consumption Analysis:</span>
                    <ul className="space-y-1">
                      {r.itemsIssued.map((it, idx) => (
                        <li key={idx} className="flex justify-between border-b border-slate-900 py-1">
                          <span className="text-slate-300">{it.itemName}</span>
                          <span className={it.isVarianceFlagged ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                            {it.actualQty} {it.uom} (Std: {it.standardQty} {it.uom}) • Var: {it.variancePercent > 0 ? `+${it.variancePercent}` : it.variancePercent}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Batch Cost & Unit Valuation:</span>
                    <div className="p-2.5 rounded-lg bg-slate-900 space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Total Batch Cost:</span>
                        <span className="text-slate-200 font-bold">{formatINR(r.totalBatchCost)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Cost Per Packet:</span>
                        <span className="text-amber-300 font-bold">₹{r.costPerPacket} / pkt</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Standard MRP:</span>
                        <span className="text-slate-200">₹{r.sellingPricePerPacket}.00</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                        <span>Gross Profit Margin:</span>
                        <span>{r.grossMarginPercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Outstanding Receivables & Ageing */}
      {activeTab === 'receivables' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Customer Receivables Ledger & Ageing Analysis
            </h3>
            <p className="text-xs text-slate-400">Tracks unpaid invoices, collection status, and credit risk exposure.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2">State</th>
                  <th className="py-2.5 px-2 text-right">Credit Limit</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Due</th>
                  <th className="py-2.5 px-3 text-center">Ageing Bracket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {customers.map((c) => {
                  const customerInvoices = invoices.filter((i) => i.customerId === c.id);
                  const latestInv = customerInvoices[0];
                  const ageing = latestInv ? computeAgeingCategory(latestInv.dateStr, c.creditDays) : 'Current (0-15 days)';

                  return (
                    <tr key={c.id} className="hover:bg-slate-850">
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">{c.name}</td>
                      <td className="py-2.5 px-2 uppercase text-[10px] text-slate-400">{c.type}</td>
                      <td className="py-2.5 px-2 text-slate-400">{c.state}</td>
                      <td className="py-2.5 px-2 text-right text-slate-400">{formatINR(c.creditLimit)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                        {formatINR(c.outstandingBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                          {ageing}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

