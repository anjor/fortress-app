import { useState } from 'react';
import { useFortressStore } from '../store';
import { Card } from './ui/Card';
import { NumInput } from './ui/NumInput';
import { DEMO_CONFIG } from '../data/demoConfig';
import type { FortressConfig, IncomeMode } from '../types';

interface Props {
  onClose: () => void;
}

export function SettingsPage({ onClose }: Props) {
  const config = useFortressStore((s) => s.config);
  const updateConfig = useFortressStore((s) => s.updateConfig);
  const reset = useFortressStore((s) => s.reset);

  const [c, setC] = useState<FortressConfig>(config);

  const apply = () => {
    updateConfig(c);
    onClose();
  };

  const setPath = (updater: (draft: FortressConfig) => FortressConfig) => {
    setC((prev) => updater({ ...prev }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-stone-50 rounded-2xl max-w-4xl w-full my-8 shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-stone-200 rounded-t-2xl px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-stone-900">Settings</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (confirm('Reset all settings to anonymized demo defaults?')) {
                  reset();
                  setC(DEMO_CONFIG);
                }
              }}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 border border-stone-300 rounded-md"
            >
              Reset to demo
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-stone-700 border border-stone-300 rounded-md hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              onClick={apply}
              className="px-4 py-1.5 text-xs font-medium text-white bg-stone-900 rounded-md hover:bg-stone-800"
            >
              Save
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <Section title="Personalization">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <TextField
                label="Report title" value={c.personalization.reportTitle}
                onChange={(v) => setPath((d) => ({ ...d, personalization: { ...d.personalization, reportTitle: v } }))}
              />
              <TextField
                label="Household name" value={c.personalization.household}
                onChange={(v) => setPath((d) => ({ ...d, personalization: { ...d.personalization, household: v } }))}
              />
              <TextField
                label="Primary partner name" value={c.personalization.partner1Name}
                onChange={(v) => setPath((d) => ({ ...d, personalization: { ...d.personalization, partner1Name: v } }))}
              />
              <TextField
                label="Secondary partner name" value={c.personalization.partner2Name}
                onChange={(v) => setPath((d) => ({ ...d, personalization: { ...d.personalization, partner2Name: v } }))}
              />
              <TextField
                label="Business name" value={c.personalization.businessName}
                onChange={(v) => setPath((d) => ({ ...d, personalization: { ...d.personalization, businessName: v } }))}
              />
              <TextField
                label="Equity holding name" value={c.personalization.equityHoldingName}
                onChange={(v) => setPath((d) => ({ ...d, personalization: { ...d.personalization, equityHoldingName: v } }))}
              />
            </div>
          </Section>

          <Section title="Ages">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumInput
                label="Primary partner age" value={c.primaryPartnerAge}
                onChange={(v) => setC({ ...c, primaryPartnerAge: v })}
              />
              <NumInput
                label="Secondary partner age" value={c.secondaryPartnerAge}
                onChange={(v) => setC({ ...c, secondaryPartnerAge: v })}
              />
              <NumInput
                label="Pension unlock age" value={c.pensionUnlockAge}
                onChange={(v) => setC({ ...c, pensionUnlockAge: v })}
              />
              <NumInput
                label="Terminal age" value={c.terminalAge}
                onChange={(v) => setC({ ...c, terminalAge: v })}
              />
            </div>
            <div className="mt-4">
              <label className="text-xs uppercase tracking-wider text-stone-500 font-medium block mb-1">
                Child ages today (comma-separated)
              </label>
              <input
                type="text"
                value={c.childAges.join(', ')}
                onChange={(e) => {
                  const ages = e.target.value.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
                  setC({ ...c, childAges: ages });
                }}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm tabular-nums"
              />
              <div className="text-[11px] text-stone-500 mt-1">e.g. 8, 4</div>
            </div>
          </Section>

          <Section title="Income">
            {(['partner1', 'partner2'] as const).map((key) => (
              <div key={key} className="mb-4 pb-4 border-b border-stone-100 last:border-0 last:mb-0 last:pb-0">
                <div className="text-xs uppercase tracking-wider text-stone-600 font-semibold mb-3">
                  {key === 'partner1' ? c.personalization.partner1Name : c.personalization.partner2Name}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-stone-500 font-medium block mb-1">Mode</label>
                    <select
                      value={c[key].mode}
                      onChange={(e) => setC({ ...c, [key]: { ...c[key], mode: e.target.value as IncomeMode } })}
                      className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm"
                    >
                      <option value="business">Business (Ltd)</option>
                      <option value="employed">Employed (PAYE)</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <NumInput
                    label="Business revenue" value={c[key].businessRevenue}
                    onChange={(v) => setC({ ...c, [key]: { ...c[key], businessRevenue: v } })}
                    suffix="£/yr"
                  />
                  <NumInput
                    label="Employed salary" value={c[key].employedSalary}
                    onChange={(v) => setC({ ...c, [key]: { ...c[key], employedSalary: v } })}
                    suffix="£/yr"
                  />
                  <NumInput
                    label="Stop age" value={c[key].stopAge}
                    onChange={(v) => setC({ ...c, [key]: { ...c[key], stopAge: v } })}
                  />
                  <NumInput
                    label="Salary draw (business mode)" value={c[key].salaryComponent}
                    onChange={(v) => setC({ ...c, [key]: { ...c[key], salaryComponent: v } })}
                    suffix="£/yr"
                  />
                  <NumInput
                    label="Dividend target" value={c[key].dividendTarget}
                    onChange={(v) => setC({ ...c, [key]: { ...c[key], dividendTarget: v } })}
                    suffix="£/yr"
                  />
                  <NumInput
                    label="Pension contrib" value={c[key].pensionContribAnnual}
                    onChange={(v) => setC({ ...c, [key]: { ...c[key], pensionContribAnnual: v } })}
                    suffix="£/yr"
                  />
                </div>
              </div>
            ))}
          </Section>

          <Section title="Expenses">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumInput label="Personal annual" value={c.expenses.personalAnnual}
                onChange={(v) => setC({ ...c, expenses: { ...c.expenses, personalAnnual: v } })} suffix="£/yr" />
              <NumInput label="Mortgage portion" value={c.expenses.mortgageAnnualPortion}
                onChange={(v) => setC({ ...c, expenses: { ...c.expenses, mortgageAnnualPortion: v } })} suffix="£/yr" />
              <NumInput label="Mortgage end age" value={c.expenses.mortgageEndAge}
                onChange={(v) => setC({ ...c, expenses: { ...c.expenses, mortgageEndAge: v } })} />
              <NumInput label="Business expenses" value={c.expenses.businessAnnual}
                onChange={(v) => setC({ ...c, expenses: { ...c.expenses, businessAnnual: v } })} suffix="£/yr" />
              <NumInput label={`${c.personalization.primarySchoolLabel} fees/child`} value={c.expenses.primarySchoolPerChild}
                onChange={(v) => setC({ ...c, expenses: { ...c.expenses, primarySchoolPerChild: v } })} suffix="£/yr" />
              <NumInput label={`${c.personalization.secondarySchoolLabel} fees/child`} value={c.expenses.secondarySchoolPerChild}
                onChange={(v) => setC({ ...c, expenses: { ...c.expenses, secondarySchoolPerChild: v } })} suffix="£/yr" />
            </div>
          </Section>

          <Section title="Initial wealth">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumInput label="Liquid (ex pensions & house)" value={c.initialLiquid}
                onChange={(v) => setC({ ...c, initialLiquid: v })} suffix="£" />
              <NumInput label="Pensions" value={c.initialPensions}
                onChange={(v) => setC({ ...c, initialPensions: v })} suffix="£" />
              <NumInput label="House equity" value={c.initialHouseEquity}
                onChange={(v) => setC({ ...c, initialHouseEquity: v })} suffix="£" />
            </div>
            <p className="text-[11px] text-stone-500 mt-2">
              Asset breakdown (the pie chart on Overview) is loaded from defaults. Edit the demo config file to change category breakdowns.
            </p>
          </Section>

          <Section title="Windfalls">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumInput label="Equity · current $/share" value={c.equity.currentPricePerShare}
                onChange={(v) => setC({ ...c, equity: { ...c.equity, currentPricePerShare: v } })}
                step={0.01} suffix="$" />
              <NumInput label="Inheritance amount" value={c.inheritance.amount}
                onChange={(v) => setC({ ...c, inheritance: { ...c.inheritance, amount: v } })} suffix="£" />
              <NumInput label="Inheritance landing age" value={c.inheritance.receivingAge}
                onChange={(v) => setC({ ...c, inheritance: { ...c.inheritance, receivingAge: v } })} />
              <NumInput label="Alternate exit lump" value={c.alternateExit.exitLump}
                onChange={(v) => setC({ ...c, alternateExit: { ...c.alternateExit, exitLump: v } })} suffix="£" />
              <NumInput label="Alternate exit age" value={c.alternateExit.exitAge}
                onChange={(v) => setC({ ...c, alternateExit: { ...c.alternateExit, exitAge: v } })} />
              <NumInput label="Alternate dividend" value={c.alternateExit.annualDividend}
                onChange={(v) => setC({ ...c, alternateExit: { ...c.alternateExit, annualDividend: v } })} suffix="£/yr" />
            </div>
          </Section>

          <Section title="House upgrade">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumInput label="Down payment" value={c.houseUpgrade.downPayment}
                onChange={(v) => setC({ ...c, houseUpgrade: { ...c.houseUpgrade, downPayment: v } })} suffix="£" />
              <NumInput label="Annual extra cost" value={c.houseUpgrade.annualExtraCost}
                onChange={(v) => setC({ ...c, houseUpgrade: { ...c.houseUpgrade, annualExtraCost: v } })} suffix="£/yr" />
              <NumInput label="Duration (years)" value={c.houseUpgrade.durationYears}
                onChange={(v) => setC({ ...c, houseUpgrade: { ...c.houseUpgrade, durationYears: v } })} />
            </div>
          </Section>

          <Section title="University">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumInput label="Annual cost per child" value={c.university.annualPerChild}
                onChange={(v) => setC({ ...c, university: { ...c.university, annualPerChild: v } })} suffix="£/yr" />
              <NumInput label="Duration (years)" value={c.university.durationYears}
                onChange={(v) => setC({ ...c, university: { ...c.university, durationYears: v } })} />
              <NumInput label="Child age at start" value={c.university.startChildAge}
                onChange={(v) => setC({ ...c, university: { ...c.university, startChildAge: v } })} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wider text-stone-600 font-semibold mb-3">{title}</div>
      {children}
    </Card>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-stone-500 font-medium block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm"
      />
    </div>
  );
}
