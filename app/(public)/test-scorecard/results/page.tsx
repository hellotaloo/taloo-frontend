'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Scorecard {
  id: string;
  name: string;
  date: string;
  completionStatus: string;
  questionsUnderstanding: { rating: string; remarks: string } | string;
  agentResponse: { rating: string; remarks: string } | string;
  stuckOrConfused: { rating: string; remarks: string } | string;
  liked: string;
  couldBeBetter: string;
  score: string;
  submittedAt: string;
}

function RatingDisplay({ value }: { value: string }) {
  const num = parseInt(value);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className={`w-6 h-6 rounded text-xs flex items-center justify-center font-medium ${
            n <= num
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {n}
        </div>
      ))}
    </div>
  );
}

function getRating(field: { rating: string; remarks: string } | string): string {
  if (typeof field === 'object' && field.rating) {
    return field.rating;
  }
  return '-';
}

function getRemarks(field: { rating: string; remarks: string } | string): string {
  if (typeof field === 'object' && field.remarks) {
    return field.remarks;
  }
  if (typeof field === 'string') {
    return field;
  }
  return '';
}

export default function ResultsPage() {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/test-scorecard')
      .then((res) => res.json())
      .then((data) => {
        setScorecards(data.reverse()); // newest first
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const averageScore =
    scorecards.length > 0
      ? (
          scorecards.reduce((sum, s) => sum + parseInt(s.score || '0'), 0) /
          scorecards.length
        ).toFixed(1)
      : '-';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-gray-900">
            Test Results Dashboard
          </h1>
          <Image
            src="/taloo-logo.svg"
            alt="Taloo"
            width={100}
            height={32}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Responses</p>
            <p className="text-3xl font-semibold text-gray-900">
              {scorecards.length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Average Score</p>
            <p className="text-3xl font-semibold text-gray-900">
              {averageScore} <span className="text-lg text-gray-400">/ 5</span>
            </p>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <p className="text-gray-500 text-center py-12">Loading...</p>
        ) : scorecards.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No responses yet.</p>
        ) : (
          <div className="space-y-4">
            {scorecards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-lg p-5 shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-medium text-gray-900">{card.name}</h2>
                    <p className="text-sm text-gray-500">
                      {new Date(card.submittedAt).toLocaleString('nl-BE')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-semibold text-gray-900">
                      {card.score}
                    </span>
                    <span className="text-gray-400">/5</span>
                  </div>
                </div>

                {/* Completion Status */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      card.completionStatus === 'yes'
                        ? 'bg-green-100 text-green-700'
                        : card.completionStatus === 'partly'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {card.completionStatus === 'yes'
                      ? 'Completed'
                      : card.completionStatus === 'partly'
                      ? 'Partly completed'
                      : 'Not completed'}
                  </span>
                </div>

                {/* Ratings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Questions Clear</p>
                    <RatingDisplay value={getRating(card.questionsUnderstanding)} />
                    {getRemarks(card.questionsUnderstanding) && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        {getRemarks(card.questionsUnderstanding)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Agent Response</p>
                    <RatingDisplay value={getRating(card.agentResponse)} />
                    {getRemarks(card.agentResponse) && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        {getRemarks(card.agentResponse)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Not Confused</p>
                    <RatingDisplay value={getRating(card.stuckOrConfused)} />
                    {getRemarks(card.stuckOrConfused) && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        {getRemarks(card.stuckOrConfused)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Feedback */}
                {(card.liked || card.couldBeBetter) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                    {card.liked && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">What they liked</p>
                        <p className="text-sm text-gray-700">{card.liked}</p>
                      </div>
                    )}
                    {card.couldBeBetter && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Could be better</p>
                        <p className="text-sm text-gray-700">{card.couldBeBetter}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
