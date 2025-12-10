// Fortress v3 - Data Entry Modal
// Monthly workflow: paste from Google Sheets, enter revenue/expenses

import React, { useState } from 'react';
import { X, ClipboardPaste, Check } from 'lucide-react';
import { useFortressStore } from '../store';
import type { MonthlySnapshot, FortressConfig } from '../types';
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
  const [personalExpenses, setPersonalExpenses] = useState('');
  const [businessExpenses, setBusinessExpenses] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [updateAction, setUpdateAction] = useState<'added' | 'updated' | null>(null);

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
  
  const handleSave = () => {
    if (!parsedSnapshot) return;

    const snapshot: MonthlySnapshot = {
      id: crypto.randomUUID(),
      date: parsedSnapshot.date || new Date(),
      currentAccounts: parsedSnapshot.currentAccounts || 0,
      savingsAccounts: parsedSnapshot.savingsAccounts || 0,
      isas: parsedSnapshot.isas || 0,
      pensions: parsedSnapshot.pensions || 0,
      taxableAccounts: parsedSnapshot.taxableAccounts || 0,
      houseEquity: parsedSnapshot.houseEquity || 0,
      businessAssets: parsedSnapshot.businessAssets || 0,
      investmentAssets: parsedSnapshot.investmentAssets || 0,
      total: parsedSnapshot.total || 0,
      businessRevenueYTD: parseFloat(revenue.replace(/[£,]/g, '')) || 0,
      partner2IncomeYTD: 0,  // Calculated from config
      personalExpensesYTD: parseFloat(personalExpenses.replace(/[£,]/g, '')) || 0,
      businessExpensesYTD: parseFloat(businessExpenses.replace(/[£,]/g, '')) || 0,
      totalExpensesYTD: (parseFloat(personalExpenses.replace(/[£,]/g, '')) || 0) +
                        (parseFloat(businessExpenses.replace(/[£,]/g, '')) || 0)
    };

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
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Copy the latest row from your Net Worth Tracker spreadsheet, then paste here.
              </p>
              
              <button
                onClick={handlePaste}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ClipboardPaste className="w-4 h-4" />
                Paste from Clipboard
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-400">or paste manually</span>
                </div>
              </div>
              
              <textarea
                value={pastedData}
                onChange={handleManualPaste}
                placeholder="02/12/2025&#9;£19,248&#9;£62,518&#9;..."
                className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono"
              />
              
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              
              {parsedSnapshot && (
                <button
                  onClick={() => setStep('review')}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Continue →
                </button>
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
                  <DataRow label="GIA" value={formatCurrency(parsedSnapshot.taxableAccounts || 0)} />
                  <DataRow label="House Equity" value={formatCurrency(parsedSnapshot.houseEquity || 0)} />
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
                      placeholder="£526,259"
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
                        placeholder="£126,515"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Business Expenses YTD</label>
                      <input
                        type="text"
                        value={businessExpenses}
                        onChange={(e) => setBusinessExpenses(e.target.value)}
                        placeholder="£42,829"
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

  const parseAmount = (str: string): number => {
    if (!str) return 0;
    const cleaned = str.replace(/[£$,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

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

export default DataEntryModal;
