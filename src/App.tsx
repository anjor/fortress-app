import { useState } from 'react';
import { TabBar } from './components/ui/TabBar';
import { Pill } from './components/ui/Pill';
import { OverviewTab } from './components/tabs/OverviewTab';
import { IncomeExpensesTab } from './components/tabs/IncomeExpensesTab';
import { MinIncomeTab } from './components/tabs/MinIncomeTab';
import { StopAgeTab } from './components/tabs/StopAgeTab';
import { DecisionsTab } from './components/tabs/DecisionsTab';
import { AssumptionsTab } from './components/tabs/AssumptionsTab';
import { SettingsPage } from './components/SettingsPage';
import { fmt } from './lib/formatters';
import { useScenarioState } from './lib/useScenarioState';
import { useFortressStore } from './store';

type TabId = 'overview' | 'income' | 'minincome' | 'stopage' | 'decisions' | 'assumptions';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',    label: 'Overview' },
  { id: 'income',      label: 'Income & Expenses' },
  { id: 'minincome',   label: 'Min Income (live)' },
  { id: 'stopage',     label: 'When can I stop?' },
  { id: 'decisions',   label: 'Decisions' },
  { id: 'assumptions', label: 'Assumptions' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('overview');
  const [showSettings, setShowSettings] = useState(false);
  const config = useFortressStore((s) => s.config);
  const scenario = useScenarioState(config);

  const totalNW = config.assetBreakdown.reduce((s, a) => s + a.value, 0);
  const fyRev = config.fiscalYearRevenue.currentTotal;

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-6 antialiased">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-1">
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-500 font-medium mb-1">
                {config.personalization.reportTitle}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
                {config.personalization.household}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Pill tone="green">NW {fmt(totalNW)}</Pill>
              <Pill tone="blue">{config.fiscalYearRevenue.currentYearLabel} {fmt(fyRev)}</Pill>
              <button
                onClick={() => setShowSettings(true)}
                className="ml-2 px-3 py-1.5 text-xs font-medium text-stone-700 border border-stone-300 rounded-md hover:bg-white"
              >
                Settings
              </button>
            </div>
          </div>
          <p className="text-sm text-stone-600">
            {config.personalization.partner1Name} ({config.primaryPartnerAge}),{' '}
            {config.personalization.partner2Name} ({config.secondaryPartnerAge})
            {config.childAges.length > 0 && (
              <>
                {' · '}
                {config.childAges
                  .map((a, i) => `${config.personalization.childNames[i] ?? `Child ${i + 1}`} (${a})`)
                  .join(', ')}
              </>
            )}
          </p>
        </div>

        <div className="mb-6">
          <TabBar tabs={TABS} active={tab} onChange={setTab} />
        </div>

        <div>
          {tab === 'overview' && <OverviewTab />}
          {tab === 'income' && <IncomeExpensesTab />}
          {tab === 'minincome' && (
            <MinIncomeTab
              state={scenario.state}
              updateField={scenario.updateField}
              updateFieldSilent={scenario.updateFieldSilent}
              activePreset={scenario.activePreset}
              applyPreset={scenario.applyPreset}
            />
          )}
          {tab === 'stopage' && (
            <StopAgeTab state={scenario.state} updateFieldSilent={scenario.updateFieldSilent} />
          )}
          {tab === 'decisions' && <DecisionsTab state={scenario.state} />}
          {tab === 'assumptions' && <AssumptionsTab />}
        </div>

        <div className="mt-12 pt-6 border-t border-stone-200 text-xs text-stone-400">
          Fortress · scenario-based FI planning · numbers in real terms · edit defaults in Settings
        </div>
      </div>

      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </div>
  );
}
