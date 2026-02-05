// Question-specific insights display for Dashboard
// Shows selected questions and their insights

import { Link } from 'react-router-dom';
import { useFortressStore } from '../store';
import { QUESTIONS, UNIVERSAL_INSIGHTS } from './QuestionSelector';
import { HelpCircle, Edit2, CheckCircle } from 'lucide-react';

export function QuestionInsights() {
  const selectedQuestionIds = useFortressStore(state => state.selectedQuestions);
  
  const selectedQuestions = QUESTIONS.filter(q => 
    selectedQuestionIds.includes(q.id)
  );

  // Gather all insights: universal + question-specific
  const questionInsights = selectedQuestions.flatMap(q => q.insights).filter(Boolean);

  if (selectedQuestionIds.length === 0) {
    return (
      <section className="p-6 border border-gray-200 rounded-xl bg-gray-50">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <HelpCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Personalize your dashboard
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Tell us what financial questions matter most to you, and we'll show relevant insights.
            </p>
            <Link
              to="/questions"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose Your Questions
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Your Questions
        </h2>
        <Link
          to="/questions"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Selected Questions */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            What You're Tracking
          </h3>
          <ul className="space-y-2">
            {selectedQuestions.map(q => (
              <li key={q.id} className="flex items-start gap-2 text-sm">
                <span className="text-blue-500 mt-0.5">•</span>
                <span className="text-gray-700">{q.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Insights Provided */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Insights You're Receiving
          </h3>
          <ul className="space-y-2">
            {UNIVERSAL_INSIGHTS.map((insight, i) => (
              <li key={`u-${i}`} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{insight}</span>
              </li>
            ))}
            {questionInsights.map((insight, i) => (
              <li key={`q-${i}`} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
