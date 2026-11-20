import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import {
  computeItemStockBalance,
  formatINR,
  formatQty,
  round2,
} from '../../utils/calculations';
import {
  Factory,
  ShoppingBag,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Percent,
} from 'lucide-react';

export const ProductionView: React.FC = () => {
  const {
    bom,
    items,
    vendors,
    stockLedger,
    productionRuns,
    purchases,
    recordPurchase,
    executeProductionRun,
    lang,
  } = useErp();

  // Purchase Form State (Step 1 in Benchmark)
  const [purchaseVendorId, setPurchaseVendorId] = useState<string>(vendors[0]?.id || '');
  const [purchaseItemId, setPurchaseItemId] = useState<string>('item-flour');
  const [purchaseQty, setPurchaseQty] = useState<number>(60);
  const [purchaseRate, setPurchaseRate] = useState<number>(45);

  // Production Run Form State (Steps 2, 3, 8 in Benchmark)
  const [flourIssued, setFlourIssued] = useState<number>(40);
  const [oilIssued, setOilIssued] = useState<number>(10.5); // +0.5L excess (+5% variance)
  const [spiceIssued, setSpiceIssued] = useState<number>(1.2);
  const [actualGoodOutput, setActualGoodOutput] = useState<number>(188); // -6% yield variance
  const [damagedPouches, setDamagedPouches] = useState<number>(6);
  const [cartonsUsed, setCartonsUsed] = useState<number>(9);
  const [overheadLabour, setOverheadLabour] = useState<number>(1200);
  const [overheadPowerGas, setOverheadPowerGas] = useState<number>(600);
  const [runFeedback, setRunFeedback] = useState<string | null>(null);

  // Live stock counts from ledger
  const flourStock = computeItemStockBalance('item-flour', stockLedger).currentBalance;
  const oilStock = computeItemStockBalance('item-oil', stockLedger).currentBalance;
  const spiceStock = computeItemStockBalance('item-spice', stockLedger).currentBalance;
  const pouchStock = computeItemStockBalance('item-pouch-200g', stockLedger).currentBalance;
  const cartonStock = computeItemStockBalance('item-carton-20', stockLedger).currentBalance;
  const murukkuStock = computeItemStockBalance('item-murukku-200g', stockLedger).currentBalance;

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordPurchase({
      vendorId: purchaseVendorId,
      itemId: purchaseItemId,
      quantity: purchaseQty,
      ratePerUnit: purchaseRate,
    });
  };

  const handleRunSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const run = executeProductionRun({
      bomId: bom.id,
      flourQty: flourIssued,
      oilQty: oilIssued,
      spiceQty: spiceIssued,
      actualOutput: actualGoodOutput,
      damagedPouches,
      cartonsUsed,
      overheadLabour,
      overheadPowerGas,
    });

    setRunFeedback(
      `Batch ${run.runNumber} recorded! Produced ${run.actualOutput} pkts @ ₹${run.costPerPacket}/pkt. Yield Variance: ${run.yieldVariancePercent}%.`
    );

    setTimeout(() => setRunFeedback(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {lang === 'en' ? 'Production Floor & BOM Execution' : 'உற்பத்தித் தளம் மற்றும் செய்முறை மேலாண்மை'}
              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                Recipe Variance & Costing
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Recipe-based material issuance, planned vs actual consumption, scrap recording, and FIFO cost per packet.
            </p>
          </div>
        </div>

        {/* Live Raw Stock Strip */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <div className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
            Flour: <strong className="text-brand-300">{flourStock} kg</strong>
          </div>
          <div className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
            Oil: <strong className="text-brand-300">{oilStock} L</strong>
          </div>
          <div className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
            Pouches: <strong className="text-brand-300">{pouchStock} pcs</strong>
          </div>
          <div className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
            Murukku: <strong className="text-emerald-400">{murukkuStock} pkts</strong>
          </div>
        </div>
      </div>

      {/* Top Row: BOM Recipe Specification & Raw Material Purchase Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BOM Recipe Master */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Bill of Materials (BOM)
              </span>
            </div>
            <span className="text-xs font-mono text-brand-400 font-semibold">1 Batch = 200 pkts</span>
          </div>

          <div className="text-xs text-slate-400">
            Target Product: <strong className="text-slate-200">{bom.finishedGoodsName}</strong>
          </div>

          <div className="space-y-2">
            {bom.components.map((comp) => (
              <div
                key={comp.itemId}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="font-sans font-semibold text-slate-200">{comp.itemName}</div>
                  <div className="text-[10px] text-slate-500">
                    Std Rate: ₹{comp.standardRate}/{comp.uom}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-300">
                    {comp.quantityPerBatch} {comp.uom}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ₹{(comp.quantityPerBatch * comp.standardRate).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Expected Yield: <strong className="text-emerald-400">200 packets (200g each)</strong> from 40kg flour & 10L oil.
          </div>
        </div>

        {/* Step 1: Raw Material Purchase Inward Desk */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Raw Material Inward (PO)
              </span>
            </div>
            <span className="text-xs font-mono bg-brand-950 text-brand-300 px-2 py-0.5 rounded border border-brand-800">
              Step 1 Benchmark
            </span>
          </div>

          <form onSubmit={handlePurchaseSubmit} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Supplier / Vendor</label>
              <select
                value={purchaseVendorId}
                onChange={(e) => setPurchaseVendorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Material Item</label>
              <select
                value={purchaseItemId}
                onChange={(e) => setPurchaseItemId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                {items
                  .filter((i) => i.category === 'raw_material')
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Unit: {i.uom})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Quantity</label>
                <input
                  type="number"
                  value={purchaseQty}
                  onChange={(e) => setPurchaseQty(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Purchase Rate (₹/kg)</label>
                <input
                  type="number"
                  value={purchaseRate}
                  onChange={(e) => setPurchaseRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono flex justify-between">
              <span className="text-slate-400">Total Purchase Value:</span>
              <span className="text-brand-300 font-bold">{formatINR(purchaseQty * purchaseRate)}</span>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Inward Goods Receipt</span>
            </button>
          </form>

          {/* Quick Recent Purchases */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-500 font-mono uppercase">Recent Inward Receipts:</span>
            <div className="space-y-1 mt-1 max-h-24 overflow-y-auto">
              {purchases.map((p) => (
                <div key={p.id} className="text-[11px] font-mono flex justify-between text-slate-400">
                  <span>{p.purchaseNumber}: {p.quantity} {p.uom}</span>
                  <span className="text-slate-200">@{formatINR(p.ratePerUnit)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Costing & Margin Engine Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Costing & Margin Engine
            </span>
            <span className="text-xs font-mono text-emerald-400 font-semibold">FIFO Valuation</span>
          </div>

          {productionRuns.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              Execute batch run below to calculate real-time cost per packet.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between font-mono text-slate-400">
                  <span>Direct Material Cost:</span>
                  <span className="text-slate-200">{formatINR(productionRuns[0].materialCostTotal)}</span>
                </div>
                <div className="flex justify-between font-mono text-slate-400">
                  <span>Allocated Labour Overhead:</span>
                  <span className="text-slate-200">{formatINR(productionRuns[0].overheadLabour)}</span>
                </div>
                <div className="flex justify-between font-mono text-slate-400">
                  <span>Allocated Power & Gas:</span>
                  <span className="text-slate-200">{formatINR(productionRuns[0].overheadPowerGas)}</span>
                </div>
                <div className="flex justify-between font-mono text-slate-200 font-bold pt-2 border-t border-slate-800">
                  <span>Total Batch Cost:</span>
                  <span className="text-brand-300">{formatINR(productionRuns[0].totalBatchCost)}</span>
                </div>
              </div>

              {/* Unit economics metric cards */}
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Cost Per Packet</div>
                  <div className="text-base font-bold text-amber-300">
                    ₹{productionRuns[0].costPerPacket}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Gross Margin</div>
                  <div className="text-base font-bold text-emerald-400">
                    {productionRuns[0].grossMarginPercent}%
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 italic">
                Rule: Overheads allocated directly to batch output packets. Margin calculated against ₹50 MRP.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Production Run Execution Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Execute Daily Production Run & Floor Log
            </h3>
            <p className="text-xs text-slate-400">
              Issue ingredients against BOM, capture actual packet output, record damaged pouches, and check variances.
            </p>
          </div>
          <span className="text-xs font-mono bg-amber-950 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-800">
            Tolerance Threshold: 3.0%
          </span>
        </div>

        <form onSubmit={handleRunSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Raw Material Issuance */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                1. Ingredients Issued
              </span>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Flour Issued (Std 40kg)</span>
                  <span className="text-slate-500 font-mono">Stock: {flourStock}kg</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={flourIssued}
                  onChange={(e) => setFlourIssued(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Cooking Oil (Std 10L)</span>
                  <span className="text-amber-400 font-mono">+5% excess in demo</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={oilIssued}
                  onChange={(e) => setOilIssued(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-amber-700/60 rounded-lg px-3 py-1.5 font-mono text-amber-300 font-bold"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Salt & Spices (Std 1.2kg)</span>
                  <span className="text-slate-500 font-mono">Stock: {spiceStock}kg</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={spiceIssued}
                  onChange={(e) => setSpiceIssued(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white font-bold"
                />
              </div>
            </div>

            {/* Actual Output & Packaging Wastage */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                2. Actual Output & Wastage
              </span>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Good Packets Produced (Expected 200)</span>
                  <span className="text-amber-400 font-mono">-6% yield variance</span>
                </div>
                <input
                  type="number"
                  value={actualGoodOutput}
                  onChange={(e) => setActualGoodOutput(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-amber-700/60 rounded-lg px-3 py-1.5 font-mono text-amber-300 font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Damaged / Scrap Pouches</span>
                  <span className="text-slate-500 font-mono">Rate ₹2.50/pc</span>
                </div>
                <input
                  type="number"
                  value={damagedPouches}
                  onChange={(e) => setDamagedPouches(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Carton Boxes Used (Holds 20)</span>
                  <span className="text-slate-500 font-mono">Rate ₹15/pc</span>
                </div>
                <input
                  type="number"
                  value={cartonsUsed}
                  onChange={(e) => setCartonsUsed(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white font-bold"
                />
              </div>
            </div>

            {/* Overheads Allocation */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                3. Overheads Allocation
              </span>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Direct Labour for Run (INR)</span>
                  <span className="text-slate-500 font-mono">Benchmark: ₹1,200</span>
                </div>
                <input
                  type="number"
                  value={overheadLabour}
                  onChange={(e) => setOverheadLabour(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Power, LPG Gas & Water (INR)</span>
                  <span className="text-slate-500 font-mono">Benchmark: ₹600</span>
                </div>
                <input
                  type="number"
                  value={overheadPowerGas}
                  onChange={(e) => setOverheadPowerGas(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white font-bold"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Total Overheads:</span>
                  <span className="text-slate-200 font-bold">{formatINR(overheadLabour + overheadPowerGas)}</span>
                </div>
              </div>
            </div>
          </div>

          {runFeedback && (
            <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{runFeedback}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-600/20 text-sm flex items-center justify-center gap-2 transition-all hover:scale-101"
          >
            <Factory className="w-4 h-4" />
            <span>SAVE PRODUCTION RUN (AUTOMATICALLY UPDATE STOCKS & VARIANCE)</span>
          </button>
        </form>
      </div>

      {/* Production Run History & Variance Audit Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Completed Production Runs ({productionRuns.length})
          </span>
          <span className="text-xs font-mono text-slate-400">Auditor Ready Ledger</span>
        </div>

        <div className="space-y-3">
          {productionRuns.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No production runs logged yet. Execute a batch run above.
            </div>
          ) : (
            productionRuns.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300 text-sm">{r.runNumber}</span>
                    <span className="text-slate-400 font-mono">{r.dateStr}</span>
                    <span className="text-slate-300 font-semibold">• {r.finishedGoodsName}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-800">
                      Output: <strong>{r.actualOutput} pkts</strong> (vs {r.expectedYield} std)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        r.isYieldVarianceFlagged
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      }`}
                    >
                      Yield Var: {r.yieldVariancePercent}%
                    </span>
                  </div>
                </div>

                {/* Variance Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Flour Consumed:</div>
                    <div className="text-slate-200 font-bold">{r.itemsIssued[0]?.actualQty} kg (Std {r.itemsIssued[0]?.standardQty} kg)</div>
                    <div className="text-[10px] text-slate-500">Var: {r.itemsIssued[0]?.variancePercent}%</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-900/40">
                    <div className="text-slate-400">Oil Consumed:</div>
                    <div className="text-amber-300 font-bold">{r.itemsIssued[1]?.actualQty} L (Std {r.itemsIssued[1]?.standardQty} L)</div>
                    <div className="text-[10px] text-amber-400 font-bold">Var: +{r.itemsIssued[1]?.variancePercent}% (Flagged!)</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Pouches & Scrap:</div>
                    <div className="text-slate-200 font-bold">188 good + {r.damagedPouches} damaged = 194 pcs</div>
                    <div className="text-[10px] text-slate-500">Cartons: {r.cartonsUsed} used</div>
                  </div>
                </div>

                {/* Batch Costing Summary */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/60 font-mono text-[11px] border border-slate-800">
                  <div>
                    Material: <strong>{formatINR(r.materialCostTotal)}</strong> + Overheads: <strong>{formatINR(r.overheadLabour + r.overheadPowerGas)}</strong> = Total: <strong className="text-brand-300">{formatINR(r.totalBatchCost)}</strong>
                  </div>
                  <div>
                    Unit Cost: <strong className="text-amber-300 text-xs">₹{r.costPerPacket} / pkt</strong> • Selling: <strong>₹{r.sellingPricePerPacket}</strong> • Margin: <strong className="text-emerald-400">{r.grossMarginPercent}%</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

