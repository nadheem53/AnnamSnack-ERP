import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { SalesOrder, SalesInvoice } from '../../types';
import { FACTORY_INFO } from '../../data/seedData';
import {
  computeItemStockBalance,
  formatINR,
  round2,
} from '../../utils/calculations';
import {
  ShieldCheck,
  FileText,
  Truck,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Printer,
  X,
  CreditCard,
  Building,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const {
    orders,
    invoices,
    stockLedger,
    customers,
    approveOrderAndGenerateInvoice,
    dispatchInvoice,
    recordPaymentReceipt,
    lang,
  } = useErp();

  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<SalesInvoice | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<SalesInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(4000); // Benchmark default
  const [paymentMode, setPaymentMode] = useState<'NEFT' | 'UPI' | 'CHEQUE' | 'CASH'>('NEFT');

  const murukkuStock = computeItemStockBalance('item-murukku-200g', stockLedger).currentBalance;

  const handleApprove = async (orderId: string) => {
    const inv = await approveOrderAndGenerateInvoice(orderId);
    if (inv) {
      setActiveInvoiceForPrint(inv);
    }
  };

  const handleDispatch = async (invoiceId: string) => {
    await dispatchInvoice(invoiceId);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice || paymentAmount <= 0) return;

    await recordPaymentReceipt({
      customerId: paymentModalInvoice.customerId,
      invoiceId: paymentModalInvoice.id,
      amount: paymentAmount,
      paymentMode,
      referenceNo: `REF-${paymentMode}-${Date.now().toString(36).toUpperCase()}`,
    });

    setPaymentModalInvoice(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {lang === 'en' ? 'Factory Admin & Billing Desk' : 'தொழிற்சாலை நிர்வாகம் மற்றும் பில்லிங்'}
              <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                GST Compliant Invoicing
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Verify salesman bookings, check stock sufficiency, generate GST tax invoices, and record dispatches.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-slate-400">Finished Murukku Stock:</span>
          <span className="text-emerald-400 font-bold">{murukkuStock} pkts</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Orders Verification Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Incoming Field Orders ({orders.filter((o) => o.status === 'submitted').length})
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">Action: Verify & Bill</span>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                No orders in queue. Switch to Salesman role to place orders.
              </div>
            ) : (
              orders.map((ord) => {
                const isShort = ord.stockSufficiency === 'PARTIAL_SHORTAGE';
                const canApprove = ord.status === 'submitted';

                return (
                  <div
                    key={ord.id}
                    className={`p-4 rounded-xl border transition-all text-xs space-y-2.5 ${
                      ord.status === 'dispatched'
                        ? 'bg-slate-950/60 border-slate-800 opacity-80'
                        : isShort
                        ? 'bg-slate-950 border-amber-600/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">{ord.orderNumber}</span>
                        <span className="text-slate-400 text-[11px] font-mono">{ord.salesmanName}</span>
                      </div>
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

                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-200 text-sm">{ord.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Destination: {ord.customerState} (Code {ord.customerStateCode}) •{' '}
                          {ord.customerStateCode !== '33' ? 'Inter-state IGST' : 'Intra-state CGST+SGST'}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-sm font-bold text-brand-300">{formatINR(ord.grandTotal)}</div>
                        <div className="text-[10px] text-slate-400">{ord.items[0]?.quantity} pkts @ ₹50</div>
                      </div>
                    </div>

                    {/* Stock Sufficiency Check Badge */}
                    <div
                      className={`p-2 rounded-lg text-[11px] font-mono flex items-center justify-between ${
                        isShort
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isShort ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>
                          {isShort
                            ? `Shortage Flagged: Only ${murukkuStock} pkts in stock (Deficit: ${ord.items[0]?.quantity - murukkuStock} pkts)`
                            : `Stock Covers Order (${murukkuStock} pkts available)`}
                        </span>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {canApprove && (
                      <div className="pt-1 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(ord.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Approve & Generate GST Invoice</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* GST Invoices & Dispatch Desk */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              GST Tax Invoices & Dispatch Desk ({invoices.length})
            </span>
            <span className="text-xs font-mono text-slate-400">FY 2026-27</span>
          </div>

          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                No invoices generated yet. Approve an incoming order above.
              </div>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-brand-300 text-sm">{inv.invoiceNumber}</span>
                      <span className="text-slate-400 text-[11px] font-mono ml-2">Date: {inv.dateStr}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        inv.dispatchStatus === 'DISPATCHED'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {inv.dispatchStatus}
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-slate-200">{inv.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        POS: {inv.placeOfSupply} • GSTIN: {inv.customerGstin || 'Unregistered'}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-sm font-bold text-slate-100">{formatINR(inv.grandTotal)}</div>
                      <div className="text-[10px] text-slate-400">
                        Taxable: {formatINR(inv.taxableValueTotal)} + Tax: {formatINR(inv.grandTotal - inv.taxableValueTotal)}
                      </div>
                    </div>
                  </div>

                  {/* Payment & Outstanding info */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[11px]">
                    <div>
                      Paid: <span className="text-emerald-400 font-bold">{formatINR(inv.paymentReceived)}</span>
                    </div>
                    <div>
                      Outstanding:{' '}
                      <span className={inv.outstandingBalance > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {formatINR(inv.outstandingBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Actions: View PDF, Record Dispatch, Record Payment */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => setActiveInvoiceForPrint(inv)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View / Print PDF</span>
                    </button>

                    {inv.dispatchStatus !== 'DISPATCHED' && (
                      <button
                        onClick={() => handleDispatch(inv.id)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Record Dispatch</span>
                      </button>
                    )}

                    {inv.outstandingBalance > 0 && (
                      <button
                        onClick={() => {
                          setPaymentModalInvoice(inv);
                          setPaymentAmount(inv.outstandingBalance >= 4000 ? 4000 : inv.outstandingBalance);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Printable / Viewable GST Invoice Modal */}
      {activeInvoiceForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  TAX INVOICE (RULE 46 OF CGST RULES, 2017)
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">{FACTORY_INFO.name}</h3>
                <p className="text-xs text-slate-600">{FACTORY_INFO.address}</p>
                <div className="text-xs font-mono text-slate-700 mt-1">
                  GSTIN: <strong>{FACTORY_INFO.gstin}</strong> • State: 33-Tamil Nadu
                </div>
              </div>
              <div className="text-right">
                <button onClick={() => setActiveInvoiceForPrint(null)} className="text-slate-400 hover:text-slate-700 p-1 mb-2">
                  <X className="w-5 h-5" />
                </button>
                <div className="text-xs font-mono">Invoice #: <strong className="text-slate-900">{activeInvoiceForPrint.invoiceNumber}</strong></div>
                <div className="text-xs font-mono text-slate-600">Date: {activeInvoiceForPrint.dateStr}</div>
              </div>
            </div>

            {/* Bill To */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Billed To Customer:</span>
              <div className="font-bold text-sm text-slate-900">{activeInvoiceForPrint.customerName}</div>
              <div className="text-slate-600 font-mono">
                State: {activeInvoiceForPrint.customerState} (Code {activeInvoiceForPrint.customerStateCode}) • Place of Supply: {activeInvoiceForPrint.placeOfSupply}
              </div>
              <div className="text-slate-600 font-mono">GSTIN: {activeInvoiceForPrint.customerGstin || 'Unregistered Dealer'}</div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="py-2 px-3">Description of Goods</th>
                    <th className="py-2 px-2">HSN</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Rate</th>
                    <th className="py-2 px-2 text-right">Taxable</th>
                    {!activeInvoiceForPrint.isInterState ? (
                      <>
                        <th className="py-2 px-2 text-right">CGST (2.5%)</th>
                        <th className="py-2 px-2 text-right">SGST (2.5%)</th>
                      </>
                    ) : (
                      <th className="py-2 px-2 text-right">IGST (5%)</th>
                    )}
                    <th className="py-2 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {activeInvoiceForPrint.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">{it.itemName}</td>
                      <td className="py-2.5 px-2">{it.hsnCode}</td>
                      <td className="py-2.5 px-2 text-right">{it.quantity} pkts</td>
                      <td className="py-2.5 px-2 text-right">₹{it.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-right">₹{it.taxableValue.toFixed(2)}</td>
                      {!activeInvoiceForPrint.isInterState ? (
                        <>
                          <td className="py-2.5 px-2 text-right">₹{it.cgstAmount.toFixed(2)}</td>
                          <td className="py-2.5 px-2 text-right">₹{it.sgstAmount.toFixed(2)}</td>
                        </>
                      ) : (
                        <td className="py-2.5 px-2 text-right">₹{it.igstAmount.toFixed(2)}</td>
                      )}
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{it.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="flex justify-end pt-2 border-t text-xs font-mono">
              <div className="w-72 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Total Taxable Value:</span>
                  <span>₹{activeInvoiceForPrint.taxableValueTotal.toFixed(2)}</span>
                </div>
                {!activeInvoiceForPrint.isInterState ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Central GST (CGST 2.5%):</span>
                      <span>₹{activeInvoiceForPrint.cgstTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>State GST (SGST 2.5%):</span>
                      <span>₹{activeInvoiceForPrint.sgstTotal.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>Integrated GST (IGST 5.0%):</span>
                    <span>₹{activeInvoiceForPrint.igstTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t">
                  <span>Grand Total (INR):</span>
                  <span>₹{activeInvoiceForPrint.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-slate-800"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
              <button
                onClick={() => setActiveInvoiceForPrint(null)}
                className="bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayment}
            className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-400" />
                Record Customer Collection
              </h3>
              <button type="button" onClick={() => setPaymentModalInvoice(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div className="text-slate-400">Customer: <strong className="text-slate-200">{paymentModalInvoice.customerName}</strong></div>
              <div className="text-slate-400">Invoice: <strong className="text-brand-300">{paymentModalInvoice.invoiceNumber}</strong></div>
              <div className="text-slate-400">Outstanding: <strong className="text-amber-400">{formatINR(paymentModalInvoice.outstandingBalance)}</strong></div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Amount Received (INR)</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="NEFT">NEFT / RTGS Bank Transfer</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="CHEQUE">Bank Cheque</option>
                <option value="CASH">Cash Counter</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-md"
              >
                Save Receipt
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

