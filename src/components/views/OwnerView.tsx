import React from 'react';
import { useErp } from '../../context/ErpContext';
import {
  computeItemStockBalance,
  formatINR,
  round2,
} from '../../utils/calculations';
import {
  Crown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  IndianRupee,
  ShoppingBag,
  Factory,
  ArrowRight,
  ShieldAlert,
  Percent,
} from 'lucide-react';

export const OwnerView: React.FC = () => {
  const {
    invoices,
    orders,
    stockLedger,
    productionRuns,
    customers,
    lang,
  } = useErp();

  // Metrics
  const murukkuStock = computeItemStockBalance('item-murukku-200g', stockLedger).currentBalance;
  const flourStock = computeItemStockBalance('item-flour', stockLedger).currentBalance;
  const oilStock = computeItemStockBalance('item-oil', stockLedger).currentBalance;
  const pouchStock = computeItemStockBalance('item-pouch-200g', stockLedger).currentBalance;

  const totalInvoiced = invoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const totalOutstanding = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
  const totalCollections = invoices.reduce((acc, i) => acc + i.paymentReceived, 0);

  const latestRun = productionRuns[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {lang === 'en' ? 'Factory Owner Executive Dashboard' : 'தொழிற்சாலை உரிமையாளர் நிர்வாக மேலோட்டம்'}
              <span className="text-[10px] font-mono bg-brand-950 text-brand-300 px-2 py-0.5 rounded border border-brand-800">
                Real-time Intelligence
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              High-level overview of daily factory revenue, inventory health, variance alerts, and unit economics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span>Target Packets/Day:</span>
          <strong className="text-white">1,000 pkts</strong>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Total Invoiced Sales</span>
            <ShoppingBag className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {formatINR(totalInvoiced)}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {orders.length} orders booked • {invoices.length} invoices generated
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Total Collections (Cash In)</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatINR(totalCollections)}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            NEFT / UPI Bank Receipts
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Customer Receivables Due</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {formatINR(totalOutstanding)}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Retailer A: ₹3,875 outstanding
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Finished Murukku Stock</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-300 mt-1">
            {murukkuStock} pkts
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Post-dispatch warehouse balance
          </p>
        </div>
      </div>

      {/* Visual Two-Loop Architecture Diagram (Requirement from Section 2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            Two-Loop Order-to-Audit Architectural Synchronization
          </h3>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Automated Single-Entry Flow
          </span>
        </div>

        {/* Diagram Box */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales Loop Box */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-blue-900/40 space-y-2">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                1. Sales Loop (Outward Flow)
              </span>
              <div className="text-slate-300 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">●</span> Salesman mobile order taken on field (150 pkts)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-400">●</span> Factory Admin verifies & checks stock sufficiency
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-400">●</span> GST Tax Invoice generated (₹7,875)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-rose-400">●</span> Dispatch recorded ──▶ <strong className="text-amber-300">Finished Stock −150 pkts</strong>
                </div>
              </div>
            </div>

            {/* Production Loop Box */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-900/40 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                2. Production Loop (Inward Flow)
              </span>
              <div className="text-slate-300 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-brand-400">●</span> Raw materials purchased (60 kg flour @ ₹45)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400">●</span> Issued per BOM recipe (40 kg flour, 10.5 L oil)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-rose-400">●</span> Raw stock decremented in ledger
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">●</span> 188 pkts produced ──▶ <strong className="text-emerald-300">Finished Stock +188 pkts</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            Meeting Point: <strong className="text-brand-300">Finished Goods Stock Ledger (88 packets closing)</strong> ➔ Feeds Monthly Auditor GSTR-1, Stock Ledger & Tally XML.
          </div>
        </div>
      </div>

      {/* Production Variances & Margin Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Variance Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Live Variance & Wastage Alerts
            </h3>
            <span className="text-xs font-mono text-amber-400">Threshold: &gt; 3%</span>
          </div>

          <div className="space-y-3">
            {latestRun ? (
              <>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-800/40 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span>Yield Variance: -6.0% (Flagged)</span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-950 border border-amber-700">
                      Warning
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Expected 200 packets from batch, but only 188 good packets obtained (Deficit: 12 packets). Check frying temperature and dough extrusion pressure.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-800/40 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span>Oil Consumption: +5.0% Over Standard (Flagged)</span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-950 border border-amber-700">
                      Warning
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Used 10.5 litres vs standard 10.0 litres. Extra 0.5L cooking oil absorbed during batch frying.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-300">
                    <span>Packaging Damage: 6 Pouches Scrap</span>
                    <span className="font-mono text-[11px] text-slate-500">₹15.00 scrap loss</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    6 pouches torn at sealing jaw; 194 total pouches issued from store.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No production runs executed yet.
              </div>
            )}
          </div>
        </div>

        {/* Unit Economics & Costing Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Packet Cost & Gross Margin Breakdown
            </h3>
            <span className="text-xs font-mono text-emerald-400">Target Margin: &gt; 35%</span>
          </div>

          {latestRun ? (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Raw Materials Cost (FIFO):</span>
                  <span className="text-slate-200">{formatINR(latestRun.materialCostTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Direct Labour Overhead:</span>
                  <span className="text-slate-200">{formatINR(latestRun.overheadLabour)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Power, Water & LPG Gas:</span>
                  <span className="text-slate-200">{formatINR(latestRun.overheadPowerGas)}</span>
                </div>
                <div className="flex justify-between text-slate-200 font-bold pt-2 border-t border-slate-800">
                  <span>Total Batch Cost:</span>
                  <span className="text-brand-300">{formatINR(latestRun.totalBatchCost)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Cost Per Packet (188 pkts):</span>
                  <span className="text-base font-bold text-amber-300">₹{latestRun.costPerPacket}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Selling Price Before Tax:</span>
                  <span className="text-base font-bold text-slate-200">₹{latestRun.sellingPricePerPacket}.00</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-emerald-800/40">
                  <span className="text-emerald-300 font-bold">Gross Margin Per Packet:</span>
                  <span className="text-lg font-bold text-emerald-400">
                    ₹{latestRun.grossMarginPerPacket} ({latestRun.grossMarginPercent}%)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              Run benchmark to view cost per packet breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

