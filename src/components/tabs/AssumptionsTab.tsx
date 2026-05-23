import { Card } from '../ui/Card';
import { fmt } from '../../lib/formatters';
import { useFortressStore } from '../../store';

export function AssumptionsTab() {
  const cfg = useFortressStore((s) => s.config);
  const p = cfg.personalization;
  const e = cfg.expenses;
  const hu = cfg.houseUpgrade;
  const uni = cfg.university;

  const ages = `${cfg.primaryPartnerAge} / ${cfg.secondaryPartnerAge}`;
  const childAges = cfg.childAges.map((a, i) => `${p.childNames[i] ?? `Child ${i + 1}`} ${a}`).join(', ');

  const rows: ([string, string] | null)[] = [
    [`Primary / secondary partner age`, ages],
    ['Children', childAges || 'None'],
    ['Pension unlock age', String(cfg.pensionUnlockAge)],
    ['Mortgage clears at age', String(e.mortgageEndAge)],
    ['Terminal age', String(cfg.terminalAge)],
    null,
    ['Personal expenses', `${fmt(e.personalAnnual)}/yr (incl ${fmt(e.mortgageAnnualPortion)} mortgage)`],
    [`${p.businessName} expenses`, `${fmt(e.businessAnnual)}/yr`],
    [`${p.primarySchoolLabel} fees`, `${fmt(e.primarySchoolPerChild)}/yr/child · ages ${e.primarySchoolAgeStart}-${e.primarySchoolAgeEnd}`],
    [`${p.secondarySchoolLabel} fees`, `${fmt(e.secondarySchoolPerChild)}/yr/child · ages ${e.secondarySchoolAgeStart}-${e.secondarySchoolAgeEnd}`],
    ['House upgrade', hu.enabled ? `${fmt(hu.downPayment)} downpay + ${fmt(hu.annualExtraCost)}/yr × ${hu.durationYears} yrs · age ${hu.defaultAge} default` : 'disabled'],
    [p.universityLabel, uni.enabled ? `${fmt(uni.annualPerChild)}/yr × ${uni.durationYears} yrs per child (from age ${uni.startChildAge})` : 'disabled'],
    null,
    ['Initial liquid (excl pensions & house)', fmt(cfg.initialLiquid)],
    [`Initial pensions (locked to ${cfg.pensionUnlockAge})`, fmt(cfg.initialPensions)],
    ['Initial house equity', fmt(cfg.initialHouseEquity)],
    null,
    [`${p.equityHoldingName} · price table`, `${cfg.equity.priceTable.length} points (interpolated)`],
    [`${p.equityHoldingName} · current $/share`, `$${cfg.equity.currentPricePerShare.toFixed(2)}`],
    ['Inheritance', cfg.inheritance.enabled ? `${fmt(cfg.inheritance.amount)} at age ${cfg.inheritance.receivingAge}` : 'disabled'],
    ['Alternate exit', cfg.alternateExit.enabled ? `${fmt(cfg.alternateExit.exitLump)} at age ${cfg.alternateExit.exitAge}` : 'disabled'],
    null,
    ['Corporation tax', `${(cfg.tax.corporationTaxRate * 100).toFixed(0)}%`],
    ['Dividend basic / higher', `${(cfg.tax.dividendBasicRate * 100).toFixed(2)}% / ${(cfg.tax.dividendHigherRate * 100).toFixed(2)}%`],
    ['Personal allowance', fmt(cfg.tax.personalAllowance)],
    ['PA taper above', fmt(cfg.tax.paTaperStart)],
    [`${p.partner1Name} pension contrib`, `${fmt(cfg.partner1.pensionContribAnnual)}/yr`],
    [`${p.partner2Name} pension contrib`, `${fmt(cfg.partner2.pensionContribAnnual)}/yr`],
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-base font-semibold text-stone-900 mb-4">Simulation parameters</h3>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {rows.map((row, i) =>
            row === null ? (
              <div key={i} className="col-span-2 border-t border-stone-100 my-1" />
            ) : (
              <div key={i} className="flex justify-between gap-4 border-b border-stone-50 pb-1.5">
                <span className="text-stone-600">{row[0]}</span>
                <span className="text-stone-900 tabular-nums text-right">{row[1]}</span>
              </div>
            ),
          )}
        </div>
      </Card>

      <Card className="p-6 bg-amber-50/20 border-amber-100">
        <h3 className="text-base font-semibold text-stone-900 mb-3">How the engine works</h3>
        <ul className="space-y-2 text-sm text-stone-700">
          <li>• <strong>Year-by-year simulation</strong> from the primary partner's age today through age {cfg.terminalAge}, in real terms.</li>
          <li>• <strong>Income</strong> while working: business-mode runs the company extraction (salary + dividends + retained profit + pension contribution); employed-mode uses PAYE net. Stops at the chosen stop age.</li>
          <li>• <strong>Spending</strong>: personal baseline (less mortgage portion after it clears), per-child school fees (primary → secondary based on each child's age), plus optional house-upgrade and university stacks.</li>
          <li>• <strong>Windfalls</strong>: equity exit (interpolated from a price-per-share table), inheritance (lump at age), and an alternate exit (dividend stream + PAYE salary stream + lump at exit).</li>
          <li>• <strong>Pensions</strong> grow at the same real rate but are locked until age {cfg.pensionUnlockAge}, at which point they merge into the liquid pot.</li>
          <li>• <strong>Min income</strong> and <strong>stop age</strong> tables are computed by binary search over the simulation result.</li>
        </ul>
      </Card>
    </div>
  );
}
