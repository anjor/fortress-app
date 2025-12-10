// Fortress v3 - Data Entry Modal
// Monthly workflow: paste from Google Sheets, enter revenue/expenses

import { useState } from 'react';
import { X, ClipboardPaste, Check } from 'lucide-react';
import { useFortressStore } from '../store';
import type { MonthlySnapshot } from '../types';
import { formatMonthYear } from '../lib/date-utils';

interface Props {
  onClose: () => void;
}

export function DataEntryModal({ onClose }: Props) {
  const config = useFortressStore(state => state.config);
  const [step, setStep] = useState<'paste' | 'review' | 'done'>('paste');
  const [pastedData, setPastedData] = useState('');
  const [parsedSnapshot, setParsedSnapshot] = useState<Partial<MonthlySnapshot> | null>(null);
  const [revenue, setRevenue] = useState('');
  const [partnerIncome, setPartnerIncome] = useState('');
  const [personalExpenses, setPersonalExpenses] = useState('');
  const [businessExpenses, setBusinessExpenses] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [updateAction, setUpdateAction] = useState<'added' | 'updated' | null>(null);
  const [manualDate, setManualDate] = useState(formatInputDate(new Date()));
  const [manualValues, setManualValues] = useState({
    currentAccounts: '',
    savingsAccounts: '',
    isas: '',
    pensions: '',
    taxableAccounts: '',
    houseEquity: '',
    businessAssets: '',
    investmentAssets: '',
    total: '',
  });
  const updateManualValue = (key: keyof typeof manualValues, value: string) => {
    setManualValues(prev => ({ ...prev, [key]: value }));
  };

  const updateSnapshot = useFortressStore(state => state.updateSnapshot);
  
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setPastedData(clipboardText);
      
      const parsed = parseNetWorthRow(clipboardText);
      if (parsed) {
        setParsedSnapshot(parsed);
        setError(null);
        setStep('review');
      } else {
        setError('Could not parse pasted data. Expected tab-separated values from Net Worth Tracker.');
      }
    } catch (err) {
      setError('Could not access clipboard. Please paste manually.');
    }
  };
  
  const handleManualPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedData(text);
    
    const parsed = parseNetWorthRow(text);
    if (parsed) {
      setParsedSnapshot(parsed);
      setError(null);
    }
  };

  const buildManualSnapshot = (): Partial<MonthlySnapshot> => {
    const totalFromFields =
      parseAmount(manualValues.total) ||
      ['currentAccounts', 'savingsAccounts', 'isas', 'pensions', 'taxableAccounts', 'houseEquity', 'businessAssets', 'investmentAssets']
        .map((key) => parseAmount((manualValues as any)[key]))
        .reduce((acc, val) => acc + val, 0);

    return {
      date: manualDate ? new Date(manualDate) : new Date(),
      currentAccounts: parseAmount(manualValues.currentAccounts),
      savingsAccounts: parseAmount(manualValues.savingsAccounts),
      isas: parseAmount(manualValues.isas),
      pensions: parseAmount(manualValues.pensions),
      taxableAccounts: parseAmount(manualValues.taxableAccounts),
      houseEquity: parseAmount(manualValues.houseEquity),
      businessAssets: parseAmount(manualValues.businessAssets),
      investmentAssets: parseAmount(manualValues.investmentAssets),
      total: totalFromFields,
    };
  };

  const handleManualContinue = () => {
    const snapshot = buildManualSnapshot();
    setParsedSnapshot(snapshot);
    setError(null);
    setStep('review');
  };

  const calculateManualTotal = () => buildManualSnapshot().total || 0;
  
  const handleSave = () => {
    const snapshotSource = parsedSnapshot ?? buildManualSnapshot();
    const deriveTotal = () => {
      if (snapshotSource.total && snapshotSource.total > 0) return snapshotSource.total;
      return (
        (snapshotSource.currentAccounts || 0) +
        (snapshotSource.savingsAccounts || 0) +
        (snapshotSource.isas || 0) +
        (snapshotSource.pensions || 0) +
        (snapshotSource.taxableAccounts || 0) +
        (snapshotSource.houseEquity || 0) +
        (snapshotSource.businessAssets || 0) +
        (snapshotSource.investmentAssets || 0)
      );
    };

    const snapshot: MonthlySnapshot = {
      id: crypto.randomUUID(),
      date: snapshotSource.date || new Date(),
      currentAccounts: snapshotSource.currentAccounts || 0,
      savingsAccounts: snapshotSource.savingsAccounts || 0,
      isas: snapshotSource.isas || 0,
      pensions: snapshotSource.pensions || 0,
      taxableAccounts: snapshotSource.taxableAccounts || 0,
      houseEquity: snapshotSource.houseEquity || 0,
      businessAssets: snapshotSource.businessAssets || 0,
      investmentAssets: snapshotSource.investmentAssets || 0,
      total: deriveTotal(),
      businessRevenueYTD: parseFloat(revenue.replace(/[£,]/g, '')) || 0,
      partner2IncomeYTD: parseFloat(partnerIncome.replace(/[£,]/g, '')) || 0,
      personalExpensesYTD: parseFloat(personalExpenses.replace(/[£,]/g, '')) || 0,
      businessExpensesYTD: parseFloat(businessExpenses.replace(/[£,]/g, '')) || 0,
      totalExpensesYTD: (parseFloat(personalExpenses.replace(/[£,]/g, '')) || 0) +
                        (parseFloat(businessExpenses.replace(/[£,]/g, '')) || 0)
    };

    if (snapshot.total === 0) {
      setError('Please enter your balances before saving.');
      return;
    }

    setError(null);
    const result = updateSnapshot(snapshot);
    setUpdateAction(result.action);
    setStep('done');
    setTimeout(onClose, 1500);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Update Numbers</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-6">
          {step === 'paste' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Enter your balances by account and your YTD inflows/outflows. This works for single or joint households,
                  with or without a business or investment company.
                </p>
                <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-medium text-gray-800 mb-1">What to include</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Balances: current, savings, ISAs, pensions, taxable (GIA), property equity, business assets, investment company assets.</li>
                    <li>Inflows: business revenue or PAYE salary, partner income (optional).</li>
                    <li>Outflows: personal and business expenses YTD (estimates fine).</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Snapshot date</label>
                  <input
                    type="date"
                    value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'currentAccounts', label: 'Current accounts' },
                      { key: 'savingsAccounts', label: 'Savings' },
                      { key: 'isas', label: 'ISAs' },
                      { key: 'pensions', label: 'Pensions' },
                      { key: 'taxableAccounts', label: 'Taxable investments (GIA)' },
                      { key: 'houseEquity', label: 'Property equity' },
                      { key: 'businessAssets', label: `${config.personalization.businessName} assets` },
                      { key: 'investmentAssets', label: `${config.personalization.investmentName} assets` },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                        <input
                          type="text"
                          value={(manualValues as any)[field.key]}
                          onChange={(e) => updateManualValue(field.key as keyof typeof manualValues, e.target.value)}
                          placeholder="£0"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Total (optional override)</label>
                    <input
                      type="text"
                      value={manualValues.total}
                      onChange={(e) => updateManualValue('total', e.target.value)}
                      placeholder="Auto-calculated from above"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 flex items-center justify-between">
                    <span>Calculated total</span>
                    <span className="font-medium text-gray-900 tabular-nums">
                      {formatCurrency(calculateManualTotal())}
                    </span>
                  </div>

                  <button
                    onClick={handleManualContinue}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Review snapshot →
                  </button>
                </div>

              <div className="space-y-2 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">Prefer to paste a row?</p>
                  <button
                    onClick={handlePaste}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:border-gray-300"
                  >
                    <ClipboardPaste className="w-4 h-4" />
                    Paste from Clipboard
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Schema: <code>Date | Current | Savings | ISAs | Pensions | Taxable | Property Equity | Business Assets | Investment Assets | Total</code>
                </p>
                <textarea
                  value={pastedData}
                  onChange={handleManualPaste}
                  placeholder="02/12/2025&#9;£19,248&#9;£62,518&#9;£614,271&#9;£885,576&#9;£513,808&#9;£474,514&#9;£166,140&#9;£999,599&#9;£3,735,674"
                  className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono"
                />
                {parsedSnapshot && (
                  <button
                    onClick={() => setStep('review')}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Continue with pasted row →
                  </button>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          )}
          
          {step === 'review' && parsedSnapshot && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Parsed Net Worth</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DataRow label="Date" value={formatDate(parsedSnapshot.date)} />
                  <DataRow label="Total" value={formatCurrency(parsedSnapshot.total || 0)} highlight />
                  <DataRow label="Current Accounts" value={formatCurrency(parsedSnapshot.currentAccounts || 0)} />
                  <DataRow label="Savings" value={formatCurrency(parsedSnapshot.savingsAccounts || 0)} />
                  <DataRow label="ISAs" value={formatCurrency(parsedSnapshot.isas || 0)} />
                  <DataRow label="Pensions" value={formatCurrency(parsedSnapshot.pensions || 0)} />
                  <DataRow label="Taxable (GIA)" value={formatCurrency(parsedSnapshot.taxableAccounts || 0)} />
                  <DataRow label="Property Equity" value={formatCurrency(parsedSnapshot.houseEquity || 0)} />
                  <DataRow label={config.personalization.businessName} value={formatCurrency(parsedSnapshot.businessAssets || 0)} />
                  <DataRow label={config.personalization.investmentName} value={formatCurrency(parsedSnapshot.investmentAssets || 0)} />
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Revenue &amp; Expenses (YTD)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{config.personalization.businessName} Revenue YTD</label>
                    <input
                      type="text"
                      value={revenue}
                      onChange={(e) => setRevenue(e.target.value)}
                      placeholder="£120,000"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{config.personalization.partner2Name} Income YTD (take-home)</label>
                    <input
                      type="text"
                      value={partnerIncome}
                      onChange={(e) => setPartnerIncome(e.target.value)}
                      placeholder="£35,000"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Personal Expenses YTD</label>
                      <input
                        type="text"
                        value={personalExpenses}
                        onChange={(e) => setPersonalExpenses(e.target.value)}
                        placeholder="£40,000"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Business Expenses YTD</label>
                      <input
                        type="text"
                        value={businessExpenses}
                        onChange={(e) => setBusinessExpenses(e.target.value)}
                        placeholder="£15,000"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Save & Recalculate
              </button>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          )}
          
          {step === 'done' && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-lg font-medium text-gray-900">
                {updateAction === 'updated' ? 'Updated!' : 'Added!'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {updateAction === 'updated'
                  ? `Overwrote existing data for ${formatMonthYear(parsedSnapshot?.date)}`
                  : 'All projections recalculated.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Data Parsing
// ============================================================================

function parseAmount(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[£$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseNetWorthRow(text: string): Partial<MonthlySnapshot> | null {
  // Expected format (tab-separated from Google Sheets):
  // Date | Current | Savings | ISAs | Pensions | Taxable | House | Business | Investment | Total

  // Clean the input
  const cleaned = text.trim().replace(/\r\n/g, '\n');

  // Try tab-separated first
  let parts = cleaned.split('\t');

  // If not enough parts, try comma-separated
  if (parts.length < 10) {
    parts = cleaned.split(',');
  }

  // If still not enough, try pipe-separated
  if (parts.length < 10) {
    parts = cleaned.split('|');
  }

  if (parts.length < 10) {
    return null;
  }

  const parseDate = (str: string): Date => {
    if (!str) return new Date();

    // Try DD/MM/YYYY format first
    const ddmmyyyy = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyy) {
      return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
    }

    // Try ISO format
    const date = new Date(str);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  return {
    date: parseDate(parts[0]),
    currentAccounts: parseAmount(parts[1]),
    savingsAccounts: parseAmount(parts[2]),
    isas: parseAmount(parts[3]),
    pensions: parseAmount(parts[4]),
    taxableAccounts: parseAmount(parts[5]),
    houseEquity: parseAmount(parts[6]),
    businessAssets: parseAmount(parts[7]),
    investmentAssets: parseAmount(parts[8]),
    total: parseAmount(parts[9]),
  };
}

// ============================================================================
// Helper Components
// ============================================================================

function DataRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium tabular-nums ${highlight ? 'text-gray-900' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date | undefined): string {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatInputDate(date: Date): string {
  return new Date(date).toISOString().split('T')[0];
}

export default DataEntryModal;
