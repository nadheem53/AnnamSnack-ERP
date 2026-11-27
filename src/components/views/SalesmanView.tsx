import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { computeItemStockBalance, formatINR } from '../../utils/calculations';
import {
  Smartphone,
  Plus,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  User,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const SalesmanView: React.FC = () => {
  const {
    customers,
    items,
    orders,
    stockLedger,
    createSalesOrder,
    lang,
  } = useErp();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [salesmanName, setSalesmanName] = useState<string>('Salesman A (K. Pandian)');
  const [quantities, setQuantities] = useState<Record<string, number>>({
    'item-murukku-200g': 150, // Benchmark default
  });
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [orderFeedback, setOrderFeedback] = useState<string | null>(null);

  const fgItem = items.find((i) => i.category === 'finished_goods') || items[0];
  const murukkuStock = computeItemStockBalance('item-murukku-200g', stockLedger).currentBalance;

  const handleQtyChange = (itemId: string, delta: number) => {
    setQuantities((prev) => {
      const cur = prev[itemId] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [itemId]: next };
    });
  };

  const handleDirectQtyInput = (itemId: string, val: string) => {
    const num = parseInt(val) || 0;
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, num) }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderFeedback(null);

    const itemsToOrder = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));

    if (itemsToOrder.length === 0) {
      setOrderFeedback('Please specify at least 1 packet quantity.');
      return;
    }

    const newOrder = await createSalesOrder({
      customerId: selectedCustomerId,
      salesmanName,
      items: itemsToOrder,
      isOffline: isOfflineMode,
    });

    setOrderFeedback(
      `Order ${newOrder.orderNumber} successfully ${isOfflineMode ? 'saved offline & queued' : 'transmitted to Factory Admin'}!`
    );

    setTimeout(() => setOrderFeedback(null), 4000);
  };

  const selectedCust = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // My Orders
  const myOrders = orders.filter((o) => o.salesmanName.includes('Pandian') || o.salesmanName === salesmanName);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Mobile Mode Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {lang === 'en' ? 'Field Sales Order Entry (Mobile Interface)' : 'விற்பனையாளர் கள ஆர்டர் பதிவு'}
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                Weak Network Optimized
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Orders flow straight to the factory desk with no manual phone calls or WhatsApp re-typing.
            </p>
          </div>
        </div>

        {/* Offline Toggle Simulation */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isOfflineMode
                ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
            <span>{isOfflineMode ? 'Simulating Offline Mode' : 'Online Connection Active'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form (Mobile Shape) */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSubmitOrder} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                New Customer Booking
              </span>
              <span className="text-xs font-mono text-slate-400">
                Salesman: <strong className="text-slate-200">{salesmanName}</strong>
              </span>
            </div>

            {/* Salesman Switcher for Benchmark */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono">Demo Salesman:</span>
              <button
                type="button"
                onClick={() => {
                  setSalesmanName('Salesman A (K. Pandian)');
                  setSelectedCustomerId('cust-retailer-a');
                  setQuantities({ 'item-murukku-200g': 150 });
                }}
                className={`px-2.5 py-1 rounded-lg border font-mono ${
                  salesmanName.includes('Pandian')
                    ? 'bg-emerald-600 text-white border-emerald-500 font-semibold'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Salesman A (150 pkts TN)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSalesmanName('Salesman B (M. Selvam)');
                  setSelectedCustomerId('cust-distributor-b');
                  setQuantities({ 'item-murukku-200g': 120 });
                }}
                className={`px-2.5 py-1 rounded-lg border font-mono ${
                  salesmanName.includes('Selvam')
                    ? 'bg-emerald-600 text-white border-emerald-500 font-semibold'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Salesman B (120 pkts KA)
              </button>
            </div>

            {/* Customer Picker */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Select Retailer / Distributor</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city}, {c.state} - {c.stateCode})
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                <span>Credit Limit: {formatINR(selectedCust.creditLimit)}</span>
                <span>
                  Current Outstanding:{' '}
                  <strong className={selectedCust.outstandingBalance > 0 ? 'text-amber-400' : 'text-slate-400'}>
                    {formatINR(selectedCust.outstandingBalance)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Product Catalogue & Quantity Counter */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Catalog Items & Standard Price List</span>
                <span className="text-[11px] font-mono text-emerald-400">
                  Available in Stock: <strong>{murukkuStock} pkts</strong>
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20 font-bold text-xs">
                    200g
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{fgItem.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      HSN: 1905 • GST 5% • Standard MRP: ₹50/pkt
                    </p>
                    <span className="text-[11px] text-brand-300 font-semibold font-mono">
                      Price: ₹50.00 / packet
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(fgItem.id, -10)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantities[fgItem.id] || 0}
                    onChange={(e) => handleDirectQtyInput(fgItem.id, e.target.value)}
                    className="w-20 text-center bg-slate-900 border border-slate-700 rounded-lg py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyChange(fgItem.id, 10)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Real-time Order Summary Preview */}
              {quantities[fgItem.id] > 0 && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Taxable Value ({quantities[fgItem.id]} pkts * ₹50):</span>
                    <span>{formatINR(quantities[fgItem.id] * 50)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Est. GST (5%):</span>
                    <span>{formatINR((quantities[fgItem.id] * 50 * 5) / 100)}</span>
                  </div>
                  <div className="flex justify-between text-slate-200 font-bold pt-1 border-t border-slate-800">
                    <span>Total Order Value:</span>
                    <span className="text-brand-300">{formatINR((quantities[fgItem.id] * 50 * 105) / 100)}</span>
                  </div>
                  {quantities[fgItem.id] > murukkuStock && (
                    <div className="text-amber-400 text-[11px] pt-1 flex items-center gap-1 font-sans">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Note: Order quantity ({quantities[fgItem.id]} pkts) exceeds current factory stock ({murukkuStock} pkts).
                    </div>
                  )}
                </div>
              )}
            </div>

            {orderFeedback && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{orderFeedback}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/20 text-sm flex items-center justify-center gap-2 transition-all hover:scale-101"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>SUBMIT ORDER DIRECTLY TO FACTORY DESK</span>
            </button>
          </form>
        </div>

        {/* Salesman Orders & Customer-wise Sales Tracker */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              My Recent Bookings
            </h3>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto">
              {myOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No orders placed yet. Select customer and click Submit.
                </div>
              ) : (
                myOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-200">{ord.orderNumber}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          ord.status === 'dispatched'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : ord.status === 'invoiced'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-slate-300 font-semibold">{ord.customerName}</div>

                    <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                      <span>{ord.items[0]?.quantity} pkts Murukku</span>
                      <span className="font-bold text-slate-200">{formatINR(ord.grandTotal)}</span>
                    </div>

                    {ord.stockSufficiency === 'PARTIAL_SHORTAGE' && (
                      <div className="text-[10px] text-amber-400 bg-amber-950/40 p-1 rounded border border-amber-800/40">
                        ⚠️ Shortage flagged: Factory pending stock
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

