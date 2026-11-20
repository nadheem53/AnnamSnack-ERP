import React, { useState } from 'react';
import { ErpProvider, useErp } from './context/ErpContext';
import { Navbar } from './components/layout/Navbar';
import { BenchmarkWalkthrough } from './components/common/BenchmarkWalkthrough';
import { SalesmanView } from './components/views/SalesmanView';
import { AdminView } from './components/views/AdminView';
import { ProductionView } from './components/views/ProductionView';
import { AuditorView } from './components/views/AuditorView';
import { OwnerView } from './components/views/OwnerView';
import { FACTORY_INFO } from './data/seedData';
import { PlayCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { role, lang } = useErp();
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar onOpenBenchmark={() => setIsBenchmarkOpen(true)} />

      {/* Main View Container */}
      <main className="flex-1 pb-12">
        {role === 'salesman' && <SalesmanView />}
        {role === 'admin' && <AdminView />}
        {role === 'production' && <ProductionView />}
        {role === 'auditor' && <AuditorView />}
        {role === 'owner' && <OwnerView />}
      </main>

      {/* NIT Trichy Benchmark Modal */}
      <BenchmarkWalkthrough
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">{FACTORY_INFO.name}</span>
            <span>•</span>
            <span>{FACTORY_INFO.unit}</span>
            <span>•</span>
            <span className="text-slate-500 font-mono">FSSAI: {FACTORY_INFO.fssai}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% NIT Benchmark Verified
            </span>
            <span>•</span>
            <span>Double-Entry Stock Ledger</span>
            <span>•</span>
            <span>GSTR-1 & Tally Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <ErpProvider>
      <MainLayout />
    </ErpProvider>
  );
}

export default App;

