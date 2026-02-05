// Question-first UI for Fortress
// Based on Jordan's Clarity Financial prototype

import { useState } from 'react';

interface Question {
  id: string;
  text: string;
  tier: 1 | 2 | 3;
  insights: string[];
}

const QUESTIONS: Question[] = [
  // Tier 1 - Core retirement questions
  {
    id: 'retire-target-age',
    text: 'Can I retire at my target age with the lifestyle I want?',
    tier: 1,
    insights: []
  },
  {
    id: 'outlive-money',
    text: 'Will I outlive my money?',
    tier: 1,
    insights: []
  },
  {
    id: 'sustainable-spending',
    text: "What's my sustainable spending level?",
    tier: 1,
    insights: []
  },
  {
    id: 'stop-work-early',
    text: 'What happens if I stop work earlier than planned?',
    tier: 1,
    insights: ['Impact of early work cessation on timeline and income']
  },
  
  // Tier 2 - Lifestyle decisions
  {
    id: 'investment-risk',
    text: 'What investment return do I actually need - am I taking unnecessary risk?',
    tier: 2,
    insights: ['Current risk level vs required risk analysis']
  },
  {
    id: 'part-time',
    text: 'Can I afford to reduce working hours, go part-time, or take a sabbatical?',
    tier: 2,
    insights: ['Maximum time you can be out of work without affecting plans']
  },
  {
    id: 'career-change',
    text: 'Can I afford a career change with lower income?',
    tier: 2,
    insights: ['Minimum salary required to maintain your retirement goals']
  },
  {
    id: 'move-house',
    text: 'Can I afford to move house or buy a second property?',
    tier: 2,
    insights: ['Maximum property value you can afford (including stamp duty)']
  },
  {
    id: 'help-children',
    text: 'Could I support adult children onto the property ladder?',
    tier: 2,
    insights: ['Maximum gift amount available for children']
  },
  {
    id: 'university',
    text: 'Will university funding for my children affect my retirement plans?',
    tier: 2,
    insights: ['Education cost impact on retirement timeline and income']
  },
  {
    id: 'downsize',
    text: 'Can I afford to downsize now vs later?',
    tier: 2,
    insights: ['Property downsizing requirements and optimal timing']
  },
  {
    id: 'market-crash',
    text: 'What if markets crash?',
    tier: 2,
    insights: ['Impact of adverse market conditions on your plan']
  },
  
  // Tier 3 - Complex scenarios
  {
    id: 'school-fees',
    text: 'Can I afford private school fees?',
    tier: 3,
    insights: [
      'Optimal private school entry points for each child',
      'Fee inflation impact on long-term retirement planning'
    ]
  },
  {
    id: 'gifting',
    text: 'How much could I give away without compromising my own security?',
    tier: 3,
    insights: [
      'Maximum one-off gift capacity without affecting lifestyle',
      'Sustainable annual gifting capacity over time'
    ]
  },
  {
    id: 'business-sale',
    text: 'What sale price do I need for my business to maintain my lifestyle?',
    tier: 3,
    insights: [
      'Minimum business sale price needed for your goals',
      'Phased exit strategy vs full sale comparison'
    ]
  }
];

const UNIVERSAL_INSIGHTS = [
  'Maximum annual spending capacity throughout retirement',
  'Required monthly savings between now and retirement',
  'Required investment return to achieve your goals',
  'Retirement age needed to maintain desired lifestyle',
  'Projected estate value at end of plan'
];

interface QuestionSelectorProps {
  onComplete: (selectedQuestions: string[]) => void;
  maxSelections?: number;
}

export function QuestionSelector({ 
  onComplete, 
  maxSelections = 5 
}: QuestionSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);

  const toggleQuestion = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else if (newSelected.size < maxSelections) {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectedQuestions = QUESTIONS.filter(q => selectedIds.has(q.id));
  
  const allInsights = [
    ...UNIVERSAL_INSIGHTS,
    ...selectedQuestions.flatMap(q => q.insights)
  ];

  const tierQuestions = (tier: 1 | 2 | 3) => 
    QUESTIONS.filter(q => q.tier === tier);

  if (showResults) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Your Personalized Analysis
          </h2>
          
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Your Selected Questions
            </h3>
            <ul className="space-y-2">
              {selectedQuestions.map(q => (
                <li key={q.id} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-700">{q.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              What You'll Receive
            </h3>
            <ul className="space-y-2">
              {allInsights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowResults(false)}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Change Questions
            </button>
            <button
              onClick={() => onComplete(Array.from(selectedIds))}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue to Analysis →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          What do you want to know?
        </h1>
        <p className="text-gray-600">
          Select up to {maxSelections} questions to receive your personalized analysis
        </p>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Choose Your Questions
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedIds.size > 0 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {selectedIds.size} of {maxSelections} selected
          </span>
        </div>

        {/* Tier 1 */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Core Retirement Questions
          </h3>
          {tierQuestions(1).map(q => (
            <QuestionItem
              key={q.id}
              question={q}
              selected={selectedIds.has(q.id)}
              disabled={!selectedIds.has(q.id) && selectedIds.size >= maxSelections}
              onToggle={() => toggleQuestion(q.id)}
            />
          ))}
        </div>

        <hr className="border-gray-200 my-6" />

        {/* Tier 2 */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Lifestyle Decisions
          </h3>
          {tierQuestions(2).map(q => (
            <QuestionItem
              key={q.id}
              question={q}
              selected={selectedIds.has(q.id)}
              disabled={!selectedIds.has(q.id) && selectedIds.size >= maxSelections}
              onToggle={() => toggleQuestion(q.id)}
            />
          ))}
        </div>

        <hr className="border-gray-200 my-6" />

        {/* Tier 3 */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Complex Scenarios
          </h3>
          {tierQuestions(3).map(q => (
            <QuestionItem
              key={q.id}
              question={q}
              selected={selectedIds.has(q.id)}
              disabled={!selectedIds.has(q.id) && selectedIds.size >= maxSelections}
              onToggle={() => toggleQuestion(q.id)}
            />
          ))}
        </div>
      </div>

      {/* Continue Button */}
      {selectedIds.size > 0 && (
        <button
          onClick={() => setShowResults(true)}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
        >
          See What You'll Receive →
        </button>
      )}
    </div>
  );
}

function QuestionItem({ 
  question, 
  selected, 
  disabled,
  onToggle 
}: { 
  question: Question;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <label 
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
        selected 
          ? 'bg-blue-50 border-2 border-blue-500' 
          : disabled
            ? 'bg-gray-50 opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-50 border-2 border-transparent'
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled}
        onChange={onToggle}
        className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className={`text-base ${selected ? 'text-gray-900' : 'text-gray-700'}`}>
        {question.text}
      </span>
    </label>
  );
}
