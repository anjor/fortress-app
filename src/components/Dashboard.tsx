// Fortress v3 - Living Dashboard
// The primary view that answers your key questions without interaction

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFortressStore } from '../store';
import { HeadlineCards } from './HeadlineCards';
import { CashflowTable } from './CashflowTable';
import { MinimumIncomeTable } from './MinimumIncomeTable';
import { DataEntryModal } from './DataEntryModal';
import { MethodologyModal } from './MethodologyModal';
import { WindfallEditor } from './WindfallEditor';
import { RefreshCw, Settings, Download } from 'lucide-react';

export function Dashboard() {
  const [showDataEntry, setShowDataEntry] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showWindfallEditor, setShowWindfallEditor] = useState(false);

  const latestSnapshot = useFortressStore(state => state.latestSnapshot);
  const headlineMetrics = useFortressStore(state => state.headlineMetrics);
  const cashflowTable = useFortressStore(state => state.cashflowTable);
  const minimumIncomeTable = useFortressStore(state => state.minimumIncomeTable);
  const config = useFortressStore(state => state.config);
  const assumptions = useFortressStore(state => state.assumptions);

  const hasSnapshot = Boolean(latestSnapshot);
  const lastUpdated = latestSnapshot?.date
    ? new Date(latestSnapshot.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'No data';

  // Build dynamic income description
  const { personalization } = config;
  const partner1IncomeDesc = config.partner1IncomeMode === 'business'
    ? `£${(config.partner1BusinessRevenue / 1000).toFixed(0)}k ${personalization.businessName} revenue`
    : `£${(config.partner1EmployedSalary / 1000).toFixed(0)}k PAYE salary`;

  const partner2IncomeDesc = `£${(config.partner2GrossAnnual / 1000).toFixed(0)}k gross`;

  const workingAgeDesc = (() => {
    const p1Age = config.partner1WorksUntilAge ?? 50;
    const p2Age = config.partner2WorksUntilAge ?? 50;
    if (p1Age === p2Age) {
      return `both working to ${p1Age}`;
    }
    return `${personalization.partner1Name} to ${p1Age}, ${personalization.partner2Name} to ${p2Age}`;
  })();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Fortress</h1>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              FI Dashboard
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Last updated: {lastUpdated}
            </span>
            <button
              onClick={() => setShowDataEntry(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update
            </button>
            <Link
              to="/settings"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setShowMethodology(true)}
              className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-4"
            >
              Methodology
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-12">
        {!hasSnapshot && (
          <OnboardingPanel
            onAddSnapshot={() => setShowDataEntry(true)}
          />
        )}
        
        {/* Headline Metrics */}
        {headlineMetrics && (
          <HeadlineCards
            metrics={headlineMetrics}
            config={config}
            onEditWindfalls={() => setShowWindfallEditor(true)}
          />
        )}

        {/* Cashflow Conclusion Table */}
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              To what age will your money last?
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Assuming {partner1IncomeDesc}, {partner2IncomeDesc}, {workingAgeDesc}
            </p>
          </div>
          
          {cashflowTable.length > 0 ? (
            <CashflowTable rows={cashflowTable} assumptions={assumptions} />
          ) : (
            <EmptyState message="Add your latest snapshot to see projections" />
          )}
        </section>
        
        {/* Minimum Income Required */}
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              What income do you need?
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Business revenue required to maintain each threshold
            </p>
          </div>

          {minimumIncomeTable.length > 0 ? (
            <MinimumIncomeTable rows={minimumIncomeTable} personalization={personalization} config={config} />
          ) : (
            <EmptyState message="Add your latest snapshot to see income requirements" />
          )}
        </section>

        {/* Actions */}
        <section className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDataEntry(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Update Numbers
            </button>
            
            <button
              className="flex items-center gap-2 px-4 py-2 text-gray-600 text-sm font-medium border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            
            <a 
              href="https://claude.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
            >
              Need custom scenarios? → Ask Claude
            </a>
          </div>
        </section>
      </main>
      
      {/* Modals */}
      {showDataEntry && (
        <DataEntryModal onClose={() => setShowDataEntry(false)} />
      )}

      {showMethodology && (
        <MethodologyModal onClose={() => setShowMethodology(false)} />
      )}

      {showWindfallEditor && (
        <WindfallEditor onClose={() => setShowWindfallEditor(false)} />
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center border border-dashed border-gray-200 rounded-lg">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

function OnboardingPanel({
  onAddSnapshot,
}: {
  onAddSnapshot: () => void;
}) {
  return (
    <section className="p-6 border border-gray-200 rounded-xl bg-gray-50">
      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Start here</p>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Tell us about your household</h2>
      <p className="text-sm text-gray-600 mb-4">
        Capture one baseline snapshot (balances + YTD spending) and sanity-check the settings for family, work,
        and FI target. We handle singles, couples, limited companies, and up to four children.
      </p>
      <div className="grid md:grid-cols-3 gap-3 text-sm mb-4">
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-1">1) Balances</p>
          <p className="text-gray-600">Current/savings, ISAs, pensions, taxable, property, business, investment company.</p>
        </div>
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-1">2) Inflows</p>
          <p className="text-gray-600">Business or PAYE income, partner income (optional), and any windfalls.</p>
        </div>
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-1">3) Outflows & goals</p>
          <p className="text-gray-600">Personal + business expenses YTD, FI number (multiplier or fixed), working ages.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/settings"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configure Settings
        </Link>
        <button
          onClick={onAddSnapshot}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 text-sm font-medium border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Add first snapshot
        </button>
        <p className="text-xs text-gray-500">
          Once saved, projections unlock headline metrics, "money lasts to age" and "income needed" tables.
        </p>
      </div>
    </section>
  );
}

export default Dashboard;
