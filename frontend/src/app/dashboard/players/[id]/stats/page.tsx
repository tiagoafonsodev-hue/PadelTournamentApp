'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Calendar, Trophy, Award } from 'lucide-react';
import { usePlayerTrends } from '@/hooks/queries';
import { Button, Spinner, Card } from '@/components/ui';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function PlayerStatsPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;

  const { data, isLoading, error } = usePlayerTrends(playerId);

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
        <p className="text-red-600">Failed to load player statistics</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const perTournament = data?.perTournament || [];
  const monthly = data?.monthly || [];

  // Calculate summary stats
  const totalPoints = perTournament.length > 0
    ? perTournament[perTournament.length - 1].cumulativePoints
    : 0;
  const totalTournaments = perTournament.length;
  const totalWins = perTournament.filter(t => t.position === 1).length;
  const bestMonth = monthly.length > 0
    ? monthly.reduce((best, m) => m.points > best.points ? m : best)
    : null;
  const bestSingleTournament = perTournament.length > 0
    ? perTournament.reduce((best, t) => t.pointsEarned > best.pointsEarned ? t : best)
    : null;

  // Format chart data
  const cumulativeData = perTournament.map((t, i) => ({
    name: `T${i + 1}`,
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    points: t.cumulativePoints,
    earned: t.pointsEarned,
  }));

  const monthlyData = monthly.map(m => ({
    month: m.month,
    points: m.points,
    tournaments: m.tournaments,
    wins: m.wins,
  }));

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Statistics & Trends
        </h1>

        {perTournament.length === 0 ? (
          <Card className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tournament data available yet</p>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card padding="md" className="text-center">
                <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
                <p className="text-sm text-gray-600">Total Points</p>
              </Card>
              <Card padding="md" className="text-center">
                <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{totalTournaments}</p>
                <p className="text-sm text-gray-600">Tournaments</p>
              </Card>
              <Card padding="md" className="text-center">
                <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{totalWins}</p>
                <p className="text-sm text-gray-600">Wins</p>
              </Card>
              <Card padding="md" className="text-center">
                <Award className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {totalTournaments > 0 ? Math.round((totalWins / totalTournaments) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600">Win Rate</p>
              </Card>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {bestMonth && (
                <Card padding="md">
                  <h3 className="font-medium text-gray-900 mb-2">Best Month</h3>
                  <p className="text-lg font-bold text-primary">{bestMonth.month}</p>
                  <p className="text-sm text-gray-600">
                    {bestMonth.points} points from {bestMonth.tournaments} tournaments ({bestMonth.wins} wins)
                  </p>
                </Card>
              )}
              {bestSingleTournament && (
                <Card padding="md">
                  <h3 className="font-medium text-gray-900 mb-2">Best Tournament</h3>
                  <p className="text-lg font-bold text-primary">
                    {bestSingleTournament.pointsEarned} points
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(bestSingleTournament.date).toLocaleDateString()} - Position #{bestSingleTournament.position}
                  </p>
                </Card>
              )}
            </div>

            {/* Cumulative Points Chart */}
            <Card padding="md" className="mb-8">
              <h3 className="font-medium text-gray-900 mb-4">Points Progression</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="points"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Cumulative Points"
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Monthly Points Chart */}
            {monthlyData.length > 1 && (
              <Card padding="md">
                <h3 className="font-medium text-gray-900 mb-4">Monthly Performance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="points" fill="#3b82f6" name="Points" />
                      <Bar dataKey="tournaments" fill="#10b981" name="Tournaments" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
