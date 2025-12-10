// Fortress - Methodology Modal
// Explains how projections and taxes are calculated

import { X, Info } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function MethodologyModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider">Methodology</p>
              <h2 className="text-lg font-semibold text-gray-900">How we model your plan</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-gray-800">
          <Section title="Projection engine">
            <ul className="list-disc list-inside space-y-1">
              <li>Annual steps from current age to 100; liquid assets grow at chosen real return and fund expenses first.</li>
              <li>Pensions grow tax-free and are accessed from age 57 if liquid assets deplete.</li>
              <li>House equity grows with inflation only; no leverage modeled beyond supplied mortgage figure.</li>
              <li>School fees inflate at the assumption rate; university costs apply per child/years configured.</li>
              <li>Inheritance/liquidity events apply in the year/age specified; investment exit nets corporation tax on gains.</li>
            </ul>
          </Section>

          <Section title="Income & work patterns">
            <ul className="list-disc list-inside space-y-1">
              <li>Scenarios set who works and until what age; partner breaks reduce gross in those years.</li>
              <li>Business vs PAYE: your mode determines whether we apply PAYE tax or salary+dividend extraction.</li>
              <li>Partner income is always treated as PAYE gross unless you leave it blank.</li>
            </ul>
          </Section>

          <Section title="Taxes">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>PAYE:</strong> Personal allowance with taper over £100k; basic/higher/additional bands; Class 1 NI (12% then 2%).</li>
              <li><strong>Ltd (salary/dividends):</strong> Uses optimal extraction helper to split salary/dividends and compute IT/NI/dividend tax and corporation tax on profits.</li>
              <li><strong>Liquidity event:</strong> Applies 25% corporation tax to gain (gross minus cost basis); adds net proceeds to liquid assets.</li>
              <li>We do not currently model student loans, child benefit charge, or pension contribution relief; pension drawdown tax is not applied (assumes net-of-tax need).</li>
            </ul>
          </Section>

          <Section title="Expenses & FI target">
            <ul className="list-disc list-inside space-y-1">
              <li>Base expenses use your YTD personal + business spend, annualised; school fees are added separately per child to avoid double counting.</li>
              <li>FI target is either a multiplier of annual expenses or a fixed amount; runway and FI progress use that target.</li>
            </ul>
          </Section>

          <Section title="Outputs">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Money lasts to age:</strong> For each scenario/assumption, the first year where liquid + pension assets hit zero.</li>
              <li><strong>Income needed:</strong> Binary search for minimum business revenue/PAYE equivalent to hit CoastFI, Surplus (+£50k/yr), or FI by target age.</li>
            </ul>
          </Section>

          <Section title="Caveats & next steps">
            <ul className="list-disc list-inside space-y-1">
              <li>No modeling of housing transactions costs beyond stamp duty on upgrades; no rent if you have zero equity.</li>
              <li>No investment allocation/volatility; single real return per assumption.</li>
              <li>For higher fidelity, add student loans/child benefit charge, pension contribution and drawdown tax, and configurable corp/dividend tax rates.</li>
            </ul>
          </Section>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

export default MethodologyModal;
