'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Calendar, Award } from 'lucide-react';
import { usePlayerHistory } from '@/hooks/queries';
import { TournamentCategory } from '@/types';
import { Button, Spinner, Card, Badge } from '@/components/ui';

const categoryLabels: Record<TournamentCategory, string> = {
  [TournamentCategory.OPEN_250]: 'Open 250',
  [TournamentCategory.OPEN_500]: 'Open 500',
  [TournamentCategory.OPEN_1000]: 'Open 1000',
  [TournamentCategory.MASTERS]: 'Masters',
};

const positionSuffix = (pos: number): string => {
  if (pos === 1) return '1st';
  if (pos === 2) return '2nd';
  if (pos === 3) return '3rd';
  return `${pos}th`;
};

export default function PlayerHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = usePlayerHistory(playerId, page);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load player history</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const results = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Tournament History
        </h1>

        {results.length === 0 ? (
          <Card className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tournament results yet</p>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.id} padding="md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {result.tournament.name || `Tournament ${new Date(result.tournament.date).toLocaleDateString()}`}
                        </h3>
                        <Badge variant="info">
                          {categoryLabels[result.category]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(result.tournament.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <span className="text-lg font-bold text-gray-900">
                          {positionSuffix(result.finalPosition)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-primary">
                          +{result.pointsAwarded + result.bonusPoints}
                        </span>{' '}
                        points
                        {result.bonusPoints > 0 && (
                          <span className="text-green-600 ml-1">
                            (+{result.bonusPoints} bonus)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}

            <div className="text-center text-sm text-gray-500 mt-4">
              Showing {results.length} of {pagination?.total || 0} results
            </div>
          </>
        )}
      </div>
    </div>
  );
}
